export default function mapNode(startObject, nodeId, callback){

    var id = 'UNDEFINED ID';

    if (startObject._id) {
        id = `-${startObject._id}`;
    }
    else if (startObject.id) {
        id = `-${startObject.id}`;
    }

    var title = 'UNDEFINED NODE TITLE';

    if (startObject.term) {
        title = `${startObject.term}`;
    }
    else if (startObject.title) {
        title = `${startObject.title}`;
    }

    return {
        id: nodeId + id,
        name: title,
        val: 10,
        type: nodeId
    }
}
