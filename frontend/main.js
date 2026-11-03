// main.js
import { codeDrawer } from './components/CodeDrawer.js';
import { initDragAndDrop } from './components/LayerDragAndDrop.js';
import { initComponentBrowser } from "./components/ComponentBrowser.js";
import { spawnNode, clearWorkspace } from './components/nodes/NodeManager.js';
import { modelState } from "./components/ModelState.js";

console.log("main.js is running");
console.debug("Loaded Model State");
console.debug("Loaded code drawer");

const togglePaletteBtn = document.getElementById("btnTogglePalette");
if (togglePaletteBtn) {
    togglePaletteBtn.addEventListener("click", () => {
        document.getElementById("layerPalette").classList.toggle("collapsed");
    });
}

initComponentBrowser(type => {
    const canvas = document.getElementById("canvasContainer");
    const viewport = document.getElementById("graphViewport");
    const count = viewport.querySelectorAll(".graph-node").length;

    const offset = (count % 6) * 24;

    const x = Math.max(10, Math.min(
            40 + offset, canvas.clientWidth - 230
        ));

    const y = Math.max(10,
        Math.min(
            100 + offset, canvas.clientHeight - 180
        ));

    spawnNode(type, x, y);
});

initDragAndDrop((type, x, y) => {
    spawnNode(type, x, y);
});

const btnClear = document.getElementById("btnClear");
if (btnClear) {
    btnClear.addEventListener("click", clearWorkspace);
}

document.addEventListener("DOMContentLoaded", () => {
    const frameworkSelector = document.getElementById("frameworkSelector");
    if (frameworkSelector) {
        frameworkSelector.addEventListener("change", (e) => {
            modelState.setFramework(e.target.value);
            codeDrawer.refreshCode()
        });
    }

    const modelNameInput = document.getElementById("modelNameInput");
    if (modelNameInput) {
        modelNameInput.addEventListener("change", (e) => {
            modelState.setModelName(e.target.value.trim());
            codeDrawer.refreshCode()
        })
    }
})

window.addEventListener("modelGraphUpdated", () => {
    if (!codeDrawer.drawer.classList.contains("hidden")) {
        codeDrawer.refreshCode();
    }
});