import * as THREE from 'three';

import { sunTexture, errorImage, glowMaterial, glowColour } from './loaders.js';

export const nodeResolution = 20;
export const nodeMaterials = {};
export const nodeRelSize = 10;
export const nodeGeometries = {};
export const defaultGeometry = new THREE.SphereBufferGeometry(Math.cbrt(1) * nodeRelSize, nodeResolution, nodeResolution);

/**
 *
 let material  = new Promise (resolve => {
            let image;
            let t;

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
                    image = node.mainImage;
                    glowColour = 0x54b1ff;
            }

            if (image === node.mainImage) {
                t = ImageLoader.load(image, (i) => {
                    console.log("IMAGE");
                    console.log(i);
                    let t = new THREE.CanvasTexture(i);
                    //prevent three.js complaining about images not being 2^n width and height
                    t.minFilter = THREE.LinearFilter;
                    t.mapping = THREE.SphericalReflectionMapping;
                    t.name = 'canvasTex-' + node.id;
                    console.log('resolve');
                    resolve(t);
                });
            }
        }).then((texture) => {
                console.log("UPDATE MATERIAL");
                console.log(texture);

                return new THREE.MeshPhongMaterial(
                    { color: 0xffffff,
                        transparent: true,
                        opacity: 1,
                        envMap: texture,
                        reflectivity: 1,
                        shininess: 100
                    } );
        });
 *
 *
 */


export default function addSphere(node, graphGroup, addImage = true) {
    let glowColour;

    let image = errorImage;
    let name = 'errorImage';

    if(addImage) {
        if (node.mainImage === 'suntex.jpg') {
            image = sunTexture;
            name = 'sunImage';
            glowColour = 0xffe589;
        }
    }

    let texture = new THREE.CanvasTexture(image);
    //prevent three.js complaining about images not being 2^n width and height
    texture.minFilter = THREE.LinearFilter;
    texture.mapping = THREE.SphericalReflectionMapping;
    texture.name = name;

    let material = new THREE.MeshPhongMaterial(
        {
            transparent: true,
            opacity: 1,
            envMap: texture,
            reflectivity: 1,
            shininess: 100
        } );

    let sphereGeometry;

    if (node.hasOwnProperty('size')) {
        //currently only the central node has its own size.
        //Need to find a good place to separate configurations for special nodes.

        sphereGeometry = new THREE.SphereBufferGeometry(Math.cbrt(node.size) * nodeRelSize, nodeResolution, nodeResolution);
        //material.emissive = new THREE.Color(0xFFFFFF);

    } else {
        sphereGeometry = defaultGeometry;
        //material.emissive = new THREE.Color(0x89D4FF);
    }

    const sphere = new THREE.Mesh(sphereGeometry, material);


    let glow = new THREE.Mesh( sphereGeometry.clone(), glowMaterial(glowColour) );
    sphere.add(glow);
    glow.scale.multiplyScalar(1.5);

    sphere.name = node.name; // Add label
    sphere.__data = node.id; // Attach node data

    graphGroup.add(node.mesh = sphere);

}
