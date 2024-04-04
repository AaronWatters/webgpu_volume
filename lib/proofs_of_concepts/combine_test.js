

// test of pasting one depth buffer onto another.

import * as GPUContext from "../support/GPUContext.js";
import * as GPUDepthBuffer from "../data_objects/GPUDepthBuffer.js";
import * as CombineDepths from "../actions/CombineDepths.js";

export function do_combine() {
    console.log("computing sample asyncronously");
    (async () => await do_combine_async0() )();
};

async function do_combine_async0() {
    const context = new GPUContext.Context();
    await context.connect();
    // h/w
    const shape = [3, 3];
    const dd = -666; // default depth
    const dv = -666; // default value
    const input_data = [
        1, 2, dv,
        4, 5, 6,
        7, 8, 9,
    ];
    const input_depths = [
        1, 2, dd,
        4, 5, 6,
        7, 8, 9,
    ];
    const output_data = [
        9, 8, 7,
        6, 5, 4,
        dv, 2, 1,
    ];
    const output_depths = [
        9, 8, 7,
        6, 5, 4,
        dd, 2, 1,
    ];
    const inputDB = new GPUDepthBuffer.DepthBuffer(
        shape,
        dd,
        dv,
        input_data,
        input_depths,
        Float32Array,
    );
    const outputDB = new GPUDepthBuffer.DepthBuffer(
        shape,
        dd,
        dv,
        output_data,
        output_depths,
        Float32Array,
    );
    inputDB.attach_to_context(context);
    outputDB.attach_to_context(context);
    const combine_action = new CombineDepths.CombineDepths(
        outputDB,
        inputDB,
    );
    combine_action.attach_to_context(context);
    combine_action.run();
    const resultArray = await outputDB.pull_data();
    console.log("got result", resultArray);
    console.log("outputDB", outputDB);
}

async function do_combine_async1() {
    debugger;
    const context = new GPUContext.Context();
    await context.connect();
    // h/w
    const input_shape = [2, 3];
    const input_data = [
        1, 2, 3,
        4, 5, 6,
    ];
    const input_depths = [
        // depths
        5, 10, 5,
        10, 5, 5,
    ];
    const default_depth = -100;
    const default_value = -100;
    const inputDB = new GPUDepthBuffer.DepthBuffer(
        input_shape,
        default_depth,
        default_value,
        input_data,
        input_depths,
        Float32Array,
    );
    // h/w
    const output_shape = [3, 2];
    const output_data = [
        7, 8,
        9, 10,
        11, 12,
    ];
    const output_depths = [
        1, 1,
        1, 1,
        1, 1,
    ];
    const outputDB = new GPUDepthBuffer.DepthBuffer(
        output_shape,
        default_depth,
        default_value,
        output_data,
        output_depths,
        Float32Array,
    );
    inputDB.attach_to_context(context);
    outputDB.attach_to_context(context);
    const offset_ij = [1, -1];
    const sign = +1;
    const combine_action = new CombineDepths.CombineDepths(
        outputDB,
        inputDB,
        offset_ij,
        sign,
    );
    combine_action.attach_to_context(context);
    combine_action.run();
    const resultArray = await outputDB.pull_data();
    console.log("got result", resultArray);
    console.log("outputDB", outputDB);
};