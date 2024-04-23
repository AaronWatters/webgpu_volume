
// A rectangular region of colors as u32 rgba

import * as GPUDataObject from "./GPUDataObject";

export class Panel extends GPUDataObject.DataObject {
    constructor (width, height) {
        super();
        this.width = width;
        this.height = height;
        this.size = width * height;
        this.buffer_size = this.size * Int32Array.BYTES_PER_ELEMENT;
        this.usage_flags = (
            GPUBufferUsage.STORAGE 
            | GPUBufferUsage.VERTEX
            | GPUBufferUsage.COPY_SRC
            | GPUBufferUsage.COPY_DST
        );
    };
    resize(width, height) {
        const size = width * height;
        const buffer_size = size * Int32Array.BYTES_PER_ELEMENT;
        if (buffer_size > this.buffer_size) {
            throw new Error("buffer resize not yet implemented");
        }
        this.width = width;
        this.height = height;
        this.size = size;
    };
    color_at([row, column]) {
        // assume data has been pulled if needed.
        if ((column < 0) || (column >= this.width) || (row < 0) || (row >= this.height)) {
            return null;
        }
        const u32offset = column + row * this.width;
        const bpe = Int32Array.BYTES_PER_ELEMENT;
        const bytes = new Uint8Array(this.buffer_content, u32offset * bpe, bpe);
        return bytes;
    }
};