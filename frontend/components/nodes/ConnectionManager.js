import { modelState } from '../ModelState.js';

class ConnectionManager {
    constructor() {
        this.connections = [];
        this.isConnecting = false;
        this.activeSourceSocket = null;
        this.tempPathEl = null;
        this.routing = 'curve';
        this.svgLayer = document.getElementById('svgConnectionsLayer');
        this.viewport = document.getElementById('graphViewport');
        window.addEventListener('pointermove', event => {
            if (!this.isConnecting) return;
            const start = this.getSocketCenter(this.activeSourceSocket);
            const end = this.getCanvasRelativeCoords(event.clientX, event.clientY);
            this.tempPathEl.setAttribute('d', this.getBezierPath(start.x, start.y, end.x, end.y));
        });
        window.addEventListener('pointerup', event => {
            if (!this.isConnecting) return;
            const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.socket-input');
            if (target) this.completeConnection(target);
            else if (event.target !== this.activeSourceSocket) this.cancelConnection();
        });
        window.addEventListener('pointercancel', () => this.cancelConnection());
        window.addEventListener('keydown', event => { if (event.key === 'Escape') this.cancelConnection(); });
    }

    notice(message) { window.dispatchEvent(new CustomEvent('workspaceNotice', { detail: message })); }
    attachSocketListeners(node) {
        const output = node.querySelector('.socket-output');
        const input = node.querySelector('.socket-input');
        output.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            event.stopPropagation();
            this.startConnection(output);
        });
        output.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault(); this.startConnection(output);
            }
        });
        input.addEventListener('keydown', event => {
            if (this.isConnecting && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault(); this.completeConnection(input);
            }
        });
    }
    startConnection(socket) {
        this.cancelConnection();
        this.isConnecting = true;
        this.activeSourceSocket = socket;
        this.tempPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.tempPathEl.setAttribute('class', 'connection-path temp-wire');
        this.svgLayer.append(this.tempPathEl);
        this.notice('Choose an input socket to complete the connection. Escape cancels.');
    }
    completeConnection(targetSocket) {
        if (!this.activeSourceSocket) return;
        const source = this.activeSourceSocket.closest('.graph-node');
        const target = targetSocket.closest('.graph-node');
        this.cancelConnection();
        this.connectNodes(source, target);
    }
    connectNodes(source, target) {
        const error = modelState.validateEdge(source.id, target.id);
        if (error) { this.notice(error); return false; }
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('class', 'connection-path');
        pathEl.setAttribute('tabindex', '0');
        pathEl.setAttribute('role', 'button');
        pathEl.setAttribute('aria-label', `Remove connection from ${source.dataset.type} to ${target.dataset.type}`);
        const connection = {
            fromNode: source, toNode: target,
            fromSocket: source.querySelector('.socket-output'),
            toSocket: target.querySelector('.socket-input'), pathEl
        };
        pathEl.addEventListener('click', () => this.removeConnection(connection));
        pathEl.addEventListener('keydown', event => {
            if (['Delete', 'Backspace', 'Enter'].includes(event.key)) {
                event.preventDefault(); this.removeConnection(connection);
            }
        });
        this.connections.push(connection);
        this.svgLayer.append(pathEl);
        this.updateConnectionPath(connection);
        modelState.addEdge(source.id, target.id);
        this.notice('Connection added.');
        return true;
    }
    removeConnection(connection) {
        connection.pathEl.remove();
        this.connections = this.connections.filter(item => item !== connection);
        modelState.removeEdge(connection.fromNode.id, connection.toNode.id);
        this.notice('Connection removed.');
    }
    cancelConnection() {
        this.tempPathEl?.remove();
        this.tempPathEl = null;
        this.isConnecting = false;
        this.activeSourceSocket = null;
    }
    updateNodeConnections(node) {
        this.connections.filter(item => item.fromNode === node || item.toNode === node).forEach(item => this.updateConnectionPath(item));
    }
    updateAll() { this.connections.forEach(item => this.updateConnectionPath(item)); }
    updateConnectionPath(connection) {
        const a = this.getSocketCenter(connection.fromSocket), b = this.getSocketCenter(connection.toSocket);
        connection.pathEl.setAttribute('d', this.getBezierPath(a.x, a.y, b.x, b.y));
    }
    getBezierPath(x1, y1, x2, y2) {
        if (this.routing === 'elbow') {
            const mid = (x1 + x2) / 2;
            return `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`;
        }
        const bend = Math.max(60, Math.abs(x2 - x1) * 0.48);
        return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
    }
    getSocketCenter(socket) {
        const rect = socket.getBoundingClientRect();
        return this.getCanvasRelativeCoords(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
    getCanvasRelativeCoords(clientX, clientY) {
        const rect = this.viewport.getBoundingClientRect(), scale = Number(this.viewport.dataset.scale) || 1;
        return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
    }
    removeNodeConnections(node) {
        this.connections = this.connections.filter(item => {
            if (item.fromNode !== node && item.toNode !== node) return true;
            item.pathEl.remove(); return false;
        });
        this.cancelConnection();
    }
    clearAll() {
        this.connections.forEach(item => item.pathEl.remove());
        this.connections = [];
        this.cancelConnection();
    }
}
export const connectionManager = new ConnectionManager();
