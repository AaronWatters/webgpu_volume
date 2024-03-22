
// probe into volume and project max value onto depth buffer.

//import * as UpdateAction from "./UpdateAction"
import * as Projection from "./Projection";
import * as GPUDataObject from "../data_objects/GPUDataObject";
import * as qdVector from "qd_vector";

import depth_buffer from "../wgsl_prefix/depth_buffer.wgsl?raw";
import volume_frame from "../wgsl_prefix/volume_frame.wgsl?raw";
import volume_intercepts from "../wgsl_prefix/volume_intercepts.wgsl?raw";
import max_value_project from "../wgsl_suffix/max_value_project.wgsl?raw";

const epsilon = 1e-15;

function intersection_buffer(orbitMatrix, volume) {
    const result = new Float32Array(3 * 4);
    const volumeInv = qdVector.M_inverse(volume.matrix);
    const shape = volume.shape;
    const orbit2volume = qdVector.MM_product(volumeInv, orbitMatrix);
    //l("orbit2volume", orbit2volume);
    var cursor = 0;
    for (var dimension=0; dimension<3; dimension++) {
        const m = orbit2volume[dimension];
        const denom = m[2];
        var descriptor;
        if (Math.abs(denom) < epsilon) {
            // invalid descriptor low > high
            descriptor = [0, 0, 1111, -1111];
        } else {
            // intersections on dimension in volume
            const low_index = 0;
            const high_index = shape[dimension];
            const c0 = - m[0] / denom;
            const c1 = - m[1] / denom;
            var low = (low_index - m[3]) / denom;
            var high = (high_index - m[3]) / denom;
            if (low > high) {
                [low, high] = [high, low]
            }
            descriptor = [c0, c1, low, high]
        }
        result.set(descriptor, cursor);
        cursor += 4;
    }
    return result;
};

class MaxProjectionParameters extends GPUDataObject.DataObject {
    constructor (
        ijk2xyz, // 4x4 matrix (qdVector embedded list format)
        volume,
        depthBuffer,
    ) {
        super();
        //this.k_limit = k_limit;
        this.volume = volume;
        this.depthBuffer = depthBuffer;
        // matrix + 3 sets of 4 float intersection parameters
        this.buffer_size = (4*4 + 4*3) * Int32Array.BYTES_PER_ELEMENT;
        this.set_matrix(ijk2xyz);
    };
    set_matrix(ijk2xyz) {
        this.ijk2xyz = qdVector.M_column_major_order(ijk2xyz);
        debugger;
        this.intersections = intersection_buffer(ijk2xyz, this.volume);
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedFloats = new Float32Array(arrayBuffer);
        mappedFloats.set(this.ijk2xyz, 0);
        mappedFloats.set(this.intersections, 4*4)
        //const mappedUInts = new Uint32Array(arrayBuffer);
        //mappedUInts[4*4] = this.k_limit;
        //l("loaded parameters", this)
    };
};

export class MaxProject extends Projection.Project {
    constructor (
        fromVolume,
        toDepthBuffer,
        ijk2xyz,
        //k_limit,
    ) {
        super(fromVolume, toDepthBuffer);
        //this.source = fromVolume;
        //this.target = toDepthBuffer;
        this.parameters = new MaxProjectionParameters(ijk2xyz, fromVolume, toDepthBuffer);
    };
    //change_matrix(ijk2xyz) {
    //    this.parameters.set_matrix(ijk2xyz);
    //    this.parameters.push_buffer();
    //};
    get_shader_module(context) {
        const gpu_shader = volume_frame + depth_buffer + volume_intercepts + max_value_project;
        return context.device.createShaderModule({code: gpu_shader});
    };
    //getWorkgroupCounts() {
    //    return [Math.ceil(this.target.size / 256), 1, 1];
    //};
};
