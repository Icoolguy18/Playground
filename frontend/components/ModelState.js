import {FRAMEWORK_REGISTRY} from "./Constants.js";

export const modelState = new class ModelState{
    constructor() {
        this.modelName = "CustomModel";
        this.framework = FRAMEWORK_REGISTRY.pytorch_2;
        this.nodes = new Map(); //Key: nodeId, Value: { id, type, params, x, y }
        this.edges = [];
    }

    setModelName(name){
        this.modelName = name;
    }

    setFramework(frameworkKey){
        if (FRAMEWORK_REGISTRY[frameworkKey]) {
            this.framework = FRAMEWORK_REGISTRY[frameworkKey];
        }
    }

    addNode(nodeData){
        this.nodes.set(nodeData.id, nodeData);
    }

    addEdge(fromNodeId, toNodeId){
        const exists = this.edges.filter(e => e.fromNodeId === fromNodeId && e.toNodeId === toNodeId);
        if (!exists) {
            this.edges.push({fromNodeId, toNodeId});
        }
    }

    removeNode(nodeId){
        this.nodes.delete(this.nodeId);
        this.edges = this.edges.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId);
    }

    removeEdge(fromNodeId, toNodeId){
        this.edges = this.edges.filter(e => e.fromNodeId !== fromNodeId && e.toNodeId !== toNodeId)
    }

    getGraph(){
        console.debug(`
            modelName:${this.modelName}
            framework:${this.framework.id}
            nodes:${Array.from(this.nodes.values())}
            `)
        return{

            modelName: this.modelName,
            framework: this.framework,
            nodes: Array.from(this.nodes.values()),
            edges: this.edges,
        }
    }
}