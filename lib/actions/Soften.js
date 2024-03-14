
// Soften a volume
// Quick and dirty low pass filter.

import * as UpdateAction from "./UpdateAction";
import * as GPUDataObject from "../data_objects/GPUDataObject";
import volume_frame from "../wgsl_prefix/volume_frame.wgsl?raw";
import soften_volume from "../wgsl_suffix/soften_volume.wgsl?raw";

// from "misc calculations" notebook.
const default_weights = new Float32Array([0.43855053, 0.03654588, 0.0151378, 0.02006508])

class SoftenParameters extends GPUDataObject.DataObject {
    constructor (
        offset_weights, // 4 weights per offset rectangular distance from voxel
    ) {
        super();
        offset_weights = offset_weights || default_weights;
        this.offset_weights = offset_weights;
        this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedFloats = new Float32Array(arrayBuffer);
        mappedFloats.set(this.offset_weights, 0);
    };
};

export class SoftenVolume extends UpdateAction.UpdateAction {
    constructor (
        fromVolume,
        toVolume,
        offset_weights,
    ) {
        super();
        this.source = fromVolume;
        this.target = toVolume;
        this.offset_weights = offset_weights;
        this.parameters = new SoftenParameters(this.offset_weights);
    };
    get_shader_module(context) {
        const gpu_shader = volume_frame + soften_volume;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        return [Math.ceil(this.target.size / 256), 1, 1];
    };
};
