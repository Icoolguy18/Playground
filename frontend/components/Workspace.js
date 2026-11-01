import { modelState } from './ModelState.js';
import { DEFAULT_PARAMS, LAYER_CATALOG } from './Constants.js';
import { NODE_GROUPS, nodeGroup, applyNodeGroup } from './NodeGroups.js';
import { spawnNode, selectNode, removeNode } from './nodes/NodeManager.js';
import { connectionManager } from './nodes/ConnectionManager.js';
import { TopologicalSort } from '../util/graphHelpers.js';
import { analyzeGraph, formatShape, parameterBreakdown } from '../util/analyzeGraph.js';

const $ = id => document.getElementById(id);
let selectedId = null;
let zoom = 1;
let analysis = new Map();

// Panel visibility is view state: it never changes node coordinates, zoom or model data.
let beforeCanvasFocus = null;
const narrowWorkspace = () => window.matchMedia?.('(max-width: 700px)').matches ?? false;
function syncPanels() {
    const paletteOpen = !$('layerPalette').hidden, inspectorOpen = !$('operatorInspector').hidden;
    $('workspace').classList.toggle('palette-hidden', !paletteOpen);
    $('workspace').classList.toggle('inspector-hidden', !inspectorOpen);
    for (const id of ['btnTogglePalette', 'btnCanvasPalette']) $(id).setAttribute('aria-expanded', String(paletteOpen));
    for (const id of ['toggleInspector', 'btnCanvasInspector']) $(id).setAttribute('aria-expanded', String(inspectorOpen));
    $('btnTogglePalette').setAttribute('aria-label', paletteOpen ? 'Collapse component browser' : 'Expand component browser');
    resizeStage();
}
function setCanvasFocus(active, restore = true) {
    if (active) {
        beforeCanvasFocus = { palette: !$('layerPalette').hidden, inspector: !$('operatorInspector').hidden };
        $('layerPalette').hidden = true; $('operatorInspector').hidden = true;
        $('workspaceOptions').open = false;
    } else if (beforeCanvasFocus) {
        if (restore) {
            $('layerPalette').hidden = !beforeCanvasFocus.palette;
            $('operatorInspector').hidden = !beforeCanvasFocus.inspector;
        }
        beforeCanvasFocus = null;
    }
    $('workspace').classList.toggle('canvas-focus', active);
    $('btnCanvasFocus').setAttribute('aria-pressed', String(active));
    $('btnCanvasFocus').textContent = active ? 'Exit canvas focus' : 'Canvas focus';
    syncPanels();
}
function setPanelOpen(name, open) {
    if (beforeCanvasFocus) setCanvasFocus(false, false);
    const panel = $(name === 'palette' ? 'layerPalette' : 'operatorInspector');
    const hadFocus = panel.contains(document.activeElement);
    panel.hidden = !open;
    if (open && narrowWorkspace()) $(name === 'palette' ? 'operatorInspector' : 'layerPalette').hidden = true;
    if (!open && hadFocus) $(name === 'palette' ? 'btnCanvasPalette' : 'btnCanvasInspector').focus();
    syncPanels();
}

function initTabs(attribute, panelPrefix) {
    const tabs = [...document.querySelectorAll(`[${attribute}]`)];
    const activate = (tab, focus = false) => {
        tabs.forEach(item => {
            const active = item === tab;
            item.setAttribute('aria-selected', String(active));
            item.tabIndex = active ? 0 : -1;
            $(panelPrefix + item.getAttribute(attribute)).hidden = !active;
        });
        if (focus) tab.focus();
    };
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', event => {
            const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length :
                event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length :
                event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
            if (next === null) return;
            event.preventDefault(); activate(tabs[next], true);
        });
    });
}

