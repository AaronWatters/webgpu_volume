
// Logic for loop boundaries in volume scans.
// This prefix assumes volume_frame.wgsl and depth_buffer.wgsl.

// v2 planar xyz intersection parameters:
// v2 ranges from c0 * v0 + c1 * v1 + low to ... + high
struct Intersection2 {
    c0: f32,
    c1: f32,
    low: f32,
    high: f32,
}

// Intersection parameters for box borders
alias Intersections3 = array<Intersection2, 3>;

// Intersection end points
struct Endpoints2 {
    offset: vec2f,
    is_valid: bool,
}

fn scan_endpoints(
    offset: vec2i, 
    int3: Intersections3, 
    geom_ptr: ptr<function, VolumeGeometry>, 
    ijk2xyz: mat4x4f,  // orbit to model affine matrix
) -> Endpoints2 {
    var initialized = false;
    var result: Endpoints2;
    result.is_valid = false;
    for (var index=0; index<3; index++) {
        let intersect = int3[index];
        let ep = intercepts2(offset, intersect);
        if (ep.is_valid) {
            if (!initialized) {
                result = ep;
                initialized = true;
            } else {
                result = intersect2(result, ep);
            }
        }
    }
    if (result.is_valid) {
        // verify that midpoint lies inside geometry
        let low = result.offset[0];
        let high = result.offset[1];
        let mid = (low + high) / 2;
        let mid_probe = probe_point(vec2f(offset), mid, ijk2xyz);
        //let low_probe = probe_point(offset, low, ijk2xyz);
        //let high_probe = probe_point(offset, high, ijk2xyz);
        //let mid_probe = 0.5 * (low_probe + high_probe);
        //let mid_probe = low_probe; // debugging
        let mid_offset = offset_of_xyz(mid_probe, geom_ptr);
        result.is_valid = mid_offset.is_valid;
        // DEBUGGING
        //result.is_valid = true;
    }
    return result;
}

fn probe_point(offset: vec2f, depth: f32, ijk2xyz: mat4x4f) -> vec3f {
    let ijkw = vec4f(vec2f(offset), f32(depth), 1.0);
    let xyzw = ijk2xyz * ijkw;
    return xyzw.xyz;
}


// Data for probing a volume along a line segment in the depth direction.
struct probeInterpolation {
    start_probe: vec3f,
    voxel_offset: vec3f,
    voxel_count: u32,
    depth_offset: f32,
}

fn probe_stats(offset: vec2f, start_depth: f32, end_depth: f32, ijk2xyz: mat4x4f) 
    -> probeInterpolation {
    var result: probeInterpolation;
    let start_xyz = probe_point(offset, start_depth, ijk2xyz);
    result.start_probe = start_xyz;
    let end_xyz = probe_point(offset, end_depth, ijk2xyz);
    let vector = end_xyz - start_xyz;
    let max_component = max(max(abs(vector[0]), abs(vector[1])), abs(vector[2]));
    result.voxel_offset = vector / max_component;
    result.voxel_count = u32(max_component);
    result.depth_offset = (end_depth - start_depth) / max_component;
    return result;
}

// Locate a voxel probe along a line segment in the depth direction as xyz
fn voxel_probe(iteration: u32, stats: probeInterpolation) -> vec3f {
    return stats.start_probe + f32(iteration) * stats.voxel_offset;
}

// Locate a voxel probe along a line segment in the depth direction as volume index offset.
fn voxel_probe_offset(
    iteration: u32, 
    stats: probeInterpolation, 
    geom : ptr<function, VolumeGeometry>) -> IndexOffset {
    let probe = voxel_probe(iteration, stats);
    //return offset_of_f(probe, geom);
    return offset_of_xyz(probe, geom);
}

fn intercepts2(offset: vec2i, intc: Intersection2) -> Endpoints2 {
    var result: Endpoints2;
    let x = (intc.c0 * f32(offset[0])) + (intc.c1 * f32(offset[1]));
    let high = floor(x + intc.high);
    let low = ceil(x + intc.low);
    result.is_valid = (high > low);
    result.offset = vec2f(low, high);
    return result;
}

fn intersect2(e1: Endpoints2, e2: Endpoints2) -> Endpoints2 {
    var result = e1;
    if (!e1.is_valid) {
        result = e2;
    } else {
        if (e2.is_valid) {
            let low = max(e1.offset[0], e2.offset[0]);
            let high = min(e1.offset[1], e2.offset[1]);
            result.offset = vec2f(low, high);
            result.is_valid = (low <= high);
        }
    }
    return result;
}
