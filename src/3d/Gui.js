import dat from 'dat.gui';
import * as THREE from 'three';

const Gui = (function() {
    return {
        addGui: (mainScene, lineGroup, nodeSphereGroup) => {
            const gui = new dat.GUI();
            const param = {};

            if(mainScene && mainScene.fog) {
                param.sceneFogColor = mainScene.fog.color.getHex();
                param.sceneFogNear = mainScene.fog.near;
                param.sceneFogFar = mainScene.fog.far;
                param.sceneFogVisible = mainScene.fog;
            }

            if(lineGroup && lineGroup.children.length) {
                param.lineMaterial = lineGroup.children[0].material;
                param.lineColor = param.lineMaterial.color.getHex();
                param.lineOpacity = param.lineMaterial.opacity;
            }

            if(nodeSphereGroup && nodeSphereGroup.children.length) {
                param.nodeSphereMaterial = nodeSphereGroup.children[0].material;
                param.nodeOpacity = param.nodeSphereMaterial.opacity;
            }

            var sceneFolder = gui.addFolder('Scene');

            if (param.sceneFogColor) {
                sceneFolder.addColor(param, 'sceneFogColor').onChange(function(val){
                    mainScene.fog.color = new THREE.Color(val);
                });
            }

            if (param.sceneFogNear) {
                sceneFolder.add(param, 'sceneFogNear', 0, 10000, 1).onChange(function(val){
                    mainScene.fog.near = val;
                });
            }

            if (param.sceneFogFar) {
                sceneFolder.add(param, 'sceneFogFar', 0, 10000, 1).onChange(function(val){
                    mainScene.fog.far = val;
                });
            }

            var linkFolder = gui.addFolder('Links');

            if (param.lineMaterial && param.lineColor) {
                linkFolder.addColor(param, 'lineColor').onChange(function(val){
                    for (let i = 0; i < lineGroup.children.length; i++) {
                        lineGroup.children[i].material.color.setHex(val);
                    }
                    //console.log(lines.getObjectByProperty('type', 'LineBasicMaterial'));
                });
            }

            if (param.lineOpacity) {
                linkFolder.add( param, 'lineOpacity', 0, 1, 0.1 ).onChange( function ( val ) {
                    for (let i = 0; i < lineGroup.children.length; i++) {
                        lineGroup.children[i].material.opacity = val;
                    }
                } );
            }

            var nodeFolder = gui.addFolder('Nodes');

            if (param.nodeOpacity) {
                nodeFolder.add( param, 'nodeOpacity', 0, 1, 0.1 ).onChange( function ( val ) {
                    for (let i = 0; i < nodeSphereGroup.children.length; i++) {
                        nodeSphereGroup.children[i].material.opacity = val;
                    }
                } );
            }
        }
    }
})();

export default Gui;