function buildBrowser() {
    let currentGroup = '';
    Object.entries(LAYER_CATALOG).forEach(([type, metadata]) => {
        const kind = nodeGroup(type);
        if (currentGroup !== metadata.group) {
            const heading = document.createElement('div');
            heading.className = 'category-title'; heading.textContent = metadata.group;
            applyNodeGroup(heading, kind); $('paletteList').append(heading);
            currentGroup = metadata.group;
        }
        const card = document.createElement('button');
        card.className = 'layer-card'; card.draggable = true; card.dataset.type = type;
        card.setAttribute('aria-label', `Add ${type}, ${NODE_GROUPS[kind].label}`);
        card.title = metadata.description;
        applyNodeGroup(card, kind);
        card.innerHTML = `<span class="layer-icon-badge">${metadata.code}</span><span>${type}</span><span aria-hidden="true">+</span>`;
        $('paletteList').append(card);
    });
    Object.entries(NODE_GROUPS).forEach(([kind, group]) => {
        const item = document.createElement('span'); item.className = 'legend-item'; applyNodeGroup(item, kind);
        const swatch = document.createElement('span'); swatch.className = 'legend-swatch'; swatch.setAttribute('aria-hidden', 'true');
        item.append(swatch, document.createTextNode(group.label)); $('nodeLegend').append(item);
    });
    document.querySelectorAll('[data-role-kind]').forEach(card => applyNodeGroup(card, card.dataset.roleKind));
    $('layerSearch').addEventListener('input', event => {
        const query = event.target.value.trim().toLowerCase();
        let count = 0;
        const children = [...$('paletteList').children];
        children.filter(child => child.matches('.layer-card')).forEach(card => {
            card.hidden = !`${card.dataset.type} ${LAYER_CATALOG[card.dataset.type].description}`.toLowerCase().includes(query);
            if (!card.hidden) count++;
        });
        children.filter(child => child.matches('.category-title')).forEach(heading => {
            let item = heading.nextElementSibling, anyVisible = false;
            while (item && !item.matches('.category-title')) { if (!item.hidden) anyVisible = true; item = item.nextElementSibling; }
            heading.hidden = !anyVisible;
        });
        $('noSearchResults').hidden = count > 0;
    });
}

function resizeStage() {
    const nodes = [...modelState.nodes.values()];
    const width = Math.max(800, ...nodes.map(node => node.x + 280));
    const height = Math.max(350, ...nodes.map(node => node.y + 210));
    Object.assign($('graphStage').style, { width: `${width}px`, height: `${height}px`, transform: `scale(${zoom})` });
    Object.assign($('graphSpace').style, { width: `${width * zoom}px`, height: `${height * zoom}px` });
    $('graphViewport').dataset.scale = zoom;
    connectionManager.updateAll();
}
function setZoom(value) {
    zoom = Math.min(1.6, Math.max(0.35, value));
    $('zoomLevel').textContent = `${Math.round(zoom * 100)}%`;
    connectionManager.cancelConnection();
    resizeStage();
}
function fitView() {
    resizeStage();
    const nodes = [...modelState.nodes.values()];
    const width = Math.max(400, ...nodes.map(node => node.x + 250));
    const height = Math.max(250, ...nodes.map(node => node.y + 160));
    setZoom(Math.min(1, ($('canvasContainer').clientWidth - 24) / width, ($('canvasContainer').clientHeight - 24) / height));
    $('canvasContainer').scrollTo({ top: 0, left: 0 });
}
function arrangeGraph() {
    const graph = modelState.getGraph();
    const ordered = TopologicalSort(graph.nodes, graph.edges);
    ordered.forEach((node, index) => {
        const x = 45 + index * 255, y = 125;
        modelState.updatePosition(node.id, x, y);
        const card = $(node.id); card.style.left = `${x}px`; card.style.top = `${y}px`;
    });
    resizeStage();
    connectionManager.notice('Operators arranged in dependency order.');
}

