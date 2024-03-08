
// suffix for pasting one panel onto another

struct parameters {
    in_hw: vec2u,
    out_hw: vec2u,
    default_color: u32,
}

@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;

@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    // loop over output
    let outputOffset = global_id.x;
    let out_hw = parms.out_hw;
    let out_location = panel_location_of(outputOffset, out_hw);
    if (out_location.is_valid) {
        // initial values arrive as f32
        let color_index_f = bitcast<f32>(outputBuffer[out_location.offset]);
        let color_index = u32(color_index_f);
        let color_ij = vec2u(color_index, 0);
        //let color_ij = vec2u(0, color_index);
        let in_hw = parms.in_hw;
        let color_location = panel_offset_of(color_ij, in_hw);
        var value = parms.default_color;
        value = 4294967295u - 256u * 255; // magenta
        //value = 0;
        if (color_location.is_valid) {
            value = inputBuffer[color_location.offset];
        }
        // debug
        //if (color_index < 1000) {
        //    value = inputBuffer[color_index];
        //    if (color_index > 5) {
        //        value = 4294967295u - 256u * 255; // magenta
        //    }
        //    //value = 4294967295u - 256 * 256u * 255; // yellow
        //    //value = 0;
        //}
        outputBuffer[out_location.offset] = value;
    }
}