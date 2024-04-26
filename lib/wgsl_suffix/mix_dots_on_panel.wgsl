
struct parameters {
    in_hw: vec2u,
    n_dots: u32,
}

struct dot {
    ratios: vec4f,
    pos: vec2f,
    radius: f32,
    color: u32,
}

@group(0) @binding(0) var<storage, read> inputDots : array<dot>;

// Output panel interpreted as u32 rgba
@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;

@group(2) @binding(0) var<storage, read> parms: parameters;

/*
fn debug_is_this_running(inputDot: dot) -> bool {
    let in_hw = parms.in_hw;
    let color = vec3f(1.0, 0.0, 1.0);
    var u32_color = f_pack_color(color);
    let size = in_hw.x * in_hw.y;
    for (var i=0u; i<in_hw.x; i+=1u) {
        for (var j=0u; j<in_hw.y; j+=1u) {
            let offset = panel_offset_of(vec2u(i, j), in_hw);
            if (i > u32(inputDot.pos.x)) {
                u32_color = f_pack_color(vec3f(0.0, 1.0, 0.0));
                outputBuffer[offset.offset] = u32_color;
            }
            if (j > u32(inputDot.pos.y)) {
                u32_color = f_pack_color(vec3f(0.0, 0.0, 1.0));
                outputBuffer[offset.offset] = u32_color;
            }
            //outputBuffer[offset.offset] = u32_color;
        }
    }
    return true;
}
*/

@compute @workgroup_size(256) // ??? too big?
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    // loop over input
    let inputIndex = global_id.x;
    let n_dots = parms.n_dots;
    if (inputIndex >= n_dots) {
        return;
    }
    let inputDot = inputDots[inputIndex];
    //debug_is_this_running(inputDot);
    let in_hw = parms.in_hw;
    let inputOffset = inputDot.pos;
    let radius = inputDot.radius;
    let radius2 = radius * radius;
    for (var di= - radius; di< radius; di+=1.0) {
        for (var dj= - radius; dj< radius; dj+=1.0) {
            if ((di*di + dj*dj <= radius2)) {
                let location = vec2f(inputDot.pos.x + di, inputDot.pos.y + dj);
                let offset = f_panel_offset_of(location, in_hw);
                if (offset.is_valid) {
                    let original_u32 = outputBuffer[offset.offset];
                    let original_color = unpack4x8unorm(original_u32);
                    let dot_u32 = inputDot.color;
                    let dot_color = unpack4x8unorm(dot_u32);
                    const ones = vec4f(1.0, 1.0, 1.0, 1.0);
                    let ratios = inputDot.ratios;
                    let mix_color = ((ones - ratios) * original_color) + (ratios * dot_color);
                    let mix_value = f_pack_color(mix_color.xyz);
                    outputBuffer[offset.offset] = mix_value;
                }
            }
        }
    }
}
