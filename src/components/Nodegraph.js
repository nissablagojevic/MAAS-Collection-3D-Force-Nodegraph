import { default as React, Component } from 'react';
import qwest from 'qwest';
import {sourceUrl, sourceQuery, nodeQuery, mapData, narrativesList} from './resolvers.js';

import './Nodegraph.css';

import NodeInfoWindow from './NodeInfoWindow';
import Selector from './Selector';
import SelectNarrative from './SelectNarrative';
import Instructions from './Instructions';

//3d stuff
import {GraphCanvas} from './canvas.js';

class NodeGraph extends Component {
    constructor() {
        super();
        this.state = {
            width: '100%',
            height: '100vh',
            fetchingJson: false,
            responseData: null,
            selectedNode: null,
            narrative: 2087
        };

        this.handleClick = this.handleClick.bind(this);
        this.getNarrative = this.getNarrative.bind(this);
    }

    componentDidMount() {

        this.graphCanvas = GraphCanvas.getInstance();
        //set the width and height to whatever our #nodegraph mounter has calculated from its CSS
        this.setState({width: this.mount.clientWidth, height: this.mount.clientHeight});

        this.graphCanvas.resizeCanvas(this.state.width, this.state.height);

        //then mount it to the DOM, doesn't matter if we resize first because we call resize again after react
        //has updated the component with the proper width and height, and there's fallback values
        this.mount.appendChild(this.graphCanvas.getRenderer().domElement);

        this.getNarrative();
    }

    componentDidUpdate(prevProps, prevState) {
        console.log("COMPONENT DID UPDATE");

        if (prevProps !== this.props) {
            this.graphCanvas.setFetchingJson(true);
            this.getNarrative();
        }

        if(this.state.responseData && this.state.responseData.narratives[0]._id === this.state.narrative) {
            console.log('have response data');
            console.log(this.state.responseData);
            //super shallow check for object sameness
            if(JSON.stringify(this.state.responseData) !== JSON.stringify(prevState.responseData) ) {
                const mappedData = mapData(this.state.responseData);
                this.graphCanvas.setMappedData(mappedData);
                if(this.graphCanvas.getMappedData()) {
                    console.log("mapped data = ");
                    console.log(mappedData);
                    this.graphCanvas.resizeCanvas(this.state.width, this.state.height);
                    if(this.graphCanvas.isFetchingJson()) {
                        this.graphCanvas.setFetchingJson(false);
                        this.graphCanvas.startLoop();
                    }
                }
            }
        } else {
            console.log("RESPONSE IS ACTUALLY...");
            console.log(this.state.responseData);
            console.log(this.state.narrative);
            console.log('no response data');
            this.graphCanvas.setFetchingJson(true);
        }

    }

    componentWillUnmount() {
        this.graphCanvas.stopLoop();
        this.graphCanvas.remove3dStuff();
    }

    getNarrative() {
        let urlNarrative;
        //this is bound to be a problem
        if(this.props.location && this.props.location.pathname) {
            urlNarrative = parseInt(this.props.location.pathname.substring(1), 10);
        }

        qwest.get(sourceUrl + sourceQuery(urlNarrative)).then((xhr, response) => {
            console.log('qwest reget');
            this.graphCanvas.stopLoop();
            this.graphCanvas.remove3dStuff();
            this.setState({narrative: urlNarrative, responseData: response.data, fetchingJson: false});
        }).catch(function (e, xhr, response) {
            // Process the error in getting the json file
            console.log('DATA RETRIEVAL ERROR');
            console.log(e);
        });
    }

    handleClick(e) {
        this.setState({selectedNode: this.graphCanvas.selectNode()});
    }

    render() {
        return (
            <div
                id="nodegraph"
                ref={mount => this.mount = mount} style={{width: this.state.width, height: this.state.height}}
                onClick={() => this.handleClick()}>
                <Instructions/>
                <NodeInfoWindow node={this.state.selectedNode}/>
            </div>
        );
    }
}

export default NodeGraph;

