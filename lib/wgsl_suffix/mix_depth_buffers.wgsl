
// Mix two depth buffers with color values.
// The shapes of the buffers should usually match.

@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> ratios: vec4f;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    if (outputLocation.valid) {
        var currentDepth = outputDB.data_and_depth[outputLocation.depth_offset];
        var currentData = outputDB.data_and_depth[outputLocation.data_offset];
        let inputShape = inputDB.shape;
        let inputLocation = depth_buffer_indices(outputOffset, inputShape);
        if (inputLocation.valid) {
            let inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];
            let inputData = inputDB.data_and_depth[inputLocation.data_offset];
            if (!(is_default(inputData, inputDepth, inputShape))) {
                //currentDepth = inputDepth;
                currentDepth = min(currentDepth, inputDepth);
                // DON'T always mix the colors ???
                let in_u32 = bitcast<u32>(inputData);
                let out_u32 = bitcast<u32>(currentData);
                let in_color = unpack4x8unorm(in_u32);
                let out_color = unpack4x8unorm(out_u32);
                //let color = mix(out_color, in_color, ratios);
                //currentData = bitcast<f32>(pack4x8unorm(mixed_color));
                const ones = vec4f(1.0, 1.0, 1.0, 1.0);
                let mix_color = ((ones - ratios) * out_color) + (ratios * in_color);
                currentData = bitcast<f32>(f_pack_color(mix_color.xyz));
            }
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = currentDepth;
        outputDB.data_and_depth[outputLocation.data_offset] = currentData;
    }
}