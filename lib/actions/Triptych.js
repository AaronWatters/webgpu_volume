
import * as viewVolume from "../actions/ViewVolume.js";
import * as ThresholdAction from "../actions/ThresholdAction.js";
import * as NormalAction from "../actions/NormalAction.js";
import * as Soften from "../actions/Soften.js"
import * as MixDepthBuffers from "../actions/MixDepthBuffers.js";
import * as CombineDepths from "../actions/CombineDepths.js";
import * as UpdateGray from "../actions/UpdateGray.js";
import * as VolumeAtDepth from "../actions/VolumeAtDepth.js";
import * as DepthBufferRange from "../actions/DepthBufferRange.js";
import * as canvas_orbit from "../support/canvas_orbit";
import * as qdVector from "qd_vector";

// xxx a lot of this is copied from SlicedThresholdView.js

export class Triptych extends viewVolume.View {
    constructor (ofVolume, range_callback) {
        super(ofVolume);
        this.range_callback = range_callback;
    };
    async run() {
        // make sure softening is done.
        await this.soften_promise;
        super.run();
    };
    async paint_on(canvas, orbiting) {
        throw new Error("Triptych.paint_on not implemented.");
    };
    async paint_on_canvases(iso_canvas, max_canvas, slice_canvas, orbiting) {
        const context = this.ofVolume.context;
        if (!context) {
            throw new Error("Volume is not attached to GPU context.");
        }
        this.attach_to_context(context);
        const projections = this.panel_sequence(context);
        const iso_painter = context.paint(projections.iso_output_panel, iso_canvas);
        const max_painter = context.paint(projections.max_output_panel, max_canvas);
        const slice_painter = context.paint(projections.slice_output_panel, slice_canvas);
        this.paint_sequence = context.sequence([
            projections.sequence,
            iso_painter,
            max_painter,
            slice_painter,
        ]);
        if (orbiting) {
            const orbiter_callback = this.get_orbiter_callback();
            const rotation = qdVector.eye(3);
            this.orbiter = new canvas_orbit.Orbiter(
                slice_canvas,
                null, // center,
                rotation,
                orbiter_callback, // callback,
            );
            this.orbiter.attach_listeners_to(iso_canvas);
            this.orbiter.attach_listeners_to(max_canvas);
            //this.orbiter.attach_listeners_to(slice_canvas);
        }
        //sequence.run();
        //debugger;
        this.run();  // call method to allow subclass overloading.
    };
    panel_sequence(context) {
        debugger;
        context = context || this.context;
        const actions_collector = [];
        const inputVolume = this.ofVolume;
        this.min_value = inputVolume.min_value;
        this.max_value = inputVolume.max_value;
        this.change_range(this.projection_matrix);
        this.current_depth = (this.min_depth + this.max_depth) / 2.0; // default
        this.soft_volume = inputVolume.same_geometry(context);
        this.soften_action = new Soften.SoftenVolume(inputVolume, this.soft_volume, null);
        this.soften_action.attach_to_context(context);
        // Execute soften action only once!
        this.soften_action.run();
        this.soften_promise = context.onSubmittedWorkDone();
        // threshold crossings
        this.threshold_depth_buffer = this.get_output_depth_buffer(context);
        this.threshold_value = (inputVolume.min_value + inputVolume.max_value) / 2.0;
        const threshold_volume = this.soft_volume;  // ??? should this be soft_volume or inputVolume
        this.threshold_project_action = new ThresholdAction.ThresholdProject(
            inputVolume,
            this.threshold_depth_buffer,
            this.projection_matrix,
            this.threshold_value,
        );
        this.threshold_project_action.attach_to_context(context); // xxx move to context
        actions_collector.push(this.threshold_project_action);
        // normal colorize
        const default_color = 0;
        this.colorize_action = new NormalAction.NormalColorize(
            this.soft_volume,
            this.threshold_depth_buffer,
            this.projection_matrix,
            default_color,
        );
        this.colorize_action.attach_to_context(context);
        actions_collector.push(this.colorize_action);
        this.iso_panel = this.get_output_panel(context);
        this.iso_flatten_action = this.threshold_depth_buffer.flatten_action(this.iso_panel);
        actions_collector.push(this.iso_flatten_action);
        // max value projection
        // xxxx this is a copied from MaxView.js
        this.max_depth_buffer = this.get_output_depth_buffer(context);
        this.max_value = inputVolume.max_value;
        this.max_project_action = context.max_projection(
            inputVolume,
            this.max_depth_buffer,
            this.projection_matrix,
        );
        actions_collector.push(this.max_project_action);
        this.max_panel = this.get_output_panel(context);
        this.max_flatten_action = this.max_depth_buffer.flatten_action(this.max_panel);
        actions_collector.push(this.max_flatten_action);
        this.max_gray_panel = this.get_output_panel(context);
        this.max_gray_action = context.to_gray_panel(
            this.max_panel, this.max_gray_panel, this.min_value, this.max_value);
        actions_collector.push(this.max_gray_action);
        // slice value projection
        this.slice_depth_buffer = this.get_output_depth_buffer(context);
        this.slice_value_panel = this.get_output_panel(context);;
        this.slice_gray_panel = this.get_output_panel(context);
        this.slice_project_action = new VolumeAtDepth.VolumeAtDepth(
            inputVolume,
            this.slice_depth_buffer,
            this.projection_matrix,
            this.current_depth,
        );
        this.slice_project_action.attach_to_context(context);
        actions_collector.push(this.slice_project_action);
        this.slice_flatten_action = this.slice_depth_buffer.flatten_action(this.slice_value_panel);
        actions_collector.push(this.slice_flatten_action);
        this.slice_gray_action = context.to_gray_panel(
            this.slice_value_panel, this.slice_gray_panel, this.min_value, this.max_value);
        actions_collector.push(this.slice_gray_action);
        // assign output panels
        this.slice_output_panel = this.slice_gray_panel;
        this.max_output_panel = this.max_gray_panel;
        this.iso_output_panel = this.iso_panel;
        // project to all output panels sequence:
        this.project_to_panel = context.sequence(actions_collector);
        return {
            sequence: this.project_to_panel,
            iso_output_panel: this.iso_panel,
            max_output_panel: this.max_gray_panel,
            slice_output_panel: this.slice_gray_panel,
            //panel: this.panel,
            //depth_buffer: this.threshold_depth_buffer,
        };
    };
    change_threshold(value) {
        this.threshold_value = value;
        this.threshold_project_action.change_threshold(value);
        this.run();
    };
    change_matrix(matrix) {
        this.threshold_project_action.change_matrix(matrix);
        this.colorize_action.change_matrix(matrix);
        this.max_project_action.change_matrix(matrix);
        this.slice_project_action.change_matrix(matrix);
    };
    change_depth(depth) {
        this.slice_project_action.change_depth(depth);
        this.current_depth = depth;
        this.run();
    };
    change_range(matrix) {
        this.projection_matrix = matrix;
        const invert_matrix = true;
        const range = this.ofVolume.projected_range(matrix, invert_matrix);
        this.min_depth = range.min[2];
        this.max_depth = range.max[2];
        if (this.range_callback) {
            this.range_callback(this.min_depth, this.max_depth);
        }
    };
};