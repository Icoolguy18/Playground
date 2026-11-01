import { FRAMEWORK_REGISTRY } from './Constants.js';

/** The single graph shared by canvas, inspector, analysis, and code emitters. */
export class ModelState {
    constructor() {
        this.modelName = 'CustomModel';
        this.framework = FRAMEWORK_REGISTRY.pytorch_2;
        this.nodes = new Map();
        this.edges = [];
    }

    changed() {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('modelGraphUpdated'));
    }

    setModelName(name) { this.modelName = name || 'CustomModel'; this.changed(); }
    setFramework(key) {
        if (FRAMEWORK_REGISTRY[key]) { this.framework = FRAMEWORK_REGISTRY[key]; this.changed(); }
    }
    addNode(node) { this.nodes.set(node.id, node); this.changed(); }
    updateParam(id, key, value) {
        const node = this.nodes.get(id);
        if (!node || !Object.hasOwn(node.params, key)) return;
        node.params[key] = value;
        this.changed();
    }
    updatePosition(id, x, y) {
        const node = this.nodes.get(id);
        if (node) Object.assign(node, { x, y });
    }

    validateEdge(from, to) {
        if (!this.nodes.has(from) || !this.nodes.has(to)) return 'Both operators must exist.';
        if (from === to) return 'An operator cannot connect to itself.';
        if (this.nodes.get(to).type === 'Input') return 'An input tensor cannot receive an upstream connection.';
        if (this.edges.some(e => e.fromNodeId === from && e.toNodeId === to)) return 'These operators are already connected.';
        if (this.edges.some(e => e.toNodeId === to)) return 'This operator accepts one input. Remove its existing connection first.';
        const pending = [to], visited = new Set();
        while (pending.length) {
            const id = pending.pop();
            if (id === from) return 'This connection would create a cycle.';
            if (visited.has(id)) continue;
            visited.add(id);
            this.edges.filter(e => e.fromNodeId === id).forEach(e => pending.push(e.toNodeId));
        }
        return '';
    }
    addEdge(fromNodeId, toNodeId) {
        const error = this.validateEdge(fromNodeId, toNodeId);
        if (error) throw new Error(error);
        this.edges.push({ fromNodeId, toNodeId });
        this.changed();
    }
    removeEdge(from, to) {
        this.edges = this.edges.filter(e => e.fromNodeId !== from || e.toNodeId !== to);
        this.changed();
    }
    removeNode(id) {
        this.nodes.delete(id);
        this.edges = this.edges.filter(e => e.fromNodeId !== id && e.toNodeId !== id);
        this.changed();
    }
    clear() { this.nodes.clear(); this.edges = []; this.changed(); }
    getGraph() { return { modelName: this.modelName, framework: this.framework, nodes: [...this.nodes.values()], edges: this.edges }; }
}
export const modelState = new ModelState();
