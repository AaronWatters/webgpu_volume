
// test driver for sampling one volume into another
// xxxx needs generalization with transform and default value???

import * as GPUContext from "./GPUContext.js";
import * as GPUVolume from "./GPUVolume.js";
import * as SampleVolume from "./SampleVolume.js";

export function do_sample() {
    console.log("computing sample asyncronously");
    (async () => await do_sample_async() )();
};

async function do_sample_async() {
    debugger;
    const context = new GPUContext.Context();
    await context.connect();
    // row major geometry matrix for input
    const ijk2xyz_in = [
        [1, 0, 0, 1],
        [0, 1, 0, 2],
        [0, 0, 1, 3],
        [0, 0, 0, 1],
    ];
    // data for input
    const shape_in = [2, 3, 2];
    const content_in = [ 30,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11];
    // output geometry
    const ijk2xyz_out = [
        [0, 1, 0, 1],
        [0, 0, 1, 2],
        [1, 0, 0, 3],
        [0, 0, 0, 1],
    ];
    const shape_out = [2, 2, 3];
    // expected...
    const content_out = [30, 2, 4, 6, 8, 10, 1, 3, 5, 7, 9, 11];
    // input volume with content
    const inputVolume = new GPUVolume.Volume(shape_in, content_in, ijk2xyz_in);
    inputVolume.attach_to_context(context);
    const samplerAction = new SampleVolume.SampleVolume(shape_out, ijk2xyz_out, inputVolume);
    samplerAction.attach_to_context(context);
    // run the action
    samplerAction.run();
    // pull the result
    const resultArray = await samplerAction.pull()
    console.log("expected", content_out);
    console.log("got output", resultArray);
};
