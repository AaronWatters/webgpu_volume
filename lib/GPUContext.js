

export class Context {
    constructor () {
        this.adapter = null;
        this.device = null;
        this.connected = false;
    };
    async connect() {
        this.adapter = await navigator.gpu.requestAdapter();
        if (this.adapter) {
            this.device = await this.adapter.requestDevice();
            if (this.device) {
                this.device.addEventListener('uncapturederror', (event) => {
                // Re-surface the error.
                console.error('A WebGPU error was not captured:', event.error);
            });
                this.connected = true;
            }
        }
    };
};