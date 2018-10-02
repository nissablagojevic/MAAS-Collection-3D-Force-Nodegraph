import { default as React, Component } from 'react';
import qwest from 'qwest';
import {sourceUrl, sourceQuery, mapData} from './resolvers.js';

import './Nodegraph.css';

import NodeInfoWindow from './NodeInfoWindow';

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
        if (prevProps !== this.props) {
            this.graphCanvas.setFetchingJson(true);
            this.graphCanvas.stopLoop();
            this.graphCanvas.remove3dStuff();
            this.getNarrative();
        }

        if(this.state.responseData && this.state.responseData.narratives[0]._id === this.state.narrative) {
            //super shallow check for object sameness
            if(JSON.stringify(this.state.responseData) !== JSON.stringify(prevState.responseData) ) {

                //@TODO change to promises instead of this mess
                const mappedData = mapData(this.state.responseData);
                this.graphCanvas.setMappedData(mappedData);
                if(this.graphCanvas.getMappedData()) {
                    this.graphCanvas.resizeCanvas(this.state.width, this.state.height);
                    if(this.graphCanvas.isFetchingJson()) {
                        this.graphCanvas.setFetchingJson(false);
                        this.graphCanvas.startLoop();
                    }
                }
            }
        } else {
            console.log('no response data');
            this.graphCanvas.setFetchingJson(true);
        }

    }

    componentWillUnmount() {
        this.graphCanvas.stopLoop();
        this.graphCanvas.remove3dStuff();
    }

    getNarrative() {
        //@TODO This should be handled in App.js so we're not repeating it in SelectorNarrative
        let urlNarrative;
        //this is bound to be a problem
        if(this.props.location && this.props.location.pathname) {
            urlNarrative = parseInt(this.props.location.pathname.substring(1), 10);
        }

        this.setState({ selectedNode: null});

        qwest.get(sourceUrl + sourceQuery(urlNarrative)).then((xhr, response) => {
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
                <NodeInfoWindow node={this.state.selectedNode}/>
            </div>
        );
    }
}

export default NodeGraph;

