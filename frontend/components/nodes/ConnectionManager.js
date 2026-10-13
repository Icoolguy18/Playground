import { ModelState } from "../ModelState.js";

const modelState = new ModelState();

export class ConnectionManager {
    constructor() {
        this.connections = [];
        this.isConnecting = false;
        this.activeSourceSocket = null;
        this.tempPathEl = null;

        this.svgLayer = document.getElementById("svgConnectionsLayer");
        this.viewport = document.getElementById("graphViewport");

        this.initGlobalListeners();
    }

    initGlobalListeners() {
        window.addEventListener("mousemove", (e) => {
            if (!this.isConnecting || !this.tempPathEl) return;
            const targetCoords = this.getCanvasRelativeCoords(e.clientX, e.clientY);
            const sourceCoords = this.getSocketCenter(this.activeSourceSocket);

            this.tempPathEl.setAttribute("d", this.getBezierPath(sourceCoords.x, sourceCoords.y, targetCoords.x, targetCoords.y));
        });

        window.addEventListener("mouseup", () => {
            if (this.isConnecting) {
                this.cancelConnection();
            }
        });
    }

    attachSocketListeners(nodeElement) {
        const outputSocket = nodeElement.querySelector(".socket-output");
        const inputSocket = nodeElement.querySelector(".socket-input");

        if (outputSocket) {
            outputSocket.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                this.startConnection(outputSocket);
            });
        }

        if (inputSocket) {
            inputSocket.addEventListener("mouseup", (e) => {
                e.stopPropagation();
                if (this.isConnecting) {
                    this.completeConnection(inputSocket);
                }
            });
        }
    }

    startConnection(socket) {
        this.isConnecting = true;
        this.activeSourceSocket = socket;

        this.tempPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.tempPathEl.setAttribute("class", "connection-path temp-wire");
        this.svgLayer.appendChild(this.tempPathEl);
    }

    completeConnection(targetSocket) {
        const sourceNode = this.activeSourceSocket.closest(".graph-node");
        const targetNode = targetSocket.closest(".graph-node");

        if (sourceNode === targetNode) {
            this.cancelConnection();
            return;
        }

        const exists = this.connections.some(
            c => c.fromSocket === this.activeSourceSocket && c.toSocket === targetSocket
        );

        if (!exists) {
            const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathEl.setAttribute("class", "connection-path");
            this.svgLayer.appendChild(pathEl);

            const connection = {
                fromNode: sourceNode,
                toNode: targetNode,
                fromSocket: this.activeSourceSocket,
                toSocket: targetSocket,
                pathEl: pathEl
            };

            this.connections.push(connection);
            this.updateConnectionPath(connection);
        }
        modelState.addEdge(sourceNode.id, targetNode.id);
        this.cancelConnection();
    }

    cancelConnection() {
        if (this.tempPathEl) {
            this.tempPathEl.remove();
            this.tempPathEl = null;
        }
        this.isConnecting = false;
        this.activeSourceSocket = null;
    }

    updateNodeConnections(nodeElement) {
        this.connections.forEach(conn => {
            if (conn.fromNode === nodeElement || conn.toNode === nodeElement) {
                this.updateConnectionPath(conn);
            }
        });
    }

    updateConnectionPath(conn) {
        const start = this.getSocketCenter(conn.fromSocket);
        const end = this.getSocketCenter(conn.toSocket);
        conn.pathEl.setAttribute("d", this.getBezierPath(start.x, start.y, end.x, end.y));
    }

    getBezierPath(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1) * 0.5;
        return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    }

    getSocketCenter(socketEl) {
        const viewportRect = this.viewport.getBoundingClientRect();
        const socketRect = socketEl.getBoundingClientRect();
        return {
            x: socketRect.left - viewportRect.left + socketRect.width / 2,
            y: socketRect.top - viewportRect.top + socketRect.height / 2
        };
    }

    getCanvasRelativeCoords(clientX, clientY) {
        const viewportRect = this.viewport.getBoundingClientRect();
        return {
            x: clientX - viewportRect.left,
            y: clientY - viewportRect.top
        };
    }

    removeNodeConnections(nodeElement) {
        this.connections = this.connections.filter(conn => {
            if (conn.fromNode === nodeElement || conn.toNode === nodeElement) {
                conn.pathEl.remove();
                return false;
            }
            return true;
        });
    }

    clearAll() {
        this.connections.forEach(conn => conn.pathEl.remove());
        this.connections = [];
        this.cancelConnection();
    }
}
