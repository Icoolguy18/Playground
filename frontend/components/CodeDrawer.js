import { modelState } from "./ModelState.js";
import { PyTorchEmitter } from "../emmiters/PyTorchEmmiter.js";


export const codeDrawer = new class CodeDrawer {
    constructor() {
        this.drawer = document.getElementById("codeDrawer");
        this.openBtn = document.getElementById("btnToggleCode");
        this.closeBtn = document.getElementById("btnCloseDrawer");
        this.copyBtn = document.getElementById("copyBtn");
        this.exportBtn = document.getElementById("exportBtn");
        this.refreshBtn = document.getElementById("refreshBtn");

        this.codeOutput = document.getElementById("codeOutput")
            .querySelector("code") || document.getElementById("codeOutput");
        this.formatBadge = document.getElementById("formatBadge");

        this.initListeners();
    }

    initListeners() {
        this.openBtn.addEventListener("click", () =>
            this.drawer.classList.remove("hidden"))
            console.debug("Opening code drawer");
        this.closeBtn.addEventListener("click", () =>
            this.drawer.classList.add("hidden"));
        this.exportBtn.addEventListener("click", () =>{
            const text = this.codeOutput.textContent;
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${modelState.modelName || "customModel"}.py`
            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(url)
        });
        this.copyBtn.addEventListener("click", () =>{
           const text = this.codeOutput.textContent;
           navigator.clipboard.writeText(text).then(()=> {
               const originalText = this.copyBtn.textContent;
               this.copyBtn.textContent = "Copied";
               setTimeout(()=> {
                   this.copyBtn.textContent = originalText;

               }, 1500);
           }).catch(err => {
               console.log("Failed to copy to clipboard: " + err);
           });
        });
        this.refreshBtn.addEventListener("click", () =>{
            this.refreshCode()
        });
    }

    refreshCode(){
        const graph = modelState.getGraph();
        const framework = graph.framework;
        console.debug(framework.id)

        if(this.formatBadge){
            this.formatBadge.textContent = `${framework.name} ${framework.version}`;
        }

        let generatedCode = "";
        if (framework.id === "pytorch_2") {
            console.debug("generating for framework PyTorch")
            generatedCode = PyTorchEmitter.generate(graph);
            console.debug(generatedCode)
        }
        else {
            generatedCode = `Emitter not implemented for framework ${framework.id}`
            console.warn(`Emitter not implemented for framework ${framework.id}`)
        }
        this.codeOutput.textContent = generatedCode;

    }
    /*updateCode(codeString) {
        document.getElementById("codeOutput").querySelector("code").textContent = codeString;
    }
     */
}