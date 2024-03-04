
// Suffix for testing frame operations.

@group(0) @binding(0) var<storage, read> inputVolume : Volume;

@group(1) @binding(0) var<storage, read_write> outputVolume : Volume;

// xxxx add additional transform matrix

@compute @workgroup_size(8)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    var inputGeometry = inputVolume.geometry;
    let inputOffset = global_id.x;
    let inputIndex = index_of(inputOffset, &inputGeometry);
    if (inputIndex.is_valid) {
        var outputGeometry = outputVolume.geometry;
        let xyz = to_model(inputIndex.ijk, &inputGeometry);
        let out_offset = offset_of_xyz(xyz, &outputGeometry);
        if (out_offset.is_valid) {
            outputVolume.content[out_offset.offset] = inputVolume.content[inputOffset];
        }
    }
}