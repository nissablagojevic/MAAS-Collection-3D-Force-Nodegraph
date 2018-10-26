import * as THREE from 'three';

const settings = {
  //nodes
  defaultSphereGeometry: new THREE.SphereBufferGeometry(Math.cbrt(1) * 10, 20, 20),
  defaultGlowColour: new THREE.Color(0xff0000),
  defaultGlowMaterial: new THREE.ShaderMaterial({
                          uniforms:
                            {
                              "c":   { type: "f", value: 0.1 },
                              "p":   { type: "f", value: 5 },
                              glowColor: { type: "c", value: new THREE.Color(0xff0000) },
                              //@TODO work out correct view vector for glowing effect
                              viewVector: { type: "v3", value: {x: 0, y: 0, z: 2000} }
                            },
                          vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
                          fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
                          side: THREE.BackSide,
                          blending: THREE.AdditiveBlending,
                          transparent: true
                        }),
  //links
  defaultLineMaterial: new THREE.LineBasicMaterial({
                        color: '#ffffff',
                        //lineWidth: 10,
                        transparent: true,
                        opacity: 0.5
                      }),
  defaultLineGeometry: new THREE.BufferGeometry().addAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3)),
  //text
  defaultMaterialFace: new THREE.MeshBasicMaterial({color: 0xffffff}),
  defaultMaterialEdge: new THREE.MeshBasicMaterial({ color: 0x000000}),
  //environment
  defaultWorldMaterial: new THREE.ShaderMaterial( {
                          fragmentShader: THREE.ShaderLib[ "cube" ].fragmentShader,
                          vertexShader: THREE.ShaderLib[ "cube" ].vertexShader,
                          uniforms: THREE.ShaderLib[ "cube" ].uniforms,
                          depthWrite: false,
                          side: THREE.BackSide,
                        } ),
  defaultWorldGeometry: new THREE.BoxBufferGeometry( 25000, 25000, 25000 ),
  defaultViewFog: new THREE.Fog(0xfff189, 1, 10000),
  defaultAmbientLight: new THREE.AmbientLight(0xbbbbbb),
  defaultDirectionalLight: new THREE.DirectionalLight(0xffffff, 0.6),
};

export default settings;