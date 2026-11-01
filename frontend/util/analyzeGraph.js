// Parameter counts describe configured operators; tensor shapes describe connections.
// A missing or incompatible input must not erase an otherwise known weight count.
const positiveInteger = value => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const nonnegativeInteger = value => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) ? Number(value) : null;

export function parameterBreakdown(node) {
    const p = node.params;
    let weights = null, biases = null, expression = '';
    let assumption = 'Configured weights and biases are counted independently of tensor compatibility.';
    const number = value => value.toLocaleString('en-GB');
    if (node.type === 'Linear') {
        const input = positiveInteger(p.in_features), output = positiveInteger(p.out_features);
        if (input && output) { weights = input * output; biases = output; expression = number(input) + ' × ' + number(output) + ' + ' + number(output); }
    } else if (node.type === 'Conv2d') {
        const input = positiveInteger(p.in_channels), output = positiveInteger(p.out_channels), kernel = positiveInteger(p.kernel_size);
        if (input && output && kernel) { weights = output * input * kernel * kernel; biases = output; expression = number(output) + ' × ' + number(input) + ' × ' + number(kernel) + ' × ' + number(kernel) + ' + ' + number(output); }
    } else if (node.type === 'BatchNorm2d') {
        const features = positiveInteger(p.num_features);
        if (features) { weights = features; biases = features; expression = number(features) + ' scale + ' + number(features) + ' shift'; }
        assumption = 'Affine scale and shift are counted. Running mean and variance are buffers, not trainable parameters.';
    } else if (['Input', 'Flatten', 'MaxPool2d', 'Dropout', 'ReLU', 'Softmax'].includes(node.type)) {
        weights = 0; biases = 0; expression = '0 weights + 0 biases';
        assumption = 'This operator has no trainable weights or biases.';
    }
    const total = weights === null || biases === null ? null : weights + biases;
    if (!Number.isSafeInteger(total) || total < 0) return { weights: null, biases: null, total: null, formula: 'Enter valid positive whole-number dimensions to calculate parameters.', assumption };
    return { weights, biases, total, formula: expression + ' = ' + number(total), assumption };
}

export function parameterCount(node) { return parameterBreakdown(node).total; }

