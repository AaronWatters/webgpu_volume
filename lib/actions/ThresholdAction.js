
// probe into volume and find threshold crossings

// xxxx this is copy/pasted from MaxProjection.js -- should unify somehow.

import * as UpdateAction from "./UpdateAction"
import * as GPUDataObject from "../data_objects/GPUDataObject";
import * as qdVector from "qd_vector";

import depth_buffer from "../wgsl_prefix/depth_buffer.wgsl?raw";
import volume_frame from "../wgsl_prefix/volume_frame.wgsl?raw";
import threshold from "../wgsl_suffix/threshold.wgsl?raw";

class ThresholdParameters extends GPUDataObject.DataObject {
    constructor (
        ijk2xyz, // 4x4 matrix (qdVector embedded list format)
        k_limit, // positive int
        threshold_value, // f32
    ) {
        super();
        this.set_matrix(ijk2xyz);
        this.k_limit = k_limit;
        this.threshold_value = threshold_value;
        // matrix + limit + value + 2 padding words for alignment
        this.buffer_size = (4*4 + 4) * Int32Array.BYTES_PER_ELEMENT;
    };
    set_matrix(ijk2xyz) {
        this.ijk2xyz = qdVector.M_column_major_order(ijk2xyz);
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedFloats = new Float32Array(arrayBuffer);
        mappedFloats.set(this.ijk2xyz, 0);
        const mappedUInts = new Uint32Array(arrayBuffer);
        mappedUInts[4*4] = this.k_limit;
        mappedFloats[4*4 + 1] = this.threshold_value;
    };
};

export class ThresholdProject extends UpdateAction.UpdateAction {
    constructor (
        fromVolume,
        toDepthBuffer,
        ijk2xyz,
        k_limit,
        threshold_value,
    ) {
        super();
        this.source = fromVolume;
        this.target = toDepthBuffer;
        this.threshold_value = threshold_value;
        this.parameters = new ThresholdParameters(ijk2xyz, k_limit, threshold_value);
    };
    change_matrix(ijk2xyz) {
        this.parameters.set_matrix(ijk2xyz);
        this.parameters.push_buffer();
    };
    change_threshold(value) {
        this.threshold_value = value;
        this.parameters.threshold_value = value;
        this.parameters.push_buffer();
    };
    get_shader_module(context) {
        const gpu_shader = volume_frame + depth_buffer + threshold;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        return [Math.ceil(this.target.size / 256), 1, 1];
    };
};
