import * as THREE from 'three';
import { addLine, addSphere, addText, addEnv, addGUI } from '../3d';
import { GraphLayout } from '../forceLayout';

//leap controls
import {initLeapControls, swipe} from "../leap";

export const GraphCanvas = (function() {
    let instance;
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
    });

    //d3 graph calculation stuff
    const graphLayout = GraphLayout.getInstance();
    const isD3Sim = graphLayout.isD3Sim();
    let _frameId = null;
    let layout = null;

    renderer.domElement.addEventListener("mousemove", mouseMove);
    renderer.domElement.addEventListener("click", handleClick);

    //interaction stuff
    let selectedNode = null;

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
        //update our raycaster's position with the mouse position coordinates and camera info
        raycaster.setFromCamera(mousePos, camera);
        //check if our raycasted click event collides with a nodesphere
        const intersects = raycaster.intersectObjects(graphGroup.getObjectByProperty('name', 'nodeSphereGroup').children)
            .filter(o => o.object.__data); // Check only objects with data (nodes)

        //if our click collided with a node
        if (intersects.length) {
            //tell react about that because later we'll want to load info about the node (VERSION 2 ANYONE??)
            selectedNode = intersects[0].object.__data;
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

    initLeapControls();
    const swiper = window.controller.gesture('swipe');

    let fetchingJson = false;

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
        let mappedData = null;

        return {
            add3dStuff: function() {
                this.initThreeControls();
                //map the newly created nodes to spheres
                mappedData.nodes.forEach(node => {

                    //this needs to be done asynchronously with a loading image fallback
                    // would probably greatly help memory usage
                    // the adding of stuff to the scene is our main memory bottleneck
                    imageLoader
                        //.load( node.mainImage + performance.now(), function ( image ) {
                        .load( node.mainImage, function ( image ) {
                            addSphere(node, image, nodeSphereGroup, true);
                        },
                        undefined,
                        function() {
                            //Image loading error nodes.
                            addText(node, textGroup);
                        });

                });

                //map the newly created links to lines in THREE.js and add them to the scene
                mappedData.links.forEach(link => {
                    addLine(link, lineGroup);
                });

                graphGroup.add(lineGroup);
                graphGroup.add(nodeSphereGroup);
                graphGroup.add(textGroup);
                graphGroup.add(spriteGroup);

                addGUI(mainScene, lineGroup, nodeSphereGroup);
            },
            animate3d: function() {
                if (camera.position.x === 0 && camera.position.y === 0) {
                    // If camera still in default position (not user modified)
                    camera.lookAt(graphGroup.position);
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
            animate: function() {
                if(_frameId && typeof _frameId === 'object') {
                    _frameId();
                }

                //if we haven't already generated our 3d objects
                //only map data if the react state has changed from changing a query? Should likely do later.
                if(graphGroup.children.length === 0) {
                    //check we haven't already fetched the graphQL data (although we definitely do start in componentDidMount,
                    //setting the fetchingJson flag just prevents responseData from being evaluated every animation frame.
                    if (!fetchingJson && mappedData !== null) {
                        //this really only should ever execute once per query, ensure it.
                        fetchingJson = true;
                        //add our 3d manifestation of nodes and links
                        instance.add3dStuff();
                        //and let d3 do some maths with it.
                        layout = graphLayout.createForceLayout(mappedData);

                    } else {
                        console.log("missing: fetchingjson || graphql sourceurl || mapped data");
                    }

                } else {
                    instance.animate3d();
                    instance.update3dStuff();

                    if(layout && layout.graph) {
                        const layoutTick = layout[isD3Sim?'tick':'step']();
                        instance.setFrameId(layoutTick);
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
            update3dStuff: function() {
                // Update nodes position
                mappedData.nodes.forEach(node => {
                    graphLayout.updateNodePos(node);
                });

                // Update links position
                mappedData.links.forEach(link => {
                    graphLayout.updateLinkPos(link);
                });
            },
            resizeCanvas: function(width, height) {
                if (width && height) {
                    renderer.setSize(width, height);
                    camera.aspect = width/height;
                    camera.updateProjectionMatrix();
                }
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
            if ( !instance ) {
                instance = init();
            }
            return instance;
        }
    }
})();