//force graphing
import * as d3 from 'd3-force-3d';
import graph from 'ngraph.graph';
import forcelayout from 'ngraph.forcelayout';
import forcelayout3d from 'ngraph.forcelayout3d';

import {GraphCanvas} from '../components/canvas.js';


export const GraphLayout = (function() {
    let instance;

    const graphCanvas = GraphCanvas.getInstance();

    //d3 force stuff
    const d3ForceLayout = d3.forceSimulation()
        .force('link', d3.forceLink())
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter())
        .stop();
    const forceEngine = 'ngraph';
    const isD3Sim = forceEngine !== 'ngraph';

    const numDimensions = 3;
    const idField = 'id';
    const warmupTicks = 0;
    const cooldownTicks = Infinity;
    //time in ms
    const cooldownTime = 15000;
    let cntTicks = 0;
    const startTickTime = new Date();
    let data = null;
    let layout = null;

    const ngraph = { graph, forcelayout, forcelayout3d };


    function init() {
        return {
            createForceLayout: function(resolvedData){
                data = resolvedData;
                // Feed data to force-directed layout
                if (isD3Sim && resolvedData !== null) {
                    // D3-force
                    (layout = d3ForceLayout)
                        .stop()
                        .alpha(1)// re-heat the simulation
                        .numDimensions(this.numDimensions)
                        .nodes(resolvedData.nodes)
                        .force('link')
                        .id(d => d[idField])
                        .links(resolvedData.links);
                } else {
                    // ngraph
                    const graph = ngraph.graph();

                    if(resolvedData !== null) {
                        resolvedData.nodes.forEach(node => { graph.addNode(node[idField]); });
                        resolvedData.links.forEach(link => { graph.addLink(link.source, link.target); });
                        layout = ngraph['forcelayout' + (numDimensions === 2 ? '' : '3d')](graph);
                        layout.graph = graph; // Attach graph reference to layout
                    }

                }

                if(layout && layout.graph) {
                    for (let i=0; i<warmupTicks; i++) {
                        layout[isD3Sim?'tick':'step']();
                    } // Initial ticks before starting to render

                    graphCanvas.setFrameId(this.layoutTick);
                }


            },
            layoutTick: function() {
                //console.log('layoutTick');
                if (cntTicks++ > cooldownTicks || (new Date()) - startTickTime > cooldownTime) {
                    graphCanvas.setFrameId(null); // Stop ticking graph
                }

                layout[isD3Sim?'tick':'step'](); // Tick it

                graphCanvas.update3dStuff(data, layout, idField);
            },
        }
    }
    return{
        getInstance: function () {
            if ( !instance ) {
                instance = init();
            }
            return instance;
        }
    }
})();