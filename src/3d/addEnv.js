import * as THREE from 'three';

export default function addEnv(scene, ambientLight = null, directLight = null, skyBoxTexture = null, viewFog = null) {
    //fiat lux

    let urls;

    if(!ambientLight) {
        ambientLight = new THREE.AmbientLight(0xbbbbbb);
    }

    if(!directLight) {
        directLight = new THREE.DirectionalLight(0xffffff, 0.6);
    }

    if(!skyBoxTexture) {
        // Textures
        const r = "http://localhost:3000/";
        urls = [ r + "spacetex.jpg", r + "spacetex.jpg",
            r + "spacetex.jpg", r + "spacetex.jpg",
            r + "spacetex.jpg", r + "spacetex.jpg" ];
    }

    if(!viewFog) {
        viewFog = new THREE.Fog(0xfff189, 1, 10000);
    }

    scene.fog = viewFog;

    //pos x, neg x, pos y, neg y, pos z, neg z

    //texture must be width = height and ideally width = 2^n
    const textureCube = new THREE.CubeTextureLoader().load( urls );
    textureCube.format = THREE.RGBFormat;
    textureCube.mapping = THREE.CubeReflectionMapping;

    var cubeShader = THREE.ShaderLib[ "cube" ];

    var cubeMaterial = new THREE.ShaderMaterial( {
        fragmentShader: cubeShader.fragmentShader,
        vertexShader: cubeShader.vertexShader,
        uniforms: cubeShader.uniforms,
        depthWrite: false,
        side: THREE.BackSide,
        fog: true
    } );
    cubeMaterial.uniforms[ "tCube" ].value = textureCube;
    // Skybox
    const cubeMesh = new THREE.Mesh( new THREE.BoxBufferGeometry( 10000, 10000, 10000 ), cubeMaterial );
    cubeMesh.name = "skybox";
    scene
        //.add( cubeMesh )
        .add( ambientLight )
        .add( directLight );
}