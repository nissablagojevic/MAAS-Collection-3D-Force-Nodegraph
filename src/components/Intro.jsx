import { default as React } from 'react';

import { SelectNarrative } from './';

import './Intro.css';

export default function Intro(props) {
  return (
    <section>
      <div id="introScreen">
        <img id="demo" src="./demo.jpg" alt="Objects are spheres that are connected by text terms"/>
        <h1>Intercollectic Planetary</h1>
        <h2>3D interactive visualisation the Museum of Applied Arts and Sciences Collection</h2>
        <p>This tool was designed to map the The <a href="https://maas.museum">Museum of Applied Arts and Sciences (MAAS)</a> collection database, to contextualise how individual objects fit in to the Collection's extremely eclectic mix, all of which can be viewed at our <a href="https://collection.maas.museum/">Collection website</a>. MAAS was established in 1879 as a Technological, Industrial and Sanitary Museum but has changed direction multiple times and now claims everything from <a href="https://collection.maas.museum/search?terms[0]=Minerals">mineral samples</a>, to the <a href="https://collection.maas.museum/object/345921">Prawns on Bikes costumes</a> from the Sydney 2000 Olympics.  I created the Intercollectic after I thought that maybe it was possible to find a thematic path from any object in the Collection to another.</p>
        <p>While it doesn't yet do the entire collection, sections of the collection are able to be shown. These are called 'Narratives' and are simply sub-collections organised by a theme by one of the Museum's curators.</p>
        <p>Each node in the network represents an object, and they are linked by the "Terms" used to describe them. Terms are input manually by the registration team, and hence often differ depending on who has recorded the item. All of these orbit a central fixed sun which represents the Narrative.</p>
        <p>This tool allows the Museum to not only view portions of the collection, but also to analyse the consistency of the metadata by which it is categorised.  Not all of the Museum's collection is digitised, and many records are incomplete. Red nodes indicate missing/loading object images.</p>
        <p>Choose a narrative below to view that narrative, my favourite is the <a href="./2087">Antiquities Collection</a></p>
        <SelectNarrative {...props}/>
      </div>
    </section>
  );
}
