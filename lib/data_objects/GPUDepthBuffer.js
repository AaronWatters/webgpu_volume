
// Depth buffer object: 32bit data items paired with f32 depth values.
// Intended to allow depth based combinations of scene elements.

import * as GPUDataObject from "./GPUDataObject";
import * as CopyAction from "../actions/CopyAction";

export class DepthBuffer extends GPUDataObject.DataObject {
    constructor (shape, default_depth, default_value, data, depths, data_format) {
        super();
        [this.height, this.width] = shape;
        this.default_depth = default_depth;
        this.default_value = default_value;
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
        this.content_offset = 4;  // height/width + defaults
        this.depth_offset = this.size + this.content_offset;
        // assign buffer size, shape + content + depth
        this.entries = (this.size * 2) + this.content_offset;
        this.buffer_size = this.entries * Int32Array.BYTES_PER_ELEMENT;
    };
    clone_operation() {
        const clone = new DepthBuffer(
            [this.height, this.width],
            this.default_depth,
            this.default_value,
            null,
            null,
            this.data_format,
        );
        clone.attach_to_context(this.context);
        const clone_action = new CopyAction.CopyData(
            this,
            0,
            clone,
            0,
            this.entries,
        );
        clone_action.attach_to_context(this.context);
        return {clone, clone_action};
    };
    flatten_action(onto_panel, buffer_offset) {
        // put the data values into a panel (unless offset is specified)
        buffer_offset = buffer_offset || this.content_offset;
        const [w, h] = [this.width, this.height];
        const [ow, oh] = [onto_panel.width, onto_panel.height];
        if ((w != ow) || (h != oh)) {
            throw new Error("w/h must match: " + [w, h, ow, oh])
        }
        return new CopyAction.CopyData(
            this,
            buffer_offset,
            onto_panel,
            0,
            this.size, // length
        );
    };
    copy_depths_action(onto_panel) {
        // copy the depths values into a panel
        return this.flatten_action(onto_panel, this.depth_offset);
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
        const shape4 = [this.height, this.width, this.default_depth, this.default_value];
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
        this.data = mappedData.slice(this.content_offset, this.depth_offset);
        const mappedFloats = new Float32Array(arrayBuffer);
        const shape4 = mappedFloats.slice(0, 4);
        this.height = shape4[0];
        this.width = shape4[1];
        this.default_depth = shape4[2];
        this.default_value = shape4[3];
        this.depths = mappedFloats.slice(this.depth_offset, this.depth_offset + this.size);
        return this.data;
    };
};