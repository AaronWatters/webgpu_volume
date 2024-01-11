
// suffix for pasting one panel onto another

struct parameters {
    in_hw: vec2u,
    out_hw: vec2u,
    offset: vec2i,
}

@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;

@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    // input expected to be smaller, so loop over input
    let inputOffset = global_id.x;
    let in_hw = parms.in_hw;
    let in_location = panel_location_of(inputOffset, in_hw);
    if (in_location.is_valid) {
        let paste_location = vec2f(parms.offset) + vec2f(in_location.ij);
        let out_hw = parms.out_hw;
        let out_location = f_panel_offset_of(paste_location, out_hw);
        if (out_location.is_valid) {
            let value = inputBuffer[in_location.offset];
            outputBuffer[out_location.offset] = value;
        }
    }
}