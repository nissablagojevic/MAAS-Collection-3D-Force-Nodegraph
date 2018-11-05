import { default as React, Component } from 'react';
import {mapData} from './resolvers.js';

import './Nodegraph.css';

//3d stuff
import {GraphCanvas} from './GraphCanvas.js';

class NodeGraph extends Component {
    constructor() {
        super();
        this.state = {
            width: '100%',
            height: '99vh'
        };

        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);

        this.graphCanvas = GraphCanvas.getInstance();
    }

    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);
        this.mount.appendChild(this.graphCanvas.getRenderer().domElement);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps !== this.props) {
            if (!this.props.responseData || this.props.responseData.then) {
                this.graphCanvas.setFetchingJson(true);
                this.graphCanvas.stopLoop();
                this.graphCanvas.remove3dStuff();
            } else {
                if(!this.props.responseData.then && this.props.responseData.narratives[0]._id) {
                    //super shallow check for object sameness
                    if(JSON.stringify(this.props.responseData) !== JSON.stringify(prevProps.responseData) ) {
                        const mappedData = mapData(this.props.responseData);
                        this.graphCanvas.setMappedData(mappedData);
                        this.graphCanvas.resizeCanvas(this.state.width, this.state.height);
                        if(this.graphCanvas.isFetchingJson()) {
                            this.graphCanvas.setFetchingJson(false);
                            this.graphCanvas.startLoop();
                        }
                    }
                }
            }
        }
    }

    componentWillUnmount() {
        this.graphCanvas.stopLoop();
        this.graphCanvas.remove3dStuff();
        window.removeEventListener('resize', this.updateWindowDimensions);
    }


    updateWindowDimensions() {
        this.setState({ width: window.innerWidth, height: window.innerHeight }, this.graphCanvas.resizeCanvas(window.innerWidth, window.innerHeight));
    }

    render() {
        return (
            <div
                id="nodegraph"
                ref={mount => this.mount = mount}
                style={{width: this.state.width, height: this.state.height}}
                onClick={(e) => this.props.handleClick(e)}
            />
        );
    }
}

export default NodeGraph;

