import mapNode from '../schema/node.js';
import mapLink from '../schema/link.js';

//graphql data
export const sourceUrl = 'https://api.maas.museum/graphql?query=';

export const narrativesList = `{
            narratives {
                _id
                title
            }
        }`;

//_id:2087 = antiquities
//_id:69 = ceramic highlights
//_id:743 = anatomical and botanical models - tight clusters

export function nodeQuery(type, id) {
    //danger. Uses very poor plurilisation assumption
    //object => objects
    //narrative => narratives etc.
    //also only works on objects currently due to erroring out on non-existing properties
    //@TODO: actually map different node types to a schema so this is way less specific to objects
    return `{${type}s(filter:{_id:${id}}) {
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
        url(width: 320, height: 320)
      }
  }}`;
}

export function sourceQuery(narrativeId) {
    return  `{narratives(filter:{_id:${narrativeId}}){
    _id
    title
    description
    objects(limit: 200) {
      _id
      category
      terms {
        id
        term
      }
      images(limit: 1) {
        url(width: 320, height: 320)
      }
    }
  }
}`;

}

/*
 * Description: resolve graphQl data against 3d-force-graph schema
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
        data.narratives.forEach((narrative) => {
                mapNodes(narrative, graphSchema, 'narrative')
        });

        //for the first narrative's objects returned in the query, map the objects as nodes and put that in our graphschema
        data.narratives[0].objects.forEach((obj) => {
                mapNodes(obj, graphSchema, 'object')
        });

        //for the first narrative map each object's terms to nodes and put that in our graphschema
        data.narratives[0].objects.forEach((obj) => {
            obj.terms.forEach((term) => {
                    mapNodes(term, graphSchema, 'term')
            });
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

    let alreadyExists = false;
    for (let i = 0; i < nodesJson.nodes.length; i++) {
        if(node.id === nodesJson.nodes[i].id) {
            alreadyExists = true;
        }
    }

    if(!alreadyExists) {
        nodesJson.nodes.push(node);
    }

    return nodesJson;
}
