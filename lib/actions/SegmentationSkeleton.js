
import * as viewVolume from "../actions/ViewVolume.js";
//import * as MaxView from "../actions/MaxView.js";
//import * as MixView from "../actions/MixView.js";
import * as ThresholdAction from "../actions/ThresholdAction.js";
import * as IndexColorizePanel from "../actions/IndexColorizePanel";
import * as OutlinePanel from "../actions/OutlinePanel";
import * as JointProjection from "../actions/JointProjection.js";
import * as MixColorPanels from "../actions/MixColorPanels";
import * as OverlayPanel from "../actions/OverlayPanel.js";
import * as qdVector from "qd_vector";

export class SegmentationSkeleton extends viewVolume.View {
    constructor (segmentationVolume, intensityVolume, indexed_colors, canvas) {
        // xxx copied from Triptych.js
        super(segmentationVolume);
        this.segmentationVolume = segmentationVolume;
        this.intensityVolume = intensityVolume;
        this.indexed_colors = indexed_colors;
        this.canvas = canvas;
    };
    panel_sequence(context) {
        context = context || this.context;
        this.min_value = this.intensityVolume.min_value;
        this.max_value = this.intensityVolume.max_value;

        // Put the indexed colors in a panel
        const ncolors = this.indexed_colors.length;
        this.color_panel = context.panel(1, ncolors);
        //debugger;
        this.colors_future = this.color_panel.push_buffer(this.indexed_colors)
        // max projection
        this.max_depth_buffer = this.get_output_depth_buffer(context);
        this.max_project_action = context.max_projection(
            this.intensityVolume,
            this.max_depth_buffer,
            this.projection_matrix,
        );
        //this.max_panel = this.get_output_panel(context);
        //this.max_flatten_action = this.max_depth_buffer.flatten_action(this.max_panel);
        this.max_to_gray = this.get_gray_panel_sequence(this.max_depth_buffer, this.min_value, this.max_value);
        this.max_gray_panel = this.max_to_gray.output_panel;

        // outline segmentation
        this.index_panel = this.get_output_panel(context);
        this.index_depth_buffer = this.get_output_depth_buffer(context);
        // cross threshold from 0 to any positive integer
        this.threshold_value = 0.5;
        this.index_project_action = new ThresholdAction.ThresholdProject(
            this.segmentationVolume,
            this.index_depth_buffer,
            this.projection_matrix,
            this.threshold_value,
        );
        this.index_project_action.attach_to_context(context);
        // flatten threshold crossings for indexed colorization.
        this.index_flatten_action = this.index_depth_buffer.flatten_action(this.index_panel);
        // get outlines
        this.outline_panel = this.get_output_panel(context);
        const default_color = 0;
        this.outline_indices = new OutlinePanel.OutlinePanel(
            this.index_panel,
            this.outline_panel,
            default_color,
        );
        this.outline_indices.attach_to_context(context);
        // colorize outlines
        //this.outline_color_panel = this.get_output_panel(context);
        this.outline_colorize = new IndexColorizePanel.IndexColorizePanel(
            this.color_panel,
            this.outline_panel,
            default_color,
        );
        this.outline_colorize.attach_to_context(context);

        // get skeleton
        const default_depth = 0; //-10000;
        const default_value = 0; //-10000;
        this.skeleton_depth_buffer = context.depth_buffer(
            this.output_shape,
            default_depth,
            default_value,
            null, //input_data,
            null, // input_depths,
            Float32Array,
        );
        this.joint_project = new JointProjection.JointProject(
            this.segmentationVolume,
            this.skeleton_depth_buffer,
            this.projection_matrix,
        );
        this.joint_project.attach_to_context(context);
        this.skeleton_panel = this.get_output_panel(context);
        this.skeleton_flatten = this.skeleton_depth_buffer.flatten_action(this.skeleton_panel);
        this.skeleton_colorize = new IndexColorizePanel.IndexColorizePanel(
            this.color_panel,
            this.skeleton_panel,
            default_color,
        );
        this.skeleton_colorize.attach_to_context(context);

        // mix skeleton with max value projection
        const ratio = 0.3;
        this.output_panel = this.max_gray_panel
        
        this.mix_action = new MixColorPanels.MixPanels(
            this.skeleton_panel,
            this.output_panel,
            ratio,
        );
        this.mix_action.attach_to_context(context);
        
        // overlay outline
        
        this.overlay_panels = new OverlayPanel.OverlayPanel(
            this.outline_panel,
            this.output_panel,
            0, // ignore_color
        );
        this.overlay_panels.attach_to_context(context);
        

        this.project_to_panel = context.sequence([
            this.max_project_action,
            this.max_to_gray.sequence,
            this.index_project_action,
            this.index_flatten_action,
            this.outline_indices,
            this.outline_colorize,
            this.joint_project,
            this.skeleton_flatten,
            this.skeleton_colorize,
            this.mix_action,
            this.overlay_panels,
        ]);
        return {
            sequence: this.project_to_panel,
            output_panel: this.output_panel,
            //output_panel: this.skeleton_panel,
        };
    };
    async run() {
        // make sure colors have loaded and softening is done.
        await this.colors_future;
        super.run();
    };
    change_matrix(matrix) {
        this.max_project_action.change_matrix(matrix);
        this.index_project_action.change_matrix(matrix);
        this.joint_project.change_matrix(matrix);
    };
};