import { default as React } from 'react';

import { AccordionSection } from './';

export default function About(props) {
  let content = <div>
    <p>This is a very very rough proof of concept at the moment, but it can visualise any narrative in EMu that is web accessible. The current narrative is Antiquities.</p>
    <p>Each sphere corresponds to an object in the collection, and the lines connect it to the "terms" it has been ascribed. Subsequently we can see how different objects relate to eachother in the context of the collection instead of as an isolated item.</p>
    <p>This is the starting point, I hope to have it encompass the entire collection one day.</p>
    <p>Created by Nissa Blagojevic on top of the excellent Collection API by Rowan Stenhouse and Lachlan Gordon, on top of the EMu data lovingly crafted by Registration.</p>
    <p>If you have any questions, feel free to drop by my desk in Digital Studio or email me at nissa.blagojevic@maas.museum</p>
  </div>;

    return (
      <AccordionSection
        key="about"
        title="About"
        content={content}
        isOpen={props.open}/>
    );
}
