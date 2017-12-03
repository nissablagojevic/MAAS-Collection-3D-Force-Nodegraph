import { default as React, Component } from 'react';
import qwest from 'qwest';
import ForceGraph3D from '3d-force-graph/dist/3d-force-graph.min.js';
import mapNode from '../schemas/node.js';
import mapLink from '../schemas/link.js';

var sourceUrl = 'https://api.maas.museum/graphql?query=';
var sourceQuery = `{narratives(filter:{_id:69}){
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

//graphJson is the collection of nodes and links required to make a valid 3d force graph
var graphSchema = {
    nodes: [],
    links: []
};




var nodeGraph = new ForceGraph3D();

function interpretData(data) {

    var nodeData;
    var linkData;
    //for each object in our query map it to our graph Schema

    data.narratives.forEach((narrative) => {nodeData = mapNodes(narrative, graphSchema, 'narrative')});
    data.narratives[0].objects.forEach((obj) => {nodeData = mapNodes(obj, graphSchema, 'object')});
    data.narratives[0].objects.forEach((obj) => {
        obj.terms.forEach((term) => {
            nodeData = mapNodes(term, graphSchema, 'term');
        });
    });

    //data.narratives.forEach((narrative) => {linkData = mapLinks(narrative, graphSchema, 'narrative', 'objects')});
    data.narratives[0].objects.forEach((obj) => {linkData = mapLinks(obj, graphSchema, 'object', 'terms')});


    console.log("INTERPRET DATA");
    console.log(nodeData);

    //need to figure out why this is working for links too
    var graphData = nodeData;

    return graphData;
}

function graph(sourceUrl, sourceQuery, nodeGraph) {

    qwest.get(sourceUrl + sourceQuery).then((xhr, response) => {

        var graphData = interpretData(response.data);

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
        console.log('DATA GET ERROR');
        console.log(e);
    });

}

function mapLinks(startObject, linkSchema, linkId = 'link', linkToType = 'objects') {
    var linksJson = linkSchema;
    var links = mapLink(startObject, linkId, linkToType);

    links.forEach((link) => {linksJson.links.push(link)});

    return linksJson;
}

function mapNodes(startObject, nodeSchema, nodeId = 'node') {

    //graphJson is the collection of nodes and links required to make a valid 3d force graph
    var nodesJson = nodeSchema;

    //generate a node with an id, name and value
    var node = mapNode(startObject, nodeId);

    nodesJson.nodes.push(node);

    return nodesJson;
}



class NodeGraph extends Component {
    constructor() {
        super();
        this.state = {
            graph: ''
        }
    }

    componentDidMount() {
        this.renderGraph();
    }

    renderGraph() {
            return (
                <div id="another">
                    {this.graphDataSets()}
                </div>
            );
    }

    graphDataSets() {


        return graph(sourceUrl, sourceQuery, nodeGraph);


/**
            data.pop(); // Remove last empty row

            data.forEach(([size, path]) => {
                const levels = path.split('/'),
                    module = levels.length > 1 ? levels[1] : null,
                    leaf = levels.pop(),
                    parent = levels.join('/');

                nodes.push({
                    path,
                    leaf,
                    module,
                    size: +size || 1
                });

                if (parent) {
                    links.push({ source: parent, target: path});
                }
            });

        ForceGraph3D.cooldownTicks(300)
                .nodeRelSize(0.5)
                .idField('path')
                .valField('size')
                .nameField('path')
                .autoColorBy('module')
                .forceEngine('ngraph')
                .graphData({ nodes: nodes, links: links });
            });

        //tunnel.description = "fabric data for a cylindrical tunnel shape";**/
        //return [loadBlocks, loadD3Dependencies, tunnel];
        //return [loadBlocks];

    }

    render() {
        return (
            <div id="nodegraph">{this.state.graph}</div>
        );
    }
}

export default NodeGraph;

