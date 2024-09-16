
// Project a volume by max value onto a depth buffer (suffix)
// Assumes prefixes: 
//  depth_buffer.wgsl
//  volume_frame.wgsl
//  volume_intercept.wgsl

struct parameters {
    ijk2xyz : mat4x4f,
    int3: Intersections3,
    dk: f32,  // k increment for probe
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
    let dk = parms.dk;
    var initial_value_found = false;
    if (outputLocation.valid) {
        var inputGeometry = inputVolume.geometry;
        var current_value = outputShape.default_value;
        var current_depth = outputShape.default_depth;
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
            let probe_stats = probe_stats(offsetij_f, start_depth, end_depth, ijk2xyz);
            let ddepth = (end_depth - start_depth) / f32(probe_stats.voxel_count);
            for (var iteration=0u; iteration<=probe_stats.voxel_count; iteration++) {
                let input_offset = voxel_probe_offset(iteration, probe_stats, &inputGeometry);
                if (input_offset.is_valid) {
                    let valueu32 = inputVolume.content[input_offset.offset];
                    let value = bitcast<f32>(valueu32);
                    if ((!initial_value_found) || (value > current_value)) {
                        current_depth = ddepth * f32(iteration) + start_depth;
                        current_value = value;
                        initial_value_found = true;
                    }
                }
            }
/*
            // previous version
            for (var depth = end_points.offset[0]; depth < end_points.offset[1]; depth += dk) {
                let xyz_probe = probe_point(offsetij_f, depth, ijk2xyz);
                let input_offset = offset_of_xyz(xyz_probe.xyz, &inputGeometry);
                if (input_offset.is_valid) {
                    let valueu32 = inputVolume.content[input_offset.offset];
                    let value = bitcast<f32>(valueu32);
                    if ((!initial_value_found) || (value > current_value)) {
                        current_depth = f32(depth);
                        current_value = value;
                        initial_value_found = true;
                    }
                } 
            } 
            */
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;
        outputDB.data_and_depth[outputLocation.data_offset] = current_value;
    }
}
