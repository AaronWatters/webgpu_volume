
// 4d polytopes projected into 3d and presented in a mix view.

import * as cylinder_test from "./cylinder_test.js";
import * as CPUVolume from "../data_objects/CPUVolume.js";
import * as GPUContext from "../support/GPUContext.js";
import * as qdVector from "qd_vector";

function rotate4d(a, b, c) {
    // 4d rotation matrix
    const R = [
        [1, 0, 0, 0],
        [0, Math.cos(a), 0, -Math.sin(a)],
        [0, Math.sin(a), 1, 0],
        [0, Math.sin(a), 0, Math.cos(a)]
    ];
    const S = [
        [Math.cos(b), 0, 0, -Math.sin(b)],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [Math.sin(b), 0, 0, Math.cos(b)]
    ];
    const T = [
        [Math.cos(c), 0, 0, -Math.sin(c)],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [Math.sin(c), 0, 0, Math.cos(c)],
    ];
    const M = qdVector.MM_product(R, S);
    return qdVector.MM_product(M, T);
};

function project4d(v) {
    // 4d to 3d projection
    return [v[0], v[1], v[2]];
};

function rotate_project_edges(edges, a, b, c, width) {
    // rotate edges in 4d and center them in a 3d cube of shape (width, width, width)
    const M = rotate4d(a, b, c);
    const pairs = [];
    const width3 = width / 4;
    const center = [width/2, width/2, width/2];
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        //const start = qdVector.matrix_multiply(M, edge[0]);
        //const end = qdVector.matrix_multiply(M, edge[1]);
        const start = qdVector.Mv_product(M, edge[0]);
        const end = qdVector.Mv_product(M, edge[1]);
        const start3d = project4d(start);
        const end3d = project4d(end);
        // center in a cube of shape (width, width, width)
        // scale the start and end by width3
        const start3dsc = qdVector.v_add(qdVector.v_scale(width3, start3d), center);
        const end3dsc = qdVector.v_add(qdVector.v_scale(width3, end3d), center);
        const offset = qdVector.v_sub(end3dsc, start3dsc);
        //const length = qdVector.v_length(offset);
        const offset6 = qdVector.v_scale(0.1, offset);
        const endoffset = qdVector.v_sub(end3dsc, offset6);
        const startoffset = qdVector.v_add(start3dsc, offset6);
        //pairs.push([start3dsc, end3dsc]);
        pairs.push([startoffset, endoffset]);
    }
    return pairs;
}

function rndint() {
    let x = Math.floor(Math.random() * 256);
    return Math.max(1, x);
};

function rnd_color() {
    //return 0xffffffff;
    var rgb = [rndint(), rndint(), rndint()];
    //debugger;
    var M = Math.max(...rgb);
    rgb = rgb.map(x => Math.floor(255 * x / M));
    let [r, g, b] = rgb;
    return (
        r + 256 * (
            b + 256 * (
                g + 256 * 255
            )
        ));
};

var view = null;
var context = null;
const width = 250;

export async function go(canvasElement, infoElement) {
    function info(msg) {
        infoElement.textContent = msg;
    };
    context = new GPUContext.Context();
    const canvas = canvasElement;
    info("got gpu context");
    await context.connect();
    const random_colors = [0];  // index 0 is invisible
    for (let i=0; i<100; i++) {
        random_colors.push(rnd_color());
    }
    const colors = new Uint32Array(random_colors);
    const shape = [width, width, width];
    const cpu_volume = new CPUVolume.Volume(shape, null);
    const gpu_volume = cpu_volume.gpu_volume(context);
    const volume = gpu_volume;
    const ncylinders = 100;
    const radius = 8;
    const pairs = rotate_project_edges(edges, 0.1, 0.2, 0.3, width);
    view = new cylinder_test.CylinderTest(width, ncylinders, pairs, colors, radius, canvas, volume);
    const orbiting = true;
    view.paint_on(canvas, orbiting);
    info('painted canvas');
    console.log("view", view);
    return [context, view];
};

export async function change_rotation(view, a, b, c) {
    const pairs = rotate_project_edges(edges, a, b, c, width);
    view.put_pairs(pairs);
}

