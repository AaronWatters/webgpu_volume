
// test of pasting gray

import * as GPUContext from "../support/GPUContext.js";
import * as GPUColorPanel from "../data_objects/GPUColorPanel.js";
import * as UpdateGray from "../actions/UpdateGray.js";

export function do_gray() {
    console.log("computing sample asyncronously");
    (async () => await do_gray_async() )();
};

async function do_gray_async() {
    const context = new GPUContext.Context();
    await context.connect();
    const input = new GPUColorPanel.Panel(3,3);
    const output = new GPUColorPanel.Panel(3,3);
    input.attach_to_context(context);
    output.attach_to_context(context);
    const A = new Float32Array([
        1,2,3,
        4,5,6,
        7,8,9,
    ]);
    input.push_buffer(A);
    const gray_action = new UpdateGray.ToGrayPanel(input, output, 0, 10);
    gray_action.attach_to_context(context);
    gray_action.run();
    const resultArray = await output.pull_buffer();
    console.log("got result", resultArray);
};
