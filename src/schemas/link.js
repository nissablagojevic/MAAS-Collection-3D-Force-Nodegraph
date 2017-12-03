export default function mapLink(startObject, linkId, linkToType, callback){

    console.log(startObject);

    var id = 'UNDEFINED ID';

    if (startObject._id) {
        id = `-${startObject._id}`;
    }
    else if (startObject.id) {
        id = `-${startObject.id}`;
    }

    var targets = [];


    startObject[linkToType].forEach((type) => {

                //SUPER HACKY SHIT WAY TO GET RID OF THE PLURAL ON OBJECTS OR TERMS OR NARRATIVES ETC FOR THE TARGET
                //WILL LIKELY FAIL ON WORDS WITH NON-S PLURALS

                var targetId = 'UNDEFINED ID';
                if (type._id) {
                    targetId = `-${type._id}`;
                }
                else if (type.id) {
                    targetId = `-${type.id}`;
                }

                targets.push(
                    {
                        source: linkId + id,
                        target: linkToType.slice(0, -1) + targetId
                    });
            });

    return targets;
}
