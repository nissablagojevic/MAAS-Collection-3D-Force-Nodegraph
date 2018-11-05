import {default as React} from 'react';
import { AccordionSection } from './';

export default function Instructions(props) {
  let content = <div>
    <p>Select a narrative using the selector above</p>
    <p>Camera controls -
      Tap/Click &amp; Drag to orbit. Pinch/Scroll to zoom.
      Tap/Click on a sphere to view information about that object.</p>
  </div>;

  return (
    <AccordionSection
      key="instructions"
      title="Instructions"
      content={content}
      isOpen={props.open}
    />
  );
}
