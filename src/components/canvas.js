import * as THREE from 'three';
import dat from 'dat.gui';
import { addLine, addSprite, addSphere, addText, addEnv } from '../3d';

export const CAMERA_DISTANCE2NODES_FACTOR = 150;
export const MAX_FRAMES = 1000;


export const GraphCanvas = (function() {
    let instance;

    const textGroup = new THREE.Group();
    const spriteGroup = new THREE.Group();
    const nodeSphereGroup = new THREE.Group();
    const lineGroup = new THREE.Group();

    const imageLoader = new THREE.ImageLoader().setCrossOrigin( '*' );

    //forceEngine can be d3 or ngraph
    const forceEngine = 'ngraph';
    const isD3Sim = forceEngine !== 'ngraph';

    function init() {
        textGroup.name = "textGroup";
        spriteGroup.name = "spriteGroup";
        nodeSphereGroup.name = "nodeSphereGroup";
        lineGroup.name = "lineGroup";
    }

    return {
        getInstance: function () {
            if ( !instance ) {
                instance = init();
            }
            return instance;
        },
        add3dStuff: function(data, graphGroup, layout) {
            //map the newly created nodes to spheres
            data.nodes.forEach(node => {

                imageLoader
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
        },
        update3dStuff: function(mappedData, layout, nodeIdField) {

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
        },
        initGui: function(scene) {

            const gui = new dat.GUI();
            const param = {};

            if(scene && scene.fog) {
                param.sceneFogColor = scene.fog.color.getHex();
                param.sceneFogNear = scene.fog.near;
                param.sceneFogFar = scene.fog.far;
                param.sceneFogVisible = scene.fog;
            }

            if(lineGroup && lineGroup.children.length) {
                param.lineMaterial = lineGroup.children[0].material;
                param.lineColor = param.lineMaterial.color.getHex();
                param.lineOpacity = param.lineMaterial.opacity;
            }


            if(nodeSphereGroup && nodeSphereGroup.children.length) {
                param.nodeSphereMaterial = nodeSphereGroup.children[0].material;
                param.nodeOpacity = param.nodeSphereMaterial.opacity;
            }

            var sceneFolder = gui.addFolder('Scene');

            if (param.sceneFogColor) {
                sceneFolder.addColor(param, 'sceneFogColor').onChange(function(val){
                    scene.fog.color = new THREE.Color(val);
                });
            }

            if (param.sceneFogNear) {
                sceneFolder.add(param, 'sceneFogNear', 0, 10000, 1).onChange(function(val){
                    scene.fog.near = val;
                });
            }

            if (param.sceneFogFar) {
                sceneFolder.add(param, 'sceneFogFar', 0, 10000, 1).onChange(function(val){
                    scene.fog.far = val;
                });
            }

            var linkFolder = gui.addFolder('Links');

            if (param.lineMaterial && param.lineColor) {
                linkFolder.addColor(param, 'lineColor').onChange(function(val){
                    for (let i = 0; i < lineGroup.children.length; i++) {
                        lineGroup.children[i].material.color.setHex(val);
                    }
                    //console.log(lines.getObjectByProperty('type', 'LineBasicMaterial'));
                });
            }

            if (param.lineOpacity) {
                linkFolder.add( param, 'lineOpacity', 0, 1, 0.1 ).onChange( function ( val ) {
                    for (let i = 0; i < lineGroup.children.length; i++) {
                        lineGroup.children[i].material.opacity = val;
                    }
                } );
            }

            var nodeFolder = gui.addFolder('Nodes');

            if (param.nodeOpacity) {
                nodeFolder.add( param, 'nodeOpacity', 0, 1, 0.1 ).onChange( function ( val ) {
                    for (let i = 0; i < nodeSphereGroup.children.length; i++) {
                        nodeSphereGroup.children[i].material.opacity = val;
                    }
                } );
            }
        },
        resizeCanvas: function(renderer, camera, width, height) {
            if (width && height) {
                renderer.setSize(width, height);
                camera.aspect = width/height;
                camera.updateProjectionMatrix();
            }
        },

        getOffset: function(el) {
            const rect = el.getBoundingClientRect();
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
        }
    }
})();