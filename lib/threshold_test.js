

// xxx move most of this logic elsewhere?
//import * as GPUAction from "./GPUAction.js";
import * as GPUContext from "./GPUContext.js";
import * as ThresholdAction from "./ThresholdAction.js";
import * as NormalAction from "./NormalAction.js";
import * as canvas_orbit from "./canvas_orbit";
import * as qdVector from "qd_vector";

export class ThresholdPipeline {
    constructor (volume_url, canvas, slider) {
        //super();
        this.slider = slider;
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
        const f32 = new Float32Array(buffer);
        console.log("f32", f32);
        this.volume_shape = f32.slice(0, 3);
        this.volume_content = f32.slice(3);
        // center the volume around the origin
        const [K, J, I] = this.volume_shape;
        this.volume_matrix = qdVector.affine3d(null, [-K/2, -J/2, -I/2]);
        await this.connect_future;
        this.volume = context.volume(
            this.volume_shape,
            this.volume_content,
            this.volume_matrix,
            Float32Array,
        );
        console.log("input Volume", this.volume);
        this.slider.min = this.volume.min_value;
        this.slider.max = this.volume.max_value;
        // construct depth buffer
        const MaxS = Math.max(K, J, I);
        this.output_shape = [MaxS * 2, MaxS * 2]
        const default_depth = -10000;
        const default_value = -10000;
        this.depth_buffer = context.depth_buffer(
            this.output_shape,
            default_depth,
            default_value,
            null, //input_data,
            null, // input_depths,
            Float32Array,
        );
        // project action from volume to depth buffer
        this.k_limit = (MaxS + 1)*3;
        this.threshold_value = 33000; // xxx temp?
        this.initial_rotation = [
            [0, 0, 1],
            [1, 0, 0],
            [0, 1, 0]
        ];
        //this.initial_rotation = [[ 0,  0, -1],
        //[-1,  0,  0],
        //[ 0,  1,  0]];
        this.affine_translation = qdVector.affine3d(null, [-MaxS, -MaxS, -MaxS]);
        this.projection_matrix = qdVector.MM_product(
            qdVector.affine3d(this.initial_rotation),
            this.affine_translation,
        );
        this.project_action = new ThresholdAction.ThresholdProject(
            this.volume,
            this.depth_buffer,
            this.projection_matrix,
            this.k_limit,
            this.threshold_value,
        );
        this.project_action.attach_to_context(context); // xxx move to context
        // normal colorize
        const default_color = 0;
        this.colorize_action = new NormalAction.NormalColorize(
            this.volume,
            this.depth_buffer,
            this.projection_matrix,
            default_color,
        );
        this.colorize_action.attach_to_context(context);
        // attach orbiter
        this.orbiter = new canvas_orbit.Orbiter(
            this.canvas,
            null, // center,
            this.initial_rotation,
            this.get_orbiter_callback(), // callback,
        )
        // construct the image panel
        const [height, width] = this.output_shape;
        this.panel = context.panel(width, height);
        // flatten depths onto panel
        //this.flatten_action = this.depth_buffer.copy_depths_action(this.panel);
        this.flatten_action = this.depth_buffer.flatten_action(this.panel);
        // convert the panels to gray color
        this.grey_panel = context.panel(width, height);
        const minimum = -MaxS; // for depths
        const maximum = MaxS; // for depths
        //this.gray_action = context.to_gray_panel(this.panel, this.grey_panel, minimum, maximum);
        // paint the panel onto the canvas
        this.painter = context.paint(this.panel, this.canvas);
        // construct the pipeline sequence
        this.sequence = context.sequence([
            this.project_action, 
            this.colorize_action,
            this.flatten_action, 
            //this.gray_action, 
            this.painter,
        ]);
        this.sequence.run();
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
    change_parameters(affine_transform, threshold) {
        if (affine_transform){
            const M = qdVector.MM_product(
                affine_transform,
                this.affine_translation, 
            )
            this.projection_matrix = M;
            this.project_action.change_matrix(M);
            this.colorize_action.change_matrix(M);
        }
        if (threshold) {
            this.project_action.change_threshold(threshold);
        };
        this.run();
    };
};