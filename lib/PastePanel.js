
// paste one panel onto another

//import * as GPUAction from "./GPUAction.js";
import * as UpdateAction from "./UpdateAction"
import * as GPUDataObject from "./GPUDataObject";
import panel_buffer from "./panel_buffer.wgsl?raw";
import paste_panel from "./paste_panel.wgsl?raw";

class PasteParameters extends GPUDataObject.DataObject {
    constructor(in_hw, out_hw, offset) {
        super();
        this.in_hw = in_hw;
        this.out_hw = out_hw;
        this.offset = offset;
        this.buffer_size = 6 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedUInts = new Uint32Array(arrayBuffer);
        mappedUInts.set(this.in_hw);
        mappedUInts.set(this.out_hw, 2);
        const mappedInts = new Int32Array(arrayBuffer);
        mappedInts.set(this.offset, 4);
    };
};

export class PastePanel extends UpdateAction.UpdateAction {
    constructor (
        fromPanel, 
        toPanel,
        //from_hw, 
        //to_hw, 
        offset
    ) {
        super();
        const from_hw = [fromPanel.height, fromPanel.width];
        const to_hw = [toPanel.height, toPanel.width];
        this.parameters = new PasteParameters(from_hw, to_hw, offset);
        this.from_hw = from_hw;
        this.to_hw = to_hw;
        this.offset = offset;
        this.source = fromPanel;
        this.target = toPanel;
    };
    get_shader_module(context) {
        const gpu_shader = panel_buffer + paste_panel;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCountX() {
        return Math.ceil(this.source.size / 8);
    };
};
