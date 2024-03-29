
// suffix for pasting one panel onto another

struct parameters {
    ratios: vec4f,
    in_hw: vec2u,
    out_hw: vec2u,
}

// Input and output panels interpreted as u32 rgba
@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;

@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    // loop over input
    let inputOffset = global_id.x;
    let in_hw = parms.in_hw;
    let in_location = panel_location_of(inputOffset, in_hw);
    let out_hw = parms.out_hw;
    let out_location = panel_location_of(inputOffset, out_hw);
    if ((in_location.is_valid) && (out_location.is_valid)) {
        let in_u32 = inputBuffer[in_location.offset];
        let out_u32 = outputBuffer[out_location.offset];
        let in_color = unpack4x8unorm(in_u32);
        let out_color = unpack4x8unorm(out_u32);
        let ratios = parms.ratios;
        const ones = vec4f(1.0, 1.0, 1.0, 1.0);
        let mix_color = ((ones - ratios) * out_color) + (ratios * in_color);
        let mix_value = f_pack_color(mix_color.xyz);
        outputBuffer[out_location.offset] = mix_value;
    }
}