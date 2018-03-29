import * as THREE from 'three';

export const nodeResolution = 20;
export const nodeMaterials = {};
export const nodeRelSize = 10;
export const nodeGeometries = {};

//this val would affect the radius of the sphere, but we don't have info mapped to that.
//if we did, each sphere would need to be created within the addSphere method
const val = 1;
if (!nodeGeometries.hasOwnProperty(val)) {
  nodeGeometries[val] = new THREE.SphereBufferGeometry(Math.cbrt(val) * nodeRelSize, nodeResolution, nodeResolution);
}

export default function addSphere(node, image, graphGroup, addData = false) {
    const texture = new THREE.CanvasTexture( image );
    //prevent three.js complaining about images not being 2^n width and height
    texture.minFilter = THREE.LinearFilter;
    texture.mapping = THREE.SphericalReflectionMapping;
    const material = new THREE.MeshPhongMaterial(
        { color: 0xffffff,
            transparent: true,
            opacity: 1,
            envMap: texture,
            reflectivity: 1,
            shininess: 100
        } );

    const sphere = new THREE.Mesh(nodeGeometries[val], material);

    sphere.name = node.name; // Add label
    if (addData) {
      sphere.__data = node; // Attach node data
    }
    graphGroup.add(node.mesh = sphere);
}
