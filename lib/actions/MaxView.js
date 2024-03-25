
// Generate a max projection view of a volume on a standard panel

import * as viewVolume from "../actions/ViewVolume.js";
import * as qdVector from "qd_vector";

export class Max extends viewVolume.View {
    panel_sequence(context) {
        context = context || this.context;
        const inputVolume = this.ofVolume;
        this.min_value = inputVolume.min_value;
        this.max_value = inputVolume.max_value;
        this.max_depth_buffer = this.get_output_depth_buffer(context);
        this.max_panel = this.get_output_panel(context);
        this.grey_panel = this.get_output_panel(context);
        this.project_action = context.max_projection(
            inputVolume,
            this.max_depth_buffer,
            this.projection_matrix,
            this.k_limit,
        );
        this.flatten_action = this.flatten_action = this.max_depth_buffer.flatten_action(
            this.max_panel);
        this.gray_action = context.to_gray_panel(
            this.max_panel, this.grey_panel, this.min_value, this.max_value);
        this.project_to_panel = context.sequence([
            this.project_action, 
            this.flatten_action, 
            this.gray_action, 
        ]);
        return {
            sequence: this.project_to_panel,
            output_panel: this.grey_panel,
        };
    };
    //_orbiter_callback(affine_transform) {
    //    const matrix = qdVector.MM_product(affine_transform, this.projection_matrix);
    //    this.project_action.change_matrix(matrix);
    //    const sequence = this.paint_sequence || this.project_to_panel;
    //    sequence.run();
    //};
    change_matrix(matrix) {
        this.project_action.change_matrix(matrix);
    };
};
