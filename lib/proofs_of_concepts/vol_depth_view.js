
// Viewer that tests volume_at_depth in isolation.

import * as viewVolume from "../actions/ViewVolume.js";
import * as VolumeAtDepth from "../actions/VolumeAtDepth.js";
import * as qdVector from "qd_vector";

// xxx this is very similar to MaxView.js

export class TestDepthView extends viewVolume.View {
    panel_sequence(context) {
        context = context || this.context;
        const inputVolume = this.ofVolume;
        this.min_value = inputVolume.min_value;
        this.max_value = inputVolume.max_value;
        const origin = [0,0,0,1];
        const projection = qdVector.M_inverse(this.projection_matrix);
        const porigin = qdVector.Mv_product(projection, origin)
        this.current_depth = porigin[2];  // volume centered at origin by default
        this.depth_buffer = this.get_output_depth_buffer(context);
        this.value_panel = this.get_output_panel(context);
        this.grey_panel = this.get_output_panel(context);
        this.project_action = new VolumeAtDepth.VolumeAtDepth(
            this.ofVolume,
            this.depth_buffer,
            this.projection_matrix,
            this.current_depth,
        );
        this.project_action.attach_to_context(context);
        this.flatten_action = this.depth_buffer.flatten_action(this.value_panel);
        this.gray_action = context.to_gray_panel(
            this.value_panel, this.grey_panel, this.min_value, this.max_value);
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
    change_matrix(matrix) {
        this.project_action.change_matrix(matrix);
        this.change_range(matrix);
    };
    change_depth(depth) {
        this.project_action.change_depth(depth);
        this.run();
    };
    on_range_change(callback) {
        this.range_change_callback = callback;
        this.change_range(this.projection_matrix);
    };
    change_range(matrix) {
        const callback = this.range_change_callback;
        if (callback) {
            // inverted projecte range
            const invert = true;
            const range = this.ofVolume.projected_range(matrix, invert);
            const min_depth = range.min[2];
            const max_depth = range.max[2];
            console.log("new range min", min_depth, "max", max_depth)
            callback(min_depth, max_depth);
        }
    };
};