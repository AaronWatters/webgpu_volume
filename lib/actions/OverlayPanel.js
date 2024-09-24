
// overlay one panel onto another, assuming the panels are the same size.

import * as UpdateAction from "./UpdateAction"
import * as GPUDataObject from "../data_objects/GPUDataObject";
import panel_buffer from "../wgsl_prefix/panel_buffer.wgsl?raw";
import overlay_panel from "../wgsl_suffix/overlay_panel.wgsl?raw";

class OverlayParameters extends GPUDataObject.DataObject {
    constructor(in_hw, ignore_color) {
        super();
        this.in_hw = in_hw;
        this.ignore_color = ignore_color || 0;
        this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedUInts = new Uint32Array(arrayBuffer);
        mappedUInts.set(this.in_hw);
        mappedUInts[2] = this.ignore_color;
    };
};

export class OverlayPanel extends UpdateAction.UpdateAction {
    constructor (
        fromPanel, 
        toPanel,
        ignore_color
    ) {
        super();
        const from_hw = [fromPanel.height, fromPanel.width];
        this.parameters = new OverlayParameters(from_hw, ignore_color);
        this.from_hw = from_hw;
        this.source = fromPanel;
        this.target = toPanel;
    };
    get_shader_module(context) {
        const gpu_shader = panel_buffer + overlay_panel;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        return [Math.ceil(this.source.size / 256), 1, 1];
    };
};
