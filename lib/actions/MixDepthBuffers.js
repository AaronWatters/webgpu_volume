
// Mix two depth buffers with color values.
// The shapes of the buffers should usually match.

import * as UpdateAction from "./UpdateAction";
import * as GPUDataObject from "../data_objects/GPUDataObject";

import depth_buffer from "../wgsl_prefix/depth_buffer.wgsl?raw";
import mix_depth_buffers from "../wgsl_suffix/mix_depth_buffers.wgsl?raw";
import panel_buffer from "../wgsl_prefix/panel_buffer.wgsl?raw";

class MixParameters extends GPUDataObject.DataObject {
    constructor(ratios) {
        super();
        this.ratios = ratios;
        this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedFloats = new Float32Array(arrayBuffer);
        mappedFloats.set(this.ratios, 0);
    };
}

export class MixDepthBuffers extends UpdateAction.UpdateAction {
    constructor (
        fromDepthBuffer, 
        toDepthBuffer,
        ratios,
    ) {
        super();
        this.source = fromDepthBuffer;
        this.target = toDepthBuffer;
        this.ratios = ratios;
        this.parameters = new MixParameters(ratios);
    };
    change_ratio(new_ratio) {
        this.ratios = [new_ratio, new_ratio, new_ratio, new_ratio];
        this.parameters.ratios = this.ratios;
        this.parameters.push_buffer()
    };
    get_shader_module(context) {
        const gpu_shader = panel_buffer + depth_buffer + mix_depth_buffers;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        // loop through output
        return [Math.ceil(this.target.size / 256), 1, 1];
    };
};