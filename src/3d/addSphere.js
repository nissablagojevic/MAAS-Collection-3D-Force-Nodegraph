import * as THREE from 'three';

import { ImageLoader, sunTexture, errorImage } from './loaders.js';

export const nodeResolution = 20;
export const nodeMaterials = {};
export const nodeRelSize = 10;
export const nodeGeometries = {};
export const defaultGeometry = new THREE.SphereBufferGeometry(Math.cbrt(1) * nodeRelSize, nodeResolution, nodeResolution);

export default function addSphere(node, graphGroup, addData = false, addImage = true) {
    let material;
    let glowColour;

    if(addImage) {

        if(!node.mainImage) {
            node.mainImage = 'error.jpg';
        }

        let image;

        switch (node.mainImage) {
            case 'error.jpg':
                image = errorImage;
                glowColour = 0xff0000;
                break;
            case 'suntex.jpg':
                image = sunTexture;
                glowColour = 0xffe589;
                break;
            default:
                image = ImageLoader.load( node.mainImage );
                glowColour = 0x54b1ff;
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
        //currently only the central node has its own size.
        //Need to find a good place to separate configurations for special nodes.

        sphereGeometry = new THREE.SphereBufferGeometry(Math.cbrt(node.size) * nodeRelSize, nodeResolution, nodeResolution);
        material.emissive = new THREE.Color(0xFFFFFF);

    } else {
        sphereGeometry = defaultGeometry;
        //material.emissive = new THREE.Color(0x89D4FF);
    }

    const sphere = new THREE.Mesh(sphereGeometry, material);

    // create custom material from the shader code above
    // that is within specially labeled script tags
    // credit: http://stemkoski.github.io/Three.js/Shader-Glow.html
    var glowMaterial = new THREE.ShaderMaterial(
        {
            uniforms:
            {
                "c":   { type: "f", value: 0.1 },
                "p":   { type: "f", value: 5 },
                glowColor: { type: "c", value: new THREE.Color(glowColour) },
                viewVector: { type: "v3", value: {x: 1, y: 1, z: 1} }
            },
            vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
            fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        }   );

    let glow = new THREE.Mesh( sphereGeometry.clone(), glowMaterial );
    sphere.add(glow);
    glow.scale.multiplyScalar(1.5);

    sphere.name = node.name; // Add label
    if (addData) {
        sphere.__data = node.id; // Attach node data
    }
    graphGroup.add(node.mesh = sphere);

}
