import { default as React } from 'react';

import { SelectNarrative } from './';

export default function Intro(props) {
  return (
    <section>
      <h2>Intercollectic Planetary</h2>
      <h3>3D interactive visualisation the Museum of Applied Arts and Sciences Collection</h3>
      <div style={{maxWidth: 600, margin: '0 auto'}}>
        <p>Enter content here</p>
        <SelectNarrative {...props}/>
      </div>
    </section>
  );
}
