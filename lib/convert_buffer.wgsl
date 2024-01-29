
// Suffix for converting or combining data from one data object buffer to another.

// Assume that prefix defines struct parameters with members
//   - input_start: u32
//   - output_start: u32
//   - length: u32
// as well as any other members needed for conversion.
//
// And fn new_out_value(in_value: u32, out_value: u32, parms: parameters) -> u32 {...}


@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;

@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    // make a copy of parms for local use...
    let local_parms = parms;
    let offset = global_id.x;
    let length = parms.length;
    if (offset < length) {
        let input_start = parms.input_start;
        let output_start = parms.output_start;
        let input_value = inputBuffer[input_start + offset];
        let output_index = output_start + offset;
        let output_value = outputBuffer[output_index];
        let new_output_value = new_out_value(input_value, output_value, local_parms);
        outputBuffer[output_index] = new_output_value;
    }
}
