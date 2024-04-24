

import * as qdVector from "qd_vector";

// Coordinate transform support functions.

export class NormalizedCanvasSpace {
    constructor(canvas) {
        this.canvas = canvas;
        //const brec = canvas.getBoundingClientRect();
        //this.brec = brec;
        //this.cx = brec.width / 2 + brec.left;
        //this.cy = brec.height / 2 + brec.top;
    };
    normalize(px, py) {
        //debugger;
        const brec = this.canvas.getBoundingClientRect();
        this.brec = brec;
        this.cx = brec.width / 2 + brec.left;
        this.cy = brec.height / 2 + brec.top;
        const offsetx = px - this.cx;
        const offsety = -(py - this.cy);
        const dx = offsetx * 2 / this.brec.width;
        const dy = offsety * 2 / this.brec.height;
        return [dx, dy];
    };
    normalize_event_coords(e) {
        return this.normalize(e.clientX, e.clientY);
    };
};

export class PanelSpace {
    constructor (height, width) {
        this.height = height;
        this.width = width;
        //this.canvas_space = canvas_space; -- not used
    };
    normalized2ij([dx, dy]) {
        const i = Math.floor((dy + 1) * this.height / 2);
        const j = Math.floor((dx + 1) * this.width / 2);
        return [i, j];
    };
    ij2normalized([i, j]) {
        const dx = 2 * j / this.width - 1;
        const dy = 2 * i / this.height - 1;
        return [dx, dy];
    };
    /*
    ij2offset([i, j]) {
        // panels are indexed from lower left corner
        if ((i < 0) || (i >= this.width) || (j < 0) || (j >= this.height)) {
            return null;
        }
        return i + j * this.width;
    };
    */
};

export class ProjectionSpace {
    constructor(ijk2xyz) {
        this.change_matrix(ijk2xyz);
    };
    change_matrix(ijk2xyz) {
        this.ijk2xyz = ijk2xyz;
        this.xyz2ijk = qdVector.M_inverse(ijk2xyz);
    };
    ijk2xyz_v(ijk) {
        return qdVector.apply_affine3d(this.ijk2xyz, ijk);
    };
};

export class VolumeSpace extends ProjectionSpace {
    constructor(ijk2xyz, shape) {
        super(ijk2xyz);
        this.shape = shape;
    };
    xyz2ijk_v(xyz) {
        return qdVector.apply_affine3d(this.xyz2ijk, xyz);
    };
    ijk2offset(ijk) {
        const [depth, height, width] = this.shape.slice(0, 3);
        var [layer, row, column] = ijk;
        layer = Math.floor(layer);
        row = Math.floor(row);
        column = Math.floor(column);
        if (
            (column < 0) || (column >= width) ||
            (row < 0) || (row >= height) ||
            (layer < 0) || (layer >= depth)
        ) {
            return null;
        }
        return (layer * height + row) * width + column;
    };
    offset2ijk(offset) {
        const [I, J, K] = this.shape.slice(0, 3);
        const k = offset % K;
        const j = Math.floor(offset / K) % J;
        const i = Math.floor(offset / (K * J));
        return [i, j, k];
    };
    xyz2offset(xyz) {
        return this.ijk2offset(this.xyz2ijk_v(xyz));
    };
};
