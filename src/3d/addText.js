import * as THREE from 'three';

const FONT_URL = 'http://localhost:3000/lineto-circular.json';

export default function addText(node, graphGroup) {
    const textMaterials = [
        new THREE.MeshBasicMaterial({color: 0xffffff, overdraw: 0.5 }),
        new THREE.MeshBasicMaterial( { color: 0x000000, overdraw: 0.5 } )
    ];

    const fontLoader = new THREE.FontLoader();

    //yeah, need to properly load this.
    fontLoader.load( FONT_URL,
        function ( font ) {
            const geometry = new THREE.TextGeometry( node.name, {
                font: font,
                size: 5,
                height: 5,
                curveSegments: 2
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