
// Framework for panel buffer structure
// A panel consists of a buffer representing a rectangular screen region.
// with height and width.

struct PanelOffset {
    offset: u32,
    ij: vec2u,
    is_valid: bool
}

fn panel_location_of(offset: u32, height_width: vec2u)-> PanelOffset  {
    // location of buffer offset in row/col form.
    let height = height_width[0];
    let width = height_width[1];
    var result : PanelOffset;
    result.offset = offset;
    result.is_valid = (offset < width * height);
    if (result.is_valid) {
        let row = offset / width;
        let col = offset - row * width;
        result.ij = vec2u(row, col);
    }
    return result;
}

fn panel_offset_of(ij: vec2u, height_width: vec2u) -> PanelOffset {
    // buffer offset of row/col
    var result : PanelOffset;
    result.is_valid = all(ij < height_width);
    if (result.is_valid) {
        //const height = height_width[0];
        let width = height_width[1];
        result.offset = ij[0] * width + ij[1];
        result.ij = ij;
    }
    return result;
}

fn f_panel_offset_of(xy: vec2f, height_width: vec2u)-> PanelOffset {
    // buffer offset of vec2f row/col
    var result : PanelOffset;
    result.is_valid = ((xy[0] >= 0.0) && (xy[1] >= 0.0));
    if (result.is_valid) {
        result = panel_offset_of(vec2u(xy), height_width);
    }
    return result;
}

// xxxx this should be a builtin 'pack4xU8'...
fn f_pack_color(color: vec3f) -> u32 {
    let ucolor = vec3u(clamp(
        255.0 * color, 
        vec3f(0.0, 0.0, 0.0),
        vec3f(255.0, 255.0, 255.0)));
    return ucolor[0] + 
        256u * (ucolor[1] + 256u * (ucolor[2] + 256u * 255u));
}
