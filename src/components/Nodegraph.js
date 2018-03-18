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
let fetchingJson = false;

//3D STUFF with THREE.JS
let renderer = new THREE.WebGLRenderer();
let camera = new THREE.PerspectiveCamera();
camera.position.z = 5;
//camera.far = 20000;


function resizeCanvas(width = 1000, height = 300) {
    if (width && height) {
        renderer.setSize(width, height);
        camera.aspect = width/height;
        camera.updateProjectionMatrix();
    }
}


let mainScene = new THREE.Scene();
let graphScene = new THREE.Group();
let ambientLight = new THREE.AmbientLight(0xbbbbbb);
let directLight = new THREE.DirectionalLight(0xffffff, 0.6);


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

mainScene.background = new THREE.Color(255, 0, 0);

mainScene.add(graphScene)
    .add(ambientLight)
    .add(directLight);


let lineMaterials = {}; // indexed by color
let sphereMaterials = {};
let nodeResolution = 10;
let nodeRelSize = 1;
let sphereGeometries = {};

var responseData = null;




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

let counter = 0;

class NodeGraph extends Component {
    constructor() {
        super();
        this.state = {
            width: '100%',
            height: '100vh'
        };

        this.animate = this.animate.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        renderer.domElement.addEventListener("mousemove", this.mouseMove);
        renderer.domElement.addEventListener("click", this.handleClick);
    }

    componentDidMount() {
        //fetch data from API after initialisation
        qwest.get(sourceUrl + sourceQuery).then((xhr, response) => {
            console.log('qwest get');
            responseData = response.data;

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

        this.setState({width: this.mount.clientWidth, height: this.mount.clientHeight});

        resizeCanvas(this.state.width, this.state.height);
        this.mount.appendChild(renderer.domElement);

        //start requestAnimationFrame checker;
        this.startLoop();
        //or just initial frame for testing purposes
        //renderer.render(mainScene, camera);


        //this.setState({graph: this.graphFromUrl(sourceUrl, sourceQuery)});
    }

    componentDidUpdate(prevProps, prevState) {
        console.log('component did update');
        resizeCanvas(this.state.width, this.state.height);
        //once we add react state to allow parameters to change, we'll need to check if we need to request new data
        //or just redraw the D3 graph with the existing data. Until then this check will remain broken but default to
        //not fetching data again.
        if (prevProps !== this.props) {
            qwest.get(sourceUrl + sourceQuery).then((xhr, response) => {
                console.log('qwest get');
                responseData = response.data;
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
        window.cancelAnimationFrame( this._frameId );
        // Note: no need to worry if the loop has already been cancelled
        // cancelAnimationFrame() won't throw an error
    }

    animate() {
        console.log(counter);
        //Emergency escape hatch until we figure out if qwest's promise is hammering the server
        if (counter > MAXFRAMES) {
            this.stopLoop();
            //this should probably not need to exist, why does cancelAnimationFrame not work?
            return null;
        }

        //check we haven't already fetched the graphQL data
        if(!fetchingJson && sourceUrl && responseData !== null) {

            //we're definitely fetching it now if we have non-null responseData
            fetchingJson = true;

            //prevent the sphere and line creators from complaining about not having data in the meantime
            let data= {
                links: [],
                nodes: []
            };

            //if it has finally returned stuff, map it to nodes and links schema
            if(!responseData.length) {
                data = mapData(responseData);
            }

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

                mainScene.add(link.__line = line);
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

                sphere.name = 'name'; // Add label
                sphere.__data = node; // Attach node data

                mainScene.add(node.__sphere = sphere);
            });

            //console.log(graphData);
            /**TEST CUBE AGAIN**/
            /**mainScene.add( cube );
            cube.rotation.x += 0.1;
            cube.rotation.y += 0.1;**/
        }

            raycaster.setFromCamera(mousePos, camera);
            tbControls.update();

            renderer.render(mainScene, camera);
            window.requestAnimationFrame( this.animate );


        counter++;

    }
    /**ANIMATING STUFF ENDS HERE**/


    /**INTERACTION STUFF STARTS HERE**/

    mouseMove(e) {
        console.log('mouseMove');
        // update the mouse pos
        const offset = getOffset(renderer.domElement),
            relPos = {
                x: e.pageX - offset.left,
                y: e.pageY - offset.top
            };
        mousePos.x = (relPos.x / this.state.width) * 2 - 1;
        mousePos.y = -(relPos.y / this.state.height) * 2 + 1;

        // Move tooltip
        //toolTipElem.style.top = (relPos.y - 40) + 'px';
        //toolTipElem.style.left = (relPos.x - 20) + 'px';


    }

    handleClick() {
        console.log('click');
        if (onNodeClick) {
            raycaster.setFromCamera(mousePos, camera);
            /**const intersects = raycaster.intersectObjects(state.graphScene.children)
                .filter(o => o.object.__data); // Check only objects with data (nodes)
            if (intersects.length) {
                state.onNodeClick(intersects[0].object.__data);
            }**/
        }
    }

    /**INTERACTION STUFF ENDS HERE**/


    render() {
        console.log(mainScene);
        //this renders only the FIRST FRAME, animation begins in component did mount with startloop;
        renderer.render(mainScene, camera);

        return (
            <div id="nodegraph" ref={mount => this.mount = mount} style={{width: this.state.width, height: this.state.height}}/>
        );
    }
}

export default NodeGraph;

