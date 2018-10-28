import * as THREE from 'three';
import { Utils } from '../3d';

//leap controls
//import {initLeapControls, swipe} from "../leap";

const Controls = (function() {
    let graphGroup;
    let renderer;
    let camera;
    let controls;

    const raycaster = new THREE.Raycaster();
    const mousePos = new THREE.Vector2();
    //have to import controls as non-ES6 because of scoping issues.
    //see https://stackoverflow.com/questions/28068038/how-do-i-import-additional-plugins-for-an-already-imported-library-using-jspm
    const OrbitControls = require('three-orbit-controls')(THREE);

    function init(r, c) {
        renderer = r;
        camera = c;
        camera.position.z = 2000;
        camera.far = 20000;

        renderer.domElement.addEventListener("mousemove", this.mouseMove);
        renderer.domElement.addEventListener("click", this.handleClick);

        // Add camera interaction and mousebased input
        controls = new OrbitControls( camera, renderer.domElement );
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.25;
        //controls.panningMode = THREE.HorizontalPanning; // default is THREE.ScreenSpacePanning
        controls.minDistance = 1;
        controls.maxDistance = 10000;
        controls.maxPolarAngle = Math.PI;

        mousePos.x = -2; // Initialize off canvas
        mousePos.y = -2;
    }

    function updateControls() {
        if (camera.position.x === 0 && camera.position.y === 0) {
            // If camera still in default position (not user modified)
            camera.lookAt(graphGroup.position);
        }

        raycaster.setFromCamera(mousePos, camera);
        //if init leap controls are connected...
        //here for if I actually get that Leap Controller going properly
        /**if(swiper) {
                    swiper.update((g) => swipe(g));
                }**/
        if(controls) {
            controls.update();
        }
    }


    function handleClick() {
        //update our raycaster's position with the mouse position coordinates and camera info
        raycaster.setFromCamera(mousePos, camera);
        //check if our raycasted click event collides with a nodesphere
        const nodes = graphGroup.getObjectByProperty('name', 'nodeSphereGroup');
        const textNodes = graphGroup.getObjectByProperty('name', 'textGroup');
        if((nodes && nodes.children.length) || (textNodes && textNodes.children.length)) {
            let intersects = raycaster.intersectObjects(nodes.children)
                .filter((o) => {
                    let object = null;
                    console.log(o);
                    if (o.object.visible) {
                        object = o.object.__data;
                    }
                    return object;
                });

            if (!intersects.length) {
                //check if we hit a textnode instead. This needs a better way of doing it too.
                intersects = raycaster.intersectObjects(textNodes.children)
                    .filter((o) => {
                        let object = null;
                        if (o.object.visible) {
                            object = o.object.__data;
                        }
                        return object;
                    });
            }

            //if our click collided with a node
            if (intersects.length) {
                return intersects[0].object.__data;
            }
        }
    }


    function mouseMove(e) {
        // update the mouse pos
        const offset = Utils.getOffset(renderer.domElement),
            relPos = {
                x: e.pageX - offset.left,
                y: e.pageY - offset.top
            };
        mousePos.x = (relPos.x / renderer.domElement.clientWidth) * 2 - 1;
        mousePos.y = -(relPos.y / renderer.domElement.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mousePos, camera);
        //check if our raycasted click event collides with a nodesphere
        if(graphGroup && graphGroup.getObjectByProperty('name', 'nodeSphereGroup')) {
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

    return {
        init: init,
        mouseMove: mouseMove,
        handleClick: handleClick,
        updateControls: updateControls,
        setGraphGroup: (gg) => graphGroup = gg
    }
})();

export default Controls;