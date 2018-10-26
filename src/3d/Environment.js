import * as THREE from 'three';

import { CubeTextureLoader, cubeTexture } from './loaders.js';

import settings from './settings';

const Environment = (function() {
    return {
        addEnvironment: (scene, ambientLight = null, directLight = null, skyBoxTexture = null, viewFog = null) => {
            if(!ambientLight) {
                ambientLight = settings.defaultAmbientLight;
            }

            if(!directLight) {
                directLight = settings.defaultDirectionalLight;
            }

            let textureCube;
            if(!skyBoxTexture) {
                textureCube = cubeTexture;
            } else {
                //texture must be width = height and ideally width = 2^n
                textureCube = CubeTextureLoader.load( skyBoxTexture, (tex) => {
                    textureCube.format = THREE.RGBFormat;
                    textureCube.mapping = THREE.CubeReflectionMapping;
                } );
            }

            if(!viewFog) {
                viewFog = settings.defaultViewFog;
            }

            scene.fog = viewFog;

            var cubeMaterial = settings.defaultWorldMaterial;
            cubeMaterial.uniforms[ "tCube" ].value = textureCube;
            // Skybox
            const cubeMesh = new THREE.Mesh( settings.defaultWorldGeometry, cubeMaterial );
            cubeMesh.name = "skybox";
            scene.add( cubeMesh );
            scene.add( ambientLight );
            scene.add( directLight );
        }
    }
})();

export default Environment;