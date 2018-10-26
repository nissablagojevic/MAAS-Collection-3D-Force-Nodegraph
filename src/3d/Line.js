import * as THREE from 'three';

import settings from './settings';

const Line = (function() {
    function makeLine(link, material = null, geometry = null) {
        if(!material) {
            material = settings.defaultLineMaterial.clone();
        }

        if(!geometry) {
            geometry = settings.defaultLineGeometry.clone();
        }

        const line = new THREE.Line(geometry, material);
        line.renderOrder = 10; // Prevent visual glitches of dark lines on top of spheres by rendering them last

        return line;
    }

    return {
      makeLine: makeLine
    }
})();

export default Line;