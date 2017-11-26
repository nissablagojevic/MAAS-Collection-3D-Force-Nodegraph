import { default as React, Component } from 'react';
import Papa from 'papaparse';
import qwest from 'qwest';
import { fetchQuery } from '../actions';
import ForceGraph3D from '3d-force-graph/dist/3d-force-graph.min.js';

const tunnel = function(Graph) {

    const perimeter = 12, length = 30;

    const getId = (col, row) => `${col},${row}`;

    let nodes = [], links = [];
    for (let colIdx=0; colIdx<perimeter; colIdx++) {
        for (let rowIdx=0; rowIdx<length; rowIdx++) {
            const id = getId(colIdx, rowIdx);
            nodes.push({id});

            // Link vertically
            if (rowIdx>0) {
                links.push({ source: getId(colIdx, rowIdx-1), target: id });
            }

            // Link horizontally
            links.push({ source: getId((colIdx || perimeter) - 1, rowIdx), target: id });
        }
    }

    Graph.cooldownTicks(300)
        .forceEngine('ngraph')
        .graphData({ nodes: nodes, links: links });
};


class NodeGraph extends Component {
    constructor() {
        super();
        this.state = {}
    }

    componentDidMount() {
        const gData = this.getGraphDataSets();
        console.log('gData');
        console.log(gData);
    }

    renderGraph() {
        var nodeGraph = ForceGraph3D();

    }

    getGraphDataSets() {
        console.log("GET GRAPH DATA SETS");
        var nodeGraph = ForceGraph3D();

        var nodeLinkData = function(nodeGraph) {
            var graphJson = {
                nodes: [],
                links: []
            };

            graphJson.nodes[0] = {
                id: 'id0',
                name: 'basenode',
                val : '1'
            };

            //get data from collection
            //https://api.maas.museum/graphql?query=%7B%0A%20%20narratives(filter%3A%7B_id%3A%2069%7D)%20%7B%0A%20%20%20%20_id%0A%20%20%20%20title%0A%20%20%20%20objects(limit%3A%20100)%20%7B%0A%20%20%20%20%20%20_id%0A%20%20%20%20%20%20title%0A%20%20%20%20%20%20displayTitle%0A%20%20%20%20%20%20description%0A%20%20%20%20%20%20category%0A%20%20%20%20%20%20production%20%7B%0A%20%20%20%20%20%20%20%20date%0A%20%20%20%20%20%20%20%20dateLatest%0A%20%20%20%20%20%20%20%20dateEarliest%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20images(limit%3A1)%20%7B%0A%20%20%20%20%20%20%20%20url(width%3A%20200%2C%20height%3A%20200)%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D
            var tempUrl = `https://api.maas.museum/graphql?query=%7B%0A%20%20narratives(filter%3A%7B_id%3A%2069%7D)%20%7B%0A%20%20%20%20_id%0A%20%20%20%20title%0A%20%20%20%20objects(limit%3A%20100)%20%7B%0A%20%20%20%20%20%20_id%0A%20%20%20%20%20%20title%0A%20%20%20%20%20%20displayTitle%0A%20%20%20%20%20%20description%0A%20%20%20%20%20%20category%0A%20%20%20%20%20%20production%20%7B%0A%20%20%20%20%20%20%20%20date%0A%20%20%20%20%20%20%20%20dateLatest%0A%20%20%20%20%20%20%20%20dateEarliest%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20images(limit%3A1)%20%7B%0A%20%20%20%20%20%20%20%20url(width%3A%20200%2C%20height%3A%20200)%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D`;

            qwest.get(tempUrl).then((xhr, response) => {
                //for each narrative in our query
                response.data.narratives.forEach(narrative => {
                    //generate a node with an id, name and value
                    var node = {};
                    var link = {};
                    node.id = 'id'+`${narrative._id}`;
                    node.name = `${narrative._id?narrative._id+': ':''}${narrative.title}`;
                    node.val = `${narrative._id}`;

                    //generate a link between the node and the base node, because lazy right now
                    link.source = 'id0';
                    link.target = 'id'+`${narrative._id}`;
                    //make that narrative a  node on our map
                    graphJson.nodes.push(node);
                    graphJson.links.push(link);
                });

                 nodeGraph(document.getElementById('nodegraph'))
                     .cooldownTicks(300)
                     .idField('id')
                     .valField('val')
                     .nameField('name')
                     .autoColorBy('val')
                     .forceEngine('ngraph')
                     .graphData(graphJson);

            }).catch(function(e, xhr, response) {
                // Process the error in getting the json file
                console.log('ERROR IN GETTING JSON');
                console.log(e);
            });

        };

        return nodeLinkData(nodeGraph);


        /**
        var loadD3Dependencies = qwest.get('.d3.csv').then((_, csvData) => {
            const nodes = [], links = [];
            const { data: [, ...data] } = Papa.parse(csvData); // Parse csv

            data.pop(); // Remove last empty row

            data.forEach(([size, path]) => {
                const levels = path.split('/'),
                    module = levels.length > 1 ? levels[1] : null,
                    leaf = levels.pop(),
                    parent = levels.join('/');

                nodes.push({
                    path,
                    leaf,
                    module,
                    size: +size || 1
                });

                if (parent) {
                    links.push({ source: parent, target: path});
                }
            });

        ForceGraph3D.cooldownTicks(300)
                .nodeRelSize(0.5)
                .idField('path')
                .valField('size')
                .nameField('path')
                .autoColorBy('module')
                .forceEngine('ngraph')
                .graphData({ nodes: nodes, links: links });
            });

        //tunnel.description = "fabric data for a cylindrical tunnel shape";**/
        //return [loadBlocks, loadD3Dependencies, tunnel];
        //return [loadBlocks];

    }

    render() {
        return (
            <div id="nodegraph"></div>
        );
    }
}

export default NodeGraph;

