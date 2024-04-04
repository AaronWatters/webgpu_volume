
// Suffix pasting input depth buffer over output where depth dominates
// Requires "depth_buffer.wgsl"

@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> input_offset_ij_sign: vec3i;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    if (outputLocation.valid) {
        let inputIndices = outputLocation.ij + input_offset_ij_sign.xy;
        let inputShape = inputDB.shape;
        let inputLocation = depth_buffer_location_of(inputIndices, inputShape);
        if (inputLocation.valid) {
            let inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];
            let inputData = inputDB.data_and_depth[inputLocation.data_offset];
            if (!is_default(inputData, inputDepth, inputShape)) {
                let outputDepth = outputDB.data_and_depth[outputLocation.depth_offset];
                let outputData = outputDB.data_and_depth[outputLocation.data_offset];
                if (is_default(outputData, outputDepth, outputShape) || 
                    (((inputDepth - outputDepth) * f32(input_offset_ij_sign.z)) < 0.0)) {
                    outputDB.data_and_depth[outputLocation.depth_offset] = inputDepth;
                    outputDB.data_and_depth[outputLocation.data_offset] = inputData;
                }
            }
            // DEBUG
            //outputDB.data_and_depth[outputLocation.depth_offset] = bitcast<f32>(0x99999999u);
            //outputDB.data_and_depth[outputLocation.data_offset] = bitcast<f32>(0x99999999u);
            
        //} else {
            // DEBUG
            //outputDB.data_and_depth[outputLocation.depth_offset] = 55.5;
            //outputDB.data_and_depth[outputLocation.data_offset] = 55.5;
        }
    }
}