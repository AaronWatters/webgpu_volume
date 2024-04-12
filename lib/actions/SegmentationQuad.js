
import * as viewVolume from "../actions/ViewVolume.js";
import * as canvas_orbit from "../support/canvas_orbit";
import * as MaxView from "../actions/MaxView.js";
import * as MixView from "../actions/MixView.js";
import * as IndexColorizePanel from "../actions/IndexColorizePanel";
import * as VolumeAtDepth from "../actions/VolumeAtDepth.js";
import * as qdVector from "qd_vector";

export class SegmentationQuad extends viewVolume.View {
    constructor (segmentationVolume, intensityVolume, indexed_colors, range_callback) {
        // xxx copied from Triptych.js
        super(segmentationVolume);
        this.segmentationVolume = segmentationVolume;
        this.intensityVolume = intensityVolume;
        this.range_callback = range_callback;
        this.indexed_colors = indexed_colors;
    };
    async paint_on(canvas, orbiting) {
        throw new Error("SegmentationQuad.paint_on not implemented.");
    };
    async paint_on_canvases(
        segmentationSliceCanvas, 
        maxCanvas, 
        intensitySliceCanvas, 
        segmentationShadeCanvas, 
        orbiting) 
    {
        const context = this.ofVolume.context;
        if (!context) {
            throw new Error("Volume is not attached to GPU context.");
        }
        this.attach_to_context(context);
        const projections = this.panel_sequence(context);
        const slice_painter = context.paint(projections.seg_slice_panel, segmentationSliceCanvas);
        const max_painter = context.paint(projections.max_panel, maxCanvas);
        const islice_painter = context.paint(projections.intensity_slice_panel, intensitySliceCanvas);
        const shaded_painter = context.paint(projections.shaded_panel, segmentationShadeCanvas);
        this.paint_sequence = context.sequence([
            projections.sequence,
            slice_painter,
            max_painter,
            islice_painter,
            shaded_painter,
        ]);
        if (orbiting) {
            const orbiter_callback = this.get_orbiter_callback();
            const rotation = qdVector.eye(3);
            this.orbiter = new canvas_orbit.Orbiter(
                segmentationShadeCanvas,
                null, // center,
                rotation,
                orbiter_callback, // callback,
            );
            this.orbiter.attach_listeners_to(maxCanvas);
            this.orbiter.attach_listeners_to(intensitySliceCanvas);
            this.orbiter.attach_listeners_to(segmentationSliceCanvas);
            //this.orbiter.attach_listeners_to(segmentationQuadCanvas);
        }
        this.run();
    };
    panel_sequence(context) {
        context = context || this.context;
        // geometry
        this.min_value = this.intensityVolume.min_value;
        this.max_value = this.intensityVolume.max_value;
        this.change_range(this.projection_matrix);
        this.current_depth = (this.min_depth + this.max_depth) / 2.0; // default
        // actions
        const actions_collector = [];
        // max projection
        const maxView = new MaxView.Max(this.intensityVolume);
        this.maxView = maxView;
        maxView.attach_to_context(context);
        const max_projections = maxView.panel_sequence(context);
        actions_collector.push(max_projections.sequence);
        // intensity slice
        this.slice_depth_buffer = this.get_output_depth_buffer(context);
        this.slice_value_panel = this.get_output_panel(context);;
        this.slice_gray_panel = this.get_output_panel(context);
        this.slice_project_action = new VolumeAtDepth.VolumeAtDepth(
            this.intensityVolume,
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
        // shaded segmentation
        const ratio = 0.7;
        const mixView = new MixView.Mix(this.segmentationVolume, this.indexed_colors, ratio);
        mixView.attach_to_context(context);
        this.mixView = mixView;
        const mix_projections = mixView.panel_sequence(context);
        actions_collector.push(mix_projections.sequence);
        // segment slice
        this.segmentation_depth_buffer = this.get_output_depth_buffer(context);
        this.segmentation_value_panel = this.get_output_panel(context);
        this.segmentation_color_panel = this.get_output_panel(context);
        this.segmentation_project_action = new VolumeAtDepth.VolumeAtDepth(
            this.segmentationVolume,
            this.segmentation_depth_buffer,
            this.projection_matrix,
            this.current_depth,
        );
        this.segmentation_project_action.attach_to_context(context);
        actions_collector.push(this.segmentation_project_action);
        this.segmentation_flatten_action = this.segmentation_depth_buffer.flatten_action(this.segmentation_value_panel);
        actions_collector.push(this.segmentation_flatten_action);
        const default_color = 0;
        this.indexed_colorize = new IndexColorizePanel.IndexColorizePanel(
            mixView.color_panel,
            this.segmentation_value_panel,
            default_color,
        );
        this.indexed_colorize.attach_to_context(context);
        actions_collector.push(this.indexed_colorize);

        // combine actions...
        this.project_to_panel = context.sequence(actions_collector);
        return {
            sequence: this.project_to_panel,
            seg_slice_panel: this.segmentation_value_panel,
            max_panel: max_projections.output_panel,
            intensity_slice_panel: this.slice_gray_panel,
            shaded_panel: mix_projections.output_panel,
        };
    };
    change_depth(depth) {
        this.current_depth = depth;
        this.slice_project_action.change_depth(depth);
        this.segmentation_project_action.change_depth(depth);
        this.run();
    };
    change_matrix(matrix) {
        this.maxView.change_matrix(matrix);
        this.slice_project_action.change_matrix(matrix);
        this.segmentation_project_action.change_matrix(matrix);
        this.mixView.change_matrix(matrix);
        this.change_range(matrix);
    };
    change_range(matrix) {
        //this.projection_matrix = matrix;
        const invert_matrix = true;
        const range = this.ofVolume.projected_range(matrix, invert_matrix);
        this.min_depth = range.min[2];
        this.max_depth = range.max[2];
        if (this.range_callback) {
            this.range_callback(this.min_depth, this.max_depth);
        }
    };
};