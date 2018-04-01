import { default as React, Component } from 'react';
import qwest from 'qwest';
import {sourceUrl, sourceQuery, mapData} from './resolvers.js';

import './Nodegraph.css';

//3d stuff
import {GraphCanvas} from './canvas.js';

//force graphing
import * as d3 from 'd3-force-3d';
import graph from 'ngraph.graph';
import forcelayout from 'ngraph.forcelayout';
import forcelayout3d from 'ngraph.forcelayout3d';

import {GraphLayout} from '../d3';

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

        this.graphCanvas = GraphCanvas.getInstance();
        this.graphLayout = GraphLayout.getInstance();

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

        this.animate = this.animate.bind(this);

    }

    componentDidMount() {
        //set the width and height to whatever our #nodegraph mounter has calculated from its CSS
        this.setState({width: this.mount.clientWidth, height: this.mount.clientHeight});
        this.graphCanvas.resizeCanvas(this.state.width, this.state.height);

        //then mount it to the DOM, doesn't matter if we resize first because we call resize again after react
        //has updated the component with the proper width and height, and there's fallback values
        this.mount.appendChild(this.graphCanvas.getRenderer().domElement);

        this.graphCanvas.initThreeControls();

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

    }

    componentDidUpdate(prevProps, prevState) {
        console.log('component did update');

        if (prevState !== this.state) {
            this.graphCanvas.resizeCanvas(this.state.width, this.state.height);
        }

        this.graphCanvas.setFrameId(null); // Pause simulation

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

        this.graphLayout.createForceLayout(this.state.mappedData);

    }

    layoutTick() {
        const layout = this.layout;
        const isD3Sim = this.forceEngine !== 'ngraph';
        let mappedData = this.state.mappedData;

        //console.log('layoutTick');
        if (this.cntTicks++ > this.cooldownTicks || (new Date()) - this.startTickTime > this.cooldownTime) {
            this.graphCanvas.setFrameId(null); // Stop ticking graph
        }

        layout[isD3Sim?'tick':'step'](); // Tick it

        this.graphCanvas.update3dStuff(mappedData, layout, this.idField);
    }

    /**ANIMATING STUFF STARTS HERE**/
    componentWillUnmount() {
        this.stopLoop();
    }


    startLoop() {
        console.log('startLoop');
        if( !this.graphCanvas.getFrameId()) {
            this.setState({animating: true});
            this.graphCanvas.setFrameId(window.requestAnimationFrame( this.animate ));
        }
    }

    stopLoop() {
        console.log('stoploop');
        console.log(this);
        window.cancelAnimationFrame( this.graphCanvas.getFrameId() );
        //setting _frameId to null will pause THREE.js rendering
        this.graphCanvas.setFrameId(null);
        //also let react know we're pausing
        this.setState({animating: false});

        // Note: no need to worry if the loop has already been cancelled
        // cancelAnimationFrame() won't throw an error
    }


    animate(prevProps, prevState) {
        if(this.graphCanvas.getFrameId()) {
            this.graphCanvas.getFrameId()();
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
                this.graphCanvas.add3dStuff(this.state.mappedData, this.layout);
                this.graphCanvas.initGui();
            }
        }

        this.graphCanvas.animate3d();

        if(this.state.animating) {
            //and the window needs to request a new frame to do this all again
            window.requestAnimationFrame( this.animate );
        }
    }
    /**ANIMATING STUFF ENDS HERE**/


    render() {
        return (
            <div id="nodegraph" ref={mount => this.mount = mount} style={{width: this.state.width, height: this.state.height}}>
                <div ref={tooltip => this.tooltip = tooltip} className="graph-tooltip" />
            </div>
        );
    }
}

export default NodeGraph;

