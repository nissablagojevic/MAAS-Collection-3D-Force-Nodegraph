import {default as React} from 'react';
import { AccordionSection } from './';

export default function Instructions(props) {

  let content = <div>
    <p>Select a narrative above</p>
    <p>Camera controls -
      Tap &amp; Drag to orbit. Pinch to zoom.
      Tap on a sphere to select that object.</p>
  </div>;

  return (
    <AccordionSection key="instructions" title="Instructions" content={content}/>
  );
}
