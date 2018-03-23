import * as THREE from 'three';
import fontJson from '../assets/lineto-circular.json';

//import {MeshLine} from 'three.meshline';

//3d stuff
export const CAMERA_DISTANCE2NODES_FACTOR = 150;
export const MAX_FRAMES = 1000;
export const FONT_URL = 'http://localhost:3000/lineto-circular.json';


const lineMaterials = new THREE.LineBasicMaterial({
  color: '#ffffff',
  lineWidth: 10,
  transparent: true,
  opacity: 0.5
});


export function resizeCanvas(renderer, camera, width = 1000, height = 300) {
    if (width && height) {
        renderer.setSize(width, height);
        camera.aspect = width/height;
        camera.updateProjectionMatrix();
    }
}

//canvas utilities
export function getOffset(el) {
    const rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
}

function addSprite(node, image, graphGroup, addData = false) {
  //if we have an image for the node, put it in there with its sphere
  const texture = new THREE.CanvasTexture( image );

  const spriteMaterial = new THREE.SpriteMaterial( { map: texture, color: 0xffffff, depthTest: false } );
  const sprite = new THREE.Sprite( spriteMaterial );
  sprite.scale.set(spriteMaterial.map.image.width/15, spriteMaterial.map.image.height/15, 1);
  if (addData) {
    sprite.__data = node;
  }
  graphGroup.add(node.img = sprite);
}

function addSphere(node, image, graphGroup, addData = false) {
  const nodeGeometries = {};
  //const nodeMaterials = {};
  const nodeRelSize = 20;
  const nodeResolution = 10;

  //this val would affect the radius of the sphere, but we don't have info mapped to that.
  const val = 1;
  if (!nodeGeometries.hasOwnProperty(val)) {
    nodeGeometries[val] = new THREE.SphereGeometry(Math.cbrt(val) * nodeRelSize, nodeResolution, nodeResolution);
  }
  const material = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.1, depthTest: false } );
  const sphere = new THREE.Mesh(nodeGeometries[val], material);
  sphere.name = node.name; // Add label
  if (addData) {
    sphere.__data = node; // Attach node data
  }
  graphGroup.add(node.mesh = sphere);
}

function addText(node, graphGroup) {
  const textMaterials = [
    new THREE.MeshBasicMaterial({color: 0xffffff, overdraw: 0.5 }),
    new THREE.MeshBasicMaterial( { color: 0x000000, overdraw: 0.5 } )
  ];

  const fontLoader = new THREE.FontLoader();

  //yeah, need to properly load this.
  fontLoader.load( FONT_URL,
    function ( font ) {
      const geometry = new THREE.TextGeometry( node.name, {
        font: font,
        size: 5,
        height: 5,
        curveSegments: 2
      });

      geometry.computeBoundingBox();
      const textMesh = new THREE.Mesh( geometry, textMaterials );
      textMesh.__data = node;
      graphGroup.add(node.displayText = textMesh);
    },
    function (xhr) {
      console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    },
    function(err) {
      console.log( 'An error happened' );
      console.log(err);
    });
}

function addLine(link, graphGroup) {
  //for 1px lines
  //each vertex stores 3 position values (x,y,z) and there are 2 of those, so 2 * 3 Typed Array.
  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3));
  const line = new THREE.Line(geometry, lineMaterials);

  line.renderOrder = 10; // Prevent visual glitches of dark lines on top of spheres by rendering them last
  graphGroup.add(link.__line = line);
}

export function add3dStuff(data, graphGroup, layout, isD3Sim) {

    //node and link 3d properties

    const textGroup = new THREE.Group();
    const spriteGroup = new THREE.Group();
    const nodeSphereGroup = new THREE.Group();
    const lineGroup = new THREE.Group();

    textGroup.name = "textGroup";
    spriteGroup.name = "spriteGroup";
    nodeSphereGroup.name = "nodeSphereGroup";
    lineGroup.name = "lineGroup";

    //map the newly created nodes to spheres
    data.nodes.forEach(node => {

        new THREE.ImageLoader()
            .setCrossOrigin( '*' )
            //.load( node.imageUrl + performance.now(), function ( image ) {
            .load( node.imageUrl, function ( image ) {
                addSprite(node, image, spriteGroup, false);
                addSphere(node, image, nodeSphereGroup, true);
            },
              undefined,
              function() {
                //Image loading error nodes.
                addText(node, textGroup);
            });



    });

    //map the newly created links to lines in THREE.js and add them to the scene
    data.links.forEach(link => {
        addLine(link, lineGroup);
    });

    graphGroup.add(lineGroup);
    graphGroup.add(nodeSphereGroup);
    graphGroup.add(textGroup);
    graphGroup.add(spriteGroup);

}

export function update3dStuff(mappedData, layout, isD3Sim, nodeIdField) {

    // Update nodes position
    mappedData.nodes.forEach(node => {
        const mesh = node.mesh;
        const sprite = node.img;
        const displayText = node.displayText;

        //if (!mesh && !sprite) return;

        const pos = isD3Sim ? node : layout.getNodePosition(node[nodeIdField]);

        if(mesh) {
          mesh.position.x = pos.x;
          mesh.position.y = pos.y || 0;
          mesh.position.z = pos.z || 0;
        }

        if(sprite) {
          sprite.position.x = pos.x;
          sprite.position.y = pos.y;
          sprite.position.z = pos.z;
        }

        if(displayText) {
          const centerOffset = -0.5 * ( displayText.geometry.boundingBox.max.x - displayText.geometry.boundingBox.min.x );
          displayText.position.x = centerOffset + pos.x;
          displayText.position.y = pos.y;
          displayText.position.z = pos.z;
        }

    });

    // Update links position
    mappedData.links.forEach(link => {
        const line = link.__line;
        if (!line) return;

        const pos = isD3Sim
                ? link
                : layout.getLinkPosition(layout.graph.getLink(link.source, link.target).id),
            start = pos[isD3Sim ? 'source' : 'from'],
            end = pos[isD3Sim ? 'target' : 'to'],
            linePos = line.geometry.attributes.position;

        linePos.array[0] = start.x;
        linePos.array[1] = start.y || 0;
        linePos.array[2] = start.z || 0;
        linePos.array[3] = end.x;
        linePos.array[4] = end.y || 0;
        linePos.array[5] = end.z || 0;

        linePos.needsUpdate = true;
        line.geometry.computeBoundingSphere();


    });

}
