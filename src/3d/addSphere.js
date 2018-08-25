import * as THREE from 'three';

import { ImageLoader, sunTexture, errorImage } from './loaders.js';

export const nodeResolution = 20;
export const nodeMaterials = {};
export const nodeRelSize = 10;
export const nodeGeometries = {};
export const defaultGeometry = new THREE.SphereBufferGeometry(Math.cbrt(1) * nodeRelSize, nodeResolution, nodeResolution);

export default function addSphere(node, graphGroup, addData = false, addImage = true) {
    let material;

    if(addImage) {

        if(!node.mainImage) {
            node.mainImage = 'error.jpg';
        }

        let image;

        switch (node.mainImage) {
            case 'error.jpg':
                image = errorImage;
                break;
            case 'suntex.jpg':
                image = sunTexture;
                break;
            default:
                image = ImageLoader.load( node.mainImage );
        }

        const texture = new THREE.CanvasTexture( image );

        //prevent three.js complaining about images not being 2^n width and height
        texture.minFilter = THREE.LinearFilter;
        texture.mapping = THREE.SphericalReflectionMapping;
        material = new THREE.MeshPhongMaterial(
            { color: 0xffffff,
                transparent: true,
                opacity: 1,
                envMap: texture,
                reflectivity: 1,
                shininess: 100
            } );
    } else {
        material = new THREE.MeshPhongMaterial(
            { color: 0xffffff,
                transparent: true,
                opacity: 1,
                reflectivity: 1,
                shininess: 100
            } );
    }

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
        sphere.__data = node.id; // Attach node data
    }
    graphGroup.add(node.mesh = sphere);

}
