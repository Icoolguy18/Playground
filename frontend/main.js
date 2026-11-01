import { codeDrawer } from './components/CodeDrawer.js';
import { initDragAndDrop } from './components/LayerDragAndDrop.js';
import { clearWorkspace } from './components/nodes/NodeManager.js';
import { modelState } from './components/ModelState.js';
import { initWorkspace, insertOperator } from './components/Workspace.js';

initWorkspace();
initDragAndDrop(insertOperator);
document.getElementById('btnClear').addEventListener('click', clearWorkspace);

const nameInput = document.getElementById('modelNameInput');
nameInput.value = modelState.modelName;
nameInput.addEventListener('input', () => modelState.setModelName(nameInput.value.trim()));
document.getElementById('frameworkSelector').addEventListener('change', event => modelState.setFramework(event.target.value));
window.addEventListener('modelGraphUpdated', () => {
    if (!codeDrawer.drawer.classList.contains('hidden')) codeDrawer.refreshCode();
});
