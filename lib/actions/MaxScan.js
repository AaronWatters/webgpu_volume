
import * as MaxProjection from "./MaxProjection";
import depth_buffer from "../wgsl_prefix/depth_buffer.wgsl?raw";
import volume_frame from "../wgsl_prefix/volume_frame.wgsl?raw";
import volume_intercepts from "../wgsl_prefix/volume_intercepts.wgsl?raw";
import max_value_scan from "../wgsl_suffix/max_value_scan.wgsl?raw";
import * as qdVector from "qd_vector";

// Note: MaxScan is very similar to MaxProjection, but uses an inverted matrix

export class MaxScan extends MaxProjection.MaxProject {
    constructor (
        fromVolume,
        toDepthBuffer,
        ijk2xyz,
    ) {
        const inverted = qdVector.M_inverse(ijk2xyz);
        super(fromVolume, toDepthBuffer, inverted);
    };
    change_matrix(ijk2xyz) {
        //this.super.change_matrix(ijk2xyz); no such method...
        const inverted = qdVector.M_inverse(ijk2xyz);
        super.change_matrix(inverted);
    };
    // clear the depth buffer before running
    run() {
        this.target.reset_to_defaults();
        super.run();
    };
    add_pass(commandEncoder) {
        // ensure depth buffer is cleared before running
        this.target.reset_to_defaults();
        super.add_pass(commandEncoder);
    }
    get_shader_module(context) {
        const gpu_shader = volume_frame + depth_buffer + volume_intercepts + max_value_scan;
        console.log("MaxScan shader:", gpu_shader);
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        // size is the height*width of the volume.
        var volume = this.source;
        var [depth, height, width] = volume.shape.slice(0, 3);
        const size = height * width;
        const nworkgroups = Math.ceil(size / 256);
        console.log("MaxScan workgroups:", nworkgroups, "for size:", size);
        return [nworkgroups, 1, 1];
    };
};