import { default as React, Component } from 'react';
import qwest from 'qwest';
import ForceGraph3D from '3d-force-graph/dist/3d-force-graph.min.js';
import mapNode from '../schemas/node.js';
import mapLink from '../schemas/link.js';


//3d stuff
import * as THREE from 'three';
import trackballControls from 'three-trackballcontrols';
import * as d3 from 'd3-force-3d';
import graph from 'ngraph.graph';
import forcelayout from 'ngraph.forcelayout';
import forcelayout3d from 'ngraph.forcelayout3d';

const sourceUrl = 'https://api.maas.museum/graphql?query=';
const sourceQuery = `{narratives(filter:{_id:69}){
    _id
    title
    objects(limit: 100) {
      _id
      title
      displayTitle
      description
      category
      terms {
        id
        term
      }
      production {
        date
        dateLatest
        dateEarliest
      }
      images(limit: 1) {
        url(width: 200, height: 200)
      }
    }
  }
}`;


//3D STUFF with THREE.JS
//we need something to render with and something to see the render with
let renderer = new THREE.WebGLRenderer();
let camera = new THREE.PerspectiveCamera();
camera.position.z = 5;
const CAMERA_DISTANCE2NODES_FACTOR = 150;
//camera.far = 20000;



function resizeCanvas(width = 1000, height = 300) {
    if (width && height) {
        renderer.setSize(width, height);
        camera.aspect = width/height;
        camera.updateProjectionMatrix();
    }
}







// Capture mouse coords on move
const raycaster = new THREE.Raycaster();
const mousePos = new THREE.Vector2();
mousePos.x = -2; // Initialize off canvas
mousePos.y = -2;

// Add camera interaction
const tbControls = new trackballControls(camera, renderer.domElement);

//nodeclicking goodness
let onNodeClick = {};

const d3ForceLayout = d3.forceSimulation()
    .force('link', d3.forceLink())
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter())
    .stop();



let lineMaterials = {}; // indexed by color
let sphereMaterials = {};
let nodeResolution = 10;
let nodeRelSize = 10;
let sphereGeometries = {};


/*** TEST CUBE
var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
mainScene.add( cube );
camera.position.z = 5;**/

//camera.far = 20000;

    //GRAPHING STUFF WITH D3.JS

    //GET DATA


/*
 * Description: resolve graphQl data against 3d-force-graph schemas
 *
 * @param {object} response.data from graphQl endpoint
 */
function mapData(data) {

    //graphSchema is the collection of nodes and links required to make a valid 3d force graph
    let graphSchema = {
        nodes: [],
        links: []
    };

    if(data.hasOwnProperty('narratives')) {
        //for each object in our query map it to our graph Schema and store that our nodeData var
        data.narratives.forEach((narrative) => {mapNodes(narrative, graphSchema, 'narrative')});

        //for the first narrative's objects returned in the query, map the objects as nodes and term and put that in our graphschema
        data.narratives[0].objects.forEach((obj) => {mapNodes(obj, graphSchema, 'object')});

        //for the first narrative map each object's terms to nodes and put that in our graphschema
        data.narratives[0].objects.forEach((obj) => {
            obj.terms.forEach((term) => {mapNodes(term, graphSchema, 'term')});
        });

        //for each of the first narrative's object, map the link between the object nodes and term nodes and put that in our graphschema
        data.narratives[0].objects.forEach((obj) => {mapLinks(obj, graphSchema, 'object', 'terms')});
    }

    return graphSchema;
}


/*
 * Description: Using a starting object, create 3d-graph links according to a provided linkSchema
 *
 * @param {object} startObject - The node to which we are creating a link
 * @param {object} linkContainer - What we put the links in
 * @param {string} linkId - Just the name we use to prefix generated link IDs
 * @param {string} linkToType What node type to link to the startObject
 */
