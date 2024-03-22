
// Logic for loop boundaries in volume scans.
// This prefix assumes volume_frame.wgsl and depth_buffer.wgsl.

struct Intersection2 {
    c0: f32,
    c1: f32,
    low: f32,
    high: f32,
}

alias Intersections3 = array<Intersection2, 3>;

struct Endpoints2 {
    offset: vec2i,
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
        let mid_probe = probe_point(offset, mid, ijk2xyz);
        //let low_probe = probe_point(offset, low, ijk2xyz);
        //let high_probe = probe_point(offset, high, ijk2xyz);
        //let mid_probe = 0.5 * (low_probe + high_probe);
        //let mid_probe = low_probe; // debugging
        let mid_offset = offset_of_xyz(mid_probe, geom_ptr);
        result.is_valid = mid_offset.is_valid;
        // DEBUGGING
        result.is_valid = true;
    }
    return result;
}

fn probe_point(offset: vec2i, depth: i32, ijk2xyz: mat4x4f) -> vec3f {
    let ijkw = vec4f(vec2f(offset), f32(depth), 1.0);
    let xyzw = ijk2xyz * ijkw;
    return xyzw.xyz;
}

fn intercepts2(offset: vec2i, intc: Intersection2) -> Endpoints2 {
    var result: Endpoints2;
    let x = (intc.c0 * f32(offset[0])) + (intc.c1 * f32(offset[1]));
    let high = floor(x + intc.high);
    let low = ceil(x + intc.low);
    result.is_valid = (high > low);
    result.offset = vec2i(vec2f(low, high));
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
            result.offset = vec2i(low, high);
            result.is_valid = (low <= high);
        }
    }
    return result;
}
