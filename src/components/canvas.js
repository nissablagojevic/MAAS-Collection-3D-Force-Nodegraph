import * as THREE from 'three';
import dat from 'dat.gui';
import { addLine, addSprite, addSphere, addText, addEnv } from '../3d';

//leap controls
import {initLeapControls, swipe} from "../leap";

export const MAX_FRAMES = 1000;

export const GraphCanvas = (function() {
    let instance;
    const CAMERA_DISTANCE2NODES_FACTOR = 150;
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
    });

    renderer.domElement.addEventListener("mousemove", mouseMove);
    renderer.domElement.addEventListener("click", handleClick);

    //interaction stuff
    let selectedNode = null;

    function mouseMove(e) {
        // update the mouse pos
        const offset = getOffset(renderer.domElement),
            relPos = {
                x: e.pageX - offset.left,
                y: e.pageY - offset.top
            };
        mousePos.x = (relPos.x / renderer.domElement.clientWidth) * 2 - 1;
        mousePos.y = -(relPos.y / renderer.domElement.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mousePos, camera);
        //check if our raycasted click event collides with a nodesphere
        if(graphGroup.getObjectByProperty('name', 'nodeSphereGroup')) {
            const intersects = raycaster.intersectObjects(graphGroup.getObjectByProperty('name', 'nodeSphereGroup').children)
                .filter(o => o.object.__data); // Check only objects with data (nodes)
            //if our mouseover collides with a node
            /**
            if (intersects.length) {
                this.tooltip.style.padding = 10 + 'px';
                this.tooltip.style.backgroundColor = 'black';
                this.tooltip.innerHTML = intersects[0].object.__data.id + ": " + intersects[0].object.__data.name;
            } else {
                this.tooltip.style.backgroundColor = 'transparent';
                this.tooltip.innerHTML = '';
            }

            // Move tooltip
            this.tooltip.style.top = (relPos.y - 20) + 'px';
            this.tooltip.style.left = (relPos.x - 20) + 'px';**/
        }
    }

    function handleClick() {
        //update our raycaster's position with the mouse position coordinates and camera info
        raycaster.setFromCamera(mousePos, camera);
        //check if our raycasted click event collides with a nodesphere
        const intersects = raycaster.intersectObjects(graphGroup.getObjectByProperty('name', 'nodeSphereGroup').children)
            .filter(o => o.object.__data); // Check only objects with data (nodes)

        //if our click collided with a node
        if (intersects.length) {
            //tell react about that because later we'll want to load info about the node (VERSION 2 ANYONE??)
            //this.selectedNode = intersects[0].object.__data.name;
            //console.log(this.selectedNode);
        }
    }

    function getOffset(el) {
        const rect = el.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
    }

    const camera = new THREE.PerspectiveCamera();
    camera.position.z = 2000;
    camera.far = 20000;

    //the mainscene is there to hold our 3d graph but also lights and viewfog or other globally stuff
    const mainScene = new THREE.Scene();

    addEnv(mainScene);

    let _frameId = null;

    // Capture mouse coords on move
    const raycaster = new THREE.Raycaster();
    const mousePos = new THREE.Vector2();

    //the graphGroup is there for all of our nodes and links, our main actors.
    const graphGroup = new THREE.Group();

    //3d continued... controls.
    //have to import controls as non-ES6 because of scoping issues.
    //see https://stackoverflow.com/questions/28068038/how-do-i-import-additional-plugins-for-an-already-imported-library-using-jspm
    const OrbitControls = require('three-orbit-controls')(THREE);

    const textGroup = new THREE.Group();
    const spriteGroup = new THREE.Group();
    const nodeSphereGroup = new THREE.Group();
    const lineGroup = new THREE.Group();

    const imageLoader = new THREE.ImageLoader().setCrossOrigin( '*' );

    //forceEngine can be d3 or ngraph
    const forceEngine = 'ngraph';
    const isD3Sim = forceEngine !== 'ngraph';

    initLeapControls();
    const swiper = window.controller.gesture('swipe');

    // Add camera interaction and mousebased input
    const controls = new OrbitControls( camera, renderer.domElement );

    function init() {
        instance = this;
        textGroup.name = "textGroup";
        spriteGroup.name = "spriteGroup";
        nodeSphereGroup.name = "nodeSphereGroup";
        lineGroup.name = "lineGroup";
        graphGroup.name = "graphGroup";
        mainScene.add(graphGroup);
        mousePos.x = -2; // Initialize off canvas
        mousePos.y = -2;

        return {
            add3dStuff: function(data, layout) {
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
            animate3d: function() {
                if (camera.position.x === 0 && camera.position.y === 0) {
                    // If camera still in default position (not user modified)
                    camera.lookAt(graphGroup.position);
                    //we're assuming that we're working in narratives here, and only on one.
                    //camera.position.z = Math.cbrt(this.state.responseData.narratives[0].objects.length) * CAMERA_DISTANCE2NODES_FACTOR;
                }
                if(textGroup && textGroup.children) {
                    for (let i = 0; i < textGroup.children.length; i++) {
                        textGroup.children[i].lookAt(camera.position);
                    }
                }

                raycaster.setFromCamera(mousePos, camera);
                //this.tbControls.update();
                this.updateControls();

                //this is the important bit. After we've dicked with the mainScene's contents(or just its children's contents),
                //the renderer needs to shove the frame to the screen
                renderer.render(mainScene, camera);
            },
            getRenderer:  function() {
              return renderer;
            },
            getCamera: function() {
              return camera;
            },
            initThreeControls: function() {
                controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
                controls.dampingFactor = 0.25;
                //controls.panningMode = THREE.HorizontalPanning; // default is THREE.ScreenSpacePanning
                controls.minDistance = 1;
                controls.maxDistance = 10000;
                controls.maxPolarAngle = Math.PI;
            },
            updateControls: function() {
                if(swiper) {
                    swiper.update((g) => swipe(g));
                }
                if(controls) {
                    controls.update();
                }
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
            initGui: function() {

                const gui = new dat.GUI();
                const param = {};

                if(mainScene && mainScene.fog) {
                    param.sceneFogColor = mainScene.fog.color.getHex();
                    param.sceneFogNear = mainScene.fog.near;
                    param.sceneFogFar = mainScene.fog.far;
                    param.sceneFogVisible = mainScene.fog;
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
                        mainScene.fog.color = new THREE.Color(val);
                    });
                }

                if (param.sceneFogNear) {
                    sceneFolder.add(param, 'sceneFogNear', 0, 10000, 1).onChange(function(val){
                        mainScene.fog.near = val;
                    });
                }

                if (param.sceneFogFar) {
                    sceneFolder.add(param, 'sceneFogFar', 0, 10000, 1).onChange(function(val){
                        mainScene.fog.far = val;
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
            resizeCanvas: function(width, height) {
                if (width && height) {
                    renderer.setSize(width, height);
                    camera.aspect = width/height;
                    camera.updateProjectionMatrix();
                }
            },
            getFrameId: function() {
              return _frameId;
            },
            setFrameId: function(frameId) {
                _frameId = frameId;
            }
        }
    }

    return {
        getInstance: function () {
            if ( !instance ) {
                instance = init();
            }
            return instance;
        }
    }
})();