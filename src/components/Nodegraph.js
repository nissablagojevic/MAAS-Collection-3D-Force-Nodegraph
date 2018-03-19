import { default as React, Component } from 'react';
import qwest from 'qwest';
import {sourceUrl, sourceQuery, mapData} from './resolvers.js';

import './Nodegraph.css';

//3d stuff
import * as THREE from 'three';
import trackballControls from 'three-trackballcontrols';
import {add3dStuff, resizeCanvas, getOffset, CAMERA_DISTANCE2NODES_FACTOR, MAX_FRAMES} from './canvas.js';

//force graphing
import * as d3 from 'd3-force-3d';
import graph from 'ngraph.graph';
import forcelayout from 'ngraph.forcelayout';
import forcelayout3d from 'ngraph.forcelayout3d';


/*** TEST CUBE
var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
mainScene.add( cube );
camera.position.z = 5;**/

class NodeGraph extends Component {
    constructor() {
        super();
        this.state = {
            width: '100%',
            height: '100vh',
            fetchingJson: false,
            animating: true,
            responseData: null,
            mappedData: null
        };


        //3D STUFF with THREE.JS
        //we need something to render with and something to see the render with
        this.renderer = new THREE.WebGLRenderer();
        this.camera = new THREE.PerspectiveCamera();
        this.camera.position.z = 5;
        this.camera.far = 20000;

        //animation frame counter and the somewhat magical _frameId
        this.counter = 0;
        this._frameId = null;

        //the mainscene is there to hold our lights and viewfog or other globally stuff
        //feel free to add objects that aren't going to change to it too if the rendering isn't working
        this.mainScene = new THREE.Scene();
        this.mainScene.background = new THREE.Color(0, 0, 0);

        //fiat lux
        this.ambientLight = new THREE.AmbientLight(0xbbbbbb);
        this.directLight = new THREE.DirectionalLight(0xffffff, 0.6);

        // Capture mouse coords on move
        this.raycaster = new THREE.Raycaster();
        this.mousePos = new THREE.Vector2();
        this.mousePos.x = -2; // Initialize off canvas
        this.mousePos.y = -2;

        //the graphGroup is there for all of our nodes and links, our main actors.
        this.graphGroup = new THREE.Group();

        this.mainScene.add(this.graphGroup)
            .add(this.ambientLight)
            .add(this.directLight);

        //d3 force stuff
        this.d3ForceLayout = d3.forceSimulation()
            .force('link', d3.forceLink())
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter())
            .stop();
        //forceEngine can be d3 or ngraph
        this.forceEngine = 'ngraph';
        this.isD3Sim = this.forceEngine !== 'ngraph';
        this.numDimensions = 3;
        this.idField = 'id';
        this.warmupTicks = 0;
        this.cooldownTicks = Infinity;
        //time in ms
        this.cooldownTime = 15000;
        this.cntTicks = 0;
        this.startTickTime = new Date();
        this.layout = null;

        this.ngraph = { graph, forcelayout, forcelayout3d };

        //interaction stuff
        this.selectedNode = null;

