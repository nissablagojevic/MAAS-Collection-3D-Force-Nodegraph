import { default as React, Component } from 'react';
import qwest from 'qwest';
import {sourceUrl, sourceQuery, mapData, narrativesList} from './resolvers.js';

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
            responseData: null,
            selectedNode: null,
            narrative: 2087,
        };

        this.graphCanvas = GraphCanvas.getInstance();
        this.handleClick = this.handleClick.bind(this);
        this.renderInfo = this.renderInfo.bind(this);
        this.renderNarrativeSelect = this.renderNarrativeSelect.bind(this);
        this.selectNarrative = this.selectNarrative.bind(this);

    }

    componentDidMount() {
        //set the width and height to whatever our #nodegraph mounter has calculated from its CSS
        this.setState({width: this.mount.clientWidth, height: this.mount.clientHeight});
        this.graphCanvas.resizeCanvas(this.state.width, this.state.height);

        //then mount it to the DOM, doesn't matter if we resize first because we call resize again after react
        //has updated the component with the proper width and height, and there's fallback values
        this.mount.appendChild(this.graphCanvas.getRenderer().domElement);

        let urlNarrative;

        if(this.props.match.params.id) {
            urlNarrative = parseInt(this.props.match.params.id, 10);
        } else {
            urlNarrative = this.state.narrative;
        }

        //fetch narrative data from API after initialisation
        qwest.get(sourceUrl + sourceQuery(urlNarrative)).then((xhr, response) => {
            console.log('qwest get');
            this.setState({responseData: response.data, narrative: urlNarrative});

        }).catch(function(e, xhr, response) {
            // Process the error in getting the json file
            console.log('DATA RETRIEVAL ERROR');
            console.log(e);
        });

        //fetch list of narratives from API
        qwest.get(sourceUrl + narrativesList).then((xhr, response) => {
            this.setState({narrativesList: response.data.narratives});
        }).catch(function(e, xhr, response) {
            // Process the error in getting the json file
            console.log('DATA RETRIEVAL ERROR');
            console.log(e);
        });
    }

    componentDidUpdate(prevProps, prevState) {
        console.log("COMPONENT DID UPDATE");



        //once we add react state to allow parameters to change, we'll need to check if we need to request new data
        //or just redraw the D3 graph with the existing data. Until then this check will remain broken but default to
        //not fetching data again.
        if (prevProps !== this.props) {
            this.graphCanvas.remove3dStuff();
            qwest.get(sourceUrl + sourceQuery(this.state.narrative)).then((xhr, response) => {
                console.log('qwest reget');
                this.setState({responseData: response.data});
            }).catch(function (e, xhr, response) {
                // Process the error in getting the json file
                console.log('DATA RETRIEVAL ERROR');
                console.log(e);
            });
        }


        if(this.state.responseData && this.state.responseData.narratives[0]._id === this.state.narrative) {
            console.log('have response data');
            console.log(this.state.responseData);
            //super shallow check for object sameness
            if(JSON.stringify(this.state.responseData) !== JSON.stringify(prevState.responseData) ) {
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

    handleClick(e) {
        this.setState({selectedNode: this.graphCanvas.selectNode()});
    }

    renderInfo() {
        let info = '';
        if(this.state.selectedNode) {
            console.log(this.state.selectedNode);

            const {id, name, type, mainImage, description, date} = this.state.selectedNode;

            info = <div>
                <dt>Name: </dt>
                <dd>{name}</dd>
                <dt>Date: </dt>
                <dd>{date}</dd>
                <dt>Description: </dt>
                <dd>{description}</dd>
                {type !== 'narrative' && <span><dt>Thumbnail: </dt><dd><img src={mainImage}/></dd></span>}
            </div>;
        }

        return (<div className="info">{info}</div>);
    }

    renderNarrativeSelect() {
        const narratives = this.state.narrativesList;

        if(narratives) {
            const options = [];

            narratives.forEach((narrative) => {
                options.push(<option key={narrative._id} value={narrative._id}>{narrative.title}</option>);
            });

            return(
                <select value={this.state.narrative} onChange={this.selectNarrative}>
                {options}
                </select>
            );
        }
    }

    selectNarrative(event) {
        let narrative = parseInt(event.target.value, 10);
        console.log(this.props);

        const location = {
            pathname: `/${narrative}`,
        };

        this.setState({narrative: narrative});
        this.props.history.push(location);
    }

    render() {
        return (
            <div
                id="nodegraph"
                ref={mount => this.mount = mount} style={{width: this.state.width, height: this.state.height}}
                onClick={() => this.handleClick()}>
                <div className="instructions">
                    <div className="narrativeSelect">
                        Selected Narrative:
                        {this.renderNarrativeSelect()}
                    </div>
                    Camera controls:
                    Tap &amp; Drag to orbit. Pinch to zoom.
                    Tap on a sphere to select that object.
                </div>
            {this.renderInfo(this.state.selectedNode)}
            </div>
        );
    }
}

export default NodeGraph;

