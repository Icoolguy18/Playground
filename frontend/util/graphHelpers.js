export function TopologicalSort(nodes, edges){
    const adjList = new Map();
    const inDegree = new Map();

    nodes.forEach((node)=>{
        adjList.set(node.id, []);
        inDegree.set(node.id, 0);
    });

    edges.forEach((edge)=>{
        if (adjList.has(edge.fromNodeId)){
            adjList.get(edge.fromNodeId).push(edge.toNodeId);
        }
        if (inDegree.has(edge.fromNodeId)){
            inDegree.set(edge.fromNodeId, inDegree.get(edge.fromNodeId) + 1);
        }
    });

    const queue = [];
    inDegree.forEach((degree, nodeId)=>{
        if (degree === 0) {
            queue.push(nodeId);
        }
    });

    const sortedNodeIds = [];
    while (queue.length > 0) {
        const currId = queue.shift();
        sortedNodeIds.push(currId);

        const neighbours = adjList.get(currId);
        neighbours.forEach( neighbourId => {
            inDegree.set(neighbourId, inDegree.get(neighbourId) - 1);
            if (inDegree.get(neighbourId) === 0){
                queue.push(neighbourId);
            }
        });
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    return sortedNodeIds.map(id => nodeMap.get(id)).filter(Boolean);
}