function renderParameterForm(node) {
    $('operatorParameters').replaceChildren();
    if (!node) return;
    $('operatorDescription').textContent = LAYER_CATALOG[node.type].description;
    Object.entries(node.params).forEach(([key, value]) => {
        const label = document.createElement('label'); label.className = 'param-row';
        const title = document.createElement('span'); title.textContent = node.type === 'Linear' && key === 'out_features' ? 'out_features (units)' : key;
        let input;
        if (typeof DEFAULT_PARAMS[node.type][key] === 'boolean') {
            input = document.createElement('select');
            ['false', 'true'].forEach(text => { const option = document.createElement('option'); option.value = text; option.textContent = text; input.append(option); });
        } else {
            input = document.createElement('input'); input.spellcheck = false;
            if (key === 'shape') { input.type = 'text'; label.dataset.wide = 'true'; }
            else {
                input.type = 'number'; input.step = key === 'p' ? 'any' : '1';
                if (key === 'p') { input.min = '0'; input.max = '1'; }
                else if (key !== 'dim') input.min = key === 'padding' ? '0' : '1';
                input.inputMode = key === 'p' ? 'decimal' : 'numeric';
            }
        }
        input.value = String(value); input.name = key; input.setAttribute('aria-label', `${node.type} ${key}`);
        input.addEventListener('input', () => {
            const next = typeof DEFAULT_PARAMS[node.type][key] === 'boolean' ? input.value === 'true' : input.value;
            modelState.updateParam(node.id, key, next);
        });
        label.append(title, input); $('operatorParameters').append(label);
    });
}
function refreshInspectorFacts() {
    const node = modelState.nodes.get(selectedId);
    $('inspectorEmpty').hidden = Boolean(node);
    $('inspectorSelected').hidden = !node;
    $('inspectorSelection').textContent = node ? `${node.type} / ${node.id.slice(5).padStart(2, '0')}` : 'No selection';
    if (!node) return;
    const kind = nodeGroup(node.type, node.kind), group = NODE_GROUPS[kind];
    applyNodeGroup($('inspectorKind'), kind);
    $('inspectorKind').textContent = `${group.code} · ${group.label}`;
    const result = analysis.get(node.id);
    $('tensorContract').replaceChildren();
    for (const [name, value] of [['Input', result.input ? formatShape(result.input) : '—'], ['Output', formatShape(result.output)], ['Parameters', result.params === null ? 'Unresolved' : result.params.toLocaleString('en-GB')]]) {
        const row = document.createElement('div'); row.className = 'tensor-row';
        const term = document.createElement('dt'); term.textContent = name;
        const description = document.createElement('dd'); description.textContent = value;
        row.append(term, description); $('tensorContract').append(row);
    }
    $('inferenceNote').textContent = result.note;
    const labels = { valid: 'Compatible tensor shape', mismatch: 'Shape mismatch', 'awaiting-input': 'Awaiting input', blocked: 'Upstream shape unresolved', 'invalid-config': 'Check configuration' };
    $('shapeDiagnostic').hidden = result.status === 'valid';
    $('shapeDiagnostic').dataset.status = result.status;
    $('shapeDiagnosticTitle').textContent = labels[result.status];
    $('shapeDiagnosticMessage').textContent = result.note;
    $('shapeComparison').replaceChildren();
    if (result.expected && result.received) {
        for (const [label, text] of [['Expected', result.expected], ['Received', result.received]]) {
            const row = document.createElement('div'); row.className = 'tensor-row';
            const term = document.createElement('dt'); term.textContent = label;
            const value = document.createElement('dd'); value.textContent = text;
            row.append(term, value); $('shapeComparison').append(row);
        }
    }
    const breakdown = parameterBreakdown(node);
    $('parameterBreakdown').replaceChildren();
    for (const [label, value] of [['Weights', breakdown.weights], ['Biases', breakdown.biases], ['Total', breakdown.total]]) {
        const row = document.createElement('div'); row.className = 'tensor-row';
        const term = document.createElement('dt'); term.textContent = label;
        const text = document.createElement('dd'); text.textContent = value === null ? 'Not calculated' : value.toLocaleString('en-GB');
        row.append(term, text); $('parameterBreakdown').append(row);
    }
    $('parameterFormula').textContent = breakdown.formula;
    $('parameterAssumption').textContent = breakdown.assumption;
    $('selectedConnections').replaceChildren();
    const links = modelState.edges.filter(edge => edge.fromNodeId === node.id || edge.toNodeId === node.id);
    if (!links.length) { const text = document.createElement('p'); text.textContent = 'No connections yet.'; $('selectedConnections').append(text); }
    links.forEach(edge => {
        const row = document.createElement('div'); row.className = 'connection-detail';
        const text = document.createElement('span'); text.textContent = `${modelState.nodes.get(edge.fromNodeId).type} → ${modelState.nodes.get(edge.toNodeId).type}`;
        const button = document.createElement('button'); button.type = 'button'; button.textContent = '×';
        button.setAttribute('aria-label', `Remove ${text.textContent} connection`);
        button.addEventListener('click', () => {
            const connection = connectionManager.connections.find(item => item.fromNode.id === edge.fromNodeId && item.toNode.id === edge.toNodeId);
            if (connection) connectionManager.removeConnection(connection);
        });
        row.append(text, button); $('selectedConnections').append(row);
    });
    $('selectedDefinition').textContent = JSON.stringify({ ...node, kind, inputs: modelState.edges.filter(edge => edge.toNodeId === node.id).map(edge => edge.fromNodeId) }, null, 2);
}
function refreshWorkspace() {
    const graph = modelState.getGraph();
    analysis = analyzeGraph(graph);
    if (selectedId && !modelState.nodes.has(selectedId)) { selectedId = null; renderParameterForm(null); }
    const unresolved = [...analysis.values()].filter(result => !result.output).length;
    const unknownCounts = [...analysis.values()].filter(result => result.params === null).length;
    const count = [...analysis.values()].reduce((sum, result) => sum + (result.params || 0), 0);
    const terminals = graph.nodes.filter(node => !graph.edges.some(edge => edge.fromNodeId === node.id));
    $('modelLayerCount').textContent = String(graph.nodes.length);
    $('metricParams').textContent = !graph.nodes.length ? '—' : `${count.toLocaleString('en-GB')}${unknownCounts ? ' + ?' : ''}`;
    $('metricParams').title = unknownCounts ? `${unknownCounts} operator parameter counts need valid configuration values.` : 'Configured parameter count, including biases and affine normalization parameters. Independent of connection validity.';
    $('metricShape').textContent = !terminals.length ? '—' : terminals.length === 1 ? formatShape(analysis.get(terminals[0].id).output) : `${terminals.length} terminals`;
    $('metricValidation').textContent = !graph.nodes.length ? 'Empty' : unresolved ? `${unresolved} unresolved` : 'Derived';
    $('graphStatus').textContent = `${graph.nodes.length} operators · ${graph.edges.length} connections`;
    $('canvasEmpty').hidden = graph.nodes.length > 0;
    $('btnClear').disabled = !graph.nodes.length;
    $('btnAutoLayout').disabled = !graph.nodes.length;
    graph.nodes.forEach(node => {
        $(node.id).querySelector('.node-shape').textContent = formatShape(analysis.get(node.id).output);
        const units = $(node.id).querySelector('.node-units');
        if (units) units.textContent = String(node.params.out_features || 'Not set');
        const card = $(node.id), result = analysis.get(node.id);
        card.classList.toggle('selected', selectedId === node.id);
        card.dataset.shapeStatus = result.status;
        card.setAttribute('aria-invalid', String(['mismatch', 'invalid-config'].includes(result.status)));
        card.setAttribute('aria-description', result.note);
        card.title = `${node.type} · ${result.params === null ? 'Unknown' : result.params.toLocaleString('en-GB')} parameters\nOutput: ${formatShape(result.output)}\n${result.note}`;
        card.querySelector('.node-header').setAttribute('aria-pressed', String(selectedId === node.id));
        const status = card.querySelector('.node-status');
        status.hidden = result.status === 'valid';
        status.textContent = ({ mismatch: '⚠ Shape mismatch', 'awaiting-input': 'Awaiting input', blocked: 'Upstream unresolved', 'invalid-config': 'Check configuration' })[result.status] || '';
        status.title = result.note;
    });
    refreshInspectorFacts(); resizeStage();
}
function loadExample() {
    if (modelState.nodes.size) return;
    const example = [
        ['Input', { shape: '(3, 32, 32)' }],
        ['Conv2d', { in_channels: 3, out_channels: 16, kernel_size: 3, stride: 1, padding: 1 }],
        ['ReLU', {}], ['MaxPool2d', { kernel_size: 2, stride: 2 }], ['Flatten', { start_dim: 1 }],
        ['Linear', { in_features: 4096, out_features: 10 }]
    ];
    const cards = example.map(([type, params], index) => spawnNode(type, 45 + index * 255, 125, params));
    cards.slice(1).forEach((card, index) => connectionManager.connectNodes(cards[index], card));
    selectNode(cards[1].id);
    fitView();
    connectionManager.notice('Encoder example loaded. Select an operator to inspect or edit it.');
}

