
// for non-default entries of outputDB
// put RGBA entries where RGB are scaled 255 representations of
// approximate normals (direction of greatest increase) at the
// corresponding location in the inputVolume

// Assumes prefixes: 
//  panel_buffer.wgsl
//  volume_frame.wgsl

struct parameters {
    ijk2xyz : mat4x4f,
    default_value: u32,
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
        // XXXX THIS SHOULD USE OFFSETS IN THE OUTPUT BUFFER REFERENCE FRAME
        var inputGeometry = inputVolume.geometry;
        var output_value = parms.default_value;
        var offset_sum = vec3f(0.0f, 0.0f, 0.0f);
        let depth = outputDB.data_and_depth[outputLocation.depth_offset];
        let ij = outputLocation.ij;
        let f_ijk = vec4f(f32(ij[0]), f32(ij[1]), depth, 1.0f);
        let xyz_probe = parms.ijk2xyz * f_ijk;
        let xyz = xyz_probe.xyz;
        let input_offset = offset_of_xyz(xyz, &inputGeometry);
        var offsets_are_valid = input_offset.is_valid;
        const combinations = array(
            vec3u(0,1,2),
            vec3u(1,2,0),
            vec3u(2,0,1),
        );
        for (var q=0; q<3; q++) {
            let combo = combinations[q];
            let M = combo[0];
            let N = combo[1];
            let P = combo[2];
            for (var m_shift=-1; m_shift<=1; m_shift++) {
                for (var n_shift=-1; n_shift<=1; n_shift++) {
                    var xyz_shift = xyz;
                    xyz_shift[M] += f32(m_shift);
                    xyz_shift[N] += f32(n_shift);
                    var left = xyz_shift;
                    var right = xyz_shift;
                    left[P] += 1.0;
                    right[P] -= 1.0;
                    let left_offset = offset_of_xyz(left, &inputGeometry);
                    let right_offset = offset_of_xyz(right, &inputGeometry);
                    offsets_are_valid = 
                        offsets_are_valid && 
                        left_offset.is_valid && right_offset.is_valid;
                    if (offsets_are_valid) {
                        let left_value_u32 = inputVolume.content[left_offset.offset];
                        let right_value_u32 = inputVolume.content[right_offset.offset];
                        let weight = bitcast<f32>(left_value_u32) - bitcast<f32>(right_value_u32);
                        let vector = (left - right);
                        offset_sum += weight * vector;
                    } // don't break otherwise -- set of measure 0
                }
            }
        }
        if (offsets_are_valid) {
            let L = length(offset_sum);
            if (L > 1e-10) {
                let N = normalize(offset_sum);
                let colors = vec3u((N + 1.0) * 127.5);
                //let colors = vec3u(255, 0, 0);  // debug
                //let result = pack4xU8(color); ???error: unresolved call target 'pack4xU8'
                output_value = 
                    colors[0] + 
                    256 * (colors[1] + 256 * (colors[2] + 256 * 255));
            }
        } else {
            //output_value = 255 * 256; // debug
        }
        //...
        outputDB.data_and_depth[outputLocation.data_offset] = bitcast<f32>(output_value);
    }
}