
// test of pipeline with max value projection 
import * as GPUContext from "./GPUContext.js";
import * as GPUVolume from "./GPUVolume.js";
import * as MaxProjection from "./MaxProjection.js";
import * as GPUDepthBuffer from "./GPUDepthBuffer.js";
import * as UpdateGray from "./UpdateGray.js";
import * as GPUColorPanel from "./GPUColorPanel.js";
import * as PaintPanel from "./PaintPanel.js";

export function do_pipeline(canvas) {
    console.log("computing sample asyncronously");
    (async () => await do_pipeline_async(canvas) )();
};

async function do_pipeline_async(canvas) {
    debugger;
    const context = new GPUContext.Context();
    await context.connect();
    // https://stackoverflow.com/questions/48447550/how-can-i-send-a-binary-data-blob-using-fetch-and-formdata
    const from_fn = "./mri.bin";
    const response = await fetch(from_fn);
    const content = await response.blob();
    const buffer = await content.arrayBuffer()
    console.log("buffer", buffer);
    const f32 = new Float32Array(buffer);
    console.log("f32", f32);
    const shape_in = f32.slice(0, 3);
    const content_in = f32.slice(3);
    const ijk2xyz_in = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ];
    const inputVolume = context.volume(shape_in, content_in, ijk2xyz_in, Float32Array);
    //inputVolume.attach_to_context(context);
    console.log("inputVolume", inputVolume);
    const output_shape = shape_in.slice(1);
    // shape_in is [K, J, I] or [depth, height, width]
    const [height, width] = output_shape;
    const default_depth = -100;
    const default_value = -100;
    const outputDB = context.depth_buffer(
        output_shape,
        default_depth,
        default_value,
        null, //input_data,
        null, // input_depths,
        Float32Array,
    );
    //outputDB.attach_to_context(context);
    console.log("outputDB", outputDB);
    const k_limit = 225;
    const project_action = context.max_projection(inputVolume, outputDB, ijk2xyz_in, k_limit);
    //project_action.attach_to_context(context);
    console.log("project_action", project_action);
    const max_panel = new GPUColorPanel.Panel(width, height);
    max_panel.attach_to_context(context);
    const flatten_action = outputDB.flatten_action(max_panel);
    flatten_action.attach_to_context(context);
    const grey_panel = context.panel(width, height);
    //grey_panel.attach_to_context(context);
    const gray_action = context.to_gray_panel(max_panel, grey_panel, 31000, 36000);
    //gray_action.attach_to_context(context);
    const painter = context.paint(grey_panel, canvas);
    //painter.attach_to_context(context);
    //project_action.run();
    //flatten_action.run();
    //gray_action.run();
    //painter.run();
    const sequence = context.sequence([
        project_action, 
        flatten_action, 
        gray_action, 
        painter
    ]);
    sequence.run();
};