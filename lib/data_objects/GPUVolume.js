
// 3d volume data object


import * as GPUDataObject from "./GPUDataObject";
import * as qdVector from "qd_vector";

/*
export function invert_list_matrix(L) {
    const M = qdVector.list_as_M(L, 4, 4);
    const Minv = qdVector.M_inverse(M)
    return qdVector.M_as_list(Minv);
};
*/

const id4x4list = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
]

export class Volume extends GPUDataObject.DataObject {
    constructor (shape, data, ijk2xyz, data_format) {
        super();
        data_format = data_format || Uint32Array;
        this.data_format = data_format;
        if (!ijk2xyz) {
            ijk2xyz = qdVector.list_as_M(id4x4list, 4, 4);
        }
        this.set_ijk2xyz(ijk2xyz);
        this.data = null;
        this.min_value = null;
        this.max_value = null;
        this.set_shape(shape, data);
        // 32 bit word indices for data offsets in GPU buffer
        this.shape_offset = 0;
        this.ijk2xyz_offset = this.shape_offset + this.shape.length;
        this.xyz2ijk_offset = this.ijk2xyz_offset + this.ijk2xyz.length;
        this.content_offset = this.xyz2ijk_offset + this.xyz2ijk.length;
        // assign buffer size
        this.buffer_size = (this.size + this.content_offset) * Int32Array.BYTES_PER_ELEMENT;
    };
    set_shape(shape, data) {
        const [I, J, K] = shape;
        this.size = I * J * K;
        // extra slot for alignment, use for error flag from GPU.
        this.shape = [I, J, K, 0];
        this.data = null;
        if (data) {
            this.set_data(data);
        }
    };
    set_data(data) {
        const ln = data.length;
        if (this.size != ln) {
            throw new Error(`Data size ${ln} doesn't match ${this.size}`);
        }
        this.data = new this.data_format(data);
        // xxx compute min and max values (always?)
        var min_value = this.data[0];
        var max_value = min_value;
        for (var v of this.data) {
            min_value = Math.min(v, min_value);
            max_value = Math.max(v, max_value);
        }
        this.min_value = min_value;
        this.max_value = max_value;
    };
    set_ijk2xyz(matrix) {
        this.matrix = matrix;
        const inv = qdVector.M_inverse(matrix);
        const ListMatrix = qdVector.M_column_major_order(matrix);
        this.ijk2xyz = ListMatrix;
        this.xyz2ijk = qdVector.M_column_major_order(inv);
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedInts = new Uint32Array(arrayBuffer);
        mappedInts.set(this.shape, this.shape_offset);
        const mappedFloats = new Float32Array(arrayBuffer);
        mappedFloats.set(this.ijk2xyz, this.ijk2xyz_offset);
        mappedFloats.set(this.xyz2ijk, this.xyz2ijk_offset);
        if (this.data) {
            const mappedData = new this.data_format(arrayBuffer);
            mappedData.set(this.data, this.content_offset);
        }
    };
    async pull_data () {
        const arrayBuffer = await this.pull_buffer();
        const mappedInts = new Uint32Array(arrayBuffer);
        //debugger;
        this.data = mappedInts.slice(this.content_offset);
        return this.data;
    };
};