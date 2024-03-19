
// CPU resident volume object with metadata.
import * as qdVector from "qd_vector";

export class Volume {
    constructor (shape, data) {
        const [K, J, I] = shape;
        this.shape = shape;
        this.size = I * J * K;
        const ln = data.length;
        if (this.size != ln) {
            throw new Error(
                `data length ${ln} doesn't match shape ${shape}`
            )
        }
        this.data = new Float32Array(data)
    };
    gpu_volume(context, dK, dJ, dI) {
        // volume with dK, dJ, dI distortion, Y going up, centered at origin.
        dK = dK || 1;
        dJ = dJ || 1;
        dI = dI || 1;
        const [K, J, I] = this.shape;
        const scaling = [
            [dK,  0,  0,  0],
            [ 0, dJ,  0,  0],
            [ 0,  0, dI,  0],
            [ 0,  0,  0,  1],
        ];
        const swap = [
            [0, -1, 0, 0],
            [0, 0, 1, 0],
            [1, 0, 0, 0],
            [0, 0, 0, 1],
        ];
        const distortion = qdVector.MM_product(swap, scaling);
        const translation = qdVector.affine3d(null, [-K/2, -J/2, -I/2]);
        const ijk2xyz = qdVector.MM_product(distortion, translation);
        const volume = context.volume(
            this.shape,
            this.data,
            ijk2xyz,
            Float32Array,
        );
        return volume
    };
};

function volume_from_prefixed_data(data) {
    const shape = data.slice(0, 3);
    const suffix_data = data.slice(3);
    return new Volume(shape, suffix_data);
};

export async function fetch_volume_prefixed(url, kind) {
    kind = kind || Float32Array;
    const buffer = await fetch_buffer(url);
    const prefixed_data = new kind(buffer);
    return volume_from_prefixed_data(prefixed_data);
};

async function fetch_buffer(url) {
    const response = await fetch(url);
    const content = await response.blob();
    const buffer = await content.arrayBuffer();
    return buffer;
};