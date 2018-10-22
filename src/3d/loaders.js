import * as THREE from 'three';

export const manager = new THREE.LoadingManager();
export const CubeTextureLoader = new THREE.CubeTextureLoader(manager);
export const FontLoader = new THREE.FontLoader(manager);
export const ImageLoader = new THREE.ImageLoader(manager).setCrossOrigin( '*' );
export const TextureLoader = new THREE.TextureLoader();

export let errorImage = null;
export let sunTexture = null;
export let cubeTexture = null;
export let font = null;

// create custom material from the shader code above
// that is within specially labeled script tags
// credit: http://stemkoski.github.io/Three.js/Shader-Glow.html
export const glowMaterial = (glowColour) => {
    if (!glowColour) {
        glowColour = 0xff0000;
    }
    return new THREE.ShaderMaterial(
    {
        uniforms:
        {
            "c":   { type: "f", value: 0.1 },
            "p":   { type: "f", value: 5 },
            glowColor: { type: "c", value: new THREE.Color(glowColour) },
            //@TODO work out correct view vector for glowing effect
            viewVector: { type: "v3", value: {x: 0, y: 0, z: 2000} }
        },
        vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    }   )};


export const preloadImage = (array, id, i) => {
    ImageLoader.load(i, (i) => {
        i.name = id;
        array.push(i);
    });
};



FontLoader.load( 'lineto-circular.json', function ( f ) {
    return font = f;
});

//manager.onStart = function ( url, itemsLoaded, itemsTotal ) {

    //console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

//};

manager.onLoad = function ( ) {

    console.log( 'Loading complete!');

};

//manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {

    //console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

//};

manager.onError = function ( url ) {

    console.log( 'There was an error loading ' + url );

};

ImageLoader.load('error.jpg',
    (image) => {
        errorImage = image;
    });


ImageLoader.load('suntex.jpg',
    (image) => {
        sunTexture = image;
    });

// Textures
//pos x, neg x, pos y, neg y, pos z, neg z
//@TODO: replace with proper seamless cube textures
const urls = [ "bluecloud.jpg", "bluecloud.jpg", "bluecloud.jpg", "bluecloud.jpg", "bluecloud.jpg", "bluecloud.jpg" ];
CubeTextureLoader.load(urls, (images) => {
    cubeTexture = images;
});








