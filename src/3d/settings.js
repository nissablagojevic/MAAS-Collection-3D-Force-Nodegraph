import * as THREE from 'three';

//text
export const defaultMaterialFace = new THREE.MeshBasicMaterial({color: 0xffffff});
export const defaultMaterialEdge = new THREE.MeshBasicMaterial({ color: 0x000000});

//links
export const defaultLineMaterial = new THREE.LineBasicMaterial({
    color: '#ffffff',
    //lineWidth: 10,
    transparent: true,
    opacity: 0.5
});
export const defaultLineGeometry = new THREE.BufferGeometry().addAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3));

//Nodes
export const defaultSphereGeometry = new THREE.SphereBufferGeometry(Math.cbrt(1) * 10, 20, 20);
export const defaultGlowColour = new THREE.Color(0xff0000);
export const defaultGlowMaterial = new THREE.ShaderMaterial({
        uniforms:
        {
            "c":   { type: "f", value: 0.1 },
            "p":   { type: "f", value: 5 },
            glowColor: { type: "c", value: defaultGlowColour },
            //@TODO work out correct view vector for glowing effect
            viewVector: { type: "v3", value: {x: 0, y: 0, z: 2000} }
        },
        vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
});