
// Project a volume where the values cross a threshold
// Assumes prefixes: 
//  panel_buffer.wgsl
//  volume_frame.wgsl
//  volume_intercept.wgsl

struct parameters {
    ijk2xyz : mat4x4f,
    int3: Intersections3,
    dk: f32,
    threshold_value: f32,
    // 2 float padding at end...???
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
    let dk = parms.dk;
    var initial_value_found = false;
    var compare_diff: f32;
    var threshold_crossed = false;
    if (outputLocation.valid) {
        var inputGeometry = inputVolume.geometry;
        var current_value = outputShape.default_value;
        var current_depth = outputShape.default_depth;
        let offsetij = vec2i(outputLocation.ij);
        let ijk2xyz = parms.ijk2xyz;
        var threshold_value = parms.threshold_value;
        var end_points = scan_endpoints(
            offsetij,
            parms.int3,
            &inputGeometry,
            ijk2xyz,
        );
        if (end_points.is_valid) {
            let offsetij_f = vec2f(offsetij);
            for (var depth = end_points.offset[0]; depth < end_points.offset[1]; depth += dk) {
                //let ijkw = vec4u(vec2u(outputLocation.ij), depth, 1u);
                //let f_ijk = vec4f(ijkw);
                //let xyz_probe = parms.ijk2xyz * f_ijk;
                let xyz_probe = probe_point(offsetij_f, depth, ijk2xyz);
                let input_offset = offset_of_xyz(xyz_probe.xyz, &inputGeometry);
                if ((input_offset.is_valid) && (!threshold_crossed)) {
                    let valueu32 = inputVolume.content[input_offset.offset];
                    let value = bitcast<f32>(valueu32);
                    let diff = value - threshold_value;
                    if ((initial_value_found) && (!threshold_crossed)) {
                        if (compare_diff * diff <= 0.0f) {
                            threshold_crossed = true;
                            current_depth = f32(depth);
                            current_value = value;
                            break;
                        }
                    }
                    initial_value_found = true;
                    compare_diff = diff;
                }
            }
        }

        // debugging
        //current_depth = bitcast<f32>(outputLocation.data_offset);
        //current_value = bitcast<f32>(outputLocation.depth_offset);

        //current_depth = bitcast<f32>(5u);
        //current_value = bitcast<f32>(6u);
        // end debugging

        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;
        outputDB.data_and_depth[outputLocation.data_offset] = current_value;
    }
}
