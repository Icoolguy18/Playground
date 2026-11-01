import { modelState } from './ModelState.js';
import { PyTorchEmitter } from '../emmiters/PyTorchEmmiter.js';
import { KerasEmitter } from '../emmiters/KerasEmmiter.js';

class CodeDrawer {
    constructor() {
        this.drawer = document.getElementById('codeDrawer');
        this.openBtn = document.getElementById('btnToggleCode');
        this.closeBtn = document.getElementById('btnCloseDrawer');
        this.copyBtn = document.getElementById('copyBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.codeOutput = document.querySelector('#codeOutput code');
        this.formatBadge = document.getElementById('codeFormatBadge');
        this.message = document.getElementById('codeMessage');
        this.app = document.querySelector('.playground-container');
        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshCode());
        this.copyBtn.addEventListener('click', () => this.copy());
        this.exportBtn.addEventListener('click', () => this.export());
        this.drawer.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.preventDefault(); this.close(); }
            if (event.key !== 'Tab') return;
            const buttons = [...this.drawer.querySelectorAll('button:not(:disabled)')];
            const first = buttons[0], last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        });
    }
    open() {
        this.refreshCode();
        this.drawer.classList.remove('hidden');
        this.drawer.setAttribute('aria-hidden', 'false');
        this.drawer.inert = false; this.app.inert = true;
        this.closeBtn.focus();
    }
    close() {
        this.app.inert = false; this.drawer.inert = true;
        this.drawer.classList.add('hidden'); this.drawer.setAttribute('aria-hidden', 'true');
        this.openBtn.focus();
    }
    refreshCode() {
        const graph = modelState.getGraph();
        this.formatBadge.textContent = `${graph.framework.name} ${graph.framework.version}`;
        try {
            const emitter = graph.framework.id === 'pytorch_2' ? PyTorchEmitter : graph.framework.id === 'keras_3' ? KerasEmitter : null;
            if (!emitter) throw new Error('Export for this framework is not available yet.');
            this.codeOutput.textContent = emitter.generate(graph);
            this.copyBtn.disabled = false; this.exportBtn.disabled = false;
            this.message.textContent = 'Generated from the current architecture. Training is not included.';
            return true;
        } catch (error) {
            this.codeOutput.textContent = '';
            this.copyBtn.disabled = true; this.exportBtn.disabled = true;
            this.message.textContent = error.message;
            return false;
        }
    }
    async copy() {
        if (!this.refreshCode()) return;
        try {
            await navigator.clipboard.writeText(this.codeOutput.textContent);
            this.message.textContent = 'Model code copied.';
        } catch {
            this.message.textContent = 'Clipboard access was unavailable. Select the code to copy it, or export the file.';
        }
    }
    export() {
        if (!this.refreshCode()) return;
        const blob = new Blob([this.codeOutput.textContent], { type: 'text/x-python;charset=utf-8' });
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = `${modelState.modelName}.py`; document.body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.message.textContent = 'Model code exported.';
    }
}
export const codeDrawer = new CodeDrawer();
