
// probe into volume and project max value onto depth buffer.

import * as UpdateAction from "./UpdateAction"
import * as GPUDataObject from "./GPUDataObject";
import * as qdVector from "qd_vector";

import depth_buffer from "./depth_buffer.wgsl?raw";
import volume_frame from "./volume_frame.wgsl?raw";
import max_value_project from "./max_value_project.wgsl?raw";

class MaxProjectionParameters extends GPUDataObject.DataObject {
    constructor (
        ijk2xyz, // 4x4 matrix (qdVector embedded list format)
        k_limit, // positive int
    ) {
        super();
        this.set_matrix(ijk2xyz);
        this.k_limit = k_limit;
        // matrix + limit + 3 padding words for alignment
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
    };
};

export class MaxProject extends UpdateAction.UpdateAction {
    constructor (
        fromVolume,
        toDepthBuffer,
        ijk2xyz,
        k_limit,
    ) {
        super();
        this.source = fromVolume;
        this.target = toDepthBuffer;
        this.parameters = new MaxProjectionParameters(ijk2xyz, k_limit);
    };
    change_matrix(ijk2xyz) {
        this.parameters.set_matrix(ijk2xyz);
        this.parameters.push_buffer();
    };
    get_shader_module(context) {
        const gpu_shader = volume_frame + depth_buffer + max_value_project;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        return [Math.ceil(this.target.size / 256), 1, 1];
    };
};
