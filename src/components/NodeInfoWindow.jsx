import { default as React } from 'react';

import { InfoList, AccordionSection } from './';

import './NodeInfoWindow.css';

export default function NodeInfoWindow(props) {
    const node = props.node;
    const nodeProperties = Object.getOwnPropertyNames(node);

    if (nodeProperties && nodeProperties.length > 0 && node[nodeProperties[0]] && node[nodeProperties[0]].length > 0) {
        const property = node[nodeProperties[0]].pop();

        if (property) {

          let content = <ul className="nodePropertyList">
                          <InfoList key={'InfoList-' + property} list={property}/>
                        </ul>;

            return (
              <AccordionSection key="nodeInfo" title="Selected Node" content={content}/>
            );
        }
    }

    return null;
}