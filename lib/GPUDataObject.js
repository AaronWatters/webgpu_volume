
export class DataObject {
    constructor () {
        this.buffer_size = 0; // override!
        this.gpu_buffer = null;
        this.usage_flags = (
            GPUBufferUsage.STORAGE | 
            GPUBufferUsage.COPY_SRC |
            GPUBufferUsage.COPY_DST
        );
        this.attached = false;
    };
    attach_to_context(context) {
        if (this.attached) {
            throw new Error("cannot re-attach attached object.")
        }
        this.attached = true;
        this.context = context;
        const device = context.device;
        this.allocate_buffer_mapped(device);
        this.load_buffer();
        this.gpu_buffer.unmap()
        return this.gpu_buffer;
    }
    allocate_buffer_mapped(device, flags) {
        device = device || this.context.device;
        flags = (flags || this.usage_flags);
        this.gpu_buffer = device.createBuffer({
            mappedAtCreation: true,
            size: this.buffer_size,
            usage: flags,
        });
        return this.gpu_buffer;
    };
    load_buffer (buffer) {
        // override 
        return this.gpu_buffer;
    };
    async pull_buffer () {
        // not optimized for multiple pulls -- reallocates copy buffers
        const context = this.context;
        const device = context.device;
        const out_flags = 
            GPUBufferUsage.COPY_DST | 
            GPUBufferUsage.MAP_READ;
        const output_buffer = device.createBuffer({
            size: this.buffer_size,
            usage: out_flags,
        });
        const commandEncoder = device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(
            this.gpu_buffer /* source buffer */,
            0 /* source offset */,
            output_buffer /* destination buffer */,
            0 /* destination offset */,
            this.buffer_size /* size */
        );
        const gpuCommands = commandEncoder.finish();
        device.queue.submit([gpuCommands]);
        await output_buffer.mapAsync(GPUMapMode.READ);
        const arrayBuffer = output_buffer.getMappedRange();
        // https://stackoverflow.com/questions/10100798/whats-the-most-straightforward-way-to-copy-an-arraybuffer-object
        var result = new ArrayBuffer(arrayBuffer.byteLength);
        new Uint8Array(result).set(new Uint8Array(arrayBuffer));
        // clean up.
        output_buffer.destroy();
        return result;
    };
    async push_buffer (array) {
        // push array (prefix) to data buffer
        // not optimized for multipe pushes...
        // could generalize to push slices...
        const context = this.context;
        const device = context.device;
        var size = this.buffer_size;
        if (array) {
            size = array.byteLength;
            if (size > this.buffer_size) {
                throw new Error("push buffer too large " + [size, this.buffer_size])
            }
        }
        const flags = this.usage_flags;
        const source_buffer = device.createBuffer({
            mappedAtCreation: true,
            size: size,
            usage: flags,
        });
        if (array) {
            const arrayBuffer = source_buffer.getMappedRange();
            const arraytype = array.constructor;
            const mapped = new arraytype(arrayBuffer);
            mapped.set(array);
        } else {
            this.load_buffer(source_buffer);
        }
        source_buffer.unmap();
        const commandEncoder = device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(
            source_buffer /* source buffer */,
            0 /* source offset */,
            this.gpu_buffer /* destination buffer */,
            0 /* destination offset */,
            size /* size */
        );
        const gpuCommands = commandEncoder.finish();
        device.queue.submit([gpuCommands]);
        await device.queue.onSubmittedWorkDone();
        source_buffer.destroy();
    };
    bindGroupLayout(type) {
        const context = this.context;
        const device = context.device;
        type = type || "storage";
        const binding = 0;
        const layoutEntry = {
            binding: binding,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: type,
            }
        };
        const layout = device.createBindGroupLayout({
            entries: [
                layoutEntry,
            ],
        });
        return layout;
    };
    bindGroup(layout, context) {
        const device = context.device;
        const bindGroup = device.createBindGroup({
            layout: layout,
            entries: [
                this.bindGroupEntry(0),
            ],
        });
        return bindGroup;
    };
    bindGroupEntry(binding) {
        return {
            binding: binding,
            resource: {
                buffer: this.gpu_buffer,
            },
        }
    };
};