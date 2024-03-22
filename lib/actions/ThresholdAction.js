
// probe into volume and find threshold crossings

// xxxx this is copy/pasted from MaxProjection.js -- should unify somehow.

//import * as UpdateAction from "./UpdateAction"
import * as Projection from "./Projection";
import * as GPUDataObject from "../data_objects/GPUDataObject";
import * as qdVector from "qd_vector";

import depth_buffer from "../wgsl_prefix/depth_buffer.wgsl?raw";
import volume_frame from "../wgsl_prefix/volume_frame.wgsl?raw";
import volume_intercepts from "../wgsl_prefix/volume_intercepts.wgsl?raw";
import threshold from "../wgsl_suffix/threshold.wgsl?raw";

class ThresholdParameters extends GPUDataObject.DataObject {
    constructor (
        ijk2xyz, // 4x4 matrix (qdVector embedded list format)
        //k_limit, // positive int
        volume,
        threshold_value, // f32
    ) {
        super();
        this.volume = volume;
        this.threshold_value = threshold_value;
        // matrix + intersections + value + 3 padding words for alignment
        this.buffer_size = (4*4 + 4*3 + 4) * Int32Array.BYTES_PER_ELEMENT;
        this.set_matrix(ijk2xyz);
    };
    set_matrix(ijk2xyz) {
        this.ijk2xyz = qdVector.M_column_major_order(ijk2xyz);
        this.intersections = Projection.intersection_buffer(ijk2xyz, this.volume);
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedFloats = new Float32Array(arrayBuffer);
        mappedFloats.set(this.ijk2xyz, 0);
        mappedFloats.set(this.intersections, 4*4)
        //const mappedUInts = new Uint32Array(arrayBuffer);
        //mappedUInts[4*4] = this.k_limit;
        mappedFloats[4*4 + 3*4] = this.threshold_value;
    };
};

export class ThresholdProject extends Projection.Project {
    constructor (
        fromVolume,
        toDepthBuffer,
        ijk2xyz,
        k_limit,
        threshold_value,
    ) {
        super(fromVolume, toDepthBuffer);
        //this.source = fromVolume;
        //this.target = toDepthBuffer;
        this.threshold_value = threshold_value;
        this.parameters = new ThresholdParameters(ijk2xyz, fromVolume, threshold_value);
    };
    //change_matrix(ijk2xyz) {
    //    this.parameters.set_matrix(ijk2xyz);
    //    this.parameters.push_buffer();
    //};
    change_threshold(value) {
        this.threshold_value = value;
        this.parameters.threshold_value = value;
        this.parameters.push_buffer();
    };
    get_shader_module(context) {
        const gpu_shader = (
            volume_frame + 
            depth_buffer + 
            volume_intercepts +
            threshold);
        return context.device.createShaderModule({code: gpu_shader});
    };
    //getWorkgroupCounts() {
    //    return [Math.ceil(this.target.size / 256), 1, 1];
    //};
};
