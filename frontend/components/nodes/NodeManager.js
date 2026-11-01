import { DEFAULT_PARAMS, LAYER_CATALOG } from '../Constants.js';
import { NODE_GROUPS, nodeGroup, applyNodeGroup } from '../NodeGroups.js';
import { connectionManager } from './ConnectionManager.js';
import { modelState } from '../ModelState.js';

let nodeIdCounter = 1;
export function selectNode(id) {
    window.dispatchEvent(new CustomEvent('nodeSelected', { detail: id }));
}
export function spawnNode(type, x = 50, y = 130, overrides = {}) {
    if (!LAYER_CATALOG[type]) return null;
    const id = `node_${nodeIdCounter++}`;
    const params = { ...DEFAULT_PARAMS[type], ...overrides };
    const node = document.createElement('article');
    const kind = nodeGroup(type), metadata = LAYER_CATALOG[type];
    node.id = id;
    node.className = 'graph-node';
    node.dataset.type = type;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    applyNodeGroup(node, kind);
    node.innerHTML = `
        <span class="node-kind">${NODE_GROUPS[kind].label} · ${id.slice(5).padStart(2, '0')}</span>
        <button class="socket socket-input" aria-label="Connect to ${type}" title="Input"></button>
        <button class="node-header" aria-label="Select ${type} ${id.slice(5)}">
            <span class="layer-icon-badge">${metadata.code}</span>
            <span><strong class="node-title">${type}</strong><small>${type.toLowerCase()}_${id.slice(5)}</small></span>
        </button>
        ${type === 'Linear' ? '<div class="node-body node-units-row"><span>output units</span><strong class="node-units"></strong></div>' : ''}
        <div class="node-body"><span>output shape</span><strong class="node-shape">Unresolved</strong></div>
        <div class="node-status" hidden></div>
        <button class="node-delete-btn" title="Remove operator" aria-label="Remove ${type}">×</button>
        <button class="socket socket-output" aria-label="Connect from ${type}" title="Output"></button>`;
    node.addEventListener('click', event => {
        if (!event.target.closest('.socket, .node-delete-btn')) selectNode(id);
    });
    node.querySelector('.node-delete-btn').addEventListener('click', event => { event.stopPropagation(); removeNode(id); });
    enableNodeDrag(node);
    document.getElementById('graphViewport').append(node);
    connectionManager.attachSocketListeners(node);
    modelState.addNode({ id, type, params, x, y });
    selectNode(id);
    return node;
}
function enableNodeDrag(node) {
    const handle = node.querySelector('.node-header');
    handle.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        selectNode(node.id);
        const start = { x: event.clientX, y: event.clientY, left: parseFloat(node.style.left), top: parseFloat(node.style.top) };
        const scale = Number(document.getElementById('graphViewport').dataset.scale) || 1;
        handle.setPointerCapture(event.pointerId);
        const move = next => {
            const x = Math.max(20, start.left + (next.clientX - start.x) / scale);
            const y = Math.max(50, start.top + (next.clientY - start.y) / scale);
            node.style.left = `${x}px`; node.style.top = `${y}px`;
            modelState.updatePosition(node.id, x, y);
            connectionManager.updateNodeConnections(node);
            window.dispatchEvent(new CustomEvent('graphViewChanged'));
        };
        const finish = () => {
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', finish);
            handle.removeEventListener('pointercancel', finish);
            handle.removeEventListener('lostpointercapture', finish);
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', finish);
        handle.addEventListener('pointercancel', finish);
        handle.addEventListener('lostpointercapture', finish);
    });
}
export function removeNode(id) {
    const node = document.getElementById(id);
    if (!node) return;
    connectionManager.removeNodeConnections(node);
    node.remove();
    modelState.removeNode(id);
}
export function clearWorkspace() {
    connectionManager.clearAll();
    document.getElementById('graphViewport').replaceChildren();
    nodeIdCounter = 1;
    modelState.clear();
    selectNode(null);
}
