/** Semantic roles are independent of theme, selection state, or implementation source.
 * A custom implementation declares its role and inherits that role's presentation.
 */
const NODE_GROUPS = Object.freeze({
    input: Object.freeze({ label: 'Input / reshape', code: 'IN', ink: '#444e58', tint: '#cbd0cf' }),
    layer: Object.freeze({ label: 'Layer', code: 'LY', ink: '#2c4e63', tint: '#c2d2d8' }),
    activation: Object.freeze({ label: 'Activation', code: 'AC', ink: '#694411', tint: '#dfc795' }),
    optimizer: Object.freeze({ label: 'Optimizer', code: 'OP', ink: '#35523c', tint: '#c5d2b8' }),
    loss: Object.freeze({ label: 'Loss', code: 'LS', ink: '#703c4d', tint: '#d9bcc0' }),
    custom: Object.freeze({ label: 'Custom / untyped', code: 'FN', ink: '#554366', tint: '#cec2d9' })
});
const NODE_TYPE_GROUPS = Object.freeze({
    Input: 'input', Flatten: 'input',
    Conv2d: 'layer', MaxPool2d: 'layer', Linear: 'layer', Dropout: 'layer', BatchNorm2d: 'layer',
    ReLU: 'activation', Softmax: 'activation', Sigmoid: 'activation', Tanh: 'activation', GELU: 'activation',
    Adam: 'optimizer', AdamW: 'optimizer', SGD: 'optimizer', RMSprop: 'optimizer',
    CrossEntropyLoss: 'loss', MSELoss: 'loss', BCELoss: 'loss', BCEWithLogitsLoss: 'loss', L1Loss: 'loss'
});
function nodeGroup(type, declaredKind) {
    return Object.hasOwn(NODE_GROUPS, declaredKind) ? declaredKind : (NODE_TYPE_GROUPS[type] || 'custom');
}
function applyNodeGroup(element, kind) {
    const group = NODE_GROUPS[kind] || NODE_GROUPS.custom;
    element.dataset.nodeKind = Object.hasOwn(NODE_GROUPS, kind) ? kind : 'custom';
    element.style.setProperty('--group-ink', group.ink);
    element.style.setProperty('--group-tint', group.tint);
}

// Also expose the shared registry to the production ES-module adapter.
globalThis.modelNodeGroups = Object.freeze({ NODE_GROUPS, NODE_TYPE_GROUPS, nodeGroup, applyNodeGroup });
