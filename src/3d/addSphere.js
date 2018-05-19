import * as THREE from 'three';

export const nodeResolution = 20;
export const nodeMaterials = {};
export const nodeRelSize = 10;
export const nodeGeometries = {};
export const defaultGeometry = new THREE.SphereBufferGeometry(Math.cbrt(1) * nodeRelSize, nodeResolution, nodeResolution);



export default function addSphere(node, graphGroup, addData = false) {

    const imageLoader = new THREE.ImageLoader().setCrossOrigin( '*' );

    // main memory bottleneck
    const image = imageLoader.load( node.mainImage );
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


    let sphereGeometry;

    if (node.hasOwnProperty('size')) {
        sphereGeometry = new THREE.SphereBufferGeometry(Math.cbrt(node.size) * nodeRelSize, nodeResolution, nodeResolution);

        //currently only the central node has its own size.
        //Need to find a good place to separate configurations for special nodes.
        material.emissive = new THREE.Color(0xFFFFFF);

    } else {
        sphereGeometry = defaultGeometry;
    }

    const sphere = new THREE.Mesh(sphereGeometry, material);

    sphere.name = node.name; // Add label
    if (addData) {
        sphere.__data = node; // Attach node data
    }
    graphGroup.add(node.mesh = sphere);

}
