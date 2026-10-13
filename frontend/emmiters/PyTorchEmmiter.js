import { TopologicalSort } from "../util/graphHelpers.js";

export class PyTorchEmitter {
    static generate(graph){
        const sortedNodes = TopologicalSort(graph.nodes, graph.edges)

        let initLines = [];
        let forwardLines = [];
        let prevVar = "x";

        sortedNodes.forEach((node, index) => {
            if (node.type === "Input" ) return; // Input handled in the forward pass signature

            const layerName = `${node.type.toLowerCase()}_${index}`;
            const paramString = Object.entries(node.params)
                .map(([key, value]) => `${key} = ${value}`)
                .join(", ")

            initLines.push(`self.${layerName} = nn.${node.type}(${paramString})`);
            const nextVar = `out_${index}`;
            forwardLines.push(`${nextVar} = self.${layerName}(${prevVar})`);
            prevVar = nextVar;

        });

        return `import torch
        from torch import nn
        
        class ${graph.modelName}(nn.Module):
            def __init__(self):
                super().__init__();
                ${initLines.join('\n')}
                
            def forward(self, x):
                ${forwardLines.join("\n")}
                return ${prevVar}
        `;
    }
}