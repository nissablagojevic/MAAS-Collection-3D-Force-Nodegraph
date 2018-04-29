//force graphing
import * as d3 from 'd3-force-3d';
import graph from 'ngraph.graph';
import forcelayout from 'ngraph.forcelayout';
import forcelayout3d from 'ngraph.forcelayout3d';

import {GraphCanvas} from '../components/canvas.js';


export const GraphLayout = (function() {
    let instance;
    //d3 force stuff
    const d3ForceLayout = d3.forceSimulation()
        .force('link', d3.forceLink())
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter())
        .stop();

    //forceEngine can be d3 or ngraph
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
            createForceLayout: function(mappedData){
                data = mappedData;
                console.log('createForceLayout');
                console.log(data);
                // Feed data to force-directed layout
                if (isD3Sim && data !== null) {
                    // D3-force
                    (layout = d3ForceLayout)
                        .stop()
                        .alpha(1)// re-heat the simulation
                        .numDimensions(this.numDimensions)
                        .nodes(data.nodes)
                        .force('link')
                        .id(d => d[idField])
                        .links(data.links);
                } else {
                    // ngraph
                    const graph = ngraph.graph();

                    if(data !== null) {
                        data.nodes.forEach(node => { graph.addNode(node[idField]); });
                        data.links.forEach(link => { graph.addLink(link.source, link.target); });
                        layout = ngraph['forcelayout' + (numDimensions === 2 ? '' : '3d')](graph);
                        layout.graph = graph; // Attach graph reference to layout
                    }

                }

                return layout;
            }
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