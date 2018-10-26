import * as THREE from 'three';
import { errorImage, sunTexture } from './loaders';
import settings from './settings';

const Sphere = (function() {


    const sphereGeometry = (nodeSize = 1, nodeRelSize = 10, nodeResolution = 20) => {
        if (nodeSize === 1 && nodeRelSize === 10 && nodeResolution === 20) {
            return settings.defaultSphereGeometry.clone();
        }
        return new THREE.SphereBufferGeometry(Math.cbrt(nodeSize) * nodeRelSize, nodeResolution, nodeResolution);
    };


    /**
     * Default material of glow around nodes
     * @constant
     * @param {String} Hex string eg. 0xff0000
     * @type {THREE.ShaderMaterial}
     * @default
     */

    const glowMaterial = (colour) => {
        if (!colour) {
            return settings.defaultGlowMaterial.clone();
        } else {
            let material =  settings.defaultGlowMaterial.clone();
            material.uniforms.glowColor.value = new THREE.Color(colour);
            return material;
        }
    };

    function addSphere(node, addImage = true) {
        let glowColour;

        let image = errorImage;
        let name = 'errorImage';

        if(addImage && node.mainImage && node.mainImage  === 'suntex.jpg') {
            image = sunTexture;
            name = 'sunImage';
            glowColour = 0xffe589;
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

        if (!node.hasOwnProperty('size')) {
            node.size = 1;
        }


         if (node.size) {
            material.emissive = new THREE.Color(0xFFFFFF);
        } else {
            material.emissive = new THREE.Color(0x89D4FF);
        }

        const sphereGeom = sphereGeometry(node.size);
        const sphere = new THREE.Mesh(sphereGeom, material);


        let glow = new THREE.Mesh( sphereGeom, glowMaterial(glowColour) );
        sphere.add(glow);
        glow.scale.multiplyScalar(1.5);

        sphere.name = node.name; // Add label
        sphere.__data = node.id; // Attach node data

        return sphere;
    }

    return {
        addSphere: addSphere
    }
})();

export default Sphere;