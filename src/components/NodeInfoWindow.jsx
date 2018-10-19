import { default as React, Component } from 'react';

import './NodeInfoWindow.css';

class NodeInfoWindow extends Component {
    constructor() {
        super();

        this.renderList = this.renderList.bind(this);
        this.keyValueToList = this.keyValueToList.bind(this);
    }


    keyValueToList(property) {
        if (property && typeof property === 'object') {
            return Object.entries(property).map(([key,value])=>{
                if (typeof value === 'object') {
                    //@TODO extend this to deal with arrays better
                    return (<li key={key} id={key}><span className="key">{key}</span> : <ul className="child">{this.keyValueToList(value)}</ul></li>);
                } else {
                    //don't display empty fields
                    if (value) {
                        return (
                            <li key={key} id={key}>
                                <span className="key">{key}</span>
                                : {value.toString()}</li>
                        );
                    }
                }
            });
        }
    }

    renderList(node) {
        const nodeProperties = Object.getOwnPropertyNames(node);

        if (nodeProperties && nodeProperties.length > 0 && node[nodeProperties[0]] && node[nodeProperties[0]].length > 0) {
            const property = node[nodeProperties[0]].pop();

            //@TODO abstract this and map attributes back to the graphql schema
            //you're totally going to write that at some point. Right?
            if (property) {
                return(<ul className="info">{this.keyValueToList(property)}</ul>);
            }
        }
    }

    render() {
        return (
            <div id="nodeInfo">
            {this.props.node ? <h3>Selected Node</h3> : ''}
            {this.renderList(this.props.node)}
            </div>
        );
    }
}

export default NodeInfoWindow;