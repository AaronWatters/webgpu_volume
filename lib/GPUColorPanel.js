
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
};