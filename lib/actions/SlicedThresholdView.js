
import * as viewVolume from "../actions/ViewVolume.js";
import * as ThresholdAction from "../actions/ThresholdAction.js";
import * as NormalAction from "../actions/NormalAction.js";
import * as Soften from "../actions/Soften.js"
import * as MixDepthBuffers from "../actions/MixDepthBuffers.js";
import * as CombineDepths from "../actions/CombineDepths.js";
import * as UpdateGray from "../actions/UpdateGray.js";
import * as VolumeAtDepth from "../actions/VolumeAtDepth.js";
import * as DepthBufferRange from "../actions/DepthBufferRange.js";

export class SlicedThreshold extends viewVolume.View {
    constructor (ofVolume, threshold_value, debugging, range_callback) {
        super(ofVolume);
        this.threshold_value = threshold_value;
        this.debugging = debugging;
        this.range_callback = range_callback;
    };
    change_threshold(value) {
        this.project_action.change_threshold(value);
        this.run();
    };
    async run() {
        // make sure softening is done.
        await this.soften_promise;
        super.run();
        if (this.debugging) {
            await this.context.onSubmittedWorkDone();
            this.threshold_depth_buffer.pull_data();
            this.level_depth_buffer.pull_data();
            this.level_clone_depth_buffer.pull_data();
            this.front_depth_buffer.pull_data();
            this.back_depth_buffer.pull_data();
            this.output_depth_buffer.pull_data();
            await this.context.onSubmittedWorkDone();
            debugger;
        }
    };
    panel_sequence(context) {
        context = context || this.context;
        // data objects
        const inputVolume = this.ofVolume;
        this.min_value = inputVolume.min_value;
        this.max_value = inputVolume.max_value;
        this.change_range(this.projection_matrix);
        this.soft_volume = inputVolume.same_geometry(context);
        this.soften_action = new Soften.SoftenVolume(inputVolume, this.soft_volume, null);
        this.soften_action.attach_to_context(context);
        // Execute soften action only once!
        this.soften_action.run();
        this.soften_promise = context.onSubmittedWorkDone();
        // threshold crossings
        this.threshold_depth_buffer = this.get_output_depth_buffer(context);
        this.threshold_value = this.threshold_value || (inputVolume.min_value + inputVolume.max_value) / 2.0;
        this.project_action = new ThresholdAction.ThresholdProject(
            inputVolume,
            this.threshold_depth_buffer,
            this.projection_matrix,
            this.threshold_value,
        );
        this.project_action.attach_to_context(context); // xxx move to context
        // normal colorize threshold depth buffer using the softened volume
        const default_color = 0;
        this.normal_colorize_action = new NormalAction.NormalColorize(
            this.soft_volume,
            this.threshold_depth_buffer,
            this.projection_matrix,
            default_color,
        );
        this.normal_colorize_action.attach_to_context(context); // move
        // set current depth to middle initially.
        const invert_matrix = true;
        const range = inputVolume.projected_range(this.projection_matrix, invert_matrix);
        this.current_depth = (range.max[2] + range.min[2]) / 2.0;
        // volume at depth
        this.level_depth_buffer = this.get_output_depth_buffer(context);
        this.level_project_action = new VolumeAtDepth.VolumeAtDepth(
            inputVolume,
            this.level_depth_buffer,
            this.projection_matrix,
            this.current_depth,
        );
        this.level_project_action.attach_to_context(context); // move
        // clone the level buffer
        this.level_clone_operation = this.level_depth_buffer.clone_operation();
        this.clone_level_action = this.level_clone_operation.clone_action;
        this.level_clone_depth_buffer = this.level_clone_operation.clone;
        // make the level buffer clone gray
        this.level_gray_action = new UpdateGray.PaintDepthBufferGray(
            this.level_depth_buffer,
            this.level_clone_depth_buffer,
            inputVolume.min_value,
            inputVolume.max_value,
        )
        this.level_gray_action.attach_to_context(context); // move
        // slice front and back of threshod depth buffer
        this.front_depth_buffer = this.get_output_depth_buffer(context);
        const far_behind = -1e11;
        this.slice_front_action = new DepthBufferRange.DepthRange(
            this.threshold_depth_buffer,
            this.front_depth_buffer,
            far_behind, //range.min[2],
            this.current_depth,
            0, // slice depths, not values
        );
        this.slice_front_action.attach_to_context(context); // move
        this.back_depth_buffer = this.get_output_depth_buffer(context);
        const far_distant = 1e11;
        this.slice_back_action = new DepthBufferRange.DepthRange(
            this.threshold_depth_buffer,
            this.back_depth_buffer,
            this.current_depth,
            far_distant, //range.max[2],
            0, // slice depths, not values
        );
        this.slice_back_action.attach_to_context(context); // move
        // mix back and level_clone into level_clone
        this.back_level_ratios = [0.5,0.5,0.5,1];
        this.mix_back_level_action = new MixDepthBuffers.MixDepthBuffers(
            this.back_depth_buffer,
            //this.front_depth_buffer, // debug test
            this.level_clone_depth_buffer,
            this.back_level_ratios,
        );
        this.mix_back_level_action.attach_to_context(context); // move
        // clone front into output
        this.output_clone_operation = this.front_depth_buffer.clone_operation();
        this.output_clone_action = this.output_clone_operation.clone_action;
        this.output_depth_buffer = this.output_clone_operation.clone;
        const do_mix = false;
        if (do_mix) {
            // combine mix into output
            this.combine_action = new CombineDepths.CombineDepths(
                this.output_depth_buffer,
                this.level_clone_depth_buffer,
                //this.back_depth_buffer,
            );
            this.combine_action.attach_to_context(context); // move
        } else {
            this.combine_ratios = [0.5,0.5,0.5,1];
            this.combine_action = new MixDepthBuffers.MixDepthBuffers(
                this.level_clone_depth_buffer,
                //this.front_depth_buffer, // debug test
                this.output_depth_buffer,
                this.combine_ratios,
            );
            this.combine_action.attach_to_context(context); // move
        }
        // output panel
        this.panel = this.get_output_panel(context);
        //this.flatten_action = this.threshold_depth_buffer.flatten_action(this.panel); // debug
        //this.flatten_action = this.level_clone_depth_buffer.flatten_action(this.panel); // debug
        //this.flatten_action = this.back_depth_buffer.flatten_action(this.panel); // debug
        //.flatten_action = this.front_depth_buffer.flatten_action(this.panel); // debug
        this.flatten_action = this.output_depth_buffer.flatten_action(this.panel);
        this.project_to_panel = context.sequence([
            this.project_action, 
            this.normal_colorize_action,
            this.level_project_action,
            this.clone_level_action,
            this.level_gray_action,
            this.slice_front_action,
            this.slice_back_action,
            this.mix_back_level_action,
            this.output_clone_action,
            this.combine_action,
            this.flatten_action, 
        ]);
        return {
            sequence: this.project_to_panel,
            output_panel: this.panel,
        };
    };
    // remainder is very similar to TestDepthView
    change_matrix(matrix) {
        this.project_action.change_matrix(matrix);
        this.normal_colorize_action.change_matrix(matrix);
        this.level_project_action.change_matrix(matrix);
        this.change_range(matrix);
        this.update_levels();
    };
    change_range(matrix) {
        debugger;
        const invert_matrix = true;
        const range = this.ofVolume.projected_range(matrix, invert_matrix);
        this.min_depth = range.min[2];
        this.max_depth = range.max[2];
        if (this.range_callback) {
            this.range_callback(this.min_depth, this.max_depth);
        }
    };
    change_depth(new_depth) {
        this.current_depth = new_depth;
    };
    update_levels() {
        this.level_project_action.change_depth(this.current_depth);
        this.slice_front_action.change_bounds(this.min_depth, this.current_depth);
        this.slice_back_action.change_bounds(this.current_depth, this.max_depth);
    };
}