function mapLinks(startObject, linkContainer, linkId = 'link', linkToType = 'objects') {
    let linksJson = linkContainer;
    const links = mapLink(startObject, linkId, linkToType);

    links.forEach((link) => {linksJson.links.push(link)});

    return linksJson;
}

/*
 * Description: Using a starting object, create 3d-graph node according to a provided nodeSchema
 *
 * @param {object} startObject - The node to which we are creating a link
 * @param {object} nodeContainer - What we put our nodes in
 * @param {string} nodeId - Just the name we use to prefix generated link IDs
 */
function mapNodes(startObject, nodeContainer, nodeId = 'node') {

    let nodesJson = nodeContainer;

    //generate a node with an id, name and value
    const node = mapNode(startObject, nodeId);

    nodesJson.nodes.push(node);

    return nodesJson;
}

function getOffset(el) {
    const rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
}


const nodeGraph = new ForceGraph3D();

const MAXFRAMES = 100;

class NodeGraph extends Component {
    constructor() {
        super();
        this.state = {
            width: '100%',
            height: '100vh',
            selectedNode: null,
            fetchingJson: false,
            animating: true,
            responseData: null
        };

        this.counter = 0;
        this._frameId = null;

        //the mainscene is there to hold our lights and viewfog or other globally stuff
        //feel free to add objects that aren't going to change to it too if the rendering isn't working
        this.mainScene = new THREE.Scene();
        this.mainScene.background = new THREE.Color(255, 0, 0);

        //fiat lux
        this.ambientLight = new THREE.AmbientLight(0xbbbbbb);
        this.directLight = new THREE.DirectionalLight(0xffffff, 0.6);

        //the graphGroup is there for all of our nodes and links, our main actors.
        this.graphGroup = new THREE.Group();

        this.mainScene.add(this.graphGroup)
            .add(this.ambientLight)
            .add(this.directLight);

        this.animate = this.animate.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        renderer.domElement.addEventListener("mousemove", this.mouseMove);
        renderer.domElement.addEventListener("click", this.handleClick);
    }

