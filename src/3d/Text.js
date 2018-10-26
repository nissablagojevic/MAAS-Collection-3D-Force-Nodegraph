import * as THREE from 'three';

import settings from './settings';

const Text = (function() {

    /**
     * @desc Default array of MeshBasicMaterials for text.
     * @constant
     * @param {MeshBasicMaterial[] | null} materials
     * @type {MeshBasicMaterial[]}
     * @return {MeshBasicMaterial[]}
     */

    const getMaterial = (materials = null) => {
        if (!materials) {
            return [settings.defaultMaterialFace.clone(), settings.defaultMaterialEdge.clone()];
        }

        return materials;

    };

    /**
     * @desc Creates a new TextGeometry from text.
     * @constant
     * @param {String} text to create geometry from
     * @param {THREE.Font} Font to create geometry from
     * @return {THREE.TextGeometry} The new TextGeometry object.
     */

    const getGeometry = (text, font) => {
        return new THREE.TextGeometry( text, {
            font: font,
            size: 5,
            height: 5,
            curveSegments: 5
        });
    };

    function createText(node, textGeometry, textMaterial) {
        const textMesh = new THREE.Mesh( textGeometry, textMaterial );
        textMesh.__data = node.id;
        textMesh.name = node.name; // Add label
        return textMesh;
    }

    function makeText(node, font, textMaterial = null) {
        let name = node.name;

        if (!name) {
            if (node.id) {
                name = node.id;
            } else {
                name = 'Error';
            }
        }

        if (!textMaterial) {
            textMaterial = getMaterial();
        }

        let textGeometry = getGeometry(name, font);
        textGeometry.computeBoundingBox();

        return createText(node, textGeometry, textMaterial);
    }

    return {
        makeText: makeText
    }
})();


export default Text;