import * as THREE from 'three';

export default function addEnv(scene) {
    //fiat lux
    const ambientLight = new THREE.AmbientLight(0xbbbbbb);
    const directLight = new THREE.DirectionalLight(0xffffff, 0.6);

    /**
     const viewFog = new THREE.Fog(0xfff189, 1, 1000);
     scene.fog = viewFog;**/

    // Textures
    var r = "http://localhost:3000/";
    //pos x, neg x, pos y, neg y, pos z, neg z
    var urls = [ r + "spacetex.jpg", r + "spacetex.jpg",
        r + "spacetex.jpg", r + "spacetex.jpg",
        r + "spacetex.jpg", r + "spacetex.jpg" ];

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
        //fog: true
    } );
    cubeMaterial.uniforms[ "tCube" ].value = textureCube;
    // Skybox
    const cubeMesh = new THREE.Mesh( new THREE.BoxBufferGeometry( 10000, 10000, 10000 ), cubeMaterial );
    cubeMesh.name = "skybox";
    scene.add( cubeMesh )
        .add( ambientLight )
        .add( directLight );
}