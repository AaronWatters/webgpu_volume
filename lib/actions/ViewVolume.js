
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
        // Probe depth heuristic xxxx should calculate this more tightly.
        //this.k_limit = (this.MaxS + 1)*3;
        this.k_limit = side;
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
    panel_sequence(context) {
        throw new Error("panel_sequence must be defined in subclass.")
    };
    _orbiter_callback(affine_transform) {
        // In subclass, update matrices and repaint if needed.
        // By default do nothing.
    };
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
};