
// Select a range in depths or values from a depth buffer 
// copied to output depth buffer at same ij locations where valid.

// Requires "depth_buffer.wgsl".

struct parameters {
    lower_bound: f32,
    upper_bound: f32,
    do_values: u32, // flag.  Do values if >0 else do depths.
}

@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    if (outputLocation.valid) {
        var current_value = outputShape.default_value;
        var current_depth = outputShape.default_depth;
        let inputIndices = outputLocation.ij;
        let inputShape = inputDB.shape;
        let inputLocation = depth_buffer_location_of(inputIndices, inputShape);
        if (inputLocation.valid) {
            let inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];
            let inputValue = inputDB.data_and_depth[inputLocation.data_offset];
            var testValue = inputDepth;
            if (parms.do_values > 0) {
                testValue = inputValue;
            }
            if ((!is_default(inputValue, inputDepth, inputShape)) &&
                (parms.lower_bound <= testValue) && 
                (testValue <= parms.upper_bound)) {
                current_depth = inputDepth;
                current_value = inputValue;
            }
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;
        outputDB.data_and_depth[outputLocation.data_offset] = current_value;
    }
}