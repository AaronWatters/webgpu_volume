
// Colorize a panel by interpreting entries as indices into a color array (panel),

//import * as GPUAction from "./GPUAction.js";
import * as UpdateAction from "./UpdateAction"
import * as GPUDataObject from "../data_objects/GPUDataObject";
import panel_buffer from "../wgsl_prefix/panel_buffer.wgsl?raw";
import index_colorize from "../wgsl_suffix/index_colorize.wgsl?raw";

class IndexColorParameters extends GPUDataObject.DataObject {
    constructor(in_hw, out_hw, default_color) {
        super();
        this.in_hw = in_hw;
        this.out_hw = out_hw;
        this.default_color = default_color;
        this.buffer_size = 6 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedUInts = new Uint32Array(arrayBuffer);
        mappedUInts.set(this.in_hw);
        mappedUInts.set(this.out_hw, 2);
        mappedUInts[4] = this.default_color;
        // index 5 is unused.
    };
};

export class IndexColorizePanel extends UpdateAction.UpdateAction {
    // all color values are Uint32 encoded RGBA
    constructor (
        fromIndexedColors, // single column panel of colors
        toPanel,
        default_color
    ) {
        super();
        const ncolors = fromIndexedColors.width;
        if (ncolors != 1) {
            throw new Error("indexed colors should have width 1: " + ncolors);
        }
        const from_hw = [fromIndexedColors.height, ncolors];
        const to_hw = [toPanel.height, toPanel.width];
        this.parameters = new IndexColorParameters(from_hw, to_hw, default_color);
        this.from_hw = from_hw;
        this.to_hw = to_hw;
        this.default_color = default_color;
        this.source = fromIndexedColors;
        this.target = toPanel;
    };
    get_shader_module(context) {
        const gpu_shader = panel_buffer + index_colorize;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        // loop over target (output)
        return [Math.ceil(this.target.size / 256), 1, 1];
    };
};
