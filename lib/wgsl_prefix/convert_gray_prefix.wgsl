
// Prefix for converting f32 to rgba gray values.
// Prefix for convert_buffer.wgsl

struct parameters {
    input_start: u32,
    output_start: u32,
    length: u32,
    min_value: f32,
    max_value: f32,
    qd_colorize: u32,  // quick and dirty colorize, 0 for gray
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
    var result: u32;
    if (parms.qd_colorize == 0) {
        result = gray_level + 256 * (gray_level + 256 * (gray_level + 256 * 255));
    } else {
        //let inv = 255 - gray_level;
        // yellow to blue
        //result = gray_level + 256 * (gray_level + 256 * (inv + 256 * 255));
        var red: u32;
        var green: u32;
        var blue: u32;
        
        // black green cyan magenta white
        if (gray_level < 64) {
            // black to green
            red = 0;
            green = gray_level * 4;
            blue = 0;
        } else if (gray_level < 128) {
            // green to cyan
            red = 0;
            green = 255;
            blue = 255 - (gray_level - 64) * 4;
        } else if (gray_level < 192) {
            // cyan to magenta
            red = (gray_level - 128) * 4;
            green = 255 - red;
            blue = 255;
        } else {
            // magenta to white
            green = (gray_level - 192) * 4;
            red = 255;
            blue = 255;
        }
        /*
        // Black -> B -> G -> Y -> W
        if (gray_level < 64) {
            // black to blue
            red = 0;
            green = 0;
            blue = gray_level * 4;
        } else if (gray_level < 128) {
            // blue to green
            green = (gray_level - 64) * 4;
            blue = 256 - green;
            red = 0;
        } else if (gray_level < 192) {
            // green to yellow
            red = (gray_level - 128) * 4;
            green = 255;
            blue = 0;
        } else {
            // yellow to white
            blue = (gray_level - 192) * 4;
            red = 255;
            green = 255;;
        }
        */
        result = red + 256 * (green + 256 * (blue + 256 * 255));
    }
    //let result = gray_level + 256 * (gray_level + 256 * (gray_level + 256 * 255));
    //let result = 255u + 256 * (gray_level + 256 * (gray_level + 256 * gray_level));
    return result;
}