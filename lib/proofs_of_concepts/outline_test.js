
// Proof of concept:
// Mix of colorized segmentation with "normal shading" modified to include outline

// xxx move most of this logic elsewhere?
//import * as GPUAction from "./GPUAction.js";
import * as GPUContext from "../support/GPUContext.js";
import * as ThresholdAction from "../actions/ThresholdAction.js";
import * as NormalAction from "../actions/NormalAction.js";
import * as canvas_orbit from "../support/canvas_orbit";
import * as OutlinePanel from "../actions/OutlinePanel";
import * as IndexColorizePanel from "../actions/IndexColorizePanel";
import * as MixColorPanels from "../actions/MixColorPanels";
import * as Soften from "../actions/Soften.js"
import * as qdVector from "qd_vector";

export class OutlinePipeline {
    constructor (volume_url, indexed_colors, canvas, ratio) {
        //super();
        ratio = ratio || 0.7;  // default ratio
        this.ratio = ratio;
        this.indexed_colors = new Uint32Array(indexed_colors);
        this.canvas = canvas;
        this.volume_url = volume_url;
        this.connect_future = this.connect();
        this.volume_future = this.load();
    };
    async connect() {
        this.context = new GPUContext.Context();
        await this.context.connect();
    };
    async load() {
        const context = this.context;
        // https://stackoverflow.com/questions/48447550/how-can-i-send-a-binary-data-blob-using-fetch-and-formdata
        const response = await fetch(this.volume_url);
        const content = await response.blob();
        const buffer = await content.arrayBuffer()
        console.log("buffer", buffer);
        //const f32 = new Float32Array(buffer);
        // interpret the buffer as u32, then convert to f32 for GPU
        const input_u32 = new Uint32Array(buffer);
        const f32 = new Float32Array(input_u32);
        console.log("f32", f32);
        this.volume_shape = f32.slice(0, 3);
        this.volume_content = f32.slice(3);
        // center the volume around the origin
        const [K, J, I] = this.volume_shape;
        const vol_rotation = qdVector.eye(4);
        vol_rotation[1][1] = -1;  // invert Y
        const vol_translation = qdVector.affine3d(null, [-K/2, -J/2, -I/2]);
        //this.volume_matrix = qdVector.affine3d(vol_rotation, [-K/2, -J/2, -I/2]);
        this.volume_matrix = qdVector.MM_product(vol_rotation, vol_translation);
        //this.volume_matrix = vol_rotation
        debugger;
        await this.connect_future;
        this.volume = context.volume(
            this.volume_shape,
            this.volume_content,
            this.volume_matrix,
            Float32Array,
        );
        this.soft_volume = context.volume(
            this.volume_shape,
            null, // no content
            this.volume_matrix,
            Float32Array,
        )
        // soften using default weights
        this.soften_action = new Soften.SoftenVolume(this.volume, this.soft_volume, null);
        this.soften_action.attach_to_context(context);
        console.log("input Volume", this.volume);
        const mm = this.volume.min_value;
        const MM = this.volume.max_value;
        // Put the indexed colors in a panel
        const ncolors = this.indexed_colors.length;
        this.color_panel = context.panel(1, ncolors);
        debugger;
        await this.color_panel.push_buffer(this.indexed_colors)
        // construct depth buffer
        const MaxS = Math.max(K, J, I);
        const side = Math.ceil(Math.sqrt(2) * MaxS)
        this.output_shape = [side, side];
        const default_depth = 0; //-10000;
        const default_value = 0; //-10000;
        this.depth_buffer = context.depth_buffer(
            this.output_shape,
            default_depth,
            default_value,
            null, //input_data,
            null, // input_depths,
            Float32Array,
        );
        // threshold project action from volume to depth buffer
        // cross threshold from 0 to any positive integer
        this.threshold_value = 0.5;
        this.initial_rotation = [
            [0, 0, 1],
            [1, 0, 0],
            [0, 1, 0]
        ];
        //this.initial_rotation = [[ 0,  0, -1],
        //[-1,  0,  0],
        //[ 0,  1,  0]];
        this.affine_translation = qdVector.affine3d(null, [-side/2, -side/2, -side]);
        this.projection_matrix = qdVector.MM_product(
            qdVector.affine3d(this.initial_rotation),
            this.affine_translation,
        );
        this.project_action = new ThresholdAction.ThresholdProject(
            this.volume,
            this.depth_buffer,
            this.projection_matrix,
            this.threshold_value,
        );
        this.project_action.attach_to_context(context); // xxx move to context
        // before normal colorize!
        // flatten threshold crossings for indexed colorization.
        const [height, width] = this.output_shape;
        this.index_panel = context.panel(width, height);
        this.index_flatten = this.depth_buffer.flatten_action(this.index_panel);
        const default_color = 0;
        //const default_color =  4290967295; //debug
        // get index outline
        this.outline_panel = context.panel(width, height);
        this.outline_indices = new OutlinePanel.OutlinePanel(
            this.index_panel,
            this.outline_panel,
            default_color,
        );
        this.outline_indices.attach_to_context(context);
        this.index_colorize = new IndexColorizePanel.IndexColorizePanel(
            this.color_panel,
            this.outline_panel,
            default_color,
        );
        // xxxx move this....
        this.index_colorize.attach_to_context(context);
        // normal colorize
        //const default_color = 0;
        this.colorize_action = new NormalAction.NormalColorize(
            this.soft_volume,  // do normal colorization using softened volume
            this.depth_buffer,
            this.projection_matrix,
            default_color,
        );
        // xxx move this...
        this.colorize_action.attach_to_context(context);
        // attach orbiter
        this.orbiter = new canvas_orbit.Orbiter(
            this.canvas,
            null, // center,
            this.initial_rotation,
            this.get_orbiter_callback(), // callback,
        )
        // construct the image panel
        //const [height, width] = this.output_shape;
        this.panel = context.panel(width, height);
        // flatten depths onto panel
        //this.flatten_action = this.depth_buffer.copy_depths_action(this.panel);
        this.flatten_action = this.depth_buffer.flatten_action(this.panel);
        // mix in the index panel
        const ratio = this.ratio;
        this.mix_action = new MixColorPanels.MixPanels(
            this.outline_panel,
            this.panel,
            ratio,
        );
        // move this...
        this.mix_action.attach_to_context(context);
        // paint the panel onto the canvas
        this.painter = context.paint(this.panel, this.canvas);
        //this.painter = context.paint(this.index_panel, this.canvas); //DEBUG
        // construct the pipeline sequence
        this.sequence = context.sequence([
            this.soften_action,  // this only needs to run once, really...
            this.project_action, 
            this.index_flatten,
            this.outline_indices,
            this.index_colorize,
            this.colorize_action,
            this.flatten_action, 
            this.mix_action,
            //this.gray_action, 
            this.painter,
        ]);
        this.sequence.run();
    };
    async debug_button_callback() {
        debugger;
        await this.index_panel.pull_buffer();
        await this.depth_buffer.pull_buffer();
        console.log("pipeline", this);
    };
    async run() {
        //console.log("run awaiting");
        await this.volume_future;
        //console.log("run running...")
        this.sequence.run();
    };
    get_orbiter_callback() {
        const that = this;
        function callback(affine_transform) {
            that.change_parameters(affine_transform);
        };
        return callback;
    };
    change_parameters(affine_transform, ratio) {
        if (affine_transform){
            const M = qdVector.MM_product(
                affine_transform,
                this.affine_translation, 
            )
            this.projection_matrix = M;
            this.project_action.change_matrix(M);
            this.colorize_action.change_matrix(M);
        }
        if (ratio) {
            this.mix_action.change_ratio(ratio);
        };
        this.run();
    };
};