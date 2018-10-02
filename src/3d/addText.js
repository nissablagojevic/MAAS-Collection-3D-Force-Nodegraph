import * as THREE from 'three';

export default function addText(node, graphGroup, font, textMaterials = null) {
    if (!textMaterials) {
        textMaterials = [
            new THREE.MeshBasicMaterial({
              color: 0xffffff
            }),
            new THREE.MeshBasicMaterial( { color: 0x000000} )
        ];
    }

     const geometry = new THREE.TextGeometry( node.name, {
                font: font,
                size: 5,
                height: 5,
                curveSegments: 5
            });


     geometry.computeBoundingBox();
     const textMesh = new THREE.Mesh( geometry, textMaterials );
     textMesh.__data = node.id;
     graphGroup.add(node.displayText = textMesh);

}