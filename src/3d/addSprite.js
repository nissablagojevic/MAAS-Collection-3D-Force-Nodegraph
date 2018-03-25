import * as THREE from 'three';

export default function addSprite(node, image, graphGroup, addData = false) {
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