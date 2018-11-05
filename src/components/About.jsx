import { default as React } from 'react';

import { AccordionSection } from './';

export default function About(props) {
  let content = <div>
    <p>Each sphere corresponds to an object in the collection, and the lines connect it to the "terms" it has been ascribed. Subsequently we can see how different objects relate to eachother in the context of the collection instead of as an isolated item.</p>
    <p>Created by Nissa Blagojevic on top of the excellent Collection API by Rowan Stenhouse and Lachlan Gordon, on top of the EMu collection database lovingly crafted by the Registration team.</p>
    <p>This tool uses <a href="https://threejs.org/">Three.js</a>, <a href="https://reactjs.org/">React</a>, <a href="https://github.com/vasturiano/3d-force-graph">3d-force-graph</a>, and interfaces with <a href="https://alm.axiell.com/collections-management-solutions/technology/emu-collections-management/">EMu</a> via our <a href="https://api.maas.museum/graphql">public GraphQL endpoint</a></p>
  </div>;

    return (
      <AccordionSection
        key="about"
        title="About"
        content={content}
        isOpen={props.open}/>
    );
}
