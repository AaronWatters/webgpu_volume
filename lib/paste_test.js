
import * as GPUContext from "./GPUContext.js";
import * as GPUColorPanel from "./GPUColorPanel.js";
import * as PastePanel from "./PastePanel.js";

export function do_paste() {
    console.log("pasting asyncronously");
    (async () => await do_paste_async() )();
};

async function do_paste_async() {
    debugger;
    const context = new GPUContext.Context();
    await context.connect();
    const input = new GPUColorPanel.Panel(2,2);
    const output = new GPUColorPanel.Panel(3,3);
    input.attach_to_context(context);
    output.attach_to_context(context);
    const inputA = new Uint32Array([
        10, 20,
        30, 40,
    ]);
    input.push_buffer(inputA);
    const outputA = new Uint32Array([
        1,2,3,
        4,5,6,
        7,8,9,
    ]);
    output.push_buffer(outputA);
    const paste_action = new PastePanel.PastePanel(
        input,
        output,
        //[2,2], // xxxxx this can be inferred!
        //[3,3], // xxx
        [1,0],
    );
    paste_action.attach_to_context(context);
    paste_action.run();
    const resultArray = await output.pull_buffer();
    console.log("got result", resultArray);
};