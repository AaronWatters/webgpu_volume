
// Generate a view of a volume painted on a standard sized panel (superclass)

import * as GPUAction from "../actions/GPUAction.js";
import * as canvas_orbit from "../support/canvas_orbit";
import * as qdVector from "qd_vector";

export class View extends GPUAction.Action {
    constructor (ofVolume) {
        super();
        this.ofVolume = ofVolume;
        this.set_geometry();
    };
    async paint_on(canvas, orbiting) {
        // full bootstrap sequence
        const context = this.ofVolume.context;
        if (!context) {
            throw new Error("Volume is not attached to GPU context.");
        }
        const sequence = this.canvas_paint_sequence(context, canvas);
        if (orbiting) {
            const orbiter_callback = this.get_orbiter_callback();
            // const rotation = this.initial_rotation;
            const rotation = qdVector.eye(3);
            //const rotation = [
            //  [0, 0, -1],
            //    [1, 0, 0],
            //    [0, -1, 0]
            //];
            this.orbiter = new canvas_orbit.Orbiter(
                canvas,
                null, // center,
                rotation,
                orbiter_callback, // callback,
            );
        }
        sequence.run();
    };
    set_geometry() {
        //const [K, J, I] = this.ofVolume.shape;
        //this.MaxS = Math.max(K, J, I);
        this.MaxS = this.ofVolume.max_extent() * Math.sqrt(2) / Math.sqrt(3);
        //const side = Math.ceil(Math.sqrt(2) * this.MaxS)
        const side = Math.ceil(this.MaxS);
        this.output_shape = [side, side];
        //this.initial_rotation = [
        //    [0, 0, 1],
        //    [1, 0, 0],
        //    [0, 1, 0]
        //];
        this.initial_rotation = qdVector.eye(3);
        this.affine_translation = qdVector.affine3d(null, [-side/2, -side/2, -side/2]);
        this.projection_matrix = qdVector.MM_product(
            qdVector.affine3d(this.initial_rotation),
            this.affine_translation,
        );
    };
    canvas_paint_sequence(context, canvas) {
        this.attach_to_context(context);
        const projection = this.panel_sequence(context);
        const painter = context.paint(projection.output_panel, canvas);
        this.paint_sequence = context.sequence([
            projection.sequence,
            painter,
        ]);
        return this.paint_sequence;
    };
    async run() { // some subclasses need to "await"
        const sequence = this.paint_sequence || this.project_to_panel;
        sequence.run();
    };
    panel_sequence(context) {
        // in subclass, set this.project_to_panel action
        throw new Error("panel_sequence must be defined in subclass.")
    };
    _orbiter_callback(affine_transform) {
        const matrix = qdVector.MM_product(affine_transform, this.projection_matrix);
        //this.project_action.change_matrix(matrix);
        //this.colorize_action.change_matrix(matrix);
        this.change_matrix(matrix);
        this.run();
    };
    change_matrix(matrix) {
        // in subclass, update matrix for 3d actions as needed.
        // by default: do nothing.
    }
    get_orbiter_callback() {
        const that = this;
        return function(affine_transform) {
            return that._orbiter_callback(affine_transform);
        };
    };
    get_output_depth_buffer(context, default_depth, default_value, kind) {
        default_depth = default_depth || -1e10;
        default_value = default_value || -1e10;
        kind = kind || Float32Array;
        context = context || this.context;
        return context.depth_buffer(
            this.output_shape,
            default_depth,
            default_value,
            null, // no input data
            null, // no input depth
            kind,
        )
    };
    get_output_panel(context) {
        context = context || this.context;
        const [height, width] = this.output_shape;
        return context.panel(width, height);
    };
    get_gray_panel_sequence(for_depth_buffer, min_value, max_value) {
        const context = this.context;
        const flat_panel = this.get_output_panel(context);
        const flatten_action = for_depth_buffer.flatten_action(flat_panel);
        const gray_panel = this.get_output_panel(context);
        const gray_action = context.to_gray_panel(
            flat_panel, gray_panel, min_value, max_value);
        const gray_panel_sequence = context.sequence([
            flatten_action,
            gray_action,
        ])
        return {
            sequence: gray_panel_sequence,
            output_panel: gray_panel,
        };
    };
};