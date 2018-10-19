import { default as React, Component } from 'react';
import {mapData} from './resolvers.js';

import './Nodegraph.css';

//3d stuff
import {GraphCanvas} from './canvas.js';

class NodeGraph extends Component {
    constructor() {
        super();
        this.state = {
            width: '100%',
            height: '100vh'
        };
    }

    componentDidMount() {
        this.graphCanvas = GraphCanvas.getInstance();
        //set the width and height to whatever our #nodegraph mounter has calculated from its CSS
        this.setState({width: this.mount.clientWidth, height: this.mount.clientHeight}, this.graphCanvas.resizeCanvas(this.mount.width, this.mount.height));

        //then mount it to the DOM, doesn't matter if we resize first because we call resize again after react
        //has updated the component with the proper width and height, and there's fallback values
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
    }

    render() {
        return (
            <div
                id="nodegraph"
                ref={mount => this.mount = mount} style={{width: this.state.width, height: this.state.height}}
                onClick={(e) => this.props.handleClick(e)}>
            </div>
        );
    }
}

export default NodeGraph;

