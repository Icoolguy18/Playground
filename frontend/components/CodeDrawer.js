// components/CodeDrawer.js
export class CodeDrawer {
    constructor() {
        this.drawer = document.getElementById("codeDrawer");
        this.openBtn = document.getElementById("btnToggleCode");
        this.closeBtn = document.getElementById("btnCloseDrawer");
        this.initListeners();
    }

    initListeners() {
        this.openBtn.addEventListener("click", () => this.drawer.classList.remove("hidden"));
        this.closeBtn.addEventListener("click", () => this.drawer.classList.add("hidden"));
    }

    updateCode(codeString) {
        document.getElementById("codeOutput").querySelector("code").textContent = codeString;
    }
}