import * as THREE from 'three';

import { CubeTextureLoader, cubeTexture } from './loaders.js';

export default function addEnv(scene, ambientLight = null, directLight = null, skyBoxTexture = null, viewFog = null) {
    //fiat lux
    var light = new THREE.PointLight( 0xFFA500, 1, 2500 );
    light.position.set( 0, 0, 0 );
    scene.add( light );

    if(!ambientLight) {
        ambientLight = new THREE.AmbientLight(0xbbbbbb);
    }

    if(!directLight) {
        //directLight = new THREE.DirectionalLight(0xffffff, 0.6);
    }

    let textureCube;
    if(!skyBoxTexture) {
        textureCube = cubeTexture;
    } else {
        //texture must be width = height and ideally width = 2^n
        textureCube = CubeTextureLoader.load( skyBoxTexture );
    }

    textureCube.format = THREE.RGBFormat;
    textureCube.mapping = THREE.CubeReflectionMapping;

    if(!viewFog) {
        viewFog = new THREE.Fog(0xfff189, 1, 10000);
    }

    scene.fog = viewFog;

    var cubeShader = THREE.ShaderLib[ "cube" ];

    var cubeMaterial = new THREE.ShaderMaterial( {
        fragmentShader: cubeShader.fragmentShader,
        vertexShader: cubeShader.vertexShader,
        uniforms: cubeShader.uniforms,
        depthWrite: false,
        side: THREE.BackSide,
    } );
    cubeMaterial.uniforms[ "tCube" ].value = textureCube;
    // Skybox
    const cubeMesh = new THREE.Mesh( new THREE.BoxBufferGeometry( 25000, 25000, 25000 ), cubeMaterial );
    cubeMesh.name = "skybox";
    scene
        .add( cubeMesh )
        .add( ambientLight )
        .add( directLight );
}