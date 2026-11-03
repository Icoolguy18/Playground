
export const FRAMEWORK_REGISTRY = {
    pytorch_2: {
        id: "pytorch_2",
        name: "PyTorch",
        version: "2.x",
        syntaxStyle: "nn.Module",
        fileExtension: "py"
    },
    keras_3: {
        id: "keras_3",
        name: "Keras / TensorFlow",
        version: "3.x",
        syntaxStyle: "Functional",
        fileExtension: "py"
    },
    onnx: {
        id: "onnx",
        name: "ONNX",
        version: "1.0",
        syntaxStyle: "Graph Spec",
        fileExtension: "onnx"
    }
}

export const LAYER_CATALOG = {
    Input: {
        code: "IN",
        group: "Input & reshaping",
        kind: "input",
        badgeClass: "badge-input",
        description: "Define the channel-first tensor entering the model.",
        defaults: { shape: "(3, 224, 224)" }
    },

    Flatten: {
        code: "FL",
        group: "Input & reshaping",
        kind: "input",
        badgeClass: "badge-input",
        description: "Combine tensor dimensions into a feature vector.",
        defaults: {}
    },

    Conv2d: {
        code: "C2",
        group: "Feature layers",
        kind: "layer",
        badgeClass: "badge-conv",
        description: "Extract spatial features with a two-dimensional convolution.",
        defaults: {
            in_channels: 3,
            out_channels: 32,
            kernel_size: 3
        }
    },

    MaxPool2d: {
        code: "MP",
        group: "Feature layers",
        kind: "layer",
        badgeClass: "badge-conv",
        description: "Downsample spatial dimensions using max pooling.",
        defaults: {
            kernel_size: 2,
            stride: 2
        }
    },

    Linear: {
        code: "FC",
        group: "Feature layers",
        kind: "layer",
        badgeClass: "badge-linear",
        description: "Project the last feature dimension into output units.",
        defaults: {
            in_features: 512,
            out_features: 10
        }
    },

    Dropout: {
        code: "DO",
        group: "Regularization & normalization",
        kind: "layer",
        badgeClass: "badge-linear",
        description: "Randomly zero activations during training.",
        defaults: { p: 0.5 }
    },

    BatchNorm2d: {
        code: "BN",
        group: "Regularization & normalization",
        kind: "layer",
        badgeClass: "badge-norm",
        description: "Normalize feature channels using batch statistics.",
        defaults: { num_features: 32 }
    },

    ReLU: {
        code: "RL",
        group: "Activations",
        kind: "activation",
        badgeClass: "badge-activation",
        description: "Apply a rectified linear activation.",
        defaults: {}
    },

    Softmax: {
        code: "SM",
        group: "Activations",
        kind: "activation",
        badgeClass: "badge-activation",
        description: "Normalize scores along the selected tensor dimension.",
        defaults: { dim: 1 }
    }
};


export const BADGE_MAP = Object.fromEntries(
    Object.entries(LAYER_CATALOG).map(([type, definition]) => [
        type,
        definition.badgeClass
    ])
);

export const DEFAULT_PARAMS = Object.fromEntries(
    Object.entries(LAYER_CATALOG).map(([type, definition]) => [
        type,
        {...definition.defaults}
    ])
)