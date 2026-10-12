export const BADGE_MAP = {
    "Input":       "badge-input",
    "Flatten":     "badge-linear",
    "Conv2d":      "badge-conv",
    "MaxPool2d":   "badge-conv",
    "Linear":      "badge-linear",
    "Dropout":     "badge-linear",
    "BatchNorm2d": "badge-norm",
    "ReLU":        "badge-activation",
    "Softmax":     "badge-activation"
};

export const DEFAULT_PARAMS= {
    "Input":       { shape: "(3, 224, 224)" },
    "Conv2d":      { in_channels: 3,   out_channels: 32, kernel: 3 },
    "MaxPool2d":   { kernel: 2, stride: 2 },
    "Linear":      { in_features: 512, out_features: 10 },
    "Dropout":     { p: 0.5 },
    "BatchNorm2d": { num_features: 32 },
    "ReLU":        {},
    "Softmax":     { dim: 1 },
    "Flatten":     {}
}