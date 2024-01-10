
// Framework for 4 byte depth buffer

// keep everything f32 for simplicity of transfers

struct DepthBufferF32 {
    // height/width and 2 alignment slots
    shape: vec4f,
    // content data followed by depth as a single array
    data_and_depth: array<f32>,
}

struct BufferLocation {
    data_offset: u32,
    depth_offset: u32,
    ij: vec2i,
    valid: bool,
}

// 2d u32 indices to array locations
fn depth_buffer_location_of(ij: vec2i, shape: vec4f) -> BufferLocation {
    var result : BufferLocation;
    result.ij = ij;
    let width = u32(shape.y);
    let height = u32(shape.x);
    let row = ij.x;
    let col = ij.y;
    let ucol = u32(col);
    let urow = u32(row);
    result.valid = ((row >= 0) && (col >= 0) && (urow < height) && (ucol < width));
    if (result.valid) {
        result.data_offset = urow * width + ucol;
        result.depth_offset = height * width + result.data_offset;
    }
    return result;
}

// 2d f32 indices to array locations
fn f_depth_buffer_location_of(xy: vec2f, shape: vec4f) -> BufferLocation {
    return depth_buffer_location_of(vec2i(xy.xy), shape);
}

fn depth_buffer_indices(data_offset: u32, shape: vec4f) -> BufferLocation {
    var result : BufferLocation;
    let width = u32(shape.y);
    let height = u32(shape.x);
    let size = width * height;
    result.valid = (data_offset < size);
    if (result.valid) {
        result.data_offset = data_offset;
        result.depth_offset = size + data_offset;
        let row = data_offset / width;
        let col = data_offset - (row * width);
        result.ij = vec2i(i32(row), i32(col));
    }
    return result;
}