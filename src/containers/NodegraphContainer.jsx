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

const mql = window.matchMedia(`(min-width: 800px)`);

let NodegraphContainer = Nodegraph => class extends Component {
    constructor() {
        super();
        this.state = {
            selectedNarrative: null,
            responseData: null,
            selectedNode: null,
            drawerOpen: mql.matches
        };

        this.getQuery = this.getQuery.bind(this);
        this.updateData = this.updateData.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.getNodeInfo = this.getNodeInfo.bind(this);
        this.openDrawer = this.openDrawer.bind(this);
        this.mediaQueryChanged = this.mediaQueryChanged.bind(this);

    }

    componentWillMount() {
      mql.addListener(this.mediaQueryChanged);
    }

    componentWillUnmount() {
      mql.removeListener(this.mediaQueryChanged);
    }

    mediaQueryChanged() {
      this.setState({ drawerOpen: !mql.matches });
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

    openDrawer() {
      this.setState({drawerOpen: !this.state.drawerOpen});
    }

    render() {
        return (
            <div id="nodegraphContainer">
                <Nodegraph {...this.props} {... this.state} handleClick={this.handleClick}/>
                <div id="infoWindows" className={this.state.drawerOpen ? '' : 'minimise'}>
                  <h1><a href="/">Intercollectic Planetary</a></h1>
                  <button id="drawerToggle" onClick={this.openDrawer}>{this.state.drawerOpen ? 'Close' : 'Open'} Menu</button>
                  <div id="drawer" className={this.state.drawerOpen ? 'drawer' : 'drawer hidden'}>
                    <SelectNarrative {...this.props} {... this.state} display="accordion" open={true}/>
                    <Instructions open={true}/>
                    <About open={false}/>
                    {this.state.selectedNode ? <NodeInfoWindow node={this.state.selectedNode}/> : ''}
                  </div>
                </div>
            </div>
        )
    }
}

export default NodegraphContainer(Nodegraph);