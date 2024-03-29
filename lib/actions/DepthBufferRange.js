
// Select a range in depths or values from a depth buffer 
// copied to output depth buffer at same ij locations where valid.

import * as UpdateAction from "./UpdateAction";
import * as GPUDataObject from "../data_objects/GPUDataObject";
import depth_buffer from "../wgsl_prefix/depth_buffer.wgsl?raw";
import depth_buffer_range from "../wgsl_suffix/depth_buffer_range.wgsl?raw";

class RangeParameters extends GPUDataObject.DataObject {
    constructor(lower_bound, upper_bound, do_values) {
        super();
        this.lower_bound = lower_bound;
        this.upper_bound = upper_bound;
        this.do_values = do_values;
        this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedUInts = new Uint32Array(arrayBuffer);
        const mappedFloats = new Float32Array(arrayBuffer);
        mappedFloats[0] = this.lower_bound;
        mappedFloats[1] = this.upper_bound;
        mappedUInts[2] = this.do_values;
        // index 3 is unused.
    };
};

export class DepthRange extends UpdateAction.UpdateAction {
    constructor (
        fromDepthBuffer, 
        toDepthBuffer,
        lower_bound,
        upper_bound,
        do_values,
    ) {
        super();
        this.source = fromDepthBuffer;
        this.target = toDepthBuffer;
        this.parameters = new RangeParameters(lower_bound, upper_bound, do_values);
    };
    change_bounds(lower_bound, upper_bound) {
        this.parameters.lower_bound = lower_bound;
        this.parameters.upper_bound = upper_bound;
        this.parameters.push_buffer()
    };
    change_lower_bound(lower_bound) {
        this.change_bounds(lower_bound, this.parameters.upper_bound);
    };
    change_upper_bound(upper_bound) {
        this.change_bounds(this.parameters.lower_bound, upper_bound);
    };
    get_shader_module(context) {
        const gpu_shader = depth_buffer + depth_buffer_range;
        return context.device.createShaderModule({code: gpu_shader});
    };
    getWorkgroupCounts() {
        // loop through source (input)
        return [Math.ceil(this.source.size / 256), 1, 1];
    };
};