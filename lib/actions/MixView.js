
// Mix of colorized segmentation with "normal shading."

import * as viewVolume from "../actions/ViewVolume.js";
import * as ThresholdAction from "../actions/ThresholdAction.js";
import * as NormalAction from "../actions/NormalAction.js";
import * as IndexColorizePanel from "../actions/IndexColorizePanel";
import * as MixColorPanels from "../actions/MixColorPanels";
import * as Soften from "../actions/Soften.js"
//import * as qdVector from "qd_vector";


export class Mix extends viewVolume.View {
    constructor (ofVolume, indexed_colors, ratio) {
        super(ofVolume);
        this.indexed_colors = indexed_colors;
        this.ratio = ratio;
    };
    async run() {
        // make sure colors have loaded
        await this.colors_promise;
        super.run();
    };
    panel_sequence(context) {
        context = context || this.context;
        // data objects
        const inputVolume = this.ofVolume;
        this.soft_volume = inputVolume.same_geometry(context);
        this.depth_buffer = this.get_output_depth_buffer(context);
        //this.color_panel = this.get_output_panel(context);
        this.index_panel = this.get_output_panel(context);
        this.output_panel = this.get_output_panel(context);
        this.threshold_value = 0.5;
        // load colors
        const ncolors = this.indexed_colors.length;
        this.color_panel = context.panel(1, ncolors);
        this.colors_promise = this.color_panel.push_buffer(this.indexed_colors);
        // actions
        this.project_action = new ThresholdAction.ThresholdProject(
            inputVolume,
            this.depth_buffer,
            this.projection_matrix,
            this.threshold_value,
        );
        this.project_action.attach_to_context(context); // xxx move to context
        // before normal colorize!
        // flatten threshold crossings for indexed colorization.
        this.index_flatten = this.depth_buffer.flatten_action(this.index_panel);
        // soften using default weights
        this.soften_action = new Soften.SoftenVolume(inputVolume, this.soft_volume, null);
        this.soften_action.attach_to_context(context);
        // normal colorize using the softened volume
        const default_color = 0;
        this.normal_colorize_action = new NormalAction.NormalColorize(
            this.soft_volume,
            this.depth_buffer,
            this.projection_matrix,
            default_color,
        );
        this.normal_colorize_action.attach_to_context(context);
        this.flatten_normals = this.depth_buffer.flatten_action(this.output_panel);
        // index colors
        this.index_colorize = new IndexColorizePanel.IndexColorizePanel(
            this.color_panel,
            this.index_panel,
            default_color,
        );
        this.index_colorize.attach_to_context(context);
        this.mix_action = new MixColorPanels.MixPanels(
            this.index_panel,
            this.output_panel,
            this.ratio,
        );
        // move this...
        this.mix_action.attach_to_context(context);
        // Projection sequence
        this.project_to_panel = context.sequence([
            this.project_action,
            this.index_flatten,
            this.soften_action, // should execute only once (unless volume changes)
            this.normal_colorize_action,
            this.index_colorize,
            this.flatten_normals,
            this.mix_action,
        ]);
        return {
            sequence: this.project_to_panel,
            output_panel: this.output_panel,
        };
    };
    change_matrix(matrix) {
        this.project_action.change_matrix(matrix);
        this.normal_colorize_action.change_matrix(matrix);
    };
    change_ratio(ratio) {
        this.mix_action.change_ratio(ratio);
        this.run();
    };
};
