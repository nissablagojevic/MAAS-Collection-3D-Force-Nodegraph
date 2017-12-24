export default function mapNode(startObject, nodeId, callback){

    var id = 'UNDEFINED ID';

    //if the data has an id, grab it from either the graphql _id or id field
    if (startObject._id) {
        id = `-${startObject._id}`;
    }
    else if (startObject.id) {
        id = `-${startObject.id}`;
    }

    //if the data has a term, use it as a title, if it has a title use that instead
    var title = 'UNDEFINED NODE TITLE';

    if (startObject.term) {
        title = `${startObject.term}`;
    }
    else if (startObject.title) {
        title = `${startObject.title}`;
    }

    //plonk the data in required format for a 3d-graph node
    return {
        id: nodeId + id,
        name: title,
        val: 10,
        type: nodeId
    }
}
