const drawer = document.getElementById("codeDrawer");
const openButton = document.getElementById("btnToggleCode");
const closeButton = document.getElementById("btnClose");

openButton.addEventListener("click", () => drawer.classList.remove("hidden"));
closeButton.addEventListener("click", () => drawer.classList.add("hidden"));

const palette = document.getElementById("palette");
const togglePaletteButton = document.getElementById("layerPalette");

togglePaletteButton.addEventListener("click", () => {
    drawer.classList.toggle("collapsed");
});