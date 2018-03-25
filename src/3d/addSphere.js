import * as THREE from 'three';

export default function addSphere(node, image, graphGroup, addData = false) {
    const nodeGeometries = {};
    const nodeMaterials = {};
    const nodeRelSize = 10;
    const nodeResolution = 20;

    //this val would affect the radius of the sphere, but we don't have info mapped to that.
    const val = 1;
    if (!nodeGeometries.hasOwnProperty(val)) {
        nodeGeometries[val] = new THREE.SphereGeometry(Math.cbrt(val) * nodeRelSize, nodeResolution, nodeResolution);
    }

    var texture = new THREE.CanvasTexture( image );
    //prevent three.js complaining about images not being 2^n width and height
    texture.minFilter = THREE.LinearFilter;
    texture.mapping = THREE.SphericalReflectionMapping;
    const material = new THREE.MeshLambertMaterial(
        { color: 0xffffff,
            transparent: true,
            opacity: 1,
            envMap: texture,
            reflectivity: 1
        } );
    const sphere = new THREE.Mesh(nodeGeometries[val], material);
    sphere.name = node.name; // Add label
    if (addData) {
        sphere.__data = node; // Attach node data
    }
    graphGroup.add(node.mesh = sphere);
}
