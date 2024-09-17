
import * as UpdateAction from "./UpdateAction"
import * as GPUDataObject from "../data_objects/GPUDataObject";
import panel_buffer from "../wgsl_prefix/panel_buffer.wgsl?raw";
import panel_outline from "../wgsl_suffix/panel_outline.wgsl?raw";

class OutlineParameters extends GPUDataObject.DataObject {
    constructor(in_hw, default_color) {
        super();
        this.in_hw = in_hw;
        this.default_color = default_color;
        this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedUInts = new Uint32Array(arrayBuffer);
        mappedUInts.set(this.in_hw);
        mappedUInts[2] = this.default_color;
        // index 3 is unused.
    };
};

export class OutlinePanel extends UpdateAction.UpdateAction {
    constructor (
        fromPanel,
        toPanel,
        default_color
    ) {
        super();
        const from_hw = [fromPanel.height, fromPanel.width];
        const to_hw = [toPanel.height, toPanel.width];
        if (from_hw[0] != to_hw[0] || from_hw[1] != to_hw[1]) {
            throw new Error("panels should have same size");
        }
        this.parameters = new OutlineParameters(from_hw, default_color);
        this.from_hw = from_hw;
        this.to_hw = to_hw;
        this.default_color = default_color;
        this.source = fromPanel;
        this.target = toPanel;
    };
    get_shader_module(context) {
        const gpu_shader = panel_buffer + panel_outline;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        // loop over target (output)
        return [Math.ceil(this.target.size / 256), 1, 1];
    };
};