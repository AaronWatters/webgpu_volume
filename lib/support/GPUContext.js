

// Container for GPU adapter and device, with construction conveniences

import * as GPUVolume from "../data_objects/GPUVolume.js";
import * as SampleVolume from "../actions/SampleVolume.js";
import * as GPUColorPanel from "../data_objects/GPUColorPanel.js";
import * as PaintPanel from "../actions/PaintPanel.js";
import * as MaxProjection from "../actions/MaxProjection.js";
import * as GPUDepthBuffer from "../data_objects/GPUDepthBuffer.js";
import * as UpdateGray from "../actions/UpdateGray.js";
import * as GPUAction from "../actions/GPUAction.js";

// convenience
export function get_context() {
    return new Context();
};

export async function get_connected_context() {
    const context = new Context();
    await context.connect();
    return context;
};

function alert_and_error_if_no_gpu() {
    if ((!navigator.gpu) || (!navigator.gpu.requestAdapter)) {
        alert("Cannot get WebGPU context. This browser does not have WebGPU enabled.");
        throw new Error("Can't get WebGPU context.");
    }
};

export class Context {
    constructor () {
        alert_and_error_if_no_gpu();
        this.adapter = null;
        this.device = null;
        this.connected = false;
    };
    async connect() {
        try {
            if (this.connected) {
                return;  // permit multiple connects
            }
            this.adapter = await navigator.gpu.requestAdapter();
            if (this.adapter) {
                //console.log("got adapter", this.adapter)
                const max_buffer = this.adapter.limits.maxStorageBufferBindingSize;
                const required_limits = {};
                // https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/limits
                required_limits.maxStorageBufferBindingSize = max_buffer;
                required_limits.maxBufferSize = max_buffer;
                this.device = await this.adapter.requestDevice({
                    "requiredLimits": required_limits,
                });
                if (this.device) {
                    this.device.addEventListener('uncapturederror', (event) => {
                        // Re-surface the error.
                        console.error('A WebGPU error was not captured:', event.error);
                    });
                    this.connected = true;
                    //console.log("got device", this.device)
                } else {
                    throw new Error("Could not get device from gpu adapter");
                }
            } else {
                throw new Error("Could not get gpu adapter");
            }
        } finally {
            if (!this.connected) {
                alert("Failed to connect WebGPU. This browser does not have WebGPU enabled.");
            }
        }
    };
    destroy() {
        if (this.connected) {
            this.device.destroy();
            this.connected = false;
        }
        this.device = null;
        this.adapter = null;
    };
    onSubmittedWorkDone() {
        // synchrony convenience
        this.must_be_connected();
        return this.device.queue.onSubmittedWorkDone();
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
    volume(shape_in, content_in, ijk2xyz_in, Float32Array) {
        this.must_be_connected()
        const result = new GPUVolume.Volume(shape_in, content_in, ijk2xyz_in, Float32Array);
        result.attach_to_context(this);
        return result;
    };
    depth_buffer(
        shape,
        default_depth,
        default_value,
        data,
        depths,
        data_format,
    ) {
        this.must_be_connected();
        const result = new GPUDepthBuffer.DepthBuffer(
            shape,
            default_depth,
            default_value,
            data,
            depths,
            data_format,
        );
        result.attach_to_context(this);
        return result;
    }
    panel(width, height) {
        this.must_be_connected()
        const result = new GPUColorPanel.Panel(width, height);
        result.attach_to_context(this);
        return result;
    };
    // Action conveniences.
    sample(shape, ijk2xyz, volumeToSample) {
        this.must_be_connected()
        const result = new SampleVolume.SampleVolume(shape, ijk2xyz, volumeToSample);
        result.attach_to_context(this);
        return result;
    };
    paint(panel, to_canvas) {
        this.must_be_connected()
        const result = new PaintPanel.PaintPanel(panel, to_canvas);
        result.attach_to_context(this);
        return result;
    };
    to_gray_panel(
        from_panel,
        to_panel,
        min_value,
        max_value,
    ) {
        this.must_be_connected()
        const result = new UpdateGray.ToGrayPanel(
            from_panel,
            to_panel,
            min_value,
            max_value,
        );
        result.attach_to_context(this);
        return result;
    };
    max_projection(
        fromVolume,
        toDepthBuffer,
        ijk2xyz,
    ) {
        this.must_be_connected()
        const result = new MaxProjection.MaxProject(
            fromVolume,
            toDepthBuffer,
            ijk2xyz,
        );
        result.attach_to_context(this);
        return result;
    };
    sequence(
        actions,
    ) {
        this.must_be_connected()
        const result = new GPUAction.ActionSequence(
            actions,
        );
        result.attach_to_context(this);
        return result;
    };
};
