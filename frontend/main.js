// main.js
import { CodeDrawer } from './components/CodeDrawer.js';
import { initDragAndDrop } from './components/LayerDragAndDrop.js';
import { spawnNode, clearWorkspace } from './components/nodes/nodeManager.js';

console.log("main.js is running");
// Initialize Code Drawer
const drawer = new CodeDrawer();

// Palette toggle
const togglePaletteBtn = document.getElementById("btnTogglePalette");
if (togglePaletteBtn) {
    togglePaletteBtn.addEventListener("click", () => {
        document.getElementById("layerPalette").classList.toggle("collapsed");
    });
}

// Initialize drag-and-drop directly
initDragAndDrop((type, x, y) => {
    spawnNode(type, x, y);
});

// Clear workspace
const btnClear = document.getElementById("btnClear");
if (btnClear) {
    btnClear.addEventListener("click", clearWorkspace);
}