
import * as MaxProjection from "./MaxProjection";

import depth_buffer from "../wgsl_prefix/depth_buffer.wgsl?raw";
import volume_frame from "../wgsl_prefix/volume_frame.wgsl?raw";
import volume_intercepts from "../wgsl_prefix/volume_intercepts.wgsl?raw";
import joint_project from "../wgsl_suffix/joint_project.wgsl?raw";

export class JointProject extends MaxProjection.MaxProject {
    get_shader_module(context) {
        const gpu_shader = volume_frame + depth_buffer + volume_intercepts + joint_project;
        return context.device.createShaderModule({code: gpu_shader});
    }
}