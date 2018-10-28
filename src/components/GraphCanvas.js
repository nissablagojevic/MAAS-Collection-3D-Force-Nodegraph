import * as THREE from 'three';
import { preloadImage, preloadFont, Text, Sphere, Line, Environment, Utils, Controls } from '../3d';
import { GraphLayout } from '../forceLayout';

//@TODO GraphCanvas should be a mediator
export const GraphCanvas = (function() {
    let instance;
    let images = [];

    const font = preloadFont();

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

    const camera = new THREE.PerspectiveCamera();

    Controls.init(renderer, camera);

    let mappedData = null;

    //the mainscene is there to hold our 3d graph but also lights and viewfog or other globally stuff
    const mainScene = new THREE.Scene();

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

    //if init leap controls are connected...
    //initLeapControls();
    //const swiper = window.controller.gesture('swipe');

    let fetchingJson = false;
    let changedSet = false;

    function add3dStuff() {
        Environment.addEnvironment(mainScene);
        //map the newly created nodes to spheres
        mappedData.nodes.forEach(node => {
            if(node.type === 'object') {
                //@TODO if image is already in cache, pass it in here
                const sphere = Sphere.addSphere(node, true, camera.position);
                nodeSphereGroup.add(node.mesh = sphere);
            }

            if(node.type === 'narrative') {
                node.size = 20;
                node.mainImage = 'suntex.jpg';
                const sphere = Sphere.addSphere(node);
                nodeSphereGroup.add(node.mesh = sphere);
                //addText(node, textGroup);
            }

            if(node.type === 'term') {
                font.then((f) => {
                    //@TODO make it so that we don't instantiate rubbish repeatedly
                    let text = Text.makeText(node, f);
                    textGroup.add(node.displayText = text);
                });
            }

        });

        //map the newly created links to lines in THREE.js and add them to the scene
        mappedData.links.forEach(link => {
            const line = Line.makeLine(link);
            lineGroup.add(link.__line = line);
        });

        graphGroup.add(lineGroup);
        graphGroup.add(nodeSphereGroup);
        graphGroup.add(textGroup);
        graphGroup.add(spriteGroup);
        Controls.setGraphGroup(graphGroup);

        /**
         if(!document.getElementsByClassName('dg').length) {
                    addGUI(mainScene, lineGroup, nodeSphereGroup);
                }**/
    }

    function updateCamera() {
        Controls.updateControls();

        if(textGroup && textGroup.children) {
            for (let i = 0; i < textGroup.children.length; i++) {
                //@TODO have text children all look at camera. Figure out maths. Include rotation problem
                textGroup.children[i].lookAt(camera.position);
                //textGroup.children[i].lookAt(camera.position);
            }
        }

        if (nodeSphereGroup && nodeSphereGroup.children) {
            for (let i = 0; i < nodeSphereGroup.children.length; i++) {
                //TODO: This should be done in Object3D.onBeforeRender
                //and you need to work out the Vector or Quaternion that is the intersect of camera and node
                //see: https://threejs.org/docs/#api/en/materials/ShaderMaterial
                nodeSphereGroup.children[i].children[0].lookAt(camera.position);
            }
        }

        //this is the important bit. After we've dicked with the mainScene's contents(or just its children's contents),
        //the renderer needs to shove the frame to the screen
        renderer.render(mainScene, camera);
    }

    function remove3dStuff(obj = null) {
        changedSet = true;
        layout = null;
        tickCounter = 0;
        images = [];

        if(mappedData) {
            mappedData.nodes.forEach(node => {
                if (node.mesh) {
                    Utils.doDispose(node.mesh);
                }

                if (node.displayText) {
                    Utils.doDispose(node.displayText);
                }
                return null;
            });

            mappedData.links.forEach(link => {
                if (link.__line) {
                    Utils.doDispose(link.__line);
                }
                return null;
            });

            //doDispose(nodeSphereGroup);
            mappedData = null;
        }

        renderer.render(mainScene, camera);
    }


    function init() {
        console.log("GRAPH CANVAS INIT");
        instance = this;

        return {
            add3dStuff: add3dStuff,
            updateCamera: updateCamera,
            remove3dStuff: remove3dStuff,
            getRenderer: () => renderer,
            preloadImage: (id, i) => preloadImage(images, id, i),
            setFrameId: (frameId) => _frameId = frameId,
            setMappedData: (data) => mappedData = data,
            isFetchingJson: () => fetchingJson,
            setFetchingJson: (fJ) => fetchingJson = fJ,
            selectNode: Controls.handleClick,
            animate: function() {

                if(_frameId && typeof _frameId === 'object') {
                    _frameId();
                }


                //@TODO take alllll this out of the animate function and use an observer
                //if we haven't already generated our 3d objects
                if(nodeSphereGroup.children.length === 0 || changedSet) {

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
                        console.log("if not fetching json and have mappedData");
                        console.log(fetchingJson);
                        console.log(mappedData);
                        console.log("missing: fetchingjson || graphql sourceurl || mapped data");
                        return;
                    }

                } else {

                    if (mappedData && images && images.length && nodeSphereGroup.children.length) {
                        for (let i = 0; i < images.length; i++) {
                            for (let j = 0; j < nodeSphereGroup.children.length; j++) {
                                if (images[i].name === nodeSphereGroup.children[j].__data) {
                                    if (nodeSphereGroup.children[j].material.envMap.name === 'errorImage') {
                                        const nodeSphere = nodeSphereGroup.children[j];
                                        const glowSphere = nodeSphere.children[0];
                                        let texture = new THREE.CanvasTexture(images[i]);

                                        texture.mapping = THREE.SphericalReflectionMapping;
                                        texture.name = 'canvasTex-' + nodeSphere.__data;

                                        //prevent three.js complaining about images not being 2^n width and height
                                        texture.minFilter = THREE.LinearFilter;

                                        nodeSphere.material.envMap = texture;
                                        nodeSphere.material.needsUpdate = true;

                                        glowSphere.material.uniforms.glowColor.value = new THREE.Color(0x54b1ff);

                                        break;
                                    }
                                }
                            }

                        }
                    }



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
            startLoop: () => {
                if( !_frameId) {
                    _frameId = window.requestAnimationFrame( instance.animate );
                }
            },
            stopLoop: () => {
                window.cancelAnimationFrame( _frameId );
                //setting _frameId to null will pause THREE.js rendering
                _frameId = null;

                // Note: no need to worry if the loop has already been cancelled
                // cancelAnimationFrame() won't throw an error
            },
            updateLinksPos: () => {
                if(mappedData && mappedData.links && mappedData.links.length > 0) {
                    // Update links position
                    mappedData.links.forEach(link => {
                        graphLayout.updateLinkPos(link);
                    });
                }
            },
            updateNodesPos: () => {
                // Update nodes position
                if(mappedData && mappedData.nodes && mappedData.nodes.length > 0) {
                    mappedData.nodes.forEach(node => {
                        graphLayout.updateNodePos(node);
                    });
                }
            },
            resizeCanvas: (width, height) => {
                if (width && height) {
                    renderer.setSize(width, height);
                    camera.aspect = width/height;
                    camera.updateProjectionMatrix();
                }
            }

        }
    }

    return {
        //this is a singleton partly because it attaches to the global window object
        getInstance: function () {
            if (!instance ) {
                instance = init();
            }

            return instance;
        }
    }
})();