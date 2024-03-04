

// smoke test for max projection

import * as GPUContext from "./GPUContext.js";
import * as GPUVolume from "./GPUVolume.js";
import * as MaxProjection from "./MaxProjection.js";
import * as GPUDepthBuffer from "./GPUDepthBuffer.js";

export function do_max_projection() {
    console.log("computing sample asyncronously");
    (async () => await do_max_projection_async() )();
};

async function do_max_projection_async() {
    debugger;
    const context = new GPUContext.Context();
    await context.connect();
    const output_shape = [2, 3];
    const default_depth = -100;
    const default_value = -100;
    const input_data = null;  // no initial data
    const input_depths = null;
    const outputDB = new GPUDepthBuffer.DepthBuffer(
        output_shape,
        default_depth,
        default_value,
        input_data,
        input_depths,
        Float32Array,
    );
    const ijk2xyz_in = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ];
    const shape_in = [2, 3, 2];
    const content_in = [ 30,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11];
    // input volume with content
    const inputVolume = new GPUVolume.Volume(shape_in, content_in, ijk2xyz_in, Float32Array);
    inputVolume.attach_to_context(context);
    outputDB.attach_to_context(context);
    console.log("inputVolume", inputVolume);
    const k_limit = 5;
    const project_action = new MaxProjection.MaxProject(inputVolume, outputDB, ijk2xyz_in, k_limit);
    project_action.attach_to_context(context);
    project_action.run();
    const resultArray = await outputDB.pull_data();
    console.log("got result", resultArray);
    console.log("outputDB", outputDB)
};
