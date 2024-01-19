
// Depth buffer object: 32bit data items paired with f32 depth values.
// Intended to allow depth based combinations of scene elements.

import * as GPUDataObject from "./GPUDataObject";

export class DepthBuffer extends GPUDataObject.DataObject {
    constructor (shape, data, depths, data_format) {
        super();
        [this.height, this.width] = shape;
        this.data_format = data_format || Uint32Array;
        this.data = null;
        // float
        this.depths = null;
        this.size = this.width * this.height;
        if (data) {
            this.set_data(data);
        }
        if (depths) {
            this.set_depths(depths);
        }
        // 32 bit word indices for data offsets in GPU buffer
        this.content_offset = 4;  // height/width + 2 alignment words
        this.depth_offset = this.size + this.content_offset;
        // assign buffer size, shape + content + depth
        this.buffer_size = ((this.size * 2) + this.content_offset) * Int32Array.BYTES_PER_ELEMENT;
    };
    set_data(data) {
        // xxxx refactor -- pasted from GPUVolume
        const ln = data.length;
        if (this.size != ln) {
            throw new Error(`Data size ${ln} doesn't match ${this.size}`);
        }
        this.data = data;
    };
    set_depths(data) {
        // xxxx refactor -- pasted from GPUVolume
        const ln = data.length;
        if (this.size != ln) {
            throw new Error(`Data size ${ln} doesn't match ${this.size}`);
        }
        this.depths = data;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedFloats = new Float32Array(arrayBuffer);
        const shape4 = [this.height, this.width, 0, 0];
        mappedFloats.set(shape4, 0);
        if (this.data) {
            const mappedData = new this.data_format(arrayBuffer);
            mappedData.set(this.data, this.content_offset);
        }
        if (this.depths) {
            mappedFloats.set(this.depths, this.depth_offset);
        }
    };
    async pull_data () {
        const arrayBuffer = await this.pull_buffer();
        const mappedData = new this.data_format(arrayBuffer);
        this.data = mappedData.slice(this.content_offset, this.depths_offset);
        const mappedFloats = new Uint32Array(arrayBuffer);
        this.depths = mappedFloats.slice(this.depth_offset, this.depth_offset + this.size);
        return this.data;
    };
};