import * as THREE from 'three';

import { addLine, addSprite, addSphere, addText, addEnv } from '../3d';

export const CAMERA_DISTANCE2NODES_FACTOR = 150;
export const MAX_FRAMES = 1000;

export function resizeCanvas(renderer, camera, width, height) {
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


export function add3dStuff(data, graphGroup, layout, isD3Sim) {

    //node and link 3d properties

    const textGroup = new THREE.Group();
    const spriteGroup = new THREE.Group();
    const nodeSphereGroup = new THREE.Group();
    const lineGroup = new THREE.Group();

    textGroup.name = "textGroup";
    spriteGroup.name = "spriteGroup";
    nodeSphereGroup.name = "nodeSphereGroup";
    lineGroup.name = "lineGroup";

    //map the newly created nodes to spheres
    data.nodes.forEach(node => {

        new THREE.ImageLoader()
            .setCrossOrigin( '*' )
            //.load( node.imageUrl + performance.now(), function ( image ) {
            .load( node.imageUrl, function ( image ) {
                //addSprite(node, image, spriteGroup, false);
                addSphere(node, image, nodeSphereGroup, true);
            },
              undefined,
              function() {
                //Image loading error nodes.
                addText(node, textGroup);
            });
    });

    //map the newly created links to lines in THREE.js and add them to the scene
    data.links.forEach(link => {
        addLine(link, lineGroup);
    });

    graphGroup.add(lineGroup);
    graphGroup.add(nodeSphereGroup);
    graphGroup.add(textGroup);
    graphGroup.add(spriteGroup);

}


export function update3dStuff(mappedData, layout, isD3Sim, nodeIdField) {

    // Update nodes position
    mappedData.nodes.forEach(node => {
        const mesh = node.mesh;
        const sprite = node.img;
        const displayText = node.displayText;

        //if (!mesh && !sprite) return;

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

        if(displayText) {
          //console.log(displayText);
          const centerOffset = -0.5 * ( displayText.geometry.boundingBox.max.x - displayText.geometry.boundingBox.min.x );
          //displayText.position.x = centerOffset + pos.x;
          displayText.position.x = pos.x;
          displayText.position.y = pos.y;
          displayText.position.z = pos.z;
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
