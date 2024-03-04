
// Framework for image volume data in WebGPU.

// replace the following line to get other content types.

//alias ContentType=u32;

struct VolumeGeometry {
    // Volume dimensions. IJK + error indicator.
    shape : vec4u,
    // Convert index space to model space,
    ijk2xyz : mat4x4f,
    // Inverse: convert model space to index space.
    xyz2ijk : mat4x4f
}

struct VolumeU32 {
    geometry : VolumeGeometry,
    content : array<u32>
}

alias Volume=VolumeU32;

/*
struct VolumeU32 {
    geometry : VolumeGeometry,
    content : array<u32>=
}

struct VolumeU8 {
    geometry : VolumeGeometry,
    content : array<u32>
}
*/

struct IndexOffset {
    offset : u32,
    is_valid : bool
}

struct OffsetIndex {
    ijk: vec3u,
    is_valid: bool
}

// Buffer offset for volume index ijk.
fn offset_of(ijk : vec3u, geom : ptr<function, VolumeGeometry>) -> IndexOffset {
    var result : IndexOffset;
    var shape = (*geom).shape.xyz;
    //result.is_valid = all(ijk.zxy < shape);
    result.is_valid = all(ijk.xyz < shape);
    if (result.is_valid) {
        let layer = ijk.x;
        let row = ijk.y;
        let column = ijk.z;
        let height = shape.y;
        let width = shape.z;
        result.offset = (layer * height + row) * width + column;
    }
    return result;
}

// Convert array offset to checked ijk index
fn index_of(offset: u32, geom : ptr<function, VolumeGeometry>) -> OffsetIndex {
    var result : OffsetIndex;
    result.is_valid = false;
    var shape = (*geom).shape;
    let depth = shape.x;
    let height = shape.y;
    let width = shape.z;
    let LR = offset / width;
    let column = offset - (LR * width);
    let layer = LR / height;
    let row = LR - (layer * height);
    if (layer < depth) {
        result.ijk.x = layer;
        result.ijk.y = row;
        result.ijk.z = column;
        result.is_valid = true;
    }
    return result;
}

// Convert float vector indices to checked unsigned index
fn offset_of_f(ijk_f : vec3f, geom : ptr<function, VolumeGeometry>) -> IndexOffset {
    var shape = (*geom).shape;
    var result : IndexOffset;
    result.is_valid = false;
    if (all(ijk_f >= vec3f(0.0, 0.0, 0.0)) && all(ijk_f < vec3f(shape.xyz))) {
        result = offset_of(vec3u(ijk_f), geom);
    }
    return result;
}

// Convert model xyz to index space (as floats)
fn to_index_f(xyz : vec3f, geom : ptr<function, VolumeGeometry>) -> vec3f {
    var xyz2ijk = (*geom).xyz2ijk;
    let xyz1 = vec4f(xyz, 1.0);
    let ijk1 = xyz2ijk * xyz1;
    return ijk1.xyz;
}

// Convert index floats to model space.
fn to_model_f(ijk_f : vec3f, geom : ptr<function, VolumeGeometry>) -> vec3f {
    var ijk2xyz = (*geom).ijk2xyz;
    let ijk1 = vec4f(ijk_f, 1.0);
    let xyz1 = ijk2xyz * ijk1;
    return xyz1.xyz;
}

// Convert unsigned int indices to model space.
fn to_model(ijk : vec3u, geom : ptr<function, VolumeGeometry>) -> vec3f {
    return to_model_f(vec3f(ijk), geom);
}

// Convert xyz model position to checked index offset.
fn offset_of_xyz(xyz : vec3f, geom : ptr<function, VolumeGeometry>) -> IndexOffset {
    return offset_of_f(to_index_f(xyz, geom), geom);
}