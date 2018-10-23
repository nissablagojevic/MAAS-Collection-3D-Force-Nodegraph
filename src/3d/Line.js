import * as THREE from 'three';

import { defaultLineMaterial, defaultLineGeometry } from './settings';

const Line = (function() {
    function addLine(link, graphGroup, material = null, geometry = null) {
        if(!material) {
            material = defaultLineMaterial.clone();
        }

        if(!geometry) {
            geometry = defaultLineGeometry.clone();
        }

        const line = new THREE.Line(geometry, material);
        line.renderOrder = 10; // Prevent visual glitches of dark lines on top of spheres by rendering them last

        graphGroup.add(link.__line = line);
    }

    return {
        addLine: addLine
    }
})();

export default Line;