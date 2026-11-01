export function TopologicalSort(nodes, edges) {
    const adjacency = new Map();
    const inDegree = new Map();

    nodes.forEach(node => {
        adjacency.set(node.id, []);
        inDegree.set(node.id, 0);
    });

    edges.forEach(({ fromNodeId, toNodeId }) => {
        if (adjacency.has(fromNodeId)) {
            adjacency.get(fromNodeId).push(toNodeId);
        }

        // The destination receives the incoming edge.
        if (inDegree.has(toNodeId)) {
            inDegree.set(toNodeId, inDegree.get(toNodeId) + 1);
        }
    });

    const queue = [];
    inDegree.forEach((degree, id) => {
        if (degree === 0) queue.push(id);
    });

    const sortedIds = [];
    while (queue.length > 0) {
        const id = queue.shift();
        sortedIds.push(id);

        adjacency.get(id).forEach(neighbourId => {
            inDegree.set(neighbourId, inDegree.get(neighbourId) - 1);

            if (inDegree.get(neighbourId) === 0) {
                queue.push(neighbourId);
            }
        });
    }

    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    return sortedIds.map(id => nodeMap.get(id)).filter(Boolean);
}