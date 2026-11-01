/**
 * Model Playground — Core Canvas & Code Generation Logic
 */

// Initial Graph State
const state = {
  modelName: "CustomVisionModel",
  framework: "pytorch_2",
  selectedNodeId: "node_2",
  nodes: [
    {
      id: "node_1",
      type: "Input",
      name: "input_tensor",
      x: 120,
      y: 60,
      params: { shape: "(3, 224, 224)" }
    },
    {
      id: "node_2",
      type: "Conv2d",
      name: "conv1",
      x: 120,
      y: 190,
      params: { in_channels: 3, out_channels: 32, kernel_size: 3, stride: 1, padding: 1 }
    },
    {
      id: "node_3",
      type: "ReLU",
      name: "relu1",
      x: 120,
      y: 320,
      params: {}
    },
    {
      id: "node_4",
      type: "MaxPool2d",
      name: "pool1",
      x: 120,
      y: 430,
      params: { kernel_size: 2, stride: 2 }
    },
    {
      id: "node_5",
      type: "Flatten",
      name: "flatten",
      x: 420,
      y: 190,
      params: {}
    },
    {
      id: "node_6",
      type: "Linear",
      name: "fc1",
      x: 420,
      y: 320,
      params: { in_features: 32 * 112 * 112, out_features: 10, bias: true }
    }
  ],
  connections: [
    { from: "node_1", to: "node_2" },
    { from: "node_2", to: "node_3" },
    { from: "node_3", to: "node_4" },
    { from: "node_4", to: "node_5" },
    { from: "node_5", to: "node_6" }
  ]
};

// DOM References
const graphViewport = document.getElementById("graphViewport");
const svgConnectionsLayer = document.getElementById("svgConnectionsLayer");
const codeEditor = document.getElementById("codeEditor");
const frameworkSelector = document.getElementById("frameworkSelector");
const modelNameInput = document.getElementById("modelNameInput");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const layerSearch = document.getElementById("layerSearch");
const paletteList = document.getElementById("paletteList");
const btnCopyCode = document.getElementById("btnCopyCode");
const btnClear = document.getElementById("btnClear");
const btnExport = document.getElementById("btnExport");

// Inspector Elements
const selectedLayerType = document.getElementById("selectedLayerType");
const propName = document.getElementById("propName");
const propInFeatures = document.getElementById("propInFeatures");
const propOutFeatures = document.getElementById("propOutFeatures");
const propKernel = document.getElementById("propKernel");
const propBias = document.getElementById("propBias");
const groupInFeatures = document.getElementById("groupInFeatures");
const groupOutFeatures = document.getElementById("groupOutFeatures");
const groupKernelSize = document.getElementById("groupKernelSize");

// Drag state for moving nodes on canvas
let activeDrag = null;

// Initialize Application
function init() {
  renderNodes();
  renderConnections();
  updateCodeView();
  setupEventListeners();
  updateInspector();
}

/**
 * Render visual nodes onto the canvas
 */
