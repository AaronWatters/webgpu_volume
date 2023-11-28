

import frame_declarations from "./volume_frame.wgsl?raw";

export function volume_shader_code(suffix, context) {
    const gpu_shader = frame_declarations + suffix;
    return context.device.createShaderModule({code: gpu_shader});
};

export class Action {
    constructor () {
        this.attached = false;
    };
    attach_to_context(context) {
        // override
        this.attached = true;
    }
};