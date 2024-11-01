
// CPU resident volume object with metadata.
import * as qdVector from "qd_vector";

export class Volume {
    constructor (shape, data) {
        const [K, J, I] = shape;
        this.shape = shape;
        this.size = I * J * K;
        if (data) {
            const ln = data.length;
            if (this.size != ln) {
                throw new Error(
                    `data length ${ln} doesn't match shape ${shape}`
                )
            }
            this.data = new Float32Array(data);
        } else {
            this.data = null;
        }
    };
    gpu_volume(context, dK, dJ, dI) {
        // volume with dK, dJ, dI distortion, Y going up, centered at origin.
        dK = dK || 1;
        dJ = dJ || 1;
        dI = dI || 1;
        const [K, J, I] = this.shape;
        const maxIJK = Math.max(I, J, K);
        // stretch to fit
        const maxdIJK = Math.max(dI * I, dJ * J, dK * K);
        const s = maxIJK / maxdIJK;
        //const s = 1;
        //console.log("rescaling", s, dI, dJ, dK, I, J, K, maxIJK, maxdIJK);
        const scaling = [
            [s*dK,  0,  0,  0],
            [ 0, s*dJ,  0,  0],
            [ 0,  0, s*dI,  0],
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

export async function fetch_volume(shape, url, kind = Float32Array) {
    const buffer = await fetch_buffer(url);
    const data = new kind(buffer);
    return new Volume(shape, data);
};

async function fetch_buffer(url) {
    const response = await fetch(url);
    const content = await response.blob();
    const buffer = await content.arrayBuffer();
    return buffer;
};