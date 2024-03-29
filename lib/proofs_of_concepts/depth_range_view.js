
// experimental combination of depth view with 2 depth ranges

import * as viewVolume from "../actions/ViewVolume.js";
import * as VolumeAtDepth from "../actions/VolumeAtDepth.js";
import * as DepthBufferRange from "../actions/DepthBufferRange.js";
import * as MixColorPanels from "../actions/MixColorPanels";
import * as qdVector from "qd_vector";

export class TestRangeView extends viewVolume.View {
    panel_sequence(context) {
        context = context || this.context;
        const inputVolume = this.ofVolume;
        this.min_value = inputVolume.min_value;
        this.max_value = inputVolume.max_value;
        const origin = [0,0,0,1];
        const projection = qdVector.M_inverse(this.projection_matrix);
        const porigin = qdVector.Mv_product(projection, origin)
        this.current_depth = porigin[2];  // volume centered at origin by default
        this.max_depth_buffer = this.get_output_depth_buffer(context);

        this.max_project_action = context.max_projection(
            inputVolume,
            this.max_depth_buffer,
            this.projection_matrix,
        );

        this.level_depth_buffer = this.get_output_depth_buffer(context);

        this.level_project_action = new VolumeAtDepth.VolumeAtDepth(
            inputVolume,
            this.level_depth_buffer,
            this.projection_matrix,
            this.current_depth,
        );
        this.level_project_action.attach_to_context(context); // move

        this.front_depth_buffer = this.get_output_depth_buffer(context);
        
        this.slice_front_action = new DepthBufferRange.DepthRange(
            this.max_depth_buffer,
            this.front_depth_buffer,
            this.min_value,
            this.current_depth,
            0, // slice depths, not values
        );
        this.slice_front_action.attach_to_context(context); // move

        this.back_depth_buffer = this.get_output_depth_buffer(context);
        this.slice_back_action = new DepthBufferRange.DepthRange(
            this.max_depth_buffer,
            this.back_depth_buffer,
            this.current_depth,
            this.max_value,
            0, // slice depths, not values
        );
        this.slice_back_action.attach_to_context(context); // move

        this.front_to_gray = this.get_gray_panel_sequence(
            this.front_depth_buffer, this.min_value, this.max_value
        );
        this.back_to_gray = this.get_gray_panel_sequence(
            this.back_depth_buffer, this.min_value, this.max_value
        );
        this.level_to_gray = this.get_gray_panel_sequence(
            this.level_depth_buffer, this.min_value, this.max_value
        );

        this.back_level_ratios = [0.8, 0.8, 1, 1]; // move
        this.mix_back_and_level = new MixColorPanels.MixPanelsRatios(
            this.level_to_gray.output_panel,
            this.back_to_gray.output_panel, // to_panel
            this.back_level_ratios,
        );
        this.mix_back_and_level.attach_to_context(context); // move

        this.back_front_ratios = [0,0.3,0.2,0]; // move
        this.mix_back_and_front = new MixColorPanels.MixPanelsRatios(
            this.front_to_gray.output_panel,
            this.back_to_gray.output_panel, // to_panel
            this.back_front_ratios,
        );
        this.mix_back_and_front.attach_to_context(context); // move
        this.output_panel = this.back_to_gray.output_panel;
        //this.output_panel = this.level_to_gray.output_panel; // debug

        this.project_to_panel = context.sequence([
            this.max_project_action,
            this.level_project_action,
            this.slice_front_action,
            this.slice_back_action,
            this.front_to_gray.sequence,
            this.back_to_gray.sequence,
            this.level_to_gray.sequence,
            this.mix_back_and_level,
            this.mix_back_and_front,
        ]);
        return {
            sequence: this.project_to_panel,
            output_panel: this.output_panel,
        };
    };
    // remainder is very similar to TestDepthView
    change_matrix(matrix) {
        this.max_project_action.change_matrix(matrix);
        this.level_project_action.change_matrix(matrix);
        this.change_range(matrix);
    };
    change_depth(depth) {
        this.level_project_action.change_depth(depth);
        this.slice_front_action.change_upper_bound(depth);
        this.slice_back_action.change_lower_bound(depth);
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
            console.log("new range min", min_depth, "max", max_depth);
            this.slice_back_action.change_upper_bound(max_depth);
            this.slice_front_action.change_lower_bound(min_depth);
            callback(min_depth, max_depth);
        }
    };
};
