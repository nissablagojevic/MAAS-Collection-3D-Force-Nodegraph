import * as THREE from 'three';

export default function addLine(link, graphGroup, lineMaterials = null) {
    if(!lineMaterials) {
        lineMaterials = new THREE.LineBasicMaterial({
            color: '#ffffff',
            lineWidth: 10,
            transparent: true,
            opacity: 0.5
        });
    }
    //for 1px lines
    //each vertex stores 3 position values (x,y,z) and there are 2 of those, so 2 * 3 Typed Array.
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3));

    const line = new THREE.Line(geometry, lineMaterials);

    line.renderOrder = 10; // Prevent visual glitches of dark lines on top of spheres by rendering them last
    graphGroup.add(link.__line = line);
}