import * as THREE from 'three';

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

export function add3dStuff(data, graphGroup, layout, isD3Sim, lineMaterials, nodeMaterials, nodeTexture) {

    //node and link 3d properties
    //const lineMaterials = {}; // indexed by color
    const nodeGeometries = {};
    //const nodeMaterials = {};
    const nodeRelSize = 20;
    const nodeResolution = 10;

    //map the newly created nodes to spheres
    data.nodes.forEach(node => {
        //this val would affect the radius of the sphere, but we don't have info mapped to that.
        const val = 1;
        if (!nodeGeometries.hasOwnProperty(val)) {
            nodeGeometries[val] = new THREE.SphereGeometry(Math.cbrt(val) * nodeRelSize, nodeResolution, nodeResolution);
        }

        //TEMPORARY UNTIL I GET CORS GOING ON SERVER
        //node.imageUrl = 'https://instagram.fmel1-1.fna.fbcdn.net/vp/7fcb02c925afda63874bcfdde952bc0b/5B28F33C/t51.2885-15/s640x640/sh0.08/e35/28754685_1920615668236824_3043251162649198592_n.jpg';
        new THREE.ImageLoader()
            .setCrossOrigin( '*' )
            //.load( node.imageUrl + performance.now(), function ( image ) {
            .load( node.imageUrl, function ( image ) {
                //if we have an image for the node, put it in there with its sphere
                const texture = new THREE.CanvasTexture( image );
                const material = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.1, depthTest: false } );

                const spriteMaterial = new THREE.SpriteMaterial( { map: texture, color: 0xffffff, depthTest: false } );
                const sprite = new THREE.Sprite( spriteMaterial );
                sprite.scale.set(spriteMaterial.map.image.width/15, spriteMaterial.map.image.height/15, 1);

                const sphere = new THREE.Mesh(nodeGeometries[val], material);
                sphere.name = node.name; // Add label
                sphere.__data = node; // Attach node data


                graphGroup.add(node.mesh = sphere);
                graphGroup.add(node.img = sprite);

            },
              undefined,
              function() {
                //Image loading error nodes.
                const material = new THREE.MeshBasicMaterial( { color: 0xff0000, transparent: true, opacity: 0.5, depthTest: true } );
                const sphere = new THREE.Mesh(nodeGeometries[val], material);
                sphere.name = node.name; // Add label
                sphere.__data = node; // Attach node data
                console.log('errorrrr');
                graphGroup.add(node.mesh = sphere);
            });


        /**
         if (!nodeMaterials.hasOwnProperty('color')) {
            nodeMaterials['color'] = new THREE.MeshLambertMaterial({
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
        const line = new THREE.Line(geometry, lineMaterials);

        line.renderOrder = 10; // Prevent visual glitches of dark lines on top of spheres by rendering them last
        graphGroup.add(link.__line = line);
    });



}

export function update3dStuff(mappedData, layout, isD3Sim, nodeIdField) {

    // Update nodes position
    mappedData.nodes.forEach(node => {
        const mesh = node.mesh;
        const sprite = node.img;

        if (!mesh && !sprite) return;

        const pos = isD3Sim ? node : layout.getNodePosition(node[nodeIdField]);

        if(mesh) {
          mesh.position.x = pos.x;
          mesh.position.y = pos.y || 0;
          mesh.position.z = pos.z || 0;
        }

        if(sprite) {
          sprite.position.x = pos.x;
          sprite.position.y = pos.y;
          sprite.position.z = pos.z;
        }

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
