
// Framework for 4 byte depth buffer

// keep everything f32 for simplicity of transfers

struct depthShape {
    height: f32,
    width: f32,
    // "null" marker depth and value.
    default_depth: f32,
    default_value: f32,
}

fn is_default(value: f32, depth:f32, for_shape: depthShape) -> bool {
    return (for_shape.default_depth == depth) && (for_shape.default_value == value);
}

struct DepthBufferF32 {
    // height/width followed by default depth and default value.
    shape: depthShape,
    // content data followed by depth as a single array
    data_and_depth: array<f32>,
}

// atomic u32 version of depth buffer structure
struct DepthBufferAtomicU32 {
    // height/width followed by default depth and default value.
    shape: depthShape,
    // content data followed by depth as a single array
    data_and_depth: array<atomic<u32>>,
}

struct BufferLocation {
    data_offset: u32,
    depth_offset: u32,
    ij: vec2i,
    valid: bool,
}

// 2d u32 indices to array locations
fn depth_buffer_location_of(ij: vec2i, shape: depthShape) -> BufferLocation {
    var result : BufferLocation;
    result.ij = ij;
    let width = u32(shape.width);
    let height = u32(shape.height);
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
fn f_depth_buffer_location_of(xy: vec2f, shape: depthShape) -> BufferLocation {
    return depth_buffer_location_of(vec2i(xy.xy), shape);
}

fn depth_buffer_indices(data_offset: u32, shape: depthShape) -> BufferLocation {
    var result : BufferLocation;
    let width = u32(shape.width);
    let height = u32(shape.height);
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