function renderNodes() {
  graphViewport.innerHTML = "";

  state.nodes.forEach(node => {
    const el = document.createElement("div");
    el.className = `graph-node ${node.id === state.selectedNodeId ? "active" : ""}`;
    el.id = node.id;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;

    // Pick badge class based on type
    let badgeClass = "badge-linear";
    if (node.type === "Input") badgeClass = "badge-input";
    else if (node.type.includes("Conv") || node.type.includes("Pool")) badgeClass = "badge-conv";
    else if (node.type === "ReLU" || node.type === "Softmax") badgeClass = "badge-activation";
    else if (node.type.includes("Norm")) badgeClass = "badge-norm";

    // Build parameter preview
    let paramSummary = "";
    if (node.type === "Conv2d") {
      paramSummary = `
        <div class="node-param-row"><span class="node-param-label">Channels</span><span class="node-param-val">${node.params.in_channels} → ${node.params.out_channels}</span></div>
        <div class="node-param-row"><span class="node-param-label">Kernel</span><span class="node-param-val">${node.params.kernel_size}×${node.params.kernel_size}</span></div>
      `;
    } else if (node.type === "Linear") {
      paramSummary = `
        <div class="node-param-row"><span class="node-param-label">Features</span><span class="node-param-val">${node.params.in_features} → ${node.params.out_features}</span></div>
      `;
    } else if (node.type === "Input") {
      paramSummary = `
        <div class="node-param-row"><span class="node-param-label">Tensor</span><span class="node-param-val">${node.params.shape}</span></div>
      `;
    } else if (node.type === "MaxPool2d") {
      paramSummary = `
        <div class="node-param-row"><span class="node-param-label">Window</span><span class="node-param-val">${node.params.kernel_size}×${node.params.kernel_size} (s=${node.params.stride})</span></div>
      `;
    } else {
      paramSummary = `<div class="node-param-row"><span class="node-param-label">Type</span><span class="node-param-val">${node.type}</span></div>`;
    }

    el.innerHTML = `
      <div class="socket socket-input" data-node="${node.id}"></div>
      <div class="node-header">
        <div class="node-title-group">
          <span class="layer-icon-badge ${badgeClass}" style="width:20px;height:20px;font-size:0.65rem;">${node.type.substring(0, 2).toUpperCase()}</span>
          <span class="node-title">${node.name}</span>
        </div>
      </div>
      <div class="node-body">
        ${paramSummary}
      </div>
      <div class="socket socket-output" data-node="${node.id}"></div>
    `;

    // Click to select
    el.addEventListener("mousedown", (e) => {
      // Don't trigger drag when clicking sockets
      if (e.target.classList.contains("socket")) return;

      state.selectedNodeId = node.id;
      document.querySelectorAll(".graph-node").forEach(n => n.classList.remove("active"));
      el.classList.add("active");
      updateInspector();

      // Begin node drag
      activeDrag = {
        node,
        element: el,
        startX: e.clientX,
        startY: e.clientY,
        initialX: node.x,
        initialY: node.y
      };
    });

    graphViewport.appendChild(el);
  });
}

/**
 * Render smooth Bezier curves connecting nodes
 */
function renderConnections() {
  svgConnectionsLayer.innerHTML = "";

  state.connections.forEach(conn => {
    const fromNode = state.nodes.find(n => n.id === conn.from);
    const toNode = state.nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) return;

    // Output socket is bottom-center, input socket is top-center
    const startX = fromNode.x + 105;
    const startY = fromNode.y + 75; // Approx height
    const endX = toNode.x + 105;
    const endY = toNode.y;

    const deltaY = Math.abs(endY - startY) * 0.55;
    const controlY1 = startY + Math.max(deltaY, 35);
    const controlY2 = endY - Math.max(deltaY, 35);

    const pathData = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("class", "connection-line");
    svgConnectionsLayer.appendChild(path);
  });
}

/**
 * Update the Property Inspector with the active node's parameters
 */
function updateInspector() {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;

  selectedLayerType.textContent = node.type;
  propName.value = node.name;

  // Toggle visible parameter fields based on node type
  if (node.type === "Conv2d") {
    groupInFeatures.style.display = "flex";
    groupOutFeatures.style.display = "flex";
    groupKernelSize.style.display = "flex";
    groupInFeatures.querySelector(".form-label").textContent = "In Channels";
    groupOutFeatures.querySelector(".form-label").textContent = "Out Channels";
    propInFeatures.value = node.params.in_channels || 3;
    propOutFeatures.value = node.params.out_channels || 32;
    propKernel.value = node.params.kernel_size || 3;
  } else if (node.type === "Linear") {
    groupInFeatures.style.display = "flex";
    groupOutFeatures.style.display = "flex";
    groupKernelSize.style.display = "none";
    groupInFeatures.querySelector(".form-label").textContent = "In Features";
    groupOutFeatures.querySelector(".form-label").textContent = "Out Features";
    propInFeatures.value = node.params.in_features || 512;
    propOutFeatures.value = node.params.out_features || 10;
  } else {
    groupInFeatures.style.display = "none";
    groupOutFeatures.style.display = "none";
    groupKernelSize.style.display = "none";
  }
}

/**
 * Generate code based on the current architecture and target framework
 */
