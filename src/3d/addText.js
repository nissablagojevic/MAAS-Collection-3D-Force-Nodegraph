import * as THREE from 'three';

export default function addText(node, graphGroup, textMaterials = null) {
    if (!textMaterials) {
        textMaterials = [
            new THREE.MeshBasicMaterial({
              color: 0xffffff
            }),
            new THREE.MeshBasicMaterial( { color: 0x000000} )
        ];
    }

    const fontLoader = new THREE.FontLoader();

    //yeah, need to properly bundle this.
    fontLoader.load( 'lineto-circular.json',
        function ( font ) {
            const geometry = new THREE.TextGeometry( node.name, {
                font: font,
                size: 5,
                height: 5,
                curveSegments: 5
            });

            geometry.computeBoundingBox();
            const textMesh = new THREE.Mesh( geometry, textMaterials );
            textMesh.__data = node;
            graphGroup.add(node.displayText = textMesh);
        },
        function (xhr) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },
        function(err) {
            console.log( 'An error happened' );
            console.log(err);
        });
}