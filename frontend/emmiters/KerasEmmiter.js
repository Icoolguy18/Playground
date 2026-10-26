import { TopologicalSort } from "../util/graphHelpers.js";
export class KerasEmitter {
    static generate(graph) {
        console.debug("Generating graph using KerasEmitter");
        const sortedNodes = TopologicalSort(graph.nodes, graph.edges);

        let prevLayer = "inputs"; // Track the name of the previous tensor
        let modelLayers = [];

        sortedNodes.forEach((node, index) => {
            if (node.type === "Input") {
                console.debug(`Input node with node.params.values ${node.params.value} and node.paras.shape ${node.params.shape}`)
                const inputParams = node.params.shape || node.params.value ;
                modelLayers.push(`inputs = tf.keras.Input(shape=(${inputParams}))`);
                prevLayer = "inputs";
                return; // Skip regular layer processing for Input
            }

            const layerName = node.type.toLowerCase();
            const params = node.params || {};
            for (const [key, val] of Object.entries(params)) {
                if (val === undefined || val === null || val === "") {
                    console.warn(`parameter "${key}" is required`);
                }
            }

            const layerParams = Object.entries(params)
                .map(([key, value]) => `${value}`)
                .join(",");
            console.debug(`Added Layer Params as ${layerParams}`);

            const currentVar = `out_${index}`;
            console.debug(`pushing layerName ${layerName}`);

            modelLayers.push(`${currentVar} = tf.keras.layers.${layerName}(${layerParams})(${prevLayer})`);
            prevLayer = currentVar; // Reassign without 'let' so it carries over to the next iteration
        });

        console.debug(`Model Layers: ${modelLayers.length}`);

        return `import tensorflow as tf
from tensorflow import keras
from keras import layers

${modelLayers.join('\n')}

model = keras.Model(inputs=inputs, outputs=${prevLayer}, name="${graph.modelName}")
`;
    }
}