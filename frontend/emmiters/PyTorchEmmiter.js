import { prepareGraph, pythonScalar } from '../util/prepareGraph.js';

export class PyTorchEmitter {
    static generate(graph) {
        const { sorted, input, parents, terminals } = prepareGraph(graph);
        const initLines = [], forwardLines = [], values = new Map([[input.id, 'x']]);
        sorted.forEach((node, index) => {
            if (node.type === 'Input') return;
            const layerName = `${node.type.toLowerCase()}_${index}`;
            const params = Object.entries(node.params).map(([key, value]) => `${key}=${pythonScalar(value)}`).join(', ');
            initLines.push(`        self.${layerName} = nn.${node.type}(${params})`);
            const output = `out_${index}`;
            forwardLines.push(`        ${output} = self.${layerName}(${values.get(parents.get(node.id))})`);
            values.set(node.id, output);
        });
        const outputs = terminals.map(node => values.get(node.id));
        return `import torch\nfrom torch import nn\n\n\nclass ${graph.modelName}(nn.Module):\n    def __init__(self):\n        super().__init__()\n${initLines.join('\n')}\n\n    def forward(self, x):\n${forwardLines.join('\n')}${forwardLines.length ? '\n' : ''}        return ${outputs.length === 1 ? outputs[0] : `(${outputs.join(', ')})`}\n`;
    }
}
