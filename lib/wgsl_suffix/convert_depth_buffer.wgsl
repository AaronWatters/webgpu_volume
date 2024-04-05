

// Suffix for converting or combining data from one depth buffer buffer to another.
// This respects depth buffer default (null) markers.

// Assume that prefix defines struct parameters with members needed for conversion.
//
// And fn new_out_value(in_value: u32, out_value: u32, parms: parameters) -> u32 {...}
//
// Requires "depth_buffer.wgsl".

@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    // make a copy of parms for local use...
    let local_parms = parms;
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    if (outputLocation.valid) {
        var current_value = outputShape.default_value; // ???
        var current_depth = outputShape.default_depth;
        let inputIndices = outputLocation.ij;
        let inputShape = inputDB.shape;
        let inputLocation = depth_buffer_location_of(inputIndices, inputShape);
        if (inputLocation.valid) {
            let inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];
            let inputValue = inputDB.data_and_depth[inputLocation.data_offset];
            if (!is_default(inputValue, inputDepth, inputShape)) {
                let Uvalue = bitcast<u32>(inputValue);
                let Ucurrent = bitcast<u32>(current_value);
                current_value = bitcast<f32>( new_out_value(Uvalue, Ucurrent, local_parms));
                current_depth = inputDepth;
            }
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;
        outputDB.data_and_depth[outputLocation.data_offset] = current_value;
    }
}