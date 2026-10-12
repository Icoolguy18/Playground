// components/LayerDragAndDrop.js
export function initDragAndDrop(onDropCallback) {
    const layerCards = document.querySelectorAll(".layer-card");
    const canvasContainer = document.getElementById("canvasContainer");

    layerCards.forEach(card => {
        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("layerType", card.getAttribute("data-type"));
            e.dataTransfer.effectAllowed = "copy";
        });
    });

    canvasContainer.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    });

    canvasContainer.addEventListener("drop", (e) => {
        e.preventDefault();
        const layerType = e.dataTransfer.getData("layerType");
        if (!layerType) return;

        const canvasRect = canvasContainer.getBoundingClientRect();
        const dropX = Math.max(10, e.clientX - canvasRect.left - 95);
        const dropY = Math.max(10, e.clientY - canvasRect.top - 30);

        onDropCallback(layerType, dropX, dropY);
    });
}