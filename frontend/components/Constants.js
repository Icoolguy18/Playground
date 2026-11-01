export const LAYER_CATALOG = {
    Input: { code: 'IN', group: 'Input & reshaping', description: 'Define the channel-first tensor entering the model.' },
    Flatten: { code: 'FL', group: 'Input & reshaping', description: 'Flatten dimensions into a feature vector. The batch dimension is omitted from shape estimates.' },
    Conv2d: { code: 'C2', group: 'Feature layers', description: 'Extract spatial features with a two-dimensional convolution.' },
    MaxPool2d: { code: 'MP', group: 'Feature layers', description: 'Downsample spatial dimensions with max pooling.' },
    Linear: { code: 'FC', group: 'Feature layers', description: 'Project the last feature dimension into a new space.' },
    Dropout: { code: 'DO', group: 'Regularization & normalization', description: 'Randomly drop activations during training.' },
    BatchNorm2d: { code: 'BN', group: 'Regularization & normalization', description: 'Normalize feature channels using batch statistics.' },
    ReLU: { code: 'RL', group: 'Activations', description: 'Apply a rectified linear activation.' },
    Softmax: { code: 'SM', group: 'Activations', description: 'Normalize scores along the selected tensor dimension.' }
};

export const BADGE_MAP = Object.fromEntries(Object.keys(LAYER_CATALOG).map(type => [type,
    type === 'Input' || type === 'Flatten' ? 'badge-input' :
    type === 'ReLU' || type === 'Softmax' ? 'badge-activation' : 'badge-linear'
]));

export const DEFAULT_PARAMS = {
    Input: { shape: '(3, 224, 224)' },
    Flatten: { start_dim: 1 },
    Conv2d: { in_channels: 3, out_channels: 32, kernel_size: 3, stride: 1, padding: 0 },
    MaxPool2d: { kernel_size: 2, stride: 2 },
    Linear: { in_features: 512, out_features: 10 },
    Dropout: { p: 0.5 },
    BatchNorm2d: { num_features: 32 },
    ReLU: { inplace: false },
    Softmax: { dim: 1 }
};

export const FRAMEWORK_REGISTRY = {
    pytorch_2: { id: 'pytorch_2', name: 'PyTorch', version: '2.x', syntaxStyle: 'nn.Module', fileExtension: 'py' },
    keras_3: { id: 'keras_3', name: 'Keras / TensorFlow', version: '3', syntaxStyle: 'Functional', fileExtension: 'py' },
    onnx: { id: 'onnx', name: 'ONNX', version: '1.0', syntaxStyle: 'Graph Spec', fileExtension: 'onnx' }
};
