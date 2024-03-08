
// paste one panel onto another

//import * as GPUAction from "./GPUAction.js";
import * as UpdateAction from "./UpdateAction"
import * as GPUDataObject from "../data_objects/GPUDataObject";
import panel_buffer from "../wgsl_prefix/panel_buffer.wgsl?raw";
import mix_color_panels from "../wgsl_suffix/mix_color_panels.wgsl?raw";

class MixParameters extends GPUDataObject.DataObject {
    constructor(in_hw, out_hw, ratio) {
        super();
        this.in_hw = in_hw;
        this.out_hw = out_hw;
        this.ratio = ratio;
        this.buffer_size = 6 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedUInts = new Uint32Array(arrayBuffer);
        mappedUInts.set(this.in_hw);
        mappedUInts.set(this.out_hw, 2);
        const mappedFloats = new Float32Array(arrayBuffer);
        mappedFloats[4] = this.ratio;
        // index 5 is unused.
    };
};

export class MixPanels extends UpdateAction.UpdateAction {
    constructor (
        fromPanel, 
        toPanel,
        ratio,
    ) {
        super();
        const from_hw = [fromPanel.height, fromPanel.width];
        const to_hw = [toPanel.height, toPanel.width];
        // usually the panels should be the same shape???
        if ((from_hw[0] != to_hw[0]) || (from_hw[0] != to_hw[0])) {
            throw new Error("Mixed panels to have same shape: "
                + from_hw + " :: " + to_hw);
        }
        if ((ratio > 1.0) || (ratio < 0.0)) {
            throw new Error("Invalid ratio: " + ratio);
        }
        this.parameters = new MixParameters(from_hw, to_hw, ratio);
        this.from_hw = from_hw;
        this.to_hw = to_hw;
        this.ratio = ratio;
        this.source = fromPanel;
        this.target = toPanel;
    };
    //change_offset(new_offset) {
    //    this.offset = new_offset;
    //    this.parameters.offset = new_offset;
    //    this.parameters.push_buffer()
    //};
    get_shader_module(context) {
        const gpu_shader = panel_buffer + mix_color_panels;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        // loop through source (input)
        return [Math.ceil(this.source.size / 256), 1, 1];
    };
};
