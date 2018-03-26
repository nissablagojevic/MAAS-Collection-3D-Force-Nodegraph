import { default as React, Component } from 'react';
import qwest from 'qwest';
import {sourceUrl, sourceQuery, mapData} from './resolvers.js';

import './Nodegraph.css';

//3d stuff
import * as THREE from 'three';
import {add3dStuff, update3dStuff, resizeCanvas, getOffset, CAMERA_DISTANCE2NODES_FACTOR, MAX_FRAMES} from './canvas.js';
import { addEnv } from '../3d';
import dat from 'dat.gui';

//force graphing
import * as d3 from 'd3-force-3d';
import graph from 'ngraph.graph';
import forcelayout from 'ngraph.forcelayout';
import forcelayout3d from 'ngraph.forcelayout3d';

//3d continued... controls.
//have to import controls as non-ES6 because of scoping issues.
//see https://stackoverflow.com/questions/28068038/how-do-i-import-additional-plugins-for-an-already-imported-library-using-jspm
const OrbitControls = require('three-orbit-controls')(THREE);

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
        this.controls = null;

        //animation frame counter and the somewhat magical _frameId
        this.counter = 0;
        this._frameId = null;

        //the mainscene is there to hold our 3d graph but also lights and viewfog or other globally stuff
        this.mainScene = new THREE.Scene();


        // Capture mouse coords on move
        this.raycaster = new THREE.Raycaster();
        this.mousePos = new THREE.Vector2();
        this.mousePos.x = -2; // Initialize off canvas
        this.mousePos.y = -2;

        //the graphGroup is there for all of our nodes and links, our main actors.
        this.graphGroup = new THREE.Group();
        this.graphGroup.name = "graphGroup";

        this.mainScene.add(this.graphGroup);

        addEnv(this.mainScene);

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
        resizeCanvas(this.renderer, this.camera, this.state.width, this.state.height);

        //then mount it to the DOM, doesn't matter if we resize first because we call resize again after react
        //has updated the component with the proper width and height, and there's fallback values
        this.mount.appendChild(this.renderer.domElement);

        // Add camera interaction and mousebased input
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );

        this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        this.controls.dampingFactor = 0.25;
        //this.controls.panningMode = THREE.HorizontalPanning; // default is THREE.ScreenSpacePanning
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10000;
        this.controls.maxPolarAngle = Math.PI;

        //fetch data from API after initialisation
        qwest.get(sourceUrl + sourceQuery).then((xhr, response) => {
            console.log('qwest get');
            this.setState({responseData: response.data});
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

    initGui() {

        const gui = new dat.GUI();
        const scene = this.mainScene;
        const graphGroup = this.graphGroup;
        const lines = graphGroup.getObjectByProperty('name', 'lineGroup');
        const textNodes = graphGroup.getObjectByProperty('name', 'textGroup');
        const nodeSpheres = graphGroup.getObjectByProperty('name', 'nodeSphereGroup');
        const sprites = graphGroup.getObjectByProperty('name', 'spriteGroup');

        const param = {};

        if(scene && scene.fog) {
            param.sceneFogColor = scene.fog.color.getHex();
            param.sceneFogNear = scene.fog.near;
            param.sceneFogFar = scene.fog.far;
            param.sceneFogVisible = scene.fog;
        }

        if(lines && lines.children.length) {
            console.log(lines.children[0]);
            param.lineMaterial = lines.children[0].material;
            param.lineColor = param.lineMaterial.color.getHex();
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
                //console.log(lines.getObjectByProperty('type', 'LineBasicMaterial'));
            });
        }

        /**
        var param = {
            lineOpacity: lineMat.opacity,
            lineColor: lineMat.color.getHex(),
            nodeColor: sphereMat.color.getHex(),
            nodeOpacity: sphereMat.opacity
        };

        var lineFolder = gui.addFolder('Lines');

        lineFolder.add( param, 'lineOpacity', 0, 1, 0.1 ).onChange( function ( val ) {
            lineMat.opacity = val;
        } );

        lineFolder.addColor(param, 'lineColor').onChange(function(val){
            lineMat.color.setHex( val );
        });


        var nodeFolder = gui.addFolder('Nodes');

        nodeFolder.addColor(param, 'nodeColor').onChange(function(val){
            sphereMat.color.setHex( val );
        });
        nodeFolder.add( param, 'nodeOpacity', 0, 1, 0.1 ).onChange( function ( val ) {
            sphereMat.opacity = val;
        } );**/

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
            qwest.get(sourceUrl + sourceQuery).then((xhr, response) => {
                console.log('qwest reget');
                this.setState({fetchingJson: false, responseData: response.data});
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

        update3dStuff(mappedData, layout, isD3Sim, this.idField);
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
        if(this._frameId) {
            this._frameId();
        }

        //note, stopping the animation loop prevents mouse controls from firing too
        if (!this.state.animating) {
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

            //only map data if the state has changed
            if(prevState !== this.state) {
                //add our 3d manifestation of nodes and links
                const isD3Sim = this.forceEngine !== 'ngraph';
                //lol
                add3dStuff(this.state.mappedData, this.graphGroup, this.layout, isD3Sim);
                this.initGui();
            }
        }


        if (this.camera.position.x === 0 && this.camera.position.y === 0) {
            // If camera still in default position (not user modified)
            this.camera.lookAt(this.graphGroup.position);

            //we're assuming that we're working in narratives here, and only on one.
            if(this.state.responseData !== null && this.state.responseData.hasOwnProperty('narratives')) {
                this.camera.position.z = Math.cbrt(this.state.responseData.narratives[0].objects.length) * CAMERA_DISTANCE2NODES_FACTOR;
            }
        }

        const textGroup = this.graphGroup.getObjectByProperty('name', 'textGroup');

        if(textGroup && textGroup.children) {
            for (let i = 0; i < textGroup.children.length; i++) {
                textGroup.children[i].lookAt(this.camera.position);
            }
        }

        this.raycaster.setFromCamera(this.mousePos, this.camera);
        //this.tbControls.update();
        this.controls.update();

        //this is the important bit. After we've dicked with the mainScene's contents(or just its children's contents),
        //the renderer needs to shove the frame to the screen
        this.renderer.render(this.mainScene, this.camera);

        if(this.state.animating) {
            //and the window needs to request a new frame to do this all again
            window.requestAnimationFrame( this.animate );
        }
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
        //check if our raycasted click event collides with a nodesphere
        if(this.graphGroup.getObjectByProperty('name', 'nodeSphereGroup')) {
            const intersects = this.raycaster.intersectObjects(this.graphGroup.getObjectByProperty('name', 'nodeSphereGroup').children)
                .filter(o => o.object.__data); // Check only objects with data (nodes)
            //if our mouseover collides with a node
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
            this.tooltip.style.left = (relPos.x - 20) + 'px';
        }


    }

    handleClick() {
            //update our raycaster's position with the mouse position coordinates and camera info
            this.raycaster.setFromCamera(this.mousePos, this.camera);
            //check if our raycasted click event collides with a nodesphere
            const intersects = this.raycaster.intersectObjects(this.graphGroup.getObjectByProperty('name', 'nodeSphereGroup').children)
                .filter(o => o.object.__data); // Check only objects with data (nodes)

            //if our click collided with a node
            if (intersects.length) {
                //tell react about that because later we'll want to load info about the node (VERSION 2 ANYONE??)
                this.selectedNode = intersects[0].object.__data.name;
                console.log(this.selectedNode);
            }
    }

    /**INTERACTION STUFF ENDS HERE**/


    render() {
        return (
            <div id="nodegraph" ref={mount => this.mount = mount} style={{width: this.state.width, height: this.state.height}}>
                <div ref={tooltip => this.tooltip = tooltip} className="graph-tooltip" />
            </div>
        );
    }
}

export default NodeGraph;

