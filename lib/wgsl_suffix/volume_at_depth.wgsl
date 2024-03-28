

// Generate values for volume in projection at a given depth as a depth buffer.
// Assumes prefixes: 
//  depth_buffer.wgsl
//  volume_frame.wgsl
//  volume_intercept.wgsl

struct parameters {
    ijk2xyz : mat4x4f, // depth buffer to xyz affine transform matrix.
    depth: f32,  // depth to probe
    // 3 floats padding at end...???
}

@group(0) @binding(0) var<storage, read> inputVolume : Volume;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    if (outputLocation.valid) {
        // xxx refactor with max_value_project somehow?
        var inputGeometry = inputVolume.geometry;
        var current_value = outputShape.default_value;
        var current_depth = outputShape.default_depth;
        let offsetij_f = vec2f(outputLocation.ij);
        let ijk2xyz = parms.ijk2xyz;
        let depth = parms.depth;
        let xyz_probe = probe_point(offsetij_f, depth, ijk2xyz);
        let input_offset = offset_of_xyz(xyz_probe.xyz, &inputGeometry);
        if (input_offset.is_valid) {
            let valueu32 = inputVolume.content[input_offset.offset];
            let value = bitcast<f32>(valueu32);
            current_depth = f32(depth);
            current_value = value;
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;
        outputDB.data_and_depth[outputLocation.data_offset] = current_value;
    }
}
