// components/nodes/nodeManager.js
import { BADGE_MAP, DEFAULT_PARAMS } from '../constants.js';
import { connectionManager } from '../ConnectionManager.js';

let nodeIdCounter = 1;

export function spawnNode(type, x, y) {
    const viewport = document.getElementById("graphViewport");
    if (!viewport) return;

    const id = `node_${nodeIdCounter}`;
    const name = `${type.toLowerCase()}_${nodeIdCounter}`;
    nodeIdCounter++;

    const badgeClass = BADGE_MAP[type] || "badge-linear";
    const shortCode = type.substring(0, 2).toUpperCase();
    const params = DEFAULT_PARAMS[type] || {};

    const paramRows = Object.entries(params).map(([key, val] ) => `
        <div class="node-param-row">
            <span class="node-param-label">${key}</span>
            <span class="node-param-val">${val}</span>
        </div>
    `).join("") || `
        <div class="node-param-row">
            <span class="node-param-label">type</span>
            <span class="node-param-val">${type}</span>
        </div>
    `;

    const node = document.createElement("div");
    node.className = "graph-node";
    node.id = id;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.innerHTML = `
        <div class="socket socket-input"></div>
        <div class="node-header">
            <div class="node-title-group">
                <span class="layer-icon-badge ${badgeClass}">${shortCode}</span>
                <span class="node-title">${name}</span>
            </div>
            <button class="node-delete-btn" title="Remove layer">✕</button>
        </div>
        <div class="node-body">${paramRows}</div>
        <div class="socket socket-output"></div>
    `;

    // Delete button handler (Fixed: passed `node` to remove wires)
    node.querySelector(".node-delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        connectionManager.removeNodeConnections(node);
        node.remove();
        updateLayerCount();
    });

    enableNodeDrag(node);

    viewport.appendChild(node);
    connectionManager.attachSocketListeners(node);
    updateLayerCount();
}

function enableNodeDrag(node) {
    let isDragging = false;
    let startMouseX, startMouseY, startNodeX, startNodeY;

    node.addEventListener("mousedown", (e) => {
        if (e.target.classList.contains("socket")) return;

        isDragging = true;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        startNodeX = parseInt(node.style.left) || 0;
        startNodeY = parseInt(node.style.top) || 0;

        node.style.zIndex = 50;
        e.preventDefault();
    });

    // Single unified mousemove handler (Fixed: combined movement & wire updating)
    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;
        node.style.left = `${Math.max(0, startNodeX + dx)}px`;
        node.style.top = `${Math.max(0, startNodeY + dy)}px`;

        // Live update wires connected to this node using lowercase instance
        connectionManager.updateNodeConnections(node);
    });

    window.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        node.style.zIndex = "";
    });
}

export function clearWorkspace() {
    const viewport = document.getElementById("graphViewport");
    if (viewport) viewport.innerHTML = "";
    nodeIdCounter = 1;
    updateLayerCount();
}

function updateLayerCount() {
    const viewport = document.getElementById("graphViewport");
    const count = viewport ? viewport.querySelectorAll(".graph-node").length : 0;
    const badge = document.getElementById("modelLayerCount");
    if (badge) {
        badge.textContent = `${count} ${count === 1 ? "Layer" : "Layers"}`;
    }
}