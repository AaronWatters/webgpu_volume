
// paste one panel onto another

//import * as GPUAction from "./GPUAction.js";
import * as UpdateAction from "./UpdateAction";
import * as GPUDataObject from "../data_objects/GPUDataObject";
import panel_buffer from "../wgsl_prefix/panel_buffer.wgsl?raw";
import mix_color_panels from "../wgsl_suffix/mix_color_panels.wgsl?raw";

class MixParameters extends GPUDataObject.DataObject {
    constructor(in_hw, out_hw, ratios) {
        super();
        this.in_hw = in_hw;
        this.out_hw = out_hw;
        this.ratios = ratios;
        this.buffer_size = 8 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedUInts = new Uint32Array(arrayBuffer);
        const mappedFloats = new Float32Array(arrayBuffer);
        mappedFloats.set(this.ratios, 0);
        mappedUInts.set(this.in_hw, 4);
        mappedUInts.set(this.out_hw, 6);
    };
};

export class MixPanelsRatios extends UpdateAction.UpdateAction {
    constructor (
        fromPanel, 
        toPanel,
        ratios,
    ) {
        super();
        const from_hw = [fromPanel.height, fromPanel.width];
        const to_hw = [toPanel.height, toPanel.width];
        // usually the panels should be the same shape???
        if ((from_hw[0] != to_hw[0]) || (from_hw[0] != to_hw[0])) {
            throw new Error("Mixed panels to have same shape: "
                + from_hw + " :: " + to_hw);
        }
        for (var ratio of ratios) {
            if ((ratio > 1.0) || (ratio < 0.0)) {
                throw new Error("Invalid ratio: " + ratio);
            }
        }
        this.parameters = new MixParameters(from_hw, to_hw, ratios);
        this.from_hw = from_hw;
        this.to_hw = to_hw;
        this.ratios = ratios;
        this.source = fromPanel;
        this.target = toPanel;
    };
    change_ratio(new_ratio) {
        this.ratios = [new_ratio, new_ratio, new_ratio, new_ratio];
        this.parameters.ratios = this.ratios;
        this.parameters.push_buffer()
    };
    get_shader_module(context) {
        const gpu_shader = panel_buffer + mix_color_panels;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        // loop through source (input)
        return [Math.ceil(this.source.size / 256), 1, 1];
    };
};

export class MixPanels extends MixPanelsRatios {
    constructor (
        fromPanel, 
        toPanel,
        ratio,
    ) {
        const ratios = [ratio, ratio, ratio, ratio];
        super(fromPanel, toPanel, ratios);
    };
};