        this.animate = this.animate.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.renderer.domElement.addEventListener("mousemove", this.mouseMove);
        this.renderer.domElement.addEventListener("click", this.handleClick);
    }

    componentDidMount() {
        //set the width and height to whatever our #nodegraph mounter has calculated from its CSS
        this.setState({width: this.mount.clientWidth, height: this.mount.clientHeight});

        //then mount it to the DOM, doesn't matter if we resize first because we call resize again after react
        //has updated the component with the proper width and height, and there's fallback values
        this.mount.appendChild(this.renderer.domElement);

        // Add camera interaction and mousebased input
        this.tbControls = new trackballControls(this.camera, this.renderer.domElement);

        //fetch data from API after initialisation
        qwest.get(sourceUrl + sourceQuery).then((xhr, response) => {
            console.log('qwest get');
            this.setState({responseData: response.data});
            //this.updateScene();
            //this used to be where and how we called the 3d force graph package we just cannibalised.
            /**nodeGraph(document.getElementById('nodegraph'))
             .cooldownTicks(300)
             .idField('id')
             .valField('val')
             .nameField('name')
             .autoColorBy('type')
             .forceEngine('ngraph')
             .graphData(graphData);**/

        }).catch(function(e, xhr, response) {
            // Process the error in getting the json file
            console.log('DATA RETRIEVAL ERROR');
            console.log(e);
        });


        //start requestAnimationFrame checker;
        this.startLoop();
        //or just initial frame for testing purposes
        //renderer.render(mainScene, camera);


    }

    componentDidUpdate(prevProps, prevState) {
        console.log('component did update');

        if (prevState !== this.state) {
            resizeCanvas(this.renderer, this.camera, this.state.width, this.state.height);
        }
        this._frameId = null; // Pause simulation

        //once we add react state to allow parameters to change, we'll need to check if we need to request new data
        //or just redraw the D3 graph with the existing data. Until then this check will remain broken but default to
        //not fetching data again.
        if (prevProps !== this.props) {
            console.log("REGET");
            console.log(this);

            qwest.get(sourceUrl + sourceQuery).then((xhr, response) => {
                console.log('qwest get');
                console.log(this);
                this.setState({fetchingJson: false, responseData: response.data});
                //this.responseData = response.data;
            }).catch(function (e, xhr, response) {
                // Process the error in getting the json file
                console.log('DATA RETRIEVAL ERROR');
                console.log(e);
            });
        }

        // Feed data to force-directed layout
        if (this.isD3Sim && this.state.mappedData !== null) {
            // D3-force
            (this.layout = this.d3ForceLayout)
                .stop()
                .alpha(1)// re-heat the simulation
                .numDimensions(this.numDimensions)
                .nodes(this.state.mappedData.nodes)
                .force('link')
                .id(d => d[this.idField])
                .links(this.state.mappedData.links);
        } else {
            // ngraph
            const graph = this.ngraph.graph();

            if(this.state.mappedData !== null) {
                this.state.mappedData.nodes.forEach(node => { graph.addNode(node[this.idField]); });
                this.state.mappedData.links.forEach(link => { graph.addLink(link.source, link.target); });
                this.layout = this.ngraph['forcelayout' + (this.numDimensions === 2 ? '' : '3d')](graph);
                this.layout.graph = graph; // Attach graph reference to layout
            }

        }


        if(this.layout && this.layout.graph) {
            for (let i=0; i<this.warmupTicks; i++) { 
                this.layout[this.isD3Sim?'tick':'step'](); 
            } // Initial ticks before starting to render

            this._frameId = this.layoutTick;
        }


    }

    layoutTick() {
        const layout = this.layout;
        const isD3Sim = this.forceEngine !== 'ngraph';
        let mappedData = this.state.mappedData;

        //console.log('layoutTick');
        if (this.cntTicks++ > this.cooldownTicks || (new Date()) - this.startTickTime > this.cooldownTime) {
            this._frameId = null; // Stop ticking graph
        }

        layout[isD3Sim?'tick':'step'](); // Tick it

        // Update nodes position
        mappedData.nodes.forEach(node => {
            const mesh = node.mesh;
            if (!mesh) return;

            const pos = isD3Sim ? node : layout.getNodePosition(node[this.idField]);

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

    /**ANIMATING STUFF STARTS HERE**/
    componentWillUnmount() {
        this.stopLoop();
    }


    startLoop() {
        console.log('startLoop');
        if( !this._frameId) {
            this.setState({animating: true});
            this._frameId = window.requestAnimationFrame( this.animate );
        }
    }

    stopLoop() {
        console.log('stoploop');
        console.log(this);
        window.cancelAnimationFrame( this._frameId );
        //setting _frameId to null should pause THREE.js rendering
        this._frameId = null;
        //also let react know we're pausing
        this.setState({animating: false});

        // Note: no need to worry if the loop has already been cancelled
        // cancelAnimationFrame() won't throw an error
    }


    animate(prevProps, prevState) {
        //console.log(this.counter);

        if(this._frameId) {
            this._frameId();
        };

        //default escape hatch with counter until we figure out if qwest's promise is hammering the server
        //note, stopping the animation loop prevents mouse controls from firing too
        if (!this.state.animating) {
            //if ((MAX_FRAMES && this.counter > MAXFRAMES) || !this.state.animating) {

                //the renderer owns the mainScene
            console.log(this.renderer);
            //the mainScene owns the children AmbientLight, DirectLight, and our Graph group...
            console.log(this.mainScene);
            //the graphGroup owns the Lines and Node Meshes
            console.log(this.graphGroup);
            //stoploop cancels the animation loop...
            this.stopLoop();
        }

        //check we haven't already fetched the graphQL data (although we definitely do start in componentDidMount,
        //setting the fetchingJson flag just prevents responseData from being evaluated every animation frame.
        if(!this.state.fetchingJson && sourceUrl && this.state.responseData !== null) {
            //this really only should ever execute once per query, ensure it.
            this.setState({fetchingJson: true, mappedData: mapData(this.state.responseData)});
            console.log(prevProps);
            console.log(prevState);

            //only map data if the state has changed
            if(prevState !== this.state) {
                //add our 3d manifestation of nodes and links
                add3dStuff(this.state.mappedData, this.graphGroup);
            }

            //console.log(graphData);
            /**TEST CUBE AGAIN for animation purposes, may not be able to see it beneath any added spheres though**/
            /**this.mainScene.add( cube );
            cube.rotation.x += 0.1;
            cube.rotation.y += 0.1;**/
        }


        if (this.camera.position.x === 0 && this.camera.position.y === 0) {
            // If camera still in default position (not user modified)
            this.camera.lookAt(this.graphGroup.position);
            if(this.state.responseData !== null && this.state.responseData.hasOwnProperty('narratives')) {
                //we're assuming that we're working in narratives here, and only on one.
                //console.log(this.state.responseData.narratives[0].objects.length);
                this.camera.position.z = Math.cbrt(this.state.responseData.narratives[0].objects.length) * CAMERA_DISTANCE2NODES_FACTOR;

            }
        }

        this.raycaster.setFromCamera(this.mousePos, this.camera);
        this.tbControls.update();

        //this is the important bit. After we've dicked with the mainScene's (or just its children's contents),
        //the renderer needs to shove the frame to the screen
        this.renderer.render(this.mainScene, this.camera);
        if(this.state.animating) {
            //and the window needs to request a new frame to do this all again
            window.requestAnimationFrame( this.animate );
        }
        //emergency counter escape hatch only for testing to stop the looping after max frames are hit.
        this.counter++;

    }
    /**ANIMATING STUFF ENDS HERE**/


    /**INTERACTION STUFF STARTS HERE**/

    mouseMove(e) {
        // update the mouse pos
        const offset = getOffset(this.renderer.domElement),
            relPos = {
                x: e.pageX - offset.left,
                y: e.pageY - offset.top
            };
        this.mousePos.x = (relPos.x / this.state.width) * 2 - 1;
        this.mousePos.y = -(relPos.y / this.state.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mousePos, this.camera);
        //check if our raycasted click event collides with something rendered in our graph group
        const intersects = this.raycaster.intersectObjects(this.graphGroup.children)
            .filter(o => o.object.__data); // Check only objects with data (nodes)
        //if our mouseover collides with a node
        if (intersects.length) {
            this.tooltip.innerHTML = intersects[0].object.__data.id + ": " + intersects[0].object.__data.name;
        } else {
            this.tooltip.innerHTML = '';
        }

        // Move tooltip
        this.tooltip.style.top = (relPos.y - 20) + 'px';
        this.tooltip.style.left = (relPos.x - 20) + 'px';

    }

    handleClick() {
            //update our raycaster's position with the mouse position coordinates and camera info
            this.raycaster.setFromCamera(this.mousePos, this.camera);
            //check if our raycasted click event collides with something rendered in our graph group
            const intersects = this.raycaster.intersectObjects(this.graphGroup.children)
                .filter(o => o.object.__data); // Check only objects with data (nodes)
            //if our click collided with a node
            if (intersects.length) {
                //tell react about that because later we'll want to load info about the node (VERSION 2 ANYONE??)
                this.selectedNode = intersects[0].object.__data.id;

                console.log(this.selectedNode);

            }
    }

    /**INTERACTION STUFF ENDS HERE**/


    render() {
        //this renders only the FIRST FRAME, animation begins in component did mount with startloop;
        //renderer.render(this.mainScene, camera);
        return (
            <div id="nodegraph" ref={mount => this.mount = mount} style={{width: this.state.width, height: this.state.height}}>
                <div ref={tooltip => this.tooltip = tooltip} className="graph-tooltip" />
            </div>
        );
    }
}

export default NodeGraph;

