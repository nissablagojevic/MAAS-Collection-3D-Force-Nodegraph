export default function mapNode(emuData, nodeId, callback){

    let id = 'UNDEFINED ID';

    //if the data has an id, grab it from either the graphql _id or id field
    if (emuData._id) {
        id = `${emuData._id}`;
    }
    else if (emuData.id) {
        id = `${emuData.id}`;
    }

    //if the data has a term, use it as a title, if it has a title use that instead
    let title = `Untitled`;

    if (emuData.term) {
        title = `${emuData.term}`;
    }
    else if (emuData.title) {
        title = `${emuData.title}`;
    }

    let mainImage = '';
    let images = [];

    if(emuData.images && emuData.images.length && emuData.images[0].url) {
        images = emuData.images;
        mainImage = emuData.images[0].url;
    }

    let description = '';

    if(emuData.description) {
        description = `${emuData.description}`;
    }

    let terms = [];

    if(emuData.terms && emuData.terms.length) {
        terms = emuData.terms;
    }

    let date = '';

    if(emuData.production && emuData.production.length) {
        if(emuData.production[0].date) {
            date = `${emuData.production[0].date}`;
        }
    }

    //plonk the data in required format for a 3d-graph node
    return {
        id: nodeId + '-' + id,
        _id: id,
        name: title,
        val: 10,
        mainImage: mainImage,
        images: images,
        type: nodeId,
        description: description,
        date: date,
        terms: terms
    }
}
