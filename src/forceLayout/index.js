//force graphing
import * as d3 from 'd3-force-3d';
import graph from 'ngraph.graph';
import forcelayout from 'ngraph.forcelayout';
import forcelayout3d from 'ngraph.forcelayout3d';

export const GraphLayout = (function() {
    let instance;
    //d3 force stuff
    const d3ForceLayout = d3.forceSimulation()
        .force('link', d3.forceLink())
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter())
        .stop();

    //forceEngine can be d3 or ngraph but I've only made it work with ngraph at the mo'
    const forceEngine = 'ngraph';
    const isD3Sim = forceEngine !== 'ngraph';

    const numDimensions = 3;
    const idField = 'id';

    let data = null;
    let layout = null;

    const ngraph = { graph, forcelayout, forcelayout3d };


    function init() {
        return {
            createForceLayout: function(mappedData){
                data = mappedData;
                // Feed data to force-directed layout
                // @TODO: either remove the d3 version or get it working with this later.
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
                    // currently using ngraph for the maths in the force layout
                    // ngraph
                    const graph = ngraph.graph();

                    if(data !== null) {
                        const centralNode = data.nodes[0];
                        data.nodes.forEach(node => { graph.addNode(node[idField]); });
                        data.links.forEach(link => { graph.addLink(link.source, link.target); });

                        layout = ngraph['forcelayout' + (numDimensions === 2 ? '' : '3d')](graph);

                        const nodeToPin = graph.getNode(centralNode[idField]);
                        layout.pinNode(nodeToPin, true);
                        layout.graph = graph; // Attach graph reference to layout
                    }

                }

                return layout;
            },
            isD3Sim: function() {
                return isD3Sim;
            },
            updateLinkPos: function(link) {
                const line = link.__line;
                if (!line) return;

                const pos = isD3Sim
                        ? link
                        : layout.getLinkPosition(layout.graph.getLink(link.source, link.target).id);
                const start = pos[isD3Sim ? 'source' : 'from'];
                const end = pos[isD3Sim ? 'target' : 'to'];
                const linePos = line.geometry.attributes.position;

                linePos.array[0] = start.x;
                linePos.array[1] = start.y || 0;
                linePos.array[2] = start.z || 0;
                linePos.array[3] = end.x;
                linePos.array[4] = end.y || 0;
                linePos.array[5] = end.z || 0;

                linePos.needsUpdate = true;
                line.geometry.computeBoundingSphere();

                return link;

            },
            updateNodePos: function(node) {
                const mesh = node.mesh;
                const sprite = node.img;
                const displayText = node.displayText;

                const pos = isD3Sim ? node : layout.getNodePosition(node[idField]);

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
                    //const centerOffset = -0.5 * ( displayText.geometry.boundingBox.max.x - displayText.geometry.boundingBox.min.x );
                    //displayText.position.x = centerOffset + pos.x;
                    displayText.position.x = pos.x;
                    displayText.position.y = pos.y;
                    displayText.position.z = pos.z;
                }

                return node;
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