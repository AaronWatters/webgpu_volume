
// Keep only outlines (pixels where changes occur)

struct parameters {
    in_hw: vec2u,
    default_value: u32,
}

// input and output buffers presumed to be panels of same size.
@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;

@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;

@group(2) @binding(0) var<storage, read> parms: parameters;


@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let outputOffset = global_id.x;
    let hw = vec2i(parms.in_hw);
    let location = panel_location_of(outputOffset, parms.in_hw);
    if (location.is_valid) {
        var value = parms.default_value;
        let i = i32(location.ij[0]);
        let j = i32(location.ij[1]);
        if ((i > 0) && (j > 0) && (i < hw[0] - 1) && (j < hw[1] - 1)) {
            var is_edge = false;
            let this_value = inputBuffer[location.offset];
            for (var di = -1; di <= 1; di++) {
                for (var dj = -1; dj <= 1; dj++) {
                    let ii = u32(i + di);
                    let jj = u32(j + dj);
                    let neighbor_offset = panel_offset_of(vec2u(ii, jj), parms.in_hw);
                    if (neighbor_offset.is_valid) {
                        let neighbor_value = inputBuffer[neighbor_offset.offset];
                        if (neighbor_value != this_value) {
                            is_edge = true;
                        }
                    }
                }
            }
            if (is_edge) {
                value = this_value;
            }
        }
        outputBuffer[location.offset] = value;
    }
}
