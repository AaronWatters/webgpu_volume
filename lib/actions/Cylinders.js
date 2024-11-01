
// Construct cylinders in a Volume

import * as UpdateAction from "./UpdateAction";
import * as GPUDataObject from "../data_objects/GPUDataObject";
import * as GPUColorPanel from "../data_objects/GPUColorPanel";
import volume_frame from "../wgsl_prefix/volume_frame.wgsl?raw";
import cylinders from "../wgsl_suffix/cylinders.wgsl?raw";
import * as qdVector from "qd_vector";

class CylindersParameters extends GPUDataObject.DataObject {
    constructor (
        ncylinders,
        clear,
        default_value,
    ) {
        super();
        this.ncylinders = ncylinders;
        this.clear = clear; // clear the volume before drawing
        this.default_value = default_value || 0;
        this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedInts = new Int32Array(arrayBuffer);
        mappedInts[0] = this.ncylinders;
        mappedInts[1] = this.default_value;
        mappedInts[2] = this.clear;
    };
};

export function CylinderFromEnds(start, end, radius, value, capped) {
    const V = qdVector.v_sub(end, start);
    const length = qdVector.v_length(V);
    const direction = qdVector.v_normalize(V);
    return new Cylinder(start, direction, length, radius, value, capped);
};

export class Cylinder {
    constructor (
        start,
        direction,
        length,
        radius,
        value,
        capped,
    ) {
        this.start = start;
        this.direction = direction;
        this.length = length;
        this.radius = radius;
        this.value = value;
        this.capped = capped;
    };
    put_on_panel(index, mappedFloats) {
        const offset = index * 12;
        mappedFloats.set(this.start, offset+4);
        // padding at 3
        mappedFloats.set(this.direction, offset+8);
        // padding at 7
        mappedFloats[offset+0] = this.length;
        mappedFloats[offset+1] = this.radius;
        mappedFloats[offset+2] = this.value;
        mappedFloats[offset+3] = this.capped;
        // padding at 10, 11
    };
}

export class CylinderPanel extends GPUColorPanel.Panel {
    // very similar to MixDotsOnPanel.DotsPanel
    constructor (max_ncylinders) {
        super(12, max_ncylinders);
        this.cylinders = [];
        this.max_ncylinders = max_ncylinders;
    };
    add_cylinder(start, direction, length, radius, value, capped) {
        const cylinder = new Cylinder(start, direction, length, radius, value, capped);
        if (this.cylinders.length >= this.max_ncylinders) {
            throw new Error("Too many cylinders: " + this.cylinders.length);
        }
        this.cylinders.push(cylinder);
    };
    put_cylinder(cylinder) {
        if (this.cylinders.length >= this.max_ncylinders) {
            throw new Error("Too many cylinders: " + this.cylinders.length);
        }
        this.cylinders.push(cylinder);
    };
    clear() {
        this.cylinders = [];
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedFloats = new Float32Array(arrayBuffer);
        for (let i = 0; i < this.cylinders.length; i++) {
            this.cylinders[i].put_on_panel(i, mappedFloats);
        }
    };
};

export class Cylinders extends UpdateAction.UpdateAction {
    constructor (
        volume,
        ncylinders,
        clear,
        default_value,
    ) {
        super();
        this.volume = volume;
        this.parameters = new CylindersParameters(ncylinders, clear, default_value);
        this.cylinders_panel = new CylinderPanel(ncylinders);
        this.source = this.cylinders_panel;
        this.target = this.volume;
    };
    clear() {
        this.cylinders_panel.clear();
    };
    add_cylinder(start, direction, length, radius, value, capped) {
        this.cylinders_panel.add_cylinder(start, direction, length, radius, value, capped);
    };
    put_cylinder(cylinder) {
        this.cylinders_panel.put_cylinder(cylinder);
    };
    push_cylinders() {
        this.parameters.ncylinders = this.cylinders_panel.cylinders.length;
        this.parameters.push_buffer();
        this.cylinders_panel.push_buffer();
    }
    get_shader_module(context) {
        const gpu_shader = volume_frame + cylinders;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        const width = this.volume.shape[2];
        return [Math.ceil(this.volume.size / width / 256), 1, 1];
    };
};