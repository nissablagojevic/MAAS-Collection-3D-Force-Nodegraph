import { default as React } from 'react';

import { InfoList } from './';

import './NodeInfoWindow.css';

export default function NodeInfoWindow(props) {
    const node = props.node;
    const nodeProperties = Object.getOwnPropertyNames(node);

    if (nodeProperties && nodeProperties.length > 0 && node[nodeProperties[0]] && node[nodeProperties[0]].length > 0) {
        const property = node[nodeProperties[0]].pop();

        if (property) {
            return (
                <div id="nodeInfo" className="info">
                    <h3>Selected Node</h3>
                    <ul className="nodePropertyList">
                        <InfoList key={'InfoList-' + property} list={property}/>
                    </ul>
                </div>
            );
        }
    }

    return null;
}