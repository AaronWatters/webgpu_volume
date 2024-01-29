
// Prefix for converting f32 to rgba gray values.
// Prefix for convert_buffer.wgsl

struct parameters {
    input_start: u32,
    output_start: u32,
    length: u32,
    min_value: f32,
    max_value: f32,
}

fn new_out_value(in_value: u32, out_value: u32, parms: parameters) -> u32 {
    let in_float = bitcast<f32>(in_value);
    let min_value = parms.min_value;
    let max_value = parms.max_value;
    let in_clamp = clamp(in_float, min_value, max_value);
    let intensity = (in_clamp - min_value) / (max_value - min_value);
    let gray_level = u32(intensity * 255.0);
    //let color = vec4u(gray_level, gray_level, gray_level, 255u);
    //let result = pack4xU8(color); ???error: unresolved call target 'pack4xU8'
    let result = 255u + 256 * (gray_level + 256 * (gray_level + 256 * gray_level));
    return result;
}