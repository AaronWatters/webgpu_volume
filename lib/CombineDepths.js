
// Combine input into output where depth overrides

import * as GPUDepthBuffer from "./GPUDepthBuffer.js";
import * as GPUAction from "./GPUAction.js";
import * as GPUDataObject from "./GPUDataObject";
import combine_depth_buffers from "./combine_depth_buffers.wgsl?raw";

class CombinationParameters extends GPUDataObject.DataObject {
    // xxxx possibly refactor/generalize this.
    constructor(offset_ij, sign) {
        super();
        this.offset_ij = offset_ij;
        this.sign = sign;
        this.buffer_size = 3 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedInts = new Uint32Array(arrayBuffer);
        mappedInts.set(this.offset_ij);
        mappedInts[2] = this.sign;
    };
};

export class CombineDepths extends GPUAction.Action {
    constructor (outputDB, inputDB, offset_ij, sign) {
        super();
        this.outputDB = outputDB;
        this.inputDB = inputDB;
        this.offset_ij = offset_ij || [0, 0];
        this.sign = sign || 1;
        this.parameters = new CombinationParameters(this.offset_ij, this.sign);
    };
    attach_to_context(context) {
        const device = context.device;
        const source = this.inputDB;
        const target = this.outputDB;
        const parms = this.parameters;
        // assume source and target have been attached elsewhere.
        parms.attach_to_context(context);
        // local
        const shaderModule = GPUAction.depth_shader_code(combine_depth_buffers, context);
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
        this.context = context;
    };
    add_pass(commandEncoder) {
        const passEncoder = commandEncoder.beginComputePass();
        const computePipeline = this.pipeline;
        passEncoder.setPipeline(computePipeline);
        passEncoder.setBindGroup(0, this.sourceBindGroup);
        passEncoder.setBindGroup(1, this.targetBindGroup);
        passEncoder.setBindGroup(2, this.parmsBindGroup);
        const workgroupCountX = Math.ceil(this.outputDB.size / 8);
        passEncoder.dispatchWorkgroups(workgroupCountX);
        passEncoder.end();
    };
}
