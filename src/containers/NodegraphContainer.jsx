import { default as React, Component } from 'react';
import { Nodegraph, SelectNarrative, NodeInfoWindow, Instructions, About } from '../components';
import {sourceUrl, sourceQuery, nodeQuery, mapData} from '../components/resolvers.js';
import {GraphCanvas} from '../components/GraphCanvas.js';
import './NodegraphContainer.css';


function parseNarrativeId(location) {
    if(location && location.pathname) {
        return parseInt(location.pathname.substring(1), 10);
    }

    return null;
}

let NodegraphContainer = Nodegraph => class extends Component {
    constructor() {
        super();
        this.state = {
            selectedNarrative: null,
            responseData: null,
            selectedNode: null
        };

        this.getQuery = this.getQuery.bind(this);
        this.updateData = this.updateData.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.getNodeInfo = this.getNodeInfo.bind(this);
    }

    componentDidMount() {
        this.graphCanvas = GraphCanvas.getInstance();
        this.updateData();
    }

    componentDidUpdate(prevProps, prevState) {
        let urlNarrative = parseNarrativeId(this.props.location);

        if (urlNarrative && urlNarrative !== this.state.selectedNarrative) {
            this.updateData();
        }

        if (this.state.responseData && !this.state.responseData.then && this.state.responseData !== prevState.responseData) {
            mapData(this.state.responseData).nodes.filter((i) => {
                if (i.mainImage) {
                    this.graphCanvas.preloadImage(i.id, i.mainImage);
                }
                return null;
            });
        }
    }

    updateData() {
        console.log("UPDATE DATA");
        const narrative = parseNarrativeId(this.props.location);
        let queryData = this.state.responseData;

        if (narrative !== this.state.selectedNarrative) {
            queryData =  this.getQuery(narrative);
        }

        this.setState({selectedNarrative: narrative, responseData: queryData});
    }
    //get single narrative
    async getQuery(narrative) {
        try {
            let response = await fetch(
                sourceUrl + sourceQuery(narrative)
            );
            let responseJson = await response.json();
            this.setState({responseData: responseJson.data, selectedNode: null});
            return responseJson;
        } catch(error) {
            console.error(error);
        }
    }

    async getNodeInfo(node) {
        try {
            let response = await fetch(
                sourceUrl + nodeQuery(node[0], node[1])
            );
            let responseJson = await response.json();

            this.setState({selectedNode: responseJson.data});
            return responseJson;
        } catch (error) {
            console.error(error);
        }
    }

    handleClick() {
        const selectedNode = this.graphCanvas.selectNode();
        if (selectedNode && selectedNode !== this.state.selectedNode) {
            const node = selectedNode.split('-');
            //@TODO Currently only works for objects due to lack of Schema
            if (node && node[0] === 'object' ) {
                this.getNodeInfo(node);
            }
        }
    }

    render() {
        return (
            <div id="nodegraphContainer">
                <Nodegraph {...this.props} {... this.state} handleClick={this.handleClick}/>
                <div id="infoWindows">
                    <SelectNarrative {...this.props} {... this.state} display="accordion" open={true}/>
                    <Instructions open={true}/>
                    <About open={false}/>
                    {this.state.selectedNode ? <NodeInfoWindow node={this.state.selectedNode}/> : ''}
                </div>
            </div>
        )
    }
}

export default NodegraphContainer(Nodegraph);