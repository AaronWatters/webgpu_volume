

import * as GPUVolume from "./GPUVolume.js";
import * as SampleVolume from "./SampleVolume.js";
import * as GPUColorPanel from "./GPUColorPanel.js";
import * as PaintPanel from "./PaintPanel.js";

// convenience
export function get_context() {
    return new Context();
};

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
    connect_then_call(callback) {
        // convenience for external interfaces.
        var that = this;
        async function go() {
            await that.connect();
            callback();
        };
        go();
    };
    must_be_connected() {
        if (!this.connected) {
            throw new Error("context is not connected.");
        }
    }
    // Data object conveniences.
    volume(shape, data, ijk2xyz) {
        this.must_be_connected()
        result = new GPUVolume.Volume(shape, data, ijk2xyz);
        result.attach_to_context(this);
        return result;
    };
    panel(width, height) {
        this.must_be_connected()
        result = new GPUColorPanel.Panel(width, height);
        result.attach_to_context(this);
        return result;
    };
    // Action conveniences.
    sample(shape, ijk2xyz, volumeToSample) {
        this.must_be_connected()
        result = new SampleVolume.SampleVolume(shape, ijk2xyz, volumeToSample);
        result.attach_to_context(this);
        return result;
    };
    paint(panel, to_canvas) {
        this.must_be_connected()
        result = new PaintPanel.PaintPanel(panel, to_canvas);
        result.attach_to_context(this);
        return result;
    };
};