export function analyzeGraph(graph) {
    const results = new Map(), visiting = new Set();
    const nodes = new Map(graph.nodes.map(node => [node.id, node]));
    function visit(node) {
        if (results.has(node.id)) return results.get(node.id);
        const params = parameterCount(node);
        if (visiting.has(node.id)) return { input: null, output: null, params, status: 'invalid-config', expected: null, received: null, note: 'Cycle detected; output shape unresolved.' };
        visiting.add(node.id);
        const parents = graph.edges.filter(edge => edge.toNodeId === node.id);
        const parent = parents.length === 1 ? nodes.get(parents[0].fromNodeId) : null;
        const input = parent ? visit(parent).output : null;
        const p = node.params;
        let output = null;
        let status = node.type !== 'Input' && !parents.length ? 'awaiting-input' : node.type !== 'Input' && !input && parents.length === 1 ? 'blocked' : 'invalid-config';
        let expected = null, received = null;
        const mismatch = (wanted, actual, message) => { status = 'mismatch'; expected = wanted; received = actual; note = message; };
        let note = 'Derived from this graph. Batch dimension omitted.';
        if (node.type === 'Input') {
            const dims = String(p.shape).replace(/[()\[\]]/g, '').split(/[×x,]/).map(value => positiveInteger(value.trim()));
            if (parents.length) note = 'An Input tensor cannot receive an upstream connection.';
            else if (dims.length && dims.every(value => value !== null)) output = dims;
            else note = 'Use positive integer input dimensions, for example (3, 32, 32).';
        } else if (parents.length > 1) {
            note = 'Multiple inputs require an explicit merge operator.';
        } else if (!parents.length) {
            note = 'Connect an upstream tensor to infer the output shape.';
        } else if (!input) {
            note = 'Upstream tensor shape is unresolved. Check the preceding operators.';
        } else if (node.type === 'Linear') {
            const cin = positiveInteger(p.in_features), cout = positiveInteger(p.out_features);
            if (!cin || !cout) note = 'in_features and out_features must be positive whole numbers.';
            else if (cin !== input.at(-1)) mismatch(`${cin} input features`, `${input.at(-1)} input features`, `Linear expects ${cin} input features; the upstream tensor provides ${input.at(-1)}. Set in_features to ${input.at(-1)} or change the preceding operator.`);
            else output = [...input.slice(0, -1), cout];
        } else if (node.type === 'Conv2d') {
            const cin = positiveInteger(p.in_channels), cout = positiveInteger(p.out_channels);
            const kernel = positiveInteger(p.kernel_size), stride = positiveInteger(p.stride), padding = nonnegativeInteger(p.padding);
            if (!cin || !cout || !kernel || !stride || padding === null) note = 'Use positive channel, kernel and stride values, and nonnegative padding.';
            else if (input.length !== 3) mismatch('C × H × W (3 dimensions)', formatShape(input), 'Conv2d requires a channel-first tensor with three dimensions: C × H × W.');
            else if (cin !== input[0]) mismatch(`${cin} input channels`, `${input[0]} input channels`, `Conv2d expects ${cin} input channels; the upstream tensor provides ${input[0]}. Set in_channels to ${input[0]} or change the preceding operator.`);
            else output = [cout, ...input.slice(1).map(size => Math.floor((size + 2 * padding - kernel) / stride + 1))];
        } else if (node.type === 'MaxPool2d') {
            const kernel = positiveInteger(p.kernel_size), stride = positiveInteger(p.stride);
            if (!kernel || !stride) note = 'Kernel size and stride must be positive whole numbers.';
            else if (input.length !== 3) mismatch('C × H × W (3 dimensions)', formatShape(input), 'MaxPool2d requires a channel-first tensor: C × H × W.');
            else output = [input[0], ...input.slice(1).map(size => Math.floor((size - kernel) / stride + 1))];
        } else if (node.type === 'Flatten') {
            const start = positiveInteger(p.start_dim);
            if (!start || start > input.length) note = 'start_dim must select a tensor dimension after the batch dimension.';
            else output = [...input.slice(0, start - 1), input.slice(start - 1).reduce((a, b) => a * b, 1)];
        } else if (node.type === 'BatchNorm2d') {
            const features = positiveInteger(p.num_features);
            if (!features) note = 'num_features must be a positive whole number.';
            else if (input.length !== 3) mismatch('C × H × W (3 dimensions)', formatShape(input), 'BatchNorm2d requires a channel-first tensor: C × H × W.');
            else if (features !== input[0]) mismatch(`${features} channels`, `${input[0]} channels`, `num_features must match the upstream channel count (${input[0]}).`);
            else output = [...input];
        } else if (node.type === 'ReLU') {
            if (['true', 'false'].includes(String(p.inplace))) output = [...input];
            else note = 'Choose true or false for inplace.';
        } else if (node.type === 'Dropout') {
            if (String(p.p).trim() !== '' && Number(p.p) >= 0 && Number(p.p) <= 1) output = [...input];
            else note = 'Dropout probability must be between 0 and 1.';
        } else if (node.type === 'Softmax') {
            if (String(p.dim).trim() !== '' && Number.isInteger(Number(p.dim)) && Number(p.dim) >= -input.length - 1 && Number(p.dim) <= input.length) output = [...input];
            else note = 'Choose a dim within the input tensor rank, including its batch dimension.';
        } else note = 'Shape inference is not available for this operator.';
        if (output && !output.every(size => Number.isSafeInteger(size) && size > 0)) {
            status = 'invalid-config'; output = null; note = 'These settings produce an invalid output dimension. Check kernel size, stride and padding.';
        }
        visiting.delete(node.id);
        if (output) status = 'valid';
        const result = { input, output, params, status, expected, received, note };
        results.set(node.id, result);
        return result;
    }
    graph.nodes.forEach(visit);
    return results;
}

export function formatShape(shape) {
    return shape ? shape.map(value => value.toLocaleString('en-GB')).join(' × ') : 'Unresolved';
}
