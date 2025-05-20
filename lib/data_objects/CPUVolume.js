
// CPU resident volume object with metadata.
import * as qdVector from "qd_vector";
import * as prefetcher from "prefetchjs";

export class VolumeSequence {
    constructor (shape, url_prefix, url_suffixes) {
        if (shape == null) {
            // data is in prefixed format
            // shape is not known yet.
            this.is_prefixed = true;
            this.shape = null;
            this.size = null;
            this.cpu_volume = null;
        } else {
            this.is_prefixed = false;
            this.shape = shape;
            this.size = shape[0] * shape[1] * shape[2];
            this.cpu_volume = Volume(shape, null);
        }
        this.url_prefix = url_prefix;
        this.url_suffixes = url_suffixes;
        this._gpu_volume = null;
        //this.cpu_volume = Volume(shape, null);
        this.index = 0;
        this.prefetcher = new prefetcher.PreFetcher(url_prefix, url_suffixes);
    };
    async fetch(index) {
        // use this.index if index is not specified
        if (index == null) {
            index = this.index;
        }
        if (index < 0 || index >= this.url_suffixes.length) {
            throw new Error(`index ${index} out of range [0, ${this.url_suffixes.length})`);
        }
        this.index = index;
        const buffer = await this.prefetcher.fetch_buffer(index);
        const data = new Float32Array(buffer);
        if (this.is_prefixed) {
            // data is in prefixed format
            const volume = volume_from_prefixed_data(data);
            if (this.shape == null) {
                this.shape = volume.shape;
                this.size = volume.size;
            } else {
                // check that the shape and size match
                const ln = volume.size;
                if (this.size != ln) {
                    throw new Error(
                        `data length ${ln} can't change shape ${this.size}`
                    )
                }
                if (this.shape[0] != volume.shape[0] ||
                    this.shape[1] != volume.shape[1] ||
                    this.shape[2] != volume.shape[2]) {
                    throw new Error(
                        `data shape ${volume.shape} doesn't match shape ${this.shape}`
                    )
                }
            }
            this.shape = volume.shape;
            this.size = volume.size;
            this.cpu_volume = volume;
        } else {
            // data is in unprefixed format
            const ln = data.length;
            if (this.size != ln) {
                throw new Error(
                    `data length ${ln} doesn't match shape ${this.shape}`
                )
            };
            this.cpu_volume.data = data;
            gpu_data = data;
        }
        if (this._gpu_volume) {
            this._gpu_volume.data = this.cpu_volume.data;
            await this._gpu_volume.push_buffer();
        }
    };
    async fetch_next() {
        this.index += 1;
        if (this.index >= this.url_suffixes.length) {
            this.index = 0; // ??? loop
        }
        await this.fetch(this.index);
    };
    gpu_volume(context, dK, dJ, dI) {
        if (this._gpu_volume) {
            // xxxx dK, dJ, dI shouldn't change
            return this._gpu_volume;
        }
        if (this.cpu_volume == null) {
            throw new Error("VolumeSequence.fetch() must be called first.");
        }
        this._gpu_volume = this.cpu_volume.gpu_volume(context, dK, dJ, dI);
        return this._gpu_volume;
    };
};

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