
// Project a volume by max value onto a depth buffer (suffix)
// Assumes prefixes: 
//  panel_buffer.wgsl
//  volume_frame.wgsl

struct parameters {
    ijk2xyz : mat4x4f,
    k_limit: u32,
    //default_depth: f32, -- implicit in outputDB
    //default_value: f32,
}

@group(0) @binding(0) var<storage, read> inputVolume : Volume;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let local_parms = parms;
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    // k increment length in xyz space
    let dk = 1.0f;  // fix this! -- k increment length in xyz space
    var initial_value_found = false;
    if (outputLocation.valid) {
        var inputGeometry = inputVolume.geometry;
        var current_value = outputShape.default_value;
        var current_depth = outputShape.default_depth;
        for (var depth = 0u; depth < parms.k_limit; depth += 1u) {
            let ijkw = vec4u(vec2u(outputLocation.ij), depth, 1u);
            let f_ijk = vec4f(ijkw);
            let xyz_probe = parms.ijk2xyz * f_ijk;
            let input_offset = offset_of_xyz(xyz_probe.xyz, &inputGeometry);
            if (input_offset.is_valid) {
                let valueu32 = inputVolume.content[input_offset.offset];
                let value = bitcast<f32>(valueu32);
                if ((!initial_value_found) || (value > current_value)) {
                    current_depth = f32(depth) * dk;
                    current_value = value;
                    initial_value_found = true;
                }
            }
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;
        outputDB.data_and_depth[outputLocation.data_offset] = current_value;
    }
}
