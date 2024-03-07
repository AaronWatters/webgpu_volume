
import * as GPUAction from "../actions/GPUAction.js";

export class CopyData extends GPUAction.Action {
    constructor (fromDataObject, from_offset, toDataObject, to_offset, length) {
        super();
        this.fromDataObject = fromDataObject;
        this.toDataObject = toDataObject;
        this.from_offset = from_offset;  // in words, not bytes!
        this.to_offset = to_offset;  // in words!
        this.length = length; // in words!
    }
    add_pass(commandEncoder) {
        const bpe = Int32Array.BYTES_PER_ELEMENT;
        commandEncoder.copyBufferToBuffer(
            this.fromDataObject.gpu_buffer /* source buffer */,
            this.from_offset * bpe /* source offset */,
            this.toDataObject.gpu_buffer /* destination buffer */,
            this.to_offset * bpe /* destination offset */,
            this.length * bpe /* size */,
        );
    };
}