export function initWorkspace() {
    buildBrowser();
    initTabs('data-library-tab', 'library-');
    initTabs('data-inspector-tab', 'inspector-');
    $('operatorParameters').addEventListener('submit', event => event.preventDefault());
    window.addEventListener('modelGraphUpdated', refreshWorkspace);
    window.addEventListener('graphViewChanged', resizeStage);
    window.addEventListener('workspaceNotice', event => { $('workspaceNotice').textContent = event.detail; });
    window.addEventListener('nodeSelected', event => {
        selectedId = modelState.nodes.has(event.detail) ? event.detail : null;
        renderParameterForm(modelState.nodes.get(selectedId));
        // Keep updating the selection while respecting a deliberately hidden inspector.
        refreshWorkspace();
    });
    ['btnTogglePalette', 'btnCanvasPalette'].forEach(id => $(id).addEventListener('click', () => setPanelOpen('palette', $('layerPalette').hidden)));
    $('btnClosePalette').addEventListener('click', () => setPanelOpen('palette', false));
    ['toggleInspector', 'btnCanvasInspector'].forEach(id => $(id).addEventListener('click', () => setPanelOpen('inspector', $('operatorInspector').hidden)));
    $('btnCanvasFocus').addEventListener('click', () => setCanvasFocus(!beforeCanvasFocus));
    if (window.matchMedia?.('(max-width: 1150px)').matches) $('operatorInspector').hidden = true;
    if (narrowWorkspace()) $('layerPalette').hidden = true;
    syncPanels();
    $('btnRemoveSelected').addEventListener('click', () => { if (selectedId) removeNode(selectedId); });
    $('btnLoadExample').addEventListener('click', loadExample);
    $('btnAutoLayout').addEventListener('click', arrangeGraph);
    $('btnZoomIn').addEventListener('click', () => setZoom(zoom + .1));
    $('btnZoomOut').addEventListener('click', () => setZoom(zoom - .1));
    $('btnResetView').addEventListener('click', fitView);
    $('connectionRouting').addEventListener('change', event => { connectionManager.routing = event.target.value; connectionManager.updateAll(); });
    $('canvasContainer').addEventListener('click', event => {
        if (!event.target.closest('.graph-node, .connection-path, button')) selectNode(null);
    });
    window.addEventListener('resize', resizeStage);
    document.addEventListener('keydown', event => {
        const editing = event.target.closest('input, select, textarea, [contenteditable]');
        if (event.key === '/' && !editing && $('codeDrawer').classList.contains('hidden')) {
            event.preventDefault();
            setPanelOpen('palette', true);
            $('libraryTab-layers').click(); $('layerSearch').focus();
        }
    });
    refreshWorkspace();
}

export function insertOperator(type, x, y) {
    if (x === undefined) x = Math.max(-210, ...[...modelState.nodes.values()].map(node => node.x)) + 255;
    const card = spawnNode(type, x, y ?? 125);
    if (card) card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
