
// overlay one panel onto another.
// Assuming panels are of same size.

struct parameters {
    in_hw: vec2u,
    ignore_color: u32,
}

@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;

@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let inputOffset = global_id.x;
    let in_hw = parms.in_hw;
    let in_location = panel_location_of(inputOffset, in_hw);
    if (in_location.is_valid) {
        let value = inputBuffer[in_location.offset];
        if (value != parms.ignore_color) {
            outputBuffer[in_location.offset] = value;
        }
    }
}

