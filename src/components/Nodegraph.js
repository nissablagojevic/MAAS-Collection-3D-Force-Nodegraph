import { default as React, Component } from 'react';
import qwest from 'qwest';
import {sourceUrl, sourceQuery, mapData} from './resolvers.js';

import './Nodegraph.css';

//3d stuff
import {GraphCanvas} from './canvas.js';

class NodeGraph extends Component {
    constructor() {
        super();
        this.state = {
            width: '100%',
            height: '100vh',
            fetchingJson: false,
            responseData: null
        };

        this.graphCanvas = GraphCanvas.getInstance();
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

    componentDidUpdate(prevProps) {
        if(this.state.responseData) {
            const mappedData = mapData(this.state.responseData);
            this.graphCanvas.setMappedData(mappedData);
            if(this.graphCanvas.getMappedData()) {
                this.graphCanvas.resizeCanvas(this.state.width, this.state.height);
                if(this.graphCanvas.isFetchingJson()) {
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

    componentWillUnmount() {
        this.graphCanvas.stopLoop();
    }

    render() {
        return (
            <div id="nodegraph" ref={mount => this.mount = mount} style={{width: this.state.width, height: this.state.height}}>
                <div ref={tooltip => this.tooltip = tooltip} className="graph-tooltip" />
            </div>
        );
    }
}

export default NodeGraph;

