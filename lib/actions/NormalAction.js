
// probe into volume and find threshold crossings

// xxxx this is copy/pasted from MaxProjection.js -- should unify somehow.

//import * as UpdateAction from "./UpdateAction"
import * as Projection from "./Projection";
import * as GPUDataObject from "../data_objects/GPUDataObject";
import * as qdVector from "qd_vector";

import depth_buffer from "../wgsl_prefix/depth_buffer.wgsl?raw";
import volume_frame from "../wgsl_prefix/volume_frame.wgsl?raw";
import normal_colors from "../wgsl_suffix/normal_colors.wgsl?raw";

class NormalParameters extends GPUDataObject.DataObject {
    constructor (
        ijk2xyz, // 4x4 matrix (qdVector embedded list format)
        default_value, // f32
    ) {
        super();
        this.set_matrix(ijk2xyz);
        this.default_value = default_value;
        // matrix + value + padding words for alignment
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
        mappedFloats[4*4] = this.default_value;
    };
};

export class NormalColorize  extends Projection.Project {
    constructor (
        fromVolume,
        toDepthBuffer,
        ijk2xyz,
        default_value,
    ) {
        super(fromVolume, toDepthBuffer);
        //this.source = fromVolume;
        //this.target = toDepthBuffer;
        this.default_value = default_value;
        this.parameters = new NormalParameters(ijk2xyz, default_value);
    };
    get_shader_module(context) {
        const gpu_shader = volume_frame + depth_buffer + normal_colors;
        return context.device.createShaderModule({code: gpu_shader});
    };
    //getWorkgroupCounts() {
    //    return [Math.ceil(this.target.size / 256), 1, 1];
    //};
};
