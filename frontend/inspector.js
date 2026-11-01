/* SageMaker-inspired selection panes. No dependency on a UI framework. */
function setupPaneTabs(selector, attribute, panelPrefix) {
    const buttons = [...document.querySelectorAll(selector)];
    function activate(button, focus = false) {
        buttons.forEach(item => {
            const active = item === button;
            item.setAttribute('aria-selected', String(active));
            item.tabIndex = active ? 0 : -1;
            document.getElementById(panelPrefix + item.dataset[attribute]).hidden = !active;
        });
        if (focus) button.focus();
    }
    buttons.forEach((button, index) => {
        button.addEventListener('click', () => activate(button));
        button.addEventListener('keydown', event => {
            let next = index;
            if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
            else if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = buttons.length - 1;
            else return;
            event.preventDefault();
            activate(buttons[next], true);
        });
    });
}

setupPaneTabs('[data-library]', 'library', 'library-');
setupPaneTabs('[data-inspector]', 'inspector', 'panel-');

const inspectorToggle = document.getElementById('toggleInspector');
inspectorToggle.addEventListener('click', () => {
    const expanded = inspectorToggle.getAttribute('aria-expanded') !== 'true';
    inspectorToggle.setAttribute('aria-expanded', String(expanded));
    inspectorToggle.setAttribute('aria-label', expanded ? 'Collapse inspector' : 'Expand inspector');
    inspectorToggle.textContent = expanded ? '−' : '+';
    document.getElementById('inspectorBody').hidden = !expanded;
});

function updateInspectorContext() {
    const node = nodes.find(item => item.id === selected);
    if (!node) return;
    const kind = nodeGroup(node.type, node.kind);
    const groupBadge = document.getElementById('inspectorKind');
    applyNodeGroup(groupBadge, kind);
    groupBadge.textContent = `${NODE_GROUPS[kind].code} · ${NODE_GROUPS[kind].label}`;
    document.getElementById('inspectorSelection').textContent = `${node.type} / ${String(node.id + 1).padStart(2, '0')}`;
    document.getElementById('selectedDefinition').textContent = JSON.stringify({
        id: `operator_${node.id + 1}`,
        kind: nodeGroup(node.type, node.kind),
        implementation: node.type,
        parameters: node.params,
        inputs: edges.filter(([, to]) => to === node.id).map(([from]) => `operator_${from + 1}`)
    }, null, 2);
}

const refreshOperatorMetrics = refreshResearch;
refreshResearch = function () {
    refreshOperatorMetrics();
    updateInspectorContext();
};
const inspectOperator = inspect;
inspect = function () {
    inspectOperator();
    // A new canvas selection reopens the inspector and preserves the chosen tab.
    document.getElementById('inspectorBody').hidden = false;
    inspectorToggle.setAttribute('aria-expanded', 'true');
    inspectorToggle.setAttribute('aria-label', 'Collapse inspector');
    inspectorToggle.textContent = '−';
};
updateInspectorContext();

// The legend is rendered from the same metadata used by nodes and the inspector.
const legend = document.getElementById('nodeLegend');
Object.entries(NODE_GROUPS).forEach(([kind, group]) => {
    const item = document.createElement('span');
    item.className = 'legend-item';
    applyNodeGroup(item, kind);
    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch';
    swatch.setAttribute('aria-hidden', 'true');
    item.append(swatch, document.createTextNode(group.label));
    legend.append(item);
});
document.querySelectorAll('[data-preview-kind]').forEach(card => applyNodeGroup(card, card.dataset.previewKind));