    componentDidMount() {
        //set the width and height to whatever our #nodegraph mounter has calculated from its CSS
        this.setState({width: this.mount.clientWidth, height: this.mount.clientHeight});

        //then mount it to the DOM, doesn't matter if we resize first because we call resize again after react
        //has updated the component with the proper width and height, and there's fallback values
        this.mount.appendChild(renderer.domElement);

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
            resizeCanvas(this.state.width, this.state.height);
        }
        this.mainScene.background = new THREE.Color(0, 0, 255);
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
    }


    /**ANIMATING STUFF STARTS HERE**/
    componentWillUnmount() {
        this.stopLoop();
    }

    startLoop() {
        console.log('startLoop');
        if( !this._frameId) {
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
        console.log(this.counter);
        //default escape hatch with counter until we figure out if qwest's promise is hammering the server
        if ((MAXFRAMES && this.counter > MAXFRAMES) || !this.state.animating) {
            //the renderer owns the mainScene
            console.log(renderer);
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
            this.setState({fetchingJson: true});
            console.log(prevProps);
            console.log(prevState);

            //only map data if the state has changed
            if(prevState !== this.state) {
                //map it to nodes and links schema
                let data = mapData(this.state.responseData);

                //about to switch context, so no more of 'this' for the time being
                const gG = this.graphGroup;

                //map the newly created links to lines in THREE.js and add them to the scene
                data.links.forEach(link => {
                    if (!lineMaterials.hasOwnProperty('color')) {
                        lineMaterials['color'] = new THREE.LineBasicMaterial({
                            color: '#f0f0f0',
                            transparent: true,
                            opacity: 0.5
                        });
                    }

                    const geometry = new THREE.BufferGeometry();
                    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3));
                    const lineMaterial = lineMaterials['color'];
                    const line = new THREE.Line(geometry, lineMaterial);

                    line.renderOrder = 10; // Prevent visual glitches of dark lines on top of spheres by rendering them last
                    gG.add(link.__line = line);
                });

                //map the newly created nodes to spheres
                data.nodes.forEach(node => {
                    const val = 1;
                    if (!sphereGeometries.hasOwnProperty(val)) {
                        sphereGeometries[val] = new THREE.SphereGeometry(Math.cbrt(val) * nodeRelSize, nodeResolution, nodeResolution);
                    }

                    if (!sphereMaterials.hasOwnProperty('color')) {
                        sphereMaterials['color'] = new THREE.MeshLambertMaterial({
                            color: '#ffffaa',
                            transparent: true,
                            opacity: 0.75
                        });
                    }

                    const sphere = new THREE.Mesh(sphereGeometries[val], sphereMaterials['color']);

                    sphere.name = node.name; // Add label
                    sphere.__data = node; // Attach node data

                    gG.add(node.__sphere = sphere);
                });
            }

            //console.log(graphData);
            /**TEST CUBE AGAIN for animation purposes, may not be able to see it beneath any added spheres though**/
            /**this.mainScene.add( cube );
            cube.rotation.x += 0.1;
            cube.rotation.y += 0.1;**/
        }


        if (camera.position.x === 0 && camera.position.y === 0) {
            // If camera still in default position (not user modified)
            camera.lookAt(this.graphGroup.position);
            if(this.state.responseData !== null && this.state.responseData.hasOwnProperty('narratives')) {
                //we're assuming that we're working in narratives here, and only on one.
                //console.log(this.state.responseData.narratives[0].objects.length);
                camera.position.z = Math.cbrt(this.state.responseData.narratives[0].objects.length) * CAMERA_DISTANCE2NODES_FACTOR;

            }
        }

            raycaster.setFromCamera(mousePos, camera);
            tbControls.update();

        //this is the important bit. After we've dicked with the mainScene's (or just its children's contents),
        //the renderer needs to shove the frame to the screen
            renderer.render(this.mainScene, camera);
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
        const offset = getOffset(renderer.domElement),
            relPos = {
                x: e.pageX - offset.left,
                y: e.pageY - offset.top
            };
        mousePos.x = (relPos.x / this.state.width) * 2 - 1;
        mousePos.y = -(relPos.y / this.state.height) * 2 + 1;

        raycaster.setFromCamera(mousePos, camera);
        //check if our raycasted click event collides with something rendered in our graph group
        const intersects = raycaster.intersectObjects(this.graphGroup.children)
            .filter(o => o.object.__data); // Check only objects with data (nodes)
        //if our mouseover collides with a node
        if (intersects.length) {
            //the node is....
            console.log('mousedNode:');
            console.log(intersects[0].object.__data);
        }

        // Move tooltip
        //toolTipElem.style.top = (relPos.y - 40) + 'px';
        //toolTipElem.style.left = (relPos.x - 20) + 'px';


    }

    handleClick() {
        console.log('click');
        if (onNodeClick) {
            //update our raycaster's position with the mouse position coordinates and camera info
            raycaster.setFromCamera(mousePos, camera);
            //check if our raycasted click event collides with something rendered in our graph group
            const intersects = raycaster.intersectObjects(this.graphGroup.children)
                .filter(o => o.object.__data); // Check only objects with data (nodes)
            //if our click collided with a node
            if (intersects.length) {
                //the clicked node data is....
                console.log('selectedNode:');
                console.log(intersects[0].object.__data);
                //tell react about that because later we'll want to load info about the node (VERSION 2 ANYONE??)
                this.setState({selectedNode: intersects[0].object.__data.id});
            }
        }
    }

    /**INTERACTION STUFF ENDS HERE**/


    render() {
        console.log(this.mainScene);
        //this renders only the FIRST FRAME, animation begins in component did mount with startloop;
        //renderer.render(this.mainScene, camera);

        return (
            <div id="nodegraph" ref={mount => this.mount = mount} style={{width: this.state.width, height: this.state.height}}/>
        );
    }
}

export default NodeGraph;

