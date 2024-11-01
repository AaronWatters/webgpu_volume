
// just display a box 

import * as CPUVolume from "../data_objects/CPUVolume.js";
import * as viewVolume from "../actions/ViewVolume.js";
import * as MixView from "../actions/MixView.js";

function cube(context, width) {
    const shape = [width, width, width];
    // dummy data for debug
    const data = new Float32Array(width * width * width);
    //for (let i = width*(width+4); i < data.length; i++) {
    //    data[i] = (i % 2) ? 1 : 0;
    //}
    for (let i=2; i < width-2; i++) {
        for (let j=2; j < width-2; j++) {
            for (let k=2; k < width-2; k++) {
                const index = i + j*width + k*width*width;
                data[index] = Math.floor(index/123) % 11 + 1;
            }
        }
    }
    //const translation = qdVector.affine3d(null, [-width/2, -width/2, -width/2]);
    const cpu_volume = new CPUVolume.Volume(shape, data);
    const volume = cpu_volume.gpu_volume(context);
    return volume;
};

export async function debug_box(canvas, context, indexed_colors) {
    const l24path = "../sample_data/l24.bin";
    const kind = Float32Array;
    const l24cpu = await CPUVolume.fetch_volume_prefixed(l24path, kind);
    const l24gpu = l24cpu.gpu_volume(context);
    return new BoxTest(24, canvas, context, indexed_colors, l24gpu);
};

export class BoxTest extends viewVolume.View {
    constructor (width, canvas, context, indexed_colors, volume) {
        volume = volume || cube(context, width);
        super(volume);
        this.width = width;
        this.canvas = canvas;
        this.indexed_colors = indexed_colors;
    };
    panel_sequence(context) {
        context = context || this.context;

        // actions
        const actions_collector = [];

        const ratio = 0.7; // mix ratio
        const mixView = new MixView.Mix(this.ofVolume, this.indexed_colors, ratio);
        mixView.attach_to_context(context);
        this.mixView = mixView;

        const mix_projections = mixView.panel_sequence(context);
        actions_collector.push(mix_projections.sequence);

        // combine actions...
        this.project_to_panel = context.sequence(actions_collector);
        return {
            sequence: this.project_to_panel,
            output_panel: mix_projections.output_panel,
        };
    };
    async run() {
        // make sure colors have loaded
        await this.colors_future;
        super.run();
    };
    change_matrix(matrix) {
        super.change_matrix(matrix);
        this.mixView.change_matrix(matrix);
    };
};