function generateCode() {
  const modelName = state.modelName || "CustomModel";
  const fw = state.framework;

  if (fw === "pytorch_2") {
    let layerDefs = [];
    let forwardCalls = ["x"];

    state.nodes.forEach(node => {
      if (node.type === "Input") return;
      if (node.type === "Conv2d") {
        layerDefs.push(`        self.${node.name} = nn.Conv2d(${node.params.in_channels}, ${node.params.out_channels}, kernel_size=${node.params.kernel_size}, padding=1)`);
        forwardCalls.push(`x = self.${node.name}(x)`);
      } else if (node.type === "Linear") {
        layerDefs.push(`        self.${node.name} = nn.Linear(${node.params.in_features}, ${node.params.out_features})`);
        forwardCalls.push(`x = self.${node.name}(x)`);
      } else if (node.type === "ReLU") {
        layerDefs.push(`        self.${node.name} = nn.ReLU(inplace=True)`);
        forwardCalls.push(`x = self.${node.name}(x)`);
      } else if (node.type === "MaxPool2d") {
        layerDefs.push(`        self.${node.name} = nn.MaxPool2d(kernel_size=2, stride=2)`);
        forwardCalls.push(`x = self.${node.name}(x)`);
      } else if (node.type === "Flatten") {
        layerDefs.push(`        self.${node.name} = nn.Flatten()`);
        forwardCalls.push(`x = self.${node.name}(x)`);
      }
    });

    return `<span class="kw">import</span> torch
<span class="kw">import</span> torch.nn <span class="kw">as</span> nn

<span class="kw">class</span> <span class="cls">${modelName}</span>(nn.Module):
    <span class="str">"""Auto-generated PyTorch 2.x Architecture"""</span>
    <span class="kw">def</span> <span class="fn">__init__</span>(self):
        <span class="fn">super</span>().<span class="fn">__init__</span>()
${layerDefs.join("\n")}

    <span class="kw">def</span> <span class="fn">forward</span>(self, x: torch.Tensor) -> torch.Tensor:
${forwardCalls.slice(1).map(c => "        " + c).join("\n")}
        <span class="kw">return</span> x

<span class="cmt"># Instantiate model</span>
model = <span class="cls">${modelName}</span>()
<span class="fn">print</span>(model)`;
  } else if (fw === "keras_3") {
    let layerOps = [];
    state.nodes.forEach(node => {
      if (node.type === "Input") {
        layerOps.push(`inputs = keras.Input(shape=(224, 224, 3), name="input")\nx = inputs`);
      } else if (node.type === "Conv2d") {
        layerOps.push(`x = layers.Conv2D(${node.params.out_channels}, (${node.params.kernel_size}, ${node.params.kernel_size}), padding="same", name="${node.name}")(x)`);
      } else if (node.type === "ReLU") {
        layerOps.push(`x = layers.Activation("relu", name="${node.name}")(x)`);
      } else if (node.type === "MaxPool2d") {
        layerOps.push(`x = layers.MaxPooling2D(pool_size=(2, 2), name="${node.name}")(x)`);
      } else if (node.type === "Flatten") {
        layerOps.push(`x = layers.Flatten(name="${node.name}")(x)`);
      } else if (node.type === "Linear") {
        layerOps.push(`outputs = layers.Dense(${node.params.out_features}, name="${node.name}")(x)`);
      }
    });

    return `<span class="kw">import</span> keras
<span class="kw">from</span> keras <span class="kw">import</span> layers

<span class="kw">def</span> <span class="fn">build_${modelName.toLowerCase()}</span>():
    <span class="str">"""Auto-generated Keras 3 Functional API Model"""</span>
${layerOps.map(op => "    " + op).join("\n")}

    model = keras.Model(inputs=inputs, outputs=outputs, name="${modelName}")
    <span class="kw">return</span> model

model = <span class="fn">build_${modelName.toLowerCase()}</span>()
model.<span class="fn">summary</span>()`;
  } else {
    return `<span class="cmt">// ONNX Graph Intermediate Representation</span>
{
  <span class="str">"graph_name"</span>: <span class="str">"${modelName}"</span>,
  <span class="str">"nodes_count"</span>: <span class="num">${state.nodes.length}</span>,
  <span class="str">"target"</span>: <span class="str">"ONNX v1.14"</span>
}`;
  }
}

function updateCodeView() {
  codeEditor.innerHTML = generateCode();
  const formatBadge = document.getElementById("codeFormatBadge");
  if (state.framework === "pytorch_2") formatBadge.textContent = "PYTORCH 2.X DEFINITION";
  else if (state.framework === "keras_3") formatBadge.textContent = "KERAS 3 FUNCTIONAL MODEL";
  else formatBadge.textContent = "ONNX IR SPECIFICATION";
}

/**
 * Event Listeners & Drag Handling
 */
