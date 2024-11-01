
import * as viewVolume from "../actions/ViewVolume.js";
import * as Cylinders from "../actions/Cylinders.js";
import * as GPUVolume from "../data_objects/GPUVolume.js";
import * as MixView from "../actions/MixView.js";
import * as qdVector from "qd_vector";

function cube(width) {
    const shape = [width, width, width];
    // dummy data for debug
    const data = new Uint32Array(width * width * width);
    for (let i = 0; i < data.length; i++) {
        data[i] = 5;
    }
    const translation = qdVector.affine3d(null, [-width/2, -width/2, -width/2]);
    return new GPUVolume.Volume(shape, data, translation, Uint32Array);
}

export class CylinderTest extends viewVolume.View {
    constructor (width, ncylinders, pairs, indexed_colors, radius, canvas, volume) {
        volume = volume || cube(width);
        super(volume);
        this.width = width;
        this.ncylinders = ncylinders; // maximum number of cylinders
        this.pairs = pairs; // initial cylinder endpoints
        this.indexed_colors = indexed_colors;
        this.radius = radius;
        this.canvas = canvas;
    };
    put_pairs(pairs) {
        this.pairs = pairs;
        const radius = this.radius;
        this.cylinders.clear();
        for (let i = 0; i < pairs.length; i++) {
            const value = i + 1;
            const [start, end] = pairs[i];
            const capped = true;
            const cylinder = Cylinders.CylinderFromEnds(start, end, radius, value, capped);
            this.cylinders.put_cylinder(cylinder);
        }
        this.cylinders.push_cylinders();
    };
    attach_to_context(context) {
        super.attach_to_context(context);
        this.ofVolume.attach_to_context(context);
    };
    panel_sequence(context) {
        context = context || this.context;

        // cylinder volume construction
        const clear = 1; // clear the volume
        const default_value = 0; // default to no color index
        this.cylinders = new Cylinders.Cylinders(this.ofVolume, this.ncylinders, clear, default_value);
        this.cylinders.attach_to_context(context);
        this.put_pairs(this.pairs);
        console.log("cylinders", this.cylinders);

        // mix colorization of cylinder volume
        const ratio = 0.5; // mix ratio
        this.mix_view = new MixView.Mix(this.ofVolume, this.indexed_colors, ratio);
        this.mix_view.attach_to_context(context);
        const mix_projections = this.mix_view.panel_sequence(context);
        console.log("mix_view", this.mix_view);

        this.project_to_panel = context.sequence([
            this.cylinders,
            mix_projections.sequence,
        ]);
        console.log("panel_sequence", this);
        console.log("mix_projections", mix_projections);
        console.log("output_panel", mix_projections.output_panel);
        return {
            sequence: this.project_to_panel,
            output_panel: mix_projections.output_panel,
        };
    };

    change_matrix(matrix) {
        super.change_matrix(matrix);
        this.mix_view.change_matrix(matrix);
    };
};