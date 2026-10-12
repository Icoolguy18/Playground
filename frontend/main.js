import { CodeDrawer } from './components/CodeDrawer.js';
import { initDragAndDrop } from './components/LayerDragAndDrop.js';
import { spawnNode, clearWorkspace } from './components/nodes/nodeManager.js'; // your decoupled node factory

document.addEventListener("DOMContentLoaded", () => {
    const drawer = new CodeDrawer();

    // Palette toggle
    document.getElementById("btnTogglePalette").addEventListener("click", () => {
        document.getElementById("layerPalette").classList.toggle("collapsed");
    });

    // Initialize drag-and-drop with node spawning handler
    initDragAndDrop((type, x, y) => spawnNode(type, x, y));

    // Clear workspace
    document.getElementById("btnClear").addEventListener("click", clearWorkspace);
});