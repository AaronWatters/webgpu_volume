
// Update action superclass implementation.
// An update action is an operation performed
//   -- using a source data object (read only)
//   -- using some (usually small number of) parameters data object (read only)
//   -- modifying a target data object

import * as GPUAction from "./GPUAction.js";

export class UpdateAction extends GPUAction.Action {
    get_shader_module(context) {
        //const gpu_shader = panel_buffer + paste_panel;
        //return context.device.createShaderModule({code: gpu_shader});
        throw new Error("get_shader_module must be define in subclass.");
    };
    async report_module_errors(shaderModule) {
        const compilationInfo = await shaderModule.getCompilationInfo();
        if (compilationInfo.messages.length > 0) {
            console.log("Shader compilation log:");
            let hadError = false;
            for (const msg of compilationInfo.messages) {
                console.log(`${msg.lineNum}:${msg.linePos} - ${msg.message}`);
                if (msg.type == "error") {
                    hadError = true;
                }
            }
            if (hadError) {
                console.error("Shader failed to compile.", shaderModule, compilationInfo);
                throw new Error("Shader failed to compile.");
            }
        }
    };
    attach_to_context(context) {
        this.context = context;
        const device = context.device;
        const source = this.source;
        const target = this.target;
        const parms = this.parameters;
        // (re)attach the source, target, and parms to the context
        source.attach_to_context(context);
        target.attach_to_context(context);
        parms.attach_to_context(context);
        const shaderModule = this.get_shader_module(context);
        this.report_module_errors(shaderModule);
        const targetLayout = target.bindGroupLayout("storage");
        const sourceLayout = source.bindGroupLayout("read-only-storage");
        const parmsLayout = parms.bindGroupLayout("read-only-storage");
        const layout = device.createPipelineLayout({
            bindGroupLayouts: [
                sourceLayout,
                targetLayout,
                parmsLayout,
            ],
        });
        // xxx is this standard? refactorable?
        this.pipeline = device.createComputePipeline({
            layout: layout,
            compute: {
                module: shaderModule,
                entryPoint: "main"
            },
        });
        this.sourceBindGroup = source.bindGroup(sourceLayout, context);
        this.targetBindGroup = target.bindGroup(targetLayout, context);
        this.parmsBindGroup = parms.bindGroup(parmsLayout, context);
        this.attached = true;
    };
    getWorkgroupCounts() {
        // Possibly override in subclass.
        // By default iterate over the target (?)
        return [Math.ceil(this.target.size / 8), 1, 1]
    }
    add_pass(commandEncoder) {
        // refactor!
        const passEncoder = commandEncoder.beginComputePass();
        const computePipeline = this.pipeline;
        passEncoder.setPipeline(computePipeline);
        passEncoder.setBindGroup(0, this.sourceBindGroup);
        passEncoder.setBindGroup(1, this.targetBindGroup);
        passEncoder.setBindGroup(2, this.parmsBindGroup);
        // local
        //const workgroupCountX = Math.ceil(this.outputDB.size / 8);
        //const workgroupCountX = this.getWorkgroupCountX();
        const [cx, cy, cz] = this.getWorkgroupCounts();
        passEncoder.dispatchWorkgroups(cx, cy, cz);
        passEncoder.end();
    };
};
