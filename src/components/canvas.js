import * as THREE from 'three';

//3d stuff
export const CAMERA_DISTANCE2NODES_FACTOR = 150;
export const MAX_FRAMES = 1000;

export function resizeCanvas(renderer, camera, width = 1000, height = 300) {
    if (width && height) {
        renderer.setSize(width, height);
        camera.aspect = width/height;
        camera.updateProjectionMatrix();
    }
}

//canvas utilities
export function getOffset(el) {
    const rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
}

export function add3dStuff(data, graphGroup) {

    //node and link 3d properties
    const lineMaterials = {}; // indexed by color
    const sphereGeometries = {};
    const sphereMaterials = {};
    const nodeRelSize = 10;
    const nodeResolution = 10;

    //map the newly created links to lines in THREE.js and add them to the scene
    data.links.forEach(link => {
        if (!lineMaterials.hasOwnProperty('color')) {
            lineMaterials['color'] = new THREE.LineBasicMaterial({
                color: '#ffffff',
                transparent: true,
                opacity: 0.5
            });
        }

        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3));
        const lineMaterial = lineMaterials['color'];
        const line = new THREE.Line(geometry, lineMaterial);

        line.renderOrder = 10; // Prevent visual glitches of dark lines on top of spheres by rendering them last
        graphGroup.add(link.__line = line);
    });

    //map the newly created nodes to spheres
    data.nodes.forEach(node => {
        //this val would affect the radius of the sphere, but we don't have info mapped to that.
        const val = 1;
        if (!sphereGeometries.hasOwnProperty(val)) {
            sphereGeometries[val] = new THREE.SphereGeometry(Math.cbrt(val) * nodeRelSize, nodeResolution, nodeResolution);
        }

        new THREE.ImageLoader()
            .setCrossOrigin( '*' )
            //.load( node.imageUrl + performance.now(), function ( image ) {
            .load( node.imageUrl, function ( image ) {
                var texture = new THREE.CanvasTexture( image );
                var material = new THREE.MeshBasicMaterial( { color: 0xff8888, map: texture } );
                const sphere = new THREE.Mesh(sphereGeometries[val], material);
                sphere.name = node.name; // Add label
                sphere.__data = node; // Attach node data
                graphGroup.add(node.mesh = sphere);

            });


        /**
        if (!sphereMaterials.hasOwnProperty('color')) {
            sphereMaterials['color'] = new THREE.MeshLambertMaterial({
                color: '#ffffaa',
                transparent: true,
                opacity: 0.75
            });
        }**/

    });

}