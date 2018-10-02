import * as THREE from 'three';
import { addLine, addSphere, addText, addEnv, addGUI, font} from '../3d';
import { GraphLayout } from '../forceLayout';

//leap controls
import {initLeapControls, swipe} from "../leap";


export const GraphCanvas = (function() {
    let instance;

    //d3 graph calculation stuff
    const graphLayout = GraphLayout.getInstance();
    const isD3Sim = graphLayout.isD3Sim();
    let _frameId = null;
    let layout = null;
    //stop layout from drifting forever. need to implement dynamic based on whole graph width
    const MAXTICKS = 400;
    let tickCounter = 0;

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
    });
    renderer.domElement.addEventListener("mousemove", mouseMove);
    renderer.domElement.addEventListener("click", handleClick);

    //interaction stuff
    let selectedNode = null;

    function removeMeshTextures(material) {
        console.log(material);

        if (material.map) {
            material.map.dispose ();
        }
        if (material.lightMap){
            material.lightMap.dispose ();
        }
        if (material.bumpMap) {
            material.bumpMap.dispose ();
        }
        if (material.normalMap)    material.normalMap.dispose ();
        if (material.specularMap)  material.specularMap.dispose ();
        if (material.envMap)       material.envMap.dispose ();

        material.dispose ();   // disposes any programs associated with the material
    }

    function doDispose(obj)
    {
        console.log("DISPOSE");
        console.log(obj);
        if (obj)
        {
            if(obj.children && obj.children.length > 0) {
                console.log('disposing of object children');
                for (var i = 0; i < obj.children.length; i++)
                {
                    doDispose(obj.children[i]);
                }
            }

            if(obj.geometry) {
                console.log('disposing object geometry');
                obj.geometry.dispose();
            }
            if(obj.material) {
                console.log("MATERIAL IS...");
                console.log(obj.material);
                if (obj.material.length > 1) {
                    obj.material.forEach((mat) => {
                        console.log("MATERIAL: ");
                        console.log(mat);
                        removeMeshTextures(mat);
                    });
                } else {
                    removeMeshTextures(obj.material);
                }
            }
        }
        const parent = obj.parent;
        parent.remove(obj);
        console.log('setting obj as undefined');
        obj = undefined;
    }

    function mouseMove(e) {
        //console.log('mouseMove');
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
        console.log('handleClick');
        //update our raycaster's position with the mouse position coordinates and camera info
        raycaster.setFromCamera(mousePos, camera);
        //check if our raycasted click event collides with a nodesphere
        const nodes = graphGroup.getObjectByProperty('name', 'nodeSphereGroup');
        const textNodes = graphGroup.getObjectByProperty('name', 'textGroup');
        if(nodes && nodes.children.length || textNodes && textNodes.children.length) {
            let intersects = raycaster.intersectObjects(nodes.children)
                .filter((o) => {
                    console.log(o);
                    if (o.object.visible) {
                        return o.object;
                    }
                });

            if (!intersects.length) {
                intersects = raycaster.intersectObjects(textNodes.children)
                    .filter((o) => {
                        console.log(o);
                        if (o.object.visible) {
                            return o.object;
                        }
                    });
            }

            //if our click collided with a node
            if (intersects.length) {
                console.log("intersects has length");
                selectedNode = intersects[0].object.__data;
            }
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



    // Capture mouse coords on move
    const raycaster = new THREE.Raycaster();
    const mousePos = new THREE.Vector2();


    //3d continued... controls.
    //have to import controls as non-ES6 because of scoping issues.
    //see https://stackoverflow.com/questions/28068038/how-do-i-import-additional-plugins-for-an-already-imported-library-using-jspm
    const OrbitControls = require('three-orbit-controls')(THREE);

    //the graphGroup is there for all of our nodes and links, our main actors.
    const graphGroup = new THREE.Group();
    const textGroup = new THREE.Group();
    const spriteGroup = new THREE.Group();
    const nodeSphereGroup = new THREE.Group();
    const lineGroup = new THREE.Group();
    textGroup.name = "textGroup";
    spriteGroup.name = "spriteGroup";
    nodeSphereGroup.name = "nodeSphereGroup";
    lineGroup.name = "lineGroup";
    graphGroup.name = "graphGroup";

    mainScene.add(graphGroup);

    initLeapControls();
    const swiper = window.controller.gesture('swipe');

    let fetchingJson = false;
    let changedSet = false;

    // Add camera interaction and mousebased input
    const controls = new OrbitControls( camera, renderer.domElement );

    function init() {
        instance = this;

        mousePos.x = -2; // Initialize off canvas
        mousePos.y = -2;
        let mappedData = null;


        return {
            add3dStuff: function() {
                addEnv(mainScene);
                this.initThreeControls();
                //map the newly created nodes to spheres
                console.log("ADD 3d STUFF");
                console.log(mappedData);

                mappedData.nodes.forEach(node => {
                    if(node.type === 'object') {
                        addSphere(node, nodeSphereGroup, true, camera.position);
                    }

                    if(node.type === 'narrative') {
                        node.mainImage = 'suntex.jpg';
                        node.size = 20;

                        addSphere(node, nodeSphereGroup);
                        //addText(node, textGroup);
                    }

                    if(node.type === 'term') {
                        addText(node, textGroup, font);
                    }

                });

                //map the newly created links to lines in THREE.js and add them to the scene
                mappedData.links.forEach(link => {
                    addLine(link, lineGroup);
                });

                graphGroup.add(lineGroup);
                graphGroup.add(nodeSphereGroup);
                graphGroup.add(textGroup);
                graphGroup.add(spriteGroup);

                /**
                if(!document.getElementsByClassName('dg').length) {
                    addGUI(mainScene, lineGroup, nodeSphereGroup);
                }**/
            },
            updateCamera: function() {
                if (camera.position.x === 0 && camera.position.y === 0) {
                    // If camera still in default position (not user modified)
                    camera.lookAt(graphGroup.position);
                }


                raycaster.setFromCamera(mousePos, camera);
                //this.tbControls.update();
                this.updateControls();


                if(textGroup && textGroup.children) {
                    for (let i = 0; i < textGroup.children.length; i++) {
                        //@TODO have text children all look at camera. Figure out maths.
                        /**console.log('textgroup');
                        console.log(camera.position);
                        console.log(textGroup.children[i].position);

                        let textCameraVector3 = {
                            x: (textGroup.children[i].position.x - camera.position.x),
                            y: (textGroup.children[i].position.y - camera.position.y),
                            z: (textGroup.children[i].position.z - camera.position.z)
                        };

                        console.log(textCameraVector3);**/
                        //textGroup.children[i].position = textCameraVector3;
                        //textGroup.children[i].lookAt(camera.position);
                    }
                }

                if (nodeSphereGroup && nodeSphereGroup.children) {
                    for (let i = 0; i < nodeSphereGroup.children.length; i++) {
                        //TODO: This should be done in Object3D.onBeforeRender
                        //and you need to work out the Vector or Quaternion that is the intersect of camera and node
                        //see: https://threejs.org/docs/#api/en/materials/ShaderMaterial
                        nodeSphereGroup.children[i].children[0].material.uniforms.viewVector.value = camera.position;
                    }
                }

                //this is the important bit. After we've dicked with the mainScene's contents(or just its children's contents),
                //the renderer needs to shove the frame to the screen
                renderer.render(mainScene, camera);
            },
            animate: function() {
                if(_frameId && typeof _frameId === 'object') {
                    _frameId();
                }

                //if we haven't already generated our 3d objects
                if(nodeSphereGroup.children.length === 0 || changedSet) {
                    console.log('changed set');

                    //todo: check we have disposed of all our stuff
                    //check we haven't already fetched the graphQL data (although we definitely do start in componentDidMount,
                    //setting the fetchingJson flag just prevents responseData from being evaluated every animation frame.
                    if (!fetchingJson && mappedData !== null) {
                        //this really only should ever execute once per query, ensure it.
                        fetchingJson = true;
                        changedSet = false;
                        //add our 3d manifestation of nodes and links
                        instance.add3dStuff();
                        //and let d3 do some maths with it.
                        layout = graphLayout.createForceLayout(mappedData);

                    } else {
                        console.log("missing: fetchingjson || graphql sourceurl || mapped data");
                        return;
                    }

                } else {
                        graphGroup.rotation.y += 0.0002;

                        instance.updateCamera();
                        instance.updateLinksPos();
                        instance.updateNodesPos();

                        if(layout && layout.graph && tickCounter < MAXTICKS) {
                            const layoutTick = layout[isD3Sim?'tick':'step']();
                            instance.setFrameId(layoutTick);
                            tickCounter++;
                        }

                }
                //and the window needs to request a new frame to do this all again
                window.requestAnimationFrame( instance.animate );
            },
            getRenderer:  function() {
              return renderer;
            },
            initThreeControls: function() {
                controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
                controls.dampingFactor = 0.25;
                //controls.panningMode = THREE.HorizontalPanning; // default is THREE.ScreenSpacePanning
                controls.minDistance = 1;
                controls.maxDistance = 10000;
                controls.maxPolarAngle = Math.PI;
            },
            startLoop: function() {
                console.log('startLoop');
                if( !_frameId) {
                    _frameId = window.requestAnimationFrame( this.animate );
                }
            },
            stopLoop: function() {
                console.log('stoploop');
                window.cancelAnimationFrame( _frameId );
                //setting _frameId to null will pause THREE.js rendering
                _frameId = null;

                // Note: no need to worry if the loop has already been cancelled
                // cancelAnimationFrame() won't throw an error
            },
            updateControls: function() {
                //here for if I actually get that Leap Controller going properly
                if(swiper) {
                    swiper.update((g) => swipe(g));
                }
                if(controls) {
                    controls.update();
                }
            },
            updateLinksPos: function() {
                if(mappedData && mappedData.links && mappedData.links.length > 0) {
                    // Update links position
                    mappedData.links.forEach(link => {
                        graphLayout.updateLinkPos(link);
                    });
                }
            },
            updateNodesPos: function() {
                // Update nodes position
                if(mappedData && mappedData.nodes && mappedData.nodes.length > 0) {
                    mappedData.nodes.forEach(node => {
                        graphLayout.updateNodePos(node);
                    });
                }
            },
            resizeCanvas: function(width, height) {
                if (width && height) {
                    renderer.setSize(width, height);
                    camera.aspect = width/height;
                    camera.updateProjectionMatrix();
                }
            },
            remove3dStuff: function(obj = null) {
                //TODO: need a proper way to dispose and memory manage here.
                changedSet = true;
                layout = null;
                tickCounter = 0;

                if(mappedData) {
                    mappedData.nodes.forEach(node => {

                        if(node.mesh) {
                            doDispose(node.mesh);
                        }

                        if(node.displayText) {
                            doDispose(node.displayText);
                        }

                        console.log(node);
                    });

                    mappedData.links.forEach(link => {
                        if(link.__line) {
                            doDispose(link.__line);
                        }
                        console.log(link);
                    });

                    //doDispose(nodeSphereGroup);
                    mappedData = null;
                }

                renderer.render(mainScene, camera);
            },
            setFrameId: function(frameId) {
                _frameId = frameId;
            },
            getMappedData: function() {
                return mappedData;
            },
            setMappedData: function(data) {
                mappedData = data;
            },
            isFetchingJson: function() {
                return fetchingJson;
            },
            setFetchingJson: function(fJ) {
                fetchingJson = fJ;
            },
            selectNode: function() {
                return selectedNode;
            }
        }
    }

    return {
        getInstance: function () {
            console.log('attempting to get 3d instance');
            if ( !instance ) {
                instance = init();
                return instance;
            }
        }
    }
})();