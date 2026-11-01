import { modelState } from "../components/ModelState";
import { PyTorchEmitter } from "../emmiters/PyTorchEmmiter";


export function updateCodeView(){
    const graph = modelState.getGraph();
    const code = PyTorchEmitter.generate(graph);
    codeDrawer.updateCode(code);
}