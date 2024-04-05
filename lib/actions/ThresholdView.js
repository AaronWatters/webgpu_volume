
// Generate a colorized threshold view on a standard panel.

import * as viewVolume from "../actions/ViewVolume.js";
import * as ThresholdAction from "../actions/ThresholdAction.js";
import * as NormalAction from "../actions/NormalAction.js";
import * as Soften from "../actions/Soften.js"
//import * as qdVector from "qd_vector";

export class Threshold extends viewVolume.View {
    constructor (ofVolume, soften) {
        super(ofVolume);
        this.soften = soften;
    };
    async run() {
        // make sure softening is done.
        if (this.soften) {
            await this.soften_promise;
        }
        super.run();
    };
    panel_sequence(context) {
        context = context || this.context;
        // data objects
        const inputVolume = this.ofVolume;
        this.depth_buffer = this.get_output_depth_buffer(context);
        this.panel = this.get_output_panel(context);
        this.min_value = inputVolume.min_value;
        this.max_value = inputVolume.max_value;
        this.threshold_value = (inputVolume.min_value + inputVolume.max_value) / 2.0;
        var project_volume = inputVolume;
        if (this.soften) {
            this.soft_volume = inputVolume.same_geometry(context);
            this.soften_action = new Soften.SoftenVolume(inputVolume, this.soft_volume, null);
            this.soften_action.attach_to_context(context);
            this.soften_action.run();
            this.soften_promise = context.onSubmittedWorkDone();
            project_volume = this.soft_volume;
        }
        this.project_action = new ThresholdAction.ThresholdProject(
            project_volume,
            this.depth_buffer,
            this.projection_matrix,
            this.threshold_value,
        );
        this.project_action.attach_to_context(context); // xxx move to context
        // normal colorize
        const default_color = 0;
        this.colorize_action = new NormalAction.NormalColorize(
            inputVolume,
            this.depth_buffer,
            this.projection_matrix,
            default_color,
        );
        this.colorize_action.attach_to_context(context);
        this.flatten_action = this.depth_buffer.flatten_action(this.panel);
        this.project_to_panel = context.sequence([
            this.project_action, 
            this.colorize_action, 
            this.flatten_action, 
        ]);
        return {
            sequence: this.project_to_panel,
            output_panel: this.panel,
        };
    };
    //run() { // xxx move to viewVolume.View
    //    const sequence = this.paint_sequence || this.project_to_panel;
    //    sequence.run();
    //};
    /*
    _orbiter_callback(affine_transform) {
        // xxxx move to viewVolume.View ???
        const matrix = qdVector.MM_product(affine_transform, this.projection_matrix);
        this.project_action.change_matrix(matrix);
        this.colorize_action.change_matrix(matrix);
        this.run();
        //const sequence = this.paint_sequence || this.project_to_panel;
        //sequence.run();
    };
    */
    change_matrix(matrix) {
        this.project_action.change_matrix(matrix);
        this.colorize_action.change_matrix(matrix);
    };
    change_threshold(value) {
        this.project_action.change_threshold(value);
        this.run();
    };
};
