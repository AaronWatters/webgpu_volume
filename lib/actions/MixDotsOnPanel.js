
// Put dots on a panel.

import * as UpdateAction from "./UpdateAction";
import * as GPUDataObject from "../data_objects/GPUDataObject";
import * as GPUColorPanel from "../data_objects/GPUColorPanel";
import panel_buffer from "../wgsl_prefix/panel_buffer.wgsl?raw";
import mix_dots_on_panel from "../wgsl_suffix/mix_dots_on_panel.wgsl?raw";

class MixDotsParameters extends GPUDataObject.DataObject {
    constructor(in_hw, n_dots) {
        super();
        this.in_hw = in_hw;
        this.n_dots = n_dots;
        this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedUInts = new Uint32Array(arrayBuffer);
        mappedUInts.set(this.in_hw, 0);
        mappedUInts.set([this.n_dots], 2);
    };
    change_n_dots(n_dots) {
        this.n_dots = n_dots;
        this.push_buffer();
    };
};

export class ColoredDot {
    constructor (
        position,
        radius,
        u32color,
        ratios,
    ) {
        this.position = position;
        this.radius = radius;
        this.u32color = u32color;
        this.ratios = ratios;
    };
    put_on_panel(index, mappedFloats, mappedUInts) {
        const offset = index * 8;
        mappedFloats.set(this.ratios, offset);
        mappedFloats.set(this.position, offset+4);
        mappedFloats.set([this.radius], offset+6);
        mappedUInts.set([this.u32color], offset+7);
    };
}

export class DotsPanel extends GPUColorPanel.Panel {
    constructor (max_ndots) {
        super(8, max_ndots);
        this.dots = [];
        this.max_ndots = max_ndots;
    };
    add_dot(position, radius, u32color, ratios) {
        const dot = new ColoredDot(position, radius, u32color, ratios);
        if (this.dots.length >= this.max_ndots) {
            throw new Error("Too many dots: " + this.dots.length);
        }
        this.dots.push(dot);
    };
    clear() {
        this.dots = [];
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedUInts = new Uint32Array(arrayBuffer);
        const mappedFloats = new Float32Array(arrayBuffer);
        for (var i=0; i<this.dots.length; i++) {
            this.dots[i].put_on_panel(i, mappedFloats, mappedUInts);
        }
    };
};

export class MixDotsOnPanel extends UpdateAction.UpdateAction {
    constructor (
        on_panel,
        max_ndots,
    ) {
        super();
        this.on_panel = on_panel;
        this.max_ndots = max_ndots;
        this.dots_panel = new DotsPanel(max_ndots);
        const hw = [on_panel.height, on_panel.width];
        this.parameters = new MixDotsParameters(hw, 0);
        this.source = this.dots_panel;
        this.target = on_panel;
    };
    get_shader_module(context) {
        const gpu_shader = panel_buffer + mix_dots_on_panel;
        return context.device.createShaderModule({code: gpu_shader});
    };
    ndots () {
        return this.dots_panel.dots.length;
    };
    push_dots () {
        this.parameters.change_n_dots(this.ndots());
        this.dots_panel.push_buffer();
    };
    add_pass(commandEncoder) {
        if (this.ndots() < 1) {
            // don't bother with empty dots
            return;
        }
        super.add_pass(commandEncoder);
    }
    getWorkgroupCounts() {
        // loop through dots
        const ndots = this.ndots();
        return [Math.ceil(ndots / 256), 1, 1]; // 256 threads per workgroup too large?
    };
    clear(no_push=false) {
        this.dots_panel.clear();
        if (!no_push) {
            this.push_dots()
        }
    };
    add_dot(position, radius, u32color, ratios) {
        this.dots_panel.add_dot(position, radius, u32color, ratios);
    };
};