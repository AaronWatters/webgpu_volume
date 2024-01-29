
// Convert f32 buffer to u32 gray values in range 0..255

import * as UpdateAction from "./UpdateAction"
import * as GPUDataObject from "./GPUDataObject";

import convert_gray_prefix from "./convert_gray_prefix.wgsl?raw"
import convert_buffer from "./convert_buffer.wgsl?raw";

class GrayParameters extends GPUDataObject.DataObject {
    constructor(input_start, output_start, length, min_value, max_value) {
        super();
        this.input_start = input_start;
        this.output_start = output_start;
        this.length = length;
        this.min_value = min_value;
        this.max_value = max_value;
        this.buffer_size = 5 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedUInts = new Uint32Array(arrayBuffer);
        mappedUInts[0] = this.input_start;
        mappedUInts[1] = this.output_start;
        mappedUInts[2] = this.length;
        const mappedFloats = new Float32Array(arrayBuffer);
        mappedFloats[3] = this.min_value;
        mappedFloats[4] = this.max_value;
    };
};

export class UpdateGray extends UpdateAction.UpdateAction {
    constructor (
        from_data_object,
        to_data_object,
        from_start,
        to_start,
        length,
        min_value,
        max_value,
    ) {
        super();
        this.from_start = from_start;
        this.to_start = to_start;
        this.length = length;
        this.min_value = min_value;
        this.max_value = max_value;
        this.source = from_data_object;
        this.target = to_data_object;
    };
    attach_to_context(context) {
        // create parameters late to allow computing min/max elsewhere.
        this.parameters = new GrayParameters(
            this.from_start,
            this.to_start,
            this.length,
            this.min_value,
            this.max_value,
        );
        super.attach_to_context(context);
    }
    get_shader_module(context) {
        const gpu_shader = convert_gray_prefix + convert_buffer;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        return [Math.ceil(this.length / 256), 1, 1];
    };
};

export class ToGrayPanel extends UpdateGray {
    constructor (
        from_panel,
        to_panel,
        min_value,
        max_value,
    ) {
        const size = from_panel.size
        if (size != to_panel.size) {
            throw new Error("panel sizes must match: " + [size, to_panel.size]);
        }
        super (from_panel, to_panel, 0, 0, size, min_value, max_value);
    };
    compute_extrema() {
        // assume from_panel buffer has been pulled.
        const buffer_content = this.source.buffer_content;
        if (buffer_content == null) {
            throw new Error("compute_extrema requires pulled buffer content.");
        }
        const values = new Float32Array(buffer_content);
        var min = values[0];
        var max = min;
        for (var value of values) {
            min = Math.min(min, value);
            max = Math.max(max, value);
        }
        this.min_value = min;
        this.max_value = max;
    };
    async pull_extrema() {
        await this.source.pull_buffer();
        this.compute_extrema();
    };
};
