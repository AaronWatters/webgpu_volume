
// Generate a max projection view of a volume on a standard panel

import * as viewVolume from "../actions/ViewVolume.js";
import * as qdVector from "qd_vector";

export class Max extends viewVolume.View {
    async pick(event, canvas_space) {
        const result = await super.pick(event, canvas_space);
        //const normalized = result.normalized_coords;
        const panel_coords = result.panel_coords;
        await this.max_depth_buffer.pull_data();
        result.maximum = this.max_depth_buffer.location(
            panel_coords,
            this.space,
            this.ofVolume,);
        /*
        if (result.maximum !== null) {
            const probe = [panel_coords[0], panel_coords[1], result.maximum.depth];
            const xyz = this.space.ijk2xyz_v(probe);
            result.xyz = xyz;
            const inputVolume = this.ofVolume;
            // no need to pull input volume
            const volume_ijk = inputVolume.space.xyz2ijk_v(xyz);
            result.volume_ijk = volume_ijk;
            const volume_offset = inputVolume.space.ijk2offset(volume_ijk);
            result.volume_offset = volume_offset;
            var volume_data = null;
            if (volume_offset != null) {
                volume_data = inputVolume.data[volume_offset];
            }   
            result.volume_data = volume_data;
        } */
        return result;
    };
    panel_sequence(context) {
        context = context || this.context;
        const inputVolume = this.ofVolume;
        this.min_value = inputVolume.min_value;
        this.max_value = inputVolume.max_value;
        this.max_depth_buffer = this.get_output_depth_buffer(context);
        this.max_panel = this.get_output_panel(context);
        this.grey_panel = this.get_output_panel(context);
        // max_projection or max_scan?
        this.project_action = context.max_scan(
            inputVolume,
            this.max_depth_buffer,
            this.projection_matrix,
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
        super.change_matrix(matrix);
        this.project_action.change_matrix(matrix);
    };
};
