import mapNode from '../schemas/node.js';
import mapLink from '../schemas/link.js';

//graphql data
export const sourceUrl = 'https://api.maas.museum/graphql?query=';
export const sourceQuery = `{narratives(filter:{_id:69}){
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

/*
 * Description: resolve graphQl data against 3d-force-graph schemas
 *
 * @param {object} response.data from graphQl endpoint
 */
export function mapData(data) {

    //graphSchema is the collection of nodes and links required to make a valid 3d force graph
    let graphSchema = {
        nodes: [],
        links: []
    };

    if(data && data.hasOwnProperty('narratives')) {
        //for each object in our query map it to our graph Schema and store that our nodeData var
        data.narratives.forEach((narrative) => {mapNodes(narrative, graphSchema, 'narrative')});

        //for the first narrative's objects returned in the query, map the objects as nodes and term and put that in our graphschema
        data.narratives[0].objects.forEach((obj) => {mapNodes(obj, graphSchema, 'object')});

        //for the first narrative map each object's terms to nodes and put that in our graphschema
        data.narratives[0].objects.forEach((obj) => {
            obj.terms.forEach((term) => {mapNodes(term, graphSchema, 'term')});
        });

        //for each of the first narrative's object, map the link between the object nodes and term nodes and put that in our graphschema
        data.narratives[0].objects.forEach((obj) => {mapLinks(obj, graphSchema, 'object', 'terms')});
    }

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
export function mapLinks(startObject, linkContainer, linkId = 'link', linkToType = 'objects') {
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
export function mapNodes(startObject, nodeContainer, nodeId = 'node') {

    let nodesJson = nodeContainer;

    //generate a node with an id, name and value
    const node = mapNode(startObject, nodeId);

    nodesJson.nodes.push(node);

    return nodesJson;
}