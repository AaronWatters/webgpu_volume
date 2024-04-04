
// quick and dirty volume low pass filter

// Assumes prefixes: 
//  panel_buffer.wgsl
//  volume_frame.wgsl

// weights per offset rectangular distance from voxel
struct parameters {
    offset_weights: vec4f,
}

@group(0) @binding(0) var<storage, read> inputVolume : Volume;

@group(1) @binding(0) var<storage, read_write> outputVolume : Volume;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let columnOffset = global_id.x;
    var inputGeometry = inputVolume.geometry;
    var outputGeometry = outputVolume.geometry;
    let width = outputGeometry.shape.xyz.z;
    let startOffset = columnOffset * width;
    for (var column=0u; column<width; column = column + 1u) {
        let outputOffset = startOffset + column;
        //process_voxel(outputOffset, inputGeometry, outputGeometry); -- xxx refactor inlined
        let output_index = index_of(outputOffset, &outputGeometry);
        if (output_index.is_valid) {
            let input_index = index_of(outputOffset, &inputGeometry);
            if (input_index.is_valid) {
                // by default just copy along borders
                let center = vec3i(output_index.ijk);
                let offset_weights = parms.offset_weights;
                var result_value = inputVolume.content[outputOffset];
                var offsets_valid = all(input_index.ijk > vec3u(0u,0u,0u));
                var accumulator = 0.0f;
                for (var di=-1; di<=1; di++) {
                    for (var dj=-1; dj<=1; dj++) {
                        for (var dk=-1; dk<=1; dk++) {
                            let shift = vec3i(di, dj, dk);
                            let probe = vec3u(shift + center);
                            let probe_offset = offset_of(probe, &inputGeometry);
                            offsets_valid = offsets_valid && probe_offset.is_valid;
                            if (offsets_valid) {
                                let abs_offset = u32(abs(di) + abs(dj) + abs(dk));
                                let weight = offset_weights[abs_offset];
                                let probe_value = bitcast<f32>(inputVolume.content[probe_offset.offset]);
                                accumulator += (weight * probe_value);
                            }
                        }
                    }
                }
                if (offsets_valid) {
                    result_value = bitcast<u32>(accumulator);
                }
                outputVolume.content[outputOffset] = result_value;
            }
        }
    }
}