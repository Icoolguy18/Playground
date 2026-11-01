# Architecture editor design references

The workspace combines research-oriented graph inspection with a muted paper/clay material palette. Reference tools inform particular interactions; this is not a replica of any one tool.

| Example | Source | Proposed use in this workspace |
| --- | --- | --- |
| Netron | https://github.com/lutzroeder/netron | Keep the model graph and the selected operator's technical details close together. |
| TensorBoard Graphs | https://www.tensorflow.org/tensorboard/graphs | Preserve a readable model-level graph, with deeper operation details available on demand. |
| Orange | https://orangedatamining.com/ | Group the component toolbox by function and keep reusable components easy to discover. |
| SageMaker Pipeline Designer | https://docs.aws.amazon.com/sagemaker/latest/dg/build-and-manage-steps-types.html | Selection-driven Settings and Details panels. |
| TensorFlow Playground | https://playground.tensorflow.org/ | Shared controls above a left-to-right network view. |

## Semantic node roles

Colors belong to roles, not individual implementations or workspace themes. The canonical mapping is in `node-groups.js`. `node-groups.css` renders the same mapping in the component browser, graph, inspector and legend.

| Role | Shade | Examples |
| --- | --- | --- |
| Input / reshape | Slate | Input, Flatten |
| Layer | Dusty blue | Conv2d, Linear, MaxPool2d, BatchNorm2d, Dropout |
| Activation | Ochre | ReLU, Softmax; future GELU, Sigmoid, Tanh |
| Optimizer | Sage | Future Adam, AdamW, SGD, RMSprop |
| Loss | Rose | Future CrossEntropyLoss, MSELoss, BCELoss |
| Custom / untyped | Lavender | A function whose role has not yet been declared |

Custom functions should declare `kind: 'layer'`, `'activation'`, `'optimizer'` or `'loss'` and inherit that role's color. Do not give all custom functions a new color just because they came from a personal store. Lavender is a fallback for untyped functions.

Selection uses a dark outer outline without replacing the node's role color. Each graph node has a written role label; browser badges and the visible legend provide redundant identification. Connections remain neutral so color does not incorrectly imply learned weights or compatibility.

Optimizers and losses currently have colored planned-resource cards in the Training tab. They are not executable nodes yet. Their future configuration should remain separate from the tensor-forward graph unless a training graph with explicit gradient, target and update ports is introduced.

## Verification

JavaScript syntax, mapping coverage, custom-role inheritance, text contrast on role tints and HTML structure are checked locally. Actual browser rendering has not yet been verified.


## Finalized working implementation

`playground.html` and `playground.css` now implement Neural / paper clay against the project’s shared model state, node manager, connection manager and code emitters. `components/Workspace.js` handles view coordination and the inspector. `components/NodeGroups.js` adapts the same color registry used by the reference pages. The production app does not load `reference.js` or `inspector.js`, and contains no mock graph state.

Model and DOM integration checks run with `npm test`; run the app with `npm start`. DOM tests use synthetic geometry and do not replace browser rendering or ML-framework execution checks.
