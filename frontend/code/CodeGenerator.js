import { ModelState } from "../components/ModelState";
import { PyTorchEmitter } from "../emmiters/PyTorchEmmiter";

const modelState = new ModelState();

export function updateCodeView(){
    const graph = modelState.getGraph();
    const code = PyTorchEmitter.generate(graph);
    codeDrawer.updateCode(code);
}