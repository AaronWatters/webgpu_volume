
import * as GPUContext from "./GPUContext.js";
import * as GPUDepthBuffer from "./GPUDepthBuffer.js";
import * as CombineDepths from "./CombineDepths.js";

export function do_combine() {
    console.log("computing sample asyncronously");
    (async () => await do_combine_async() )();
};

async function do_combine_async() {
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
    const inputDB = new GPUDepthBuffer.DepthBuffer(
        input_shape,
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