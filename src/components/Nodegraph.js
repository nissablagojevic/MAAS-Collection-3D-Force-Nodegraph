import { default as React, Component } from 'react';
import qwest from 'qwest';
import ForceGraph3D from '3d-force-graph/dist/3d-force-graph.min.js';
import mapNode from '../schemas/node.js';
import mapLink from '../schemas/link.js';

const sourceUrl = 'https://api.maas.museum/graphql?query=';
const sourceQuery = `{narratives(filter:{_id:69}){
    _id
    title
    objects(limit: 100) {
      _id
      title
      displayTitle
      description
      category
      terms {
        id
        term
      }
      production {
        date
        dateLatest
        dateEarliest
      }
      images(limit: 1) {
        url(width: 200, height: 200)
      }
    }
  }
}`;

class NodeGraph extends Component {
    constructor() {
        super();
        this.state = {
            graph: 'Please wait while graph loads...'
        }
    }

    componentDidMount() {
        this.setState({graph: this.graphFromUrl(sourceUrl, sourceQuery)});
    }

    /*
     * Description: resolve graphQl data against 3d-force-graph schemas
     *
     * @param {object} response.data from graphQl endpoint
     */
    static mapData(data) {

        //graphSchema is the collection of nodes and links required to make a valid 3d force graph
        let graphSchema = {
            nodes: [],
            links: []
        };

        //for each object in our query map it to our graph Schema and store that our nodeData var
        data.narratives.forEach((narrative) => {NodeGraph.mapNodes(narrative, graphSchema, 'narrative')});

        //for the first narrative's objects returned in the query, map the objects as nodes and term and put that in our graphschema
        data.narratives[0].objects.forEach((obj) => {NodeGraph.mapNodes(obj, graphSchema, 'object')});

        //for the first narrative map each object's terms to nodes and put that in our graphschema
        data.narratives[0].objects.forEach((obj) => {
            obj.terms.forEach((term) => {NodeGraph.mapNodes(term, graphSchema, 'term')});
        });

        //for each of the first narrative's object, map the link between the object nodes and term nodes and put that in our graphschema
        data.narratives[0].objects.forEach((obj) => {NodeGraph.mapLinks(obj, graphSchema, 'object', 'terms')});

        return graphSchema;
    }

    /*
     * Description: Using a starting object, create 3d-graph links according to a provided linkSchema
     *
     * @param {object} startObject - The node to which we are creating a link
     * @param {object} linkContainer - What we put the links in
     * @param {string} linkId - Just the name we use to prefix generated link IDs
     * @param {string} linkToType What node type to link to the startObject
     */
    static mapLinks(startObject, linkContainer, linkId = 'link', linkToType = 'objects') {
        let linksJson = linkContainer;
        const links = mapLink(startObject, linkId, linkToType);

        links.forEach((link) => {linksJson.links.push(link)});

        return linksJson;
    }

    /*
     * Description: Using a starting object, create 3d-graph node according to a provided nodeSchema
     *
     * @param {object} startObject - The node to which we are creating a link
     * @param {object} nodeContainer - What we put our nodes in
     * @param {string} nodeId - Just the name we use to prefix generated link IDs
     */
    static mapNodes(startObject, nodeContainer, nodeId = 'node') {

        let nodesJson = nodeContainer;

        //generate a node with an id, name and value
        const node = mapNode(startObject, nodeId);

        nodesJson.nodes.push(node);

        return nodesJson;
    }


    /*
     * Description: Create 3d-graph from GraphQL endpoint and GraphQL query via HTTP
     *
     * @param {string} sourceUrl - The GraphQL endpoint
     * @param {string} sourceQuery - The GraphQL query
     */

    graphFromUrl(sourceUrl, sourceQuery) {

        const nodeGraph = new ForceGraph3D();

        qwest.get(sourceUrl + sourceQuery).then((xhr, response) => {

            const graphData = NodeGraph.mapData(response.data);

            nodeGraph(document.getElementById('nodegraph'))
                .cooldownTicks(300)
                .idField('id')
                .valField('val')
                .nameField('name')
                .autoColorBy('type')
                .forceEngine('ngraph')
                .graphData(graphData);

        }).catch(function(e, xhr, response) {
            // Process the error in getting the json file
            console.log('DATA RETRIEVAL ERROR');
            console.log(e);
        });

    }

    render() {
        return (
            <div id="nodegraph">{this.state.graph}</div>
        );
    }
}

export default NodeGraph;

