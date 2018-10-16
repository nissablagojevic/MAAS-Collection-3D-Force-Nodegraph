import { default as React, Component } from 'react';

import { Nodegraph, SelectNarrative  } from '../components';

import {sourceUrl, sourceQuery, narrativesList, mapData} from '../components/resolvers.js';

//or even further omitting extra ()
let NodegraphContainer = Nodegraph => class extends Component {
    constructor() {
        super();
        this.state = {
            selectedNarrative: null,
            narrativesList: null,
            responseData: null,
        }

        this.parseNarrative = this.parseNarrative.bind(this);
        this.getNarrativeList = this.getNarrativeList.bind(this);
        this.getQuery = this.getQuery.bind(this);
        this.parseNarrative = this.parseNarrative.bind(this);
        this.updateData = this.updateData.bind(this);
    }

    componentDidMount() {
        this.updateData();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.parseNarrative() !== this.state.selectedNarrative) {
            this.updateData();
        }

    }

    updateData() {
        const narrative = this.parseNarrative();
        const queryData =  this.getQuery(narrative);
        let narrativesList = this.state.narrativesList;

        if (!narrativesList || narrativesList.then) {
            narrativesList = this.getNarrativeList();
        }

        this.setState({selectedNarrative: narrative, narrativesList: narrativesList, responseData: queryData});
    }

    parseNarrative() {
        let urlNarrative;
        let narrative;

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

    render() {
        return (
            <div className="debug">
                <SelectNarrative {...this.props} {... this.state}/>
                <Nodegraph {...this.props} {... this.state}/>
            </div>
        )
    }
};

//finally any definition can be used like that:
export default NodegraphContainer(Nodegraph);