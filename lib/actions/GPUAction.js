
// GPU Action superclass.

import frame_declarations from "./volume_frame.wgsl?raw";
import depth_declarations from "./depth_buffer.wgsl?raw";

export function volume_shader_code(suffix, context) {
    const gpu_shader = frame_declarations + suffix;
    return context.device.createShaderModule({code: gpu_shader});
};

export function depth_shader_code(suffix, context) {
    const gpu_shader = depth_declarations + suffix;
    return context.device.createShaderModule({code: gpu_shader});
};

export class Action {
    constructor () {
        this.attached = false;
    };
    attach_to_context(context) {
        // override if needed
        this.attached = true;
        this.context = context;
    };
    run() {
        const context = this.context;
        const device = context.device;
        const commandEncoder = device.createCommandEncoder();
        this.add_pass(commandEncoder);
        const gpuCommands = commandEncoder.finish();
        device.queue.submit([gpuCommands]);
    };
    add_pass(commandEncoder) {
        // override...
    };
};

export class ActionSequence extends Action {
    // xxx could add bookkeeping so only actions with updated inputs execute.
    constructor (actions) {
        super();
        this.actions = actions;
    };
    // attach_to_context not needed, assume actions already attached.
    add_pass(commandEncoder) {
        for (var action of this.actions) {
            action.add_pass(commandEncoder);
        }
    };
};
