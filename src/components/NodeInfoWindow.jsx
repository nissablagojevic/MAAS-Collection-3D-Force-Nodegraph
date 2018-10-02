import { default as React, Component } from 'react';

import qwest from 'qwest';
import {sourceUrl, nodeQuery} from './resolvers.js';

class NodeInfoWindow extends Component {
    constructor() {
        super();
        this.state = {
            info: null,
            currentNode: null
        }
    }

    componentDidUpdate() {
        if(this.props.node !== null && this.props.node !== this.state.currentNode) {
            //[0] gives query type
            //[1] gives ID for type]
            let selectedNode = this.props.node.split('-');

            //Another thing a GraphQL Schema would solve. Only can put objects in the infowindow right now.
            if (selectedNode[0] === 'object') {
                qwest.get(sourceUrl + nodeQuery(selectedNode[0],selectedNode[1])).then((xhr, response) => {
                    console.log('qwest get sourceUrl + nodeQuery(selectedNode[0],selectedNode[1]))');
                    let property = Object.getOwnPropertyNames(response.data);

                    //graphQL query returns things that look like this: {objects: [{key: value, ...}]}
                    //so figure out what the key it has returned is, and pop off the array
                    const thing = response.data[property[0]].pop();

                    //@TODO get more properly recursive with this and map attributes back to the graphql schema
                    //you're totally going to write that at some point. Right?
                    const info = Object.entries(thing).map(([key,value])=>{
                        if (typeof value !== 'object') {
                            return (
                                <li key={key}>{key} : {value.toString()}</li>
                            );
                        } else {
                            let otherThing = Object.entries(value).map(([key2,value2])=>{
                                return (
                                    <li key={key2}>{key2} : {value2.toString()}</li>
                                );
                            });

                            return (<li key={key}>{key} : <ul>{otherThing}</ul></li>);
                        }
                    });

                    this.setState({info: info, currentNode: this.props.node});

                }).catch(function(e, xhr, response) {
                    // Process the error in getting the json file
                    console.log('DATA RETRIEVAL ERROR');
                    console.log(e);
                });
            }
        }
    }

    render() {
        return (
            <ul className="info">
            {this.state.info ? <h3>Selected Node</h3> : ''}
            {this.state.info}
            </ul>
        );
    }
}

export default NodeInfoWindow;