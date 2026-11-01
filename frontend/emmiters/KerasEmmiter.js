import { prepareGraph, pythonScalar } from '../util/prepareGraph.js';

export class KerasEmitter {
    static generate(graph) {
        const { sorted, input, parents, terminals, analysis } = prepareGraph(graph);
        const shape = analysis.get(input.id).output;
        const lines = [`inputs = keras.Input(shape=(${shape.join(', ')}${shape.length === 1 ? ',' : ''}), name="input_tensor")`];
        const values = new Map([[input.id, 'inputs']]);
        sorted.forEach((node, index) => {
            if (node.type === 'Input') return;
            const p = node.params, name = `${node.type.toLowerCase()}_${index}`;
            let source = values.get(parents.get(node.id)), layer;
            const n = key => pythonScalar(p[key]);
            switch (node.type) {
                case 'Conv2d':
                    if (Number(p.padding) > 0) {
                        const padded = `padded_${index}`;
                        lines.push(`${padded} = layers.ZeroPadding2D(padding=${n('padding')}, data_format="channels_first")(${source})`);
                        source = padded;
                    }
                    layer = `Conv2D(filters=${n('out_channels')}, kernel_size=${n('kernel_size')}, strides=${n('stride')}, padding="valid", data_format="channels_first"`;
                    break;
                case 'MaxPool2d': layer = `MaxPooling2D(pool_size=${n('kernel_size')}, strides=${n('stride')}, data_format="channels_first"`; break;
                case 'Linear': layer = `Dense(units=${n('out_features')}`; break;
                case 'Dropout': layer = `Dropout(rate=${n('p')}`; break;
                case 'BatchNorm2d': layer = 'BatchNormalization(axis=1'; break;
                case 'ReLU': layer = 'ReLU('; break;
                case 'Softmax': layer = `Softmax(axis=${n('dim')}`; break;
                case 'Flatten':
                    if (Number(p.start_dim) !== 1) throw new Error('Keras export currently supports Flatten with start_dim=1.');
                    layer = 'Flatten(data_format="channels_first"'; break;
                default: throw new Error(`Keras export does not support ${node.type} yet.`);
            }
            const output = `out_${index}`;
            const separator = layer.endsWith('(') ? '' : ', ';
            lines.push(`${output} = layers.${layer}${separator}name="${name}")(${source})`);
            values.set(node.id, output);
        });
        const outputs = terminals.map(node => values.get(node.id));
        lines.push(`model = keras.Model(inputs=inputs, outputs=${outputs.length === 1 ? outputs[0] : `[${outputs.join(', ')}]`}, name="${graph.modelName}")`);
        return `import tensorflow as tf\nfrom tensorflow import keras\nfrom tensorflow.keras import layers\n\n# Shapes use channel-first tensors: (channels, height, width).\n${lines.join('\n')}\n`;
    }
}
