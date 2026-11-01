// Palette buttons support click/keyboard insertion as well as drag and drop.
export function initDragAndDrop(onDropCallback) {
    const canvas = document.getElementById('canvasContainer');
    const viewport = document.getElementById('graphViewport');
    document.querySelectorAll('.layer-card').forEach(card => {
        card.addEventListener('dragstart', event => {
            event.dataTransfer.setData('layerType', card.dataset.type);
            event.dataTransfer.effectAllowed = 'copy';
        });
        card.addEventListener('click', () => onDropCallback(card.dataset.type));
    });
    canvas.addEventListener('dragover', event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; });
    canvas.addEventListener('drop', event => {
        event.preventDefault();
        const type = event.dataTransfer.getData('layerType');
        if (!type) return;
        const rect = viewport.getBoundingClientRect(), scale = Number(viewport.dataset.scale) || 1;
        onDropCallback(type, Math.max(20, (event.clientX - rect.left) / scale - 96), Math.max(50, (event.clientY - rect.top) / scale - 35));
    });
}
