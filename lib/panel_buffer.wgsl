
// Framework for panel buffer structure

struct PanelOffset {
    offset: u32,
    ij: vec2u,
    is_valid: bool
}

fn panel_location_of(offset: u32, height_width: vec2u)-> PanelOffset  {
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
    var result : PanelOffset;
    result.is_valid = ((xy[0] >= 0.0) && (xy[1] >= 0.0));
    if (result.is_valid) {
        result = panel_offset_of(vec2u(xy), height_width);
    }
    return result;
}