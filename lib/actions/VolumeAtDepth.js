
// Generate values for volume in projection at a given depth as a depth buffer.

import * as Projection from "./Projection";
import * as GPUDataObject from "../data_objects/GPUDataObject";
import * as qdVector from "qd_vector";

import depth_buffer from "../wgsl_prefix/depth_buffer.wgsl?raw";
import volume_frame from "../wgsl_prefix/volume_frame.wgsl?raw";
import volume_intercepts from "../wgsl_prefix/volume_intercepts.wgsl?raw";
import volume_at_depth from "../wgsl_suffix/volume_at_depth.wgsl?raw";

class MaxProjectionParameters extends GPUDataObject.DataObject {
    constructor (
        ijk2xyz, // 4x4 matrix (qdVector embedded list format)
        depth,
    ) {
        super();
        this.depth = depth;
        // matrix + depth + padding
        this.buffer_size = (4*4 + 4) * Int32Array.BYTES_PER_ELEMENT;
        this.set_matrix(ijk2xyz);
    };
    set_matrix(ijk2xyz) {
        this.ijk2xyz = qdVector.M_column_major_order(ijk2xyz);
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedFloats = new Float32Array(arrayBuffer);
        mappedFloats.set(this.ijk2xyz, 0);
        mappedFloats.set([this.depth], 4*4)
    };
    change_depth(depth) {
        this.depth = depth;
        this.push_buffer();
    };
};

export class VolumeAtDepth extends Projection.Project {
    constructor (
        fromVolume,
        toDepthBuffer,
        ijk2xyz,
        depth,
    ) {
        super(fromVolume, toDepthBuffer);
        this.parameters = new MaxProjectionParameters(ijk2xyz, depth);
    };
    get_shader_module(context) {
        const gpu_shader = (
            volume_frame + 
            depth_buffer + 
            volume_intercepts + 
            volume_at_depth);
        return context.device.createShaderModule({code: gpu_shader});
    };
    change_depth(depth) {
        this.parameters.change_depth(depth);
    }
};
