import * as THREE from 'three';

export const manager = new THREE.LoadingManager();
export const CubeTextureLoader = new THREE.CubeTextureLoader(manager);
export const FontLoader = new THREE.FontLoader(manager);
export const ImageLoader = new THREE.ImageLoader(manager).setCrossOrigin( '*' );
export const TextureLoader = new THREE.TextureLoader();

export let errorImage = null;
export let sunTexture = null;
export let cubeTexture = null;

/**
 * Sends an image url to the Three loader
 *
 * @param {Array} Collection of result images
 * @param {String} Name of the image
 * @param {String} URL of the Image
 * @return null
 */
export const preloadImage = (array, id, i) => {
    ImageLoader.load(i, (i) => {
        i.name = id;
        array.push(i);
    });
};

export function preloadFont(json) {
    return new Promise((resolve, reject) => {
        console.log("PRELOAD FONT");
        if (!json) {
            json = 'lineto-circular.json';
        }

        FontLoader.load(json,
            (f) => {resolve(f)},
            (xhr) => {console.log('loading font')},
            (err) => {console.log('load failed on font'); reject(err);}
        );
    });
}



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