function setupEventListeners() {
  // Model Name & Framework selection
  modelNameInput.addEventListener("input", (e) => {
    state.modelName = e.target.value.trim().replace(/\s+/g, "_") || "CustomModel";
    updateCodeView();
  });

  frameworkSelector.addEventListener("change", (e) => {
    state.framework = e.target.value;
    updateCodeView();
  });

  // Tab switching
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      document.getElementById(targetId).classList.add("active");
    });
  });

  // Mouse drag on canvas nodes
  window.addEventListener("mousemove", (e) => {
    if (!activeDrag) return;
    const dx = e.clientX - activeDrag.startX;
    const dy = e.clientY - activeDrag.startY;

    const newX = Math.max(10, activeDrag.initialX + dx);
    const newY = Math.max(10, activeDrag.initialY + dy);

    activeDrag.node.x = newX;
    activeDrag.node.y = newY;
    activeDrag.element.style.left = `${newX}px`;
    activeDrag.element.style.top = `${newY}px`;

    renderConnections();
  });

  window.addEventListener("mouseup", () => {
    activeDrag = null;
  });

  // Palette Drag & Drop onto Canvas
  const layerCards = document.querySelectorAll(".layer-card");
  const canvasContainer = document.getElementById("canvasContainer");

  layerCards.forEach(card => {
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", card.getAttribute("data-type"));
    });
  });

  canvasContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  canvasContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/plain");
    if (!type) return;

    const rect = canvasContainer.getBoundingClientRect();
    const dropX = e.clientX - rect.left - 100;
    const dropY = e.clientY - rect.top - 40;

    const newId = `node_${Date.now()}`;
    const newName = `${type.toLowerCase()}_${state.nodes.length + 1}`;

    const newNode = {
      id: newId,
      type: type,
      name: newName,
      x: Math.max(20, dropX),
      y: Math.max(20, dropY),
      params: type === "Conv2d" ? { in_channels: 32, out_channels: 64, kernel_size: 3 } :
              type === "Linear" ? { in_features: 128, out_features: 10 } : {}
    };

    // Auto-connect to previously selected node if one exists
    if (state.selectedNodeId) {
      state.connections.push({ from: state.selectedNodeId, to: newId });
    }

    state.nodes.push(newNode);
    state.selectedNodeId = newId;

    renderNodes();
    renderConnections();
    updateCodeView();
    updateInspector();
  });

  // Search filter
  layerSearch.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll(".layer-card").forEach(card => {
      const name = card.querySelector(".layer-name").textContent.toLowerCase();
      card.style.display = name.includes(term) ? "flex" : "none";
    });
  });

  // Inspector Input Change Handlers
  propName.addEventListener("input", (e) => {
    const node = state.nodes.find(n => n.id === state.selectedNodeId);
    if (node) {
      node.name = e.target.value.trim() || node.name;
      renderNodes();
      updateCodeView();
    }
  });

  propInFeatures.addEventListener("input", (e) => {
    const node = state.nodes.find(n => n.id === state.selectedNodeId);
    if (node && node.params) {
      const val = parseInt(e.target.value) || 1;
      if (node.type === "Conv2d") node.params.in_channels = val;
      if (node.type === "Linear") node.params.in_features = val;
      renderNodes();
      updateCodeView();
    }
  });

  propOutFeatures.addEventListener("input", (e) => {
    const node = state.nodes.find(n => n.id === state.selectedNodeId);
    if (node && node.params) {
      const val = parseInt(e.target.value) || 1;
      if (node.type === "Conv2d") node.params.out_channels = val;
      if (node.type === "Linear") node.params.out_features = val;
      renderNodes();
      updateCodeView();
    }
  });

  // Copy Code to Clipboard
  btnCopyCode.addEventListener("click", () => {
    const codeText = codeEditor.innerText;
    navigator.clipboard.writeText(codeText).then(() => {
      const origText = btnCopyCode.innerHTML;
      btnCopyCode.innerHTML = `<span style="color:#38bdf8;">✓ Copied!</span>`;
      setTimeout(() => { btnCopyCode.innerHTML = origText; }, 1800);
    });
  });

  // Clear Canvas
  btnClear.addEventListener("click", () => {
    if (confirm("Clear all layers from the canvas?")) {
      state.nodes = [];
      state.connections = [];
      state.selectedNodeId = null;
      renderNodes();
      renderConnections();
      updateCodeView();
    }
  });

  // Export Script (.py)
  btnExport.addEventListener("click", () => {
    const code = codeEditor.innerText;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.modelName.toLowerCase()}.py`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Kick off when DOM is ready
document.addEventListener("DOMContentLoaded", init);
