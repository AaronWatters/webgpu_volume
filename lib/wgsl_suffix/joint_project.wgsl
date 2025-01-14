
// Project a volume by "joints" where 3 segmentation elements meet.
// Assumes prefixes: 
//  depth_buffer.wgsl
//  volume_frame.wgsl
//  volume_intercept.wgsl

// xxx this is shared with max_value_project.wgsl
struct parameters {
    ijk2xyz : mat4x4f,
    int3: Intersections3,
    //dk: f32,  // k increment for probe
    // 3 floats padding at end...???
}

@group(0) @binding(0) var<storage, read> inputVolume : Volume;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    //let local_parms = parms;
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    // k increment length in xyz space
    //let dk = 1.0f;  // fix this! -- k increment length in xyz space
    //let dk = parms.dk;
    if (outputLocation.valid) {
        var inputGeometry = inputVolume.geometry;
        var current_value = outputShape.default_value;
        var current_depth = outputShape.default_depth;
        var value_found = false;
        let offsetij = vec2i(outputLocation.ij);
        let ijk2xyz = parms.ijk2xyz;
        var end_points = scan_endpoints(
            offsetij,
            parms.int3,
            &inputGeometry,
            ijk2xyz,
        );
        if (end_points.is_valid) {
            let offsetij_f = vec2f(offsetij);
            // using probe_offsets..
            let start_depth = end_points.offset[0];
            let end_depth = end_points.offset[1];
            let probe_stats = probe_stats0(offsetij_f, start_depth, end_depth, ijk2xyz);
            let ddepth = probe_stats.depth_offset;
            for (var iteration=0u; iteration<=probe_stats.voxel_count; iteration++) {
                if (value_found) {
                    break;
                }
                let input_offset = voxel_probe_offset(iteration, probe_stats, &inputGeometry);
                if (input_offset.is_valid) {
                    let indices = index_of(input_offset.offset, &inputGeometry);
                    let ijk = indices.ijk;
                    if (indices.is_valid && all(ijk > vec3u(0,0,0)) && all(ijk < inputGeometry.shape.xyz)) {
                        let valueu32 = inputVolume.content[input_offset.offset];
                        let value = bitcast<f32>(valueu32);
                        let i = i32(ijk.x);
                        let j = i32(ijk.y);
                        let k = i32(ijk.z);
                        var is_edge = false;
                        var other_value = value;
                        for (var di = -1; di <= 1; di++) {
                            for (var dj = -1; dj <= 1; dj++) {
                                for (var dk = -1; dk <= 1; dk++) {
                                    let ii = u32(i + di);
                                    let jj = u32(j + dj);
                                    let kk = u32(k + dk);
                                    let neighbor_offset = offset_of(vec3u(ii, jj, kk), &inputGeometry);
                                    if (neighbor_offset.is_valid) {
                                        let neighbor_valueu32 = inputVolume.content[neighbor_offset.offset];
                                        let neighbor_value = bitcast<f32>(neighbor_valueu32);
                                        if (neighbor_value != value) {
                                            if (is_edge) {
                                                if (neighbor_value != other_value) {
                                                    // 3-way joint
                                                    current_depth = f32(k) * ddepth + start_depth;
                                                    if (value != outputShape.default_value) {
                                                        current_value = value;
                                                    } else {
                                                        current_value = neighbor_value;
                                                    }
                                                    value_found = true;
                                                }
                                            }
                                            is_edge = true;
                                            other_value = neighbor_value;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;
        outputDB.data_and_depth[outputLocation.data_offset] = current_value;
    }
}
