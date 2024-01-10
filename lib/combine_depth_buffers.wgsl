
// Suffix for testing depth buffers

@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> input_offset_ij_sign: vec3i;

@compute @workgroup_size(8)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    if (outputLocation.valid) {
        //outputDB.data_and_depth[outputLocation.depth_offset] = 1000.0; // debug
        //outputDB.data_and_depth[outputLocation.depth_offset] = 
        //    1000000.0 + 
        //    f32(outputLocation.ij.x) * 1000 + 
        //    f32(outputLocation.ij.y); // debug
        let inputIndices = outputLocation.ij + input_offset_ij_sign.xy;
        //outputDB.data_and_depth[outputLocation.depth_offset] = 
        //    1000000.0 + 
        //    f32(inputIndices.x) * 1000 + 
        //    f32(inputIndices.y); // debug
        let inputShape = inputDB.shape;
        //outputDB.data_and_depth[outputLocation.data_offset] = 
        //    1000000.0 + 
        //    f32(inputShape.x) * 1000 + 
        //    f32(inputShape.y); // debug
        let inputLocation = depth_buffer_location_of(inputIndices, inputShape);
        if (inputLocation.valid) {
            //outputDB.data_and_depth[outputLocation.data_offset] = 666.0; //debug
            var inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];
            var outputDepth = outputDB.data_and_depth[outputLocation.depth_offset];
            outputDB.data_and_depth[outputLocation.data_offset] = 
                3000000 + inputDepth * 1000 + outputDepth; //debug
            var sign = input_offset_ij_sign.z;
            if (sign == 0) {
                sign = 1;
            }
            if (((inputDepth - outputDepth) * f32(sign)) > 0.0) {
                outputDB.data_and_depth[outputLocation.depth_offset] = inputDepth;
                var inputData = inputDB.data_and_depth[inputLocation.data_offset];
                outputDB.data_and_depth[outputLocation.data_offset] = inputData;
            }
        }
    }
}