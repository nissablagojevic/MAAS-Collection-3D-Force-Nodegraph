import { default as React, Component } from 'react';
import { Nodegraph, SelectNarrative, NodeInfoWindow, Instructions } from '../components';
import {sourceUrl, sourceQuery, narrativesList, nodeQuery, mapData} from '../components/resolvers.js';
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
            narrativesList: null,
            responseData: null,
            selectedNode: null
        };

        this.getNarrativeList = this.getNarrativeList.bind(this);
        this.getQuery = this.getQuery.bind(this);
        this.updateData = this.updateData.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.getNodeInfo = this.getNodeInfo.bind(this);
        this.preloadImages = this.preloadImages.bind(this);
    }

    componentDidMount() {
        this.graphCanvas = GraphCanvas.getInstance();
        this.updateData();
    }

    componentDidUpdate(prevProps, prevState) {
        console.log("NODEGRAPH CONTAINER componentDidUpdate")
        let urlNarrative = parseNarrativeId(this.props.location);

        if (urlNarrative && urlNarrative !== this.state.selectedNarrative) {
            this.updateData();
        }

        if (this.state.responseData && this.state.responseData !== prevState.responseData) {
            this.preloadImages(this.state.responseData);
        }
    }

    updateData() {
        const narrative = parseNarrativeId(this.props.location);
        let queryData = this.state.responseData;
        let narrativesList = this.state.narrativesList;

        if (narrative !== this.state.selectedNarrative) {
            queryData =  this.getQuery(narrative);
        }

        if (!narrativesList) {
            narrativesList = this.getNarrativeList();
        }

        this.setState({selectedNarrative: narrative, narrativesList: narrativesList, responseData: queryData});
    }
    //get single narrative
    async getQuery(narrative) {
        try {
            let response = await fetch(
                sourceUrl + sourceQuery(narrative)
            );
            let responseJson = await response.json();
            this.setState({responseData: responseJson.data, selectedNode: null});
            console.log(responseJson.data);
            return responseJson;
        } catch(error) {
            console.error(error);
        }
    }

    //get list of all narratives
    async getNarrativeList() {
        try {
            let response = await fetch(
                sourceUrl + narrativesList
            );
            let responseJson = await response.json();
            this.setState({narrativesList: responseJson.data.narratives});
            console.log(responseJson.data);
            return responseJson;
        } catch(error) {
            console.error(error);
        }
    }

    preloadImages(responseData) {
        console.log("PRELOAD");
        if(!responseData || responseData.then) {
            console.log('but no response data yet');
            return null;
        }

        mapData(responseData).nodes.filter((i) => {
            if (i.mainImage) {
                this.graphCanvas.preloadImage(i.id, i.mainImage);
            }
            return null;
        });
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

    render() {
        return (
            <div id="nodegraphContainer">
                <Nodegraph {...this.props} {... this.state} handleClick={this.handleClick}/>
                <div id="infoWindows">
                    <SelectNarrative {...this.props} {... this.state}/>
                    <Instructions/>
                    {this.state.selectedNode ? <NodeInfoWindow node={this.state.selectedNode}/> : ''}
                </div>
            </div>
        )
    }
}

export default NodegraphContainer(Nodegraph);