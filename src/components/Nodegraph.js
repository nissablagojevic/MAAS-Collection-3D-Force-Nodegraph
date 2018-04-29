import { default as React, Component } from 'react';
import qwest from 'qwest';
import {sourceUrl, sourceQuery, mapData} from './resolvers.js';

import './Nodegraph.css';

//3d stuff
import {GraphCanvas} from './canvas.js';

//force graphing calculations
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

        this.animate = this.animate.bind(this);
    }

    componentDidMount() {
        //set the width and height to whatever our #nodegraph mounter has calculated from its CSS
        this.setState({width: this.mount.clientWidth, height: this.mount.clientHeight});
        this.graphCanvas.resizeCanvas(this.state.width, this.state.height);

        //then mount it to the DOM, doesn't matter if we resize first because we call resize again after react
        //has updated the component with the proper width and height, and there's fallback values
        this.mount.appendChild(this.graphCanvas.getRenderer().domElement);

        //fetch data from API after initialisation
        qwest.get(sourceUrl + sourceQuery).then((xhr, response) => {
            console.log('qwest get');
            this.setState({responseData: response.data});

        }).catch(function(e, xhr, response) {
            // Process the error in getting the json file
            console.log('DATA RETRIEVAL ERROR');
            console.log(e);
        });



    }

    componentDidUpdate(prevProps, prevState) {
        console.log('component did update');

        if(this.state.responseData) {
            console.log('have response data');
            const mappedData = mapData(this.state.responseData);
            this.graphCanvas.setMappedData(mappedData);
            if(this.graphCanvas.getMappedData()) {
                this.graphCanvas.resizeCanvas(this.state.width, this.state.height);
                this.graphCanvas.setFrameId(null); // Pause simulation
                if(this.graphCanvas.getFetchingJson()) {
                    this.graphCanvas.setFetchingJson(false);
                    this.graphCanvas.startLoop();
                }
            }
        } else {
            console.log('no response data');
            this.graphCanvas.setFetchingJson(true);
        }


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
    }

    /**ANIMATING STUFF STARTS HERE**/
    componentWillUnmount() {
        this.graphCanvas.stopLoop();
    }

    animate(prevProps, prevState) {
        if(this.getFrameId()) {
            this.getFrameId()();
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
                this.graphCanvas.add3dStuff();
            }
        }

        this.graphCanvas.animate3d();

        if(this.state.animating) {
            //and the window needs to request a new frame to do this all again
            window.requestAnimationFrame( this.graphCanvas.animate );
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

