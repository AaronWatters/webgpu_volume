

// Sample from one volume into another volume.

// xxxx add an independent transformation matrix and default value?

import * as GPUVolume from "../data_objects/GPUVolume.js";
import * as GPUAction from "./GPUAction.js";
import embed_volume from "../wgsl_suffix/embed_volume.wgsl?raw";

export class SampleVolume extends GPUAction.Action {
    constructor (shape, ijk2xyz, volumeToSample) {
        super();
        this.volumeToSample = volumeToSample;
        this.shape = shape;
        this.ijk2xyz = ijk2xyz;
        this.targetVolume = new GPUVolume.Volume(shape, null, ijk2xyz);
    };
    attach_to_context(context) {
        const device = context.device;
        const source = this.volumeToSample;
        const target = this.targetVolume;
        this.targetVolume.attach_to_context(context);
        const shaderModule = GPUAction.volume_shader_code(embed_volume, context);
        const targetLayout = target.bindGroupLayout("storage");
        const sourceLayout = source.bindGroupLayout("read-only-storage");
        const layout = device.createPipelineLayout({
            bindGroupLayouts: [
                sourceLayout,
                targetLayout,
            ],
        });
        this.pipeline = device.createComputePipeline({
            layout: layout,
            compute: {
                module: shaderModule,
                entryPoint: "main"
            },
        });
        this.sourceBindGroup = source.bindGroup(sourceLayout, context);
        this.targetBindGroup = target.bindGroup(targetLayout, context);
        this.attached = true;
        this.context = context;
    };
    add_pass(commandEncoder) {
        const passEncoder = commandEncoder.beginComputePass();
        const computePipeline = this.pipeline;
        passEncoder.setPipeline(computePipeline);
        passEncoder.setBindGroup(0, this.sourceBindGroup);
        passEncoder.setBindGroup(1, this.targetBindGroup);
        const workgroupCountX = Math.ceil(this.targetVolume.size / 8);
        passEncoder.dispatchWorkgroups(workgroupCountX);
        passEncoder.end();
    };
    async pull() {
        const result = await this.targetVolume.pull_data();
        return result;
    }
};
