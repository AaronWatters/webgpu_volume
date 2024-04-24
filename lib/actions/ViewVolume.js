
// Generate a view of a volume painted on a standard sized panel (superclass)

import * as GPUAction from "../actions/GPUAction.js";
import * as canvas_orbit from "../support/canvas_orbit";
import * as qdVector from "qd_vector";
import * as coordinates from "../support/coordinates";

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
            this.orbiter = new canvas_orbit.Orbiter(
                canvas,
                null, // center,
                rotation,
                orbiter_callback, // callback,
            );
        }
        this.run();  // call method to allow subclass overloading.
    };
    pick_on(canvas, callback, etype) {
        etype = etype || 'click';
        // support multiple canvases.
        const canvas_space = new coordinates.NormalizedCanvasSpace(canvas);
        const [width, height] = this.output_shape;
        this.panel_space = new coordinates.PanelSpace(width, height);
        const that = this;
        canvas.addEventListener(etype, async function(event) {
            const pick = await that.pick(event, canvas_space);
            if (that.pick_callback) {
                that.pick_callback(pick);
            }
        });
        that.pick_callback = callback;
    };
    async pick(event, canvas_space) {
        // override in subclass to provide more or different coordinates.
        //const canvas_space = this.canvas_space;
        const normalized = canvas_space.normalize_event_coords(event);
        const panel_space = this.panel_space;
        const panel_coords = panel_space.normalized2ij(normalized);
        var panel_color = null;
        if (this.output_panel) {  // xxx this is not always required?
            await this.output_panel.pull_buffer();
            panel_color = this.output_panel.color_at(panel_coords);
        }
        return {
            normalized_coords: normalized,
            panel_coords: panel_coords,
            //panel_offset: panel_offset,
            panel_color: panel_color,
        };
    };
    set_geometry() {
        const [K, J, I] = this.ofVolume.shape;
        //this.MaxS = Math.max(K, J, I);
        this.MaxS = Math.max(K, J, I) * Math.sqrt(2);;
        const side = Math.ceil(this.MaxS);
        this.output_shape = [side, side];
        this.initial_rotation = qdVector.eye(3);
        this.affine_translation = qdVector.affine3d(null, [-side/2, -side/2, -side/2]);
        this.projection_matrix = qdVector.MM_product(
            qdVector.affine3d(this.initial_rotation),
            this.affine_translation,
        );
        this.space = new coordinates.ProjectionSpace(this.projection_matrix);
    };
    canvas_paint_sequence(context, canvas) {
        this.attach_to_context(context);
        const projection = this.panel_sequence(context);
        this.output_panel = projection.output_panel;
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
        // apply orbit to original projection matrix
        const matrix = qdVector.MM_product(affine_transform, this.projection_matrix);
        this.change_matrix(matrix);
        this.run();
    };
    change_matrix(matrix) {
        this.space = new coordinates.ProjectionSpace(matrix);
        //this.projection_matrix = matrix;  -- don't save matrix, it is used by orbiter.
        // in subclass, update matrix for 3d actions as needed.
        // by default: do nothing.
    }
    get_orbiter_callback() {
        const that = this;
        return function(affine_transform) {
            return that._orbiter_callback(affine_transform);
        };
    };
    orbit2xyz_v(ijk) {
        return this.space.ijk2xyz_v(ijk);
    };
    xyz2volume_v(xyz) {
        return this.ofVolume.space.xyz2ijk_v(xyz);
    };
    orbit2volume_v(ijk) {
        return this.xyz2volume_v(this.orbit2xyz_v(ijk));
    };
    orbit_sample(ijk) {
        const xyz = this.orbit2xyz_v(ijk);
        const volume_indices = this.xyz2volume_v(xyz);
        var volume_offset = this.ofVolume.space.ijk2offset(volume_indices);
        var volume_sample = null;
        if ((this.data) && (volume_offset !== null)) {
            volume_sample = this.ofVolume.data[volume_offset];
        }
        return {
            xyz: xyz,
            volume_indices: volume_indices,
            volume_offset: volume_offset,
            volume_sample: volume_sample,
        };
    };
    get_output_depth_buffer(context, default_depth, default_value, kind) {
        default_depth = default_depth || -1e10;
        default_value = default_value || 0;
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