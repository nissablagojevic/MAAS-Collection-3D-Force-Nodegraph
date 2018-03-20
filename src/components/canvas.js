import * as THREE from 'three';
import dat from 'dat.gui';

//import {MeshLine} from 'three.meshline';

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

    //map the newly created nodes to spheres
    data.nodes.forEach(node => {
        //this val would affect the radius of the sphere, but we don't have info mapped to that.
        const val = 1;
        if (!sphereGeometries.hasOwnProperty(val)) {
            sphereGeometries[val] = new THREE.SphereGeometry(Math.cbrt(val) * nodeRelSize, nodeResolution, nodeResolution);
        }

        //TEMPORARY UNTIL I GET CORS GOING ON SERVER
        node.imageUrl = 'https://instagram.fmel1-1.fna.fbcdn.net/vp/94d1cc1192566037bde989d5a863e368/5B414519/t51.2885-15/s640x640/sh0.08/e35/20214323_1492574297455295_3536729040805167104_n.jpg';

        new THREE.ImageLoader()
            .setCrossOrigin( '*' )
            //.load( node.imageUrl + performance.now(), function ( image ) {
            .load( node.imageUrl, function ( image ) {
                var texture = new THREE.CanvasTexture( image );
                var material = new THREE.MeshBasicMaterial( { color: 0xffffff, map: texture } );
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

    //map the newly created links to lines in THREE.js and add them to the scene
    data.links.forEach(link => {
        if (!lineMaterials.hasOwnProperty('color')) {
            lineMaterials['color'] = new THREE.LineBasicMaterial({
                color: '#ffffff',
                lineWidth: 10,
                transparent: true,
                opacity: 0.5
            });
        }

        //for 1px lines
        //each vertex stores 3 position values (x,y,z) and there are 2 of those, so 2 * 3 Typed Array.
        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3));
        const material = lineMaterials['color'];
        const line = new THREE.Line(geometry, material);

        line.renderOrder = 10; // Prevent visual glitches of dark lines on top of spheres by rendering them last
        graphGroup.add(link.__line = line);
    });



}

export function update3dStuff(mappedData, layout, isD3Sim, nodeIdField) {

    // Update nodes position
    mappedData.nodes.forEach(node => {
        const mesh = node.mesh;
        if (!mesh) return;

        const pos = isD3Sim ? node : layout.getNodePosition(node[nodeIdField]);

        mesh.position.x = pos.x;
        mesh.position.y = pos.y || 0;
        mesh.position.z = pos.z || 0;
    });

    // Update links position
    mappedData.links.forEach(link => {
        const line = link.__line;
        if (!line) return;

        const pos = isD3Sim
                ? link
                : layout.getLinkPosition(layout.graph.getLink(link.source, link.target).id),
            start = pos[isD3Sim ? 'source' : 'from'],
            end = pos[isD3Sim ? 'target' : 'to'],
            linePos = line.geometry.attributes.position;

        linePos.array[0] = start.x;
        linePos.array[1] = start.y || 0;
        linePos.array[2] = start.z || 0;
        linePos.array[3] = end.x;
        linePos.array[4] = end.y || 0;
        linePos.array[5] = end.z || 0;

        linePos.needsUpdate = true;
        line.geometry.computeBoundingSphere();


    });

}


export function initGui(line, matLine) {
    const gui = new dat.GUI();
    var param = {
        'width (px)': 5,
    };

    gui.add(param, 'width (px)', 1, 10, 1).onChange(function (val) {
        matLine.linewidth = val;
    });

}