
// test of pipeline with max value projection 
import * as GPUContext from "../support/GPUContext.js";
import * as GPUColorPanel from "../data_objects/GPUColorPanel.js";
import * as canvas_orbit from "../support/canvas_orbit";
//import * as PaintPanel from "./PaintPanel.js";
import * as qdVector from "qd_vector";

export function do_pipeline(canvas, from_fn, kSlider, kValue) {
    console.log("computing sample asyncronously");
    (async () => await do_pipeline_async(canvas, from_fn, kSlider, kValue) )();
};

// globals for events
var project_action;
var sequence;
var shape_in;
var orbiter;
var initial_rotation;

function orbiter_callback(affine_transform) {
    const [K, J, I] = shape_in;
    const MaxS = Math.max(K, J, I);
    const translate_out = qdVector.affine3d(null, [-MaxS, -MaxS, -MaxS]);
    const ijk2xyz_out = qdVector.MM_product(affine_transform, translate_out);
    project_action.change_matrix(ijk2xyz_out);
    sequence.run();
}

async function do_pipeline_async(canvas, from_fn, kSlider, kValue) {
    debugger;
    from_fn = from_fn || "./mri.bin";
    // orbiter with default center and initial rotation
    initial_rotation = [
        [0, 0, -1],
        [1, 0, 0],
        [0, -1, 0]
    ];
    orbiter = new canvas_orbit.Orbiter(
        canvas,
        null, // center,
        initial_rotation,
        orbiter_callback, // callback,
    )
    const context = new GPUContext.Context();
    await context.connect();
    // https://stackoverflow.com/questions/48447550/how-can-i-send-a-binary-data-blob-using-fetch-and-formdata
    //const from_fn = "./mri.bin";
    const response = await fetch(from_fn);
    const content = await response.blob();
    const buffer = await content.arrayBuffer()
    console.log("buffer", buffer);
    const f32 = new Float32Array(buffer);
    console.log("f32", f32);
    shape_in = f32.slice(0, 3);
    console.log("shape_in", shape_in);
    const [K, J, I] = shape_in;
    if (kSlider) {
        kSlider.max = 3*K;
        kSlider.min = -3*K;
    }
    const MaxS = Math.max(K, J, I);
    const content_in = f32.slice(3);
    // DEBUG: IDENTITY
    //var ijk2xyz_in = qdVector.affine3d(null, [-K/2, -J/2, -I/2]);
    var ijk2xyz_out = qdVector.MM_product(
        qdVector.affine3d(initial_rotation),
        qdVector.affine3d(null, [-MaxS, -MaxS, -MaxS])
    );
    const vol_rotation = qdVector.eye(4);
    vol_rotation[1][1] = -1;  // invert Y
    const vol_translation = qdVector.affine3d(null, [-K/2, -J/2, -I/2]);
    var ijk2xyz_in = qdVector.MM_product(vol_rotation, vol_translation);
    const inputVolume = context.volume(shape_in, content_in, ijk2xyz_in, Float32Array);
    //inputVolume.attach_to_context(context);
    console.log("inputVolume", inputVolume);
    const output_shape = [MaxS * 2, MaxS * 2];//shape_in.slice(1);
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
    //const M = Math.max(I, J, K) + 1;
    const k_limit = (MaxS + 1)*3;
    console.log("k_limit", k_limit);
    project_action = context.max_projection(inputVolume, outputDB, ijk2xyz_out, k_limit);
    //project_action.attach_to_context(context);
    console.log("project_action", project_action);
    const max_panel = new GPUColorPanel.Panel(width, height);
    max_panel.attach_to_context(context);
    const flatten_action = outputDB.flatten_action(max_panel);
    //const flatten_action = outputDB.copy_depths_action(max_panel);
    flatten_action.attach_to_context(context);
    const grey_panel = context.panel(width, height);
    //grey_panel.attach_to_context(context);
    const minimum = inputVolume.min_value; // 31000
    const maximum = inputVolume.max_value; // 36000
    //const minimum = 0; // for depths
    //const maximum = MaxS; // for depths
    const gray_action = context.to_gray_panel(max_panel, grey_panel, minimum, maximum);
    const painter = context.paint(grey_panel, canvas);
    sequence = context.sequence([
        project_action, 
        flatten_action, 
        gray_action, 
        painter
    ]);
    //sequence.run(); xxx
    do_rotation(0,0,0,kSlider,kValue);
};

export function do_rotation(roll, pitch, yaw, kSlider, kValue) {
    const R = qdVector.M_roll(roll);
    const P = qdVector.M_pitch(pitch);
    const Y = qdVector.M_yaw(yaw);
    const RPY = qdVector.MM_product(qdVector.MM_product(R, P), Y)
    const [K, J, I] = shape_in;
    const MaxS = Math.max(K, J, I);
    var KK = -MaxS;
    if (kSlider) {
        KK = kSlider.value;
    }
    if (kValue) {
        kValue.textContent = KK;
    }
    //const translate_out = qdVector.affine3d(null, [-I, -J, -K]);
    //const translate_out = qdVector.affine3d(null, [-MaxS, -MaxS, -MaxS]);
    //const translate_out = qdVector.affine3d(null, [-MaxS, -MaxS, KK]);
    const translate_out = qdVector.MM_product(
        qdVector.affine3d(initial_rotation),
        qdVector.affine3d(null, [-MaxS, -MaxS, KK])
    )
    const rotate_out = qdVector.affine3d(RPY);
    const ijk2xyz_out = qdVector.MM_product(rotate_out, translate_out);
    //console.log("rotating", ijk2xyz_out);
    project_action.change_matrix(ijk2xyz_out);
    //project_action.change_matrix(rotate_out); // debug: just the rotation
    sequence.run();
};
