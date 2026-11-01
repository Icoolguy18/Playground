import { TopologicalSort } from './graphHelpers.js';
import { analyzeGraph } from './analyzeGraph.js';

const PYTHON_KEYWORDS = new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '));

/** Validate the supported single-input, single-parent tensor graph before export. */
export function prepareGraph(graph) {
    if (!graph.nodes.length) throw new Error('Add an Input tensor and connect at least one operator before exporting.');
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(graph.modelName) || PYTHON_KEYWORDS.has(graph.modelName)) {
        throw new Error('Use a model name with letters, digits and underscores, starting with a letter or underscore. Python keywords cannot be used.');
    }
    const ids = new Set(graph.nodes.map(node => node.id));
    if (graph.edges.some(edge => !ids.has(edge.fromNodeId) || !ids.has(edge.toNodeId))) throw new Error('The graph has a connection to a missing operator.');
    const sorted = TopologicalSort(graph.nodes, graph.edges);
    if (sorted.length !== graph.nodes.length) throw new Error('Remove the cycle before exporting this graph.');
    const inputs = sorted.filter(node => node.type === 'Input');
    if (inputs.length !== 1) throw new Error('Use exactly one Input tensor for model export.');
    const parents = new Map();
    for (const node of sorted) {
        const incoming = graph.edges.filter(edge => edge.toNodeId === node.id);
        if (node.type === 'Input' && incoming.length) throw new Error('An Input tensor cannot have upstream connections.');
        if (node.type !== 'Input' && incoming.length !== 1) throw new Error(`Connect ${node.type} to exactly one upstream operator before exporting.`);
        if (incoming.length) parents.set(node.id, incoming[0].fromNodeId);
    }
    const analysis = analyzeGraph(graph);
    const invalid = sorted.find(node => !analysis.get(node.id).output);
    if (invalid) throw new Error(`Check ${invalid.type} parameters and input shape before exporting. ${analysis.get(invalid.id).note}`);
    const terminals = sorted.filter(node => !graph.edges.some(edge => edge.fromNodeId === node.id));
    return { sorted, input: inputs[0], parents, terminals, analysis };
}
export function pythonScalar(value) {
    if (value === true || value === 'true') return 'True';
    if (value === false || value === 'false') return 'False';
    const number = Number(value);
    if (String(value).trim() === '' || !Number.isFinite(number)) throw new Error('Operator parameters must be finite numbers or booleans.');
    return String(number);
}
