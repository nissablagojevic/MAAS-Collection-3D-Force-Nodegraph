import { default as React, Component } from 'react';

import { Nodegraph, SelectNarrative, NodeInfoWindow } from '../components';

import {sourceUrl, sourceQuery, narrativesList, nodeQuery} from '../components/resolvers.js';

//3d stuff
import {GraphCanvas} from '../components/canvas.js';

//or even further omitting extra ()
let NodegraphContainer = Nodegraph => class extends Component {
    constructor() {
        super();
        this.state = {
            selectedNarrative: null,
            narrativesList: null,
            responseData: null,
            selectedNode: null
        }

        this.parseNarrative = this.parseNarrative.bind(this);
        this.getNarrativeList = this.getNarrativeList.bind(this);
        this.getQuery = this.getQuery.bind(this);
        this.parseNarrative = this.parseNarrative.bind(this);
        this.updateData = this.updateData.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.getNodeInfo = this.getNodeInfo.bind(this);
    }

    componentDidMount() {
        this.graphCanvas = GraphCanvas.getInstance();
        this.updateData();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.parseNarrative() !== this.state.selectedNarrative) {
            this.updateData();
        }

    }

    updateData() {
        const narrative = this.parseNarrative();
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

    parseNarrative() {
        let urlNarrative;

        if(this.props.location && this.props.location.pathname) {
            urlNarrative = parseInt(this.props.location.pathname.substring(1), 10);
        }

        return urlNarrative;
    }

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

    handleClick() {
        console.log("NODEGRAPH CONTAINER HANDLECLICK");
        console.log(this.state.selectedNode);
        console.log(this.graphCanvas.selectNode());
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
        console.log("NODEGRAPH CONTAINER render");
        return (
            <div id="nodegraphContainer">
                <SelectNarrative {...this.props} {... this.state}/>
                <Nodegraph {...this.props} {... this.state} handleClick={this.handleClick}/>
                {this.state.selectedNode ? <NodeInfoWindow node={this.state.selectedNode}/> : ''}
            </div>
        )
    }
};

//finally any definition can be used like that:
export default NodegraphContainer(Nodegraph);