// 24 cell edges
const edges = [
 [[-1.0, -1.0, 0.0, 0.0], [-1.0, 0.0, -1.0, 0.0]],
 [[-1.0, -1.0, 0.0, 0.0], [-1.0, 0.0, 1.0, 0.0]],
 [[-1.0, -1.0, 0.0, 0.0], [-1.0, 0.0, 0.0, -1.0]],
 [[-1.0, -1.0, 0.0, 0.0], [-1.0, 0.0, 0.0, 1.0]],
 [[-1.0, -1.0, 0.0, 0.0], [0.0, -1.0, -1.0, 0.0]],
 [[-1.0, -1.0, 0.0, 0.0], [0.0, -1.0, 1.0, 0.0]],
 [[-1.0, -1.0, 0.0, 0.0], [0.0, -1.0, 0.0, -1.0]],
 [[-1.0, -1.0, 0.0, 0.0], [0.0, -1.0, 0.0, 1.0]],
 [[-1.0, 1.0, 0.0, 0.0], [-1.0, 0.0, -1.0, 0.0]],
 [[-1.0, 1.0, 0.0, 0.0], [-1.0, 0.0, 1.0, 0.0]],
 [[-1.0, 1.0, 0.0, 0.0], [-1.0, 0.0, 0.0, -1.0]],
 [[-1.0, 1.0, 0.0, 0.0], [-1.0, 0.0, 0.0, 1.0]],
 [[-1.0, 1.0, 0.0, 0.0], [0.0, 1.0, -1.0, 0.0]],
 [[-1.0, 1.0, 0.0, 0.0], [0.0, 1.0, 1.0, 0.0]],
 [[-1.0, 1.0, 0.0, 0.0], [0.0, 1.0, 0.0, -1.0]],
 [[-1.0, 1.0, 0.0, 0.0], [0.0, 1.0, 0.0, 1.0]],
 [[1.0, -1.0, 0.0, 0.0], [1.0, 0.0, -1.0, 0.0]],
 [[1.0, -1.0, 0.0, 0.0], [1.0, 0.0, 1.0, 0.0]],
 [[1.0, -1.0, 0.0, 0.0], [1.0, 0.0, 0.0, -1.0]],
 [[1.0, -1.0, 0.0, 0.0], [1.0, 0.0, 0.0, 1.0]],
 [[1.0, -1.0, 0.0, 0.0], [0.0, -1.0, -1.0, 0.0]],
 [[1.0, -1.0, 0.0, 0.0], [0.0, -1.0, 1.0, 0.0]],
 [[1.0, -1.0, 0.0, 0.0], [0.0, -1.0, 0.0, -1.0]],
 [[1.0, -1.0, 0.0, 0.0], [0.0, -1.0, 0.0, 1.0]],
 [[1.0, 1.0, 0.0, 0.0], [1.0, 0.0, -1.0, 0.0]],
 [[1.0, 1.0, 0.0, 0.0], [1.0, 0.0, 1.0, 0.0]],
 [[1.0, 1.0, 0.0, 0.0], [1.0, 0.0, 0.0, -1.0]],
 [[1.0, 1.0, 0.0, 0.0], [1.0, 0.0, 0.0, 1.0]],
 [[1.0, 1.0, 0.0, 0.0], [0.0, 1.0, -1.0, 0.0]],
 [[1.0, 1.0, 0.0, 0.0], [0.0, 1.0, 1.0, 0.0]],
 [[1.0, 1.0, 0.0, 0.0], [0.0, 1.0, 0.0, -1.0]],
 [[1.0, 1.0, 0.0, 0.0], [0.0, 1.0, 0.0, 1.0]],
 [[-1.0, 0.0, -1.0, 0.0], [-1.0, 0.0, 0.0, -1.0]],
 [[-1.0, 0.0, -1.0, 0.0], [-1.0, 0.0, 0.0, 1.0]],
 [[-1.0, 0.0, -1.0, 0.0], [0.0, -1.0, -1.0, 0.0]],
 [[-1.0, 0.0, -1.0, 0.0], [0.0, 1.0, -1.0, 0.0]],
 [[-1.0, 0.0, -1.0, 0.0], [0.0, 0.0, -1.0, -1.0]],
 [[-1.0, 0.0, -1.0, 0.0], [0.0, 0.0, -1.0, 1.0]],
 [[-1.0, 0.0, 1.0, 0.0], [-1.0, 0.0, 0.0, -1.0]],
 [[-1.0, 0.0, 1.0, 0.0], [-1.0, 0.0, 0.0, 1.0]],
 [[-1.0, 0.0, 1.0, 0.0], [0.0, -1.0, 1.0, 0.0]],
 [[-1.0, 0.0, 1.0, 0.0], [0.0, 1.0, 1.0, 0.0]],
 [[-1.0, 0.0, 1.0, 0.0], [0.0, 0.0, 1.0, -1.0]],
 [[-1.0, 0.0, 1.0, 0.0], [0.0, 0.0, 1.0, 1.0]],
 [[1.0, 0.0, -1.0, 0.0], [1.0, 0.0, 0.0, -1.0]],
 [[1.0, 0.0, -1.0, 0.0], [1.0, 0.0, 0.0, 1.0]],
 [[1.0, 0.0, -1.0, 0.0], [0.0, -1.0, -1.0, 0.0]],
 [[1.0, 0.0, -1.0, 0.0], [0.0, 1.0, -1.0, 0.0]],
 [[1.0, 0.0, -1.0, 0.0], [0.0, 0.0, -1.0, -1.0]],
 [[1.0, 0.0, -1.0, 0.0], [0.0, 0.0, -1.0, 1.0]],
 [[1.0, 0.0, 1.0, 0.0], [1.0, 0.0, 0.0, -1.0]],
 [[1.0, 0.0, 1.0, 0.0], [1.0, 0.0, 0.0, 1.0]],
 [[1.0, 0.0, 1.0, 0.0], [0.0, -1.0, 1.0, 0.0]],
 [[1.0, 0.0, 1.0, 0.0], [0.0, 1.0, 1.0, 0.0]],
 [[1.0, 0.0, 1.0, 0.0], [0.0, 0.0, 1.0, -1.0]],
 [[1.0, 0.0, 1.0, 0.0], [0.0, 0.0, 1.0, 1.0]],
 [[-1.0, 0.0, 0.0, -1.0], [0.0, -1.0, 0.0, -1.0]],
 [[-1.0, 0.0, 0.0, -1.0], [0.0, 1.0, 0.0, -1.0]],
 [[-1.0, 0.0, 0.0, -1.0], [0.0, 0.0, -1.0, -1.0]],
 [[-1.0, 0.0, 0.0, -1.0], [0.0, 0.0, 1.0, -1.0]],
 [[-1.0, 0.0, 0.0, 1.0], [0.0, -1.0, 0.0, 1.0]],
 [[-1.0, 0.0, 0.0, 1.0], [0.0, 1.0, 0.0, 1.0]],
 [[-1.0, 0.0, 0.0, 1.0], [0.0, 0.0, -1.0, 1.0]],
 [[-1.0, 0.0, 0.0, 1.0], [0.0, 0.0, 1.0, 1.0]],
 [[1.0, 0.0, 0.0, -1.0], [0.0, -1.0, 0.0, -1.0]],
 [[1.0, 0.0, 0.0, -1.0], [0.0, 1.0, 0.0, -1.0]],
 [[1.0, 0.0, 0.0, -1.0], [0.0, 0.0, -1.0, -1.0]],
 [[1.0, 0.0, 0.0, -1.0], [0.0, 0.0, 1.0, -1.0]],
 [[1.0, 0.0, 0.0, 1.0], [0.0, -1.0, 0.0, 1.0]],
 [[1.0, 0.0, 0.0, 1.0], [0.0, 1.0, 0.0, 1.0]],
 [[1.0, 0.0, 0.0, 1.0], [0.0, 0.0, -1.0, 1.0]],
 [[1.0, 0.0, 0.0, 1.0], [0.0, 0.0, 1.0, 1.0]],
 [[0.0, -1.0, -1.0, 0.0], [0.0, -1.0, 0.0, -1.0]],
 [[0.0, -1.0, -1.0, 0.0], [0.0, -1.0, 0.0, 1.0]],
 [[0.0, -1.0, -1.0, 0.0], [0.0, 0.0, -1.0, -1.0]],
 [[0.0, -1.0, -1.0, 0.0], [0.0, 0.0, -1.0, 1.0]],
 [[0.0, -1.0, 1.0, 0.0], [0.0, -1.0, 0.0, -1.0]],
 [[0.0, -1.0, 1.0, 0.0], [0.0, -1.0, 0.0, 1.0]],
 [[0.0, -1.0, 1.0, 0.0], [0.0, 0.0, 1.0, -1.0]],
 [[0.0, -1.0, 1.0, 0.0], [0.0, 0.0, 1.0, 1.0]],
 [[0.0, 1.0, -1.0, 0.0], [0.0, 1.0, 0.0, -1.0]],
 [[0.0, 1.0, -1.0, 0.0], [0.0, 1.0, 0.0, 1.0]],
 [[0.0, 1.0, -1.0, 0.0], [0.0, 0.0, -1.0, -1.0]],
 [[0.0, 1.0, -1.0, 0.0], [0.0, 0.0, -1.0, 1.0]],
 [[0.0, 1.0, 1.0, 0.0], [0.0, 1.0, 0.0, -1.0]],
 [[0.0, 1.0, 1.0, 0.0], [0.0, 1.0, 0.0, 1.0]],
 [[0.0, 1.0, 1.0, 0.0], [0.0, 0.0, 1.0, -1.0]],
 [[0.0, 1.0, 1.0, 0.0], [0.0, 0.0, 1.0, 1.0]],
 [[0.0, -1.0, 0.0, -1.0], [0.0, 0.0, -1.0, -1.0]],
 [[0.0, -1.0, 0.0, -1.0], [0.0, 0.0, 1.0, -1.0]],
 [[0.0, -1.0, 0.0, 1.0], [0.0, 0.0, -1.0, 1.0]],
 [[0.0, -1.0, 0.0, 1.0], [0.0, 0.0, 1.0, 1.0]],
 [[0.0, 1.0, 0.0, -1.0], [0.0, 0.0, -1.0, -1.0]],
 [[0.0, 1.0, 0.0, -1.0], [0.0, 0.0, 1.0, -1.0]],
 [[0.0, 1.0, 0.0, 1.0], [0.0, 0.0, -1.0, 1.0]],
 [[0.0, 1.0, 0.0, 1.0], [0.0, 0.0, 1.0, 1.0]]
];

