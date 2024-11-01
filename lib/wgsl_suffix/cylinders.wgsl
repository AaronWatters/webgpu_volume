
// construct cylinders in volume
// Assumes prefixes: 
//  volume_frame.wgsl

struct parameters {
    ncylinders: u32,
    default_value: u32,
    clear: u32,
}

struct cylinder_descriptor {
    length: f32, // length of cylinder at 0
    radius: f32, // radius of cylinder at 1
    value: f32, // value to write at 2
    capped: f32, // capped cylinder at 3
    start: vec3f, // float vector index at 4..6, 7 padding
    direction: vec3f,  // unit vector at 8..10, 11 padding
}

// cylinder descriptors: later cylinders override earlier ones
@group(0) @binding(0) var<storage, read> descriptors : array<cylinder_descriptor>;

@group(1) @binding(0) var<storage, read_write> outputVolume : Volume;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let ncylinders = parms.ncylinders;
    let columnOffset = global_id.x;
    var outputGeometry = outputVolume.geometry;
    let width = outputGeometry.shape.xyz.z;
    let startOffset = columnOffset * width;
    //let capped = parms.capped;
    let default_value = f32(parms.default_value);
    let default_value_u32 = bitcast<u32>(default_value);
    // initialize all voxels to default value
    if (parms.clear > 0u) {
        for (var column=0u; column<width; column = column + 1u) {
            let outputOffset = startOffset + column;
            let output_index = index_of(outputOffset, &outputGeometry);
            if (output_index.is_valid) {
                var outputValue = default_value_u32;
                // debugging
                /*
                let lower = 2u;
                let upper = width - lower;
                if (all(output_index.ijk > vec3u(lower, lower, lower)) &&
                    all(output_index.ijk < vec3u(upper, upper, upper))) {
                    outputValue = bitcast<u32>(1.0f);
                } else {
                    outputValue = bitcast<u32>(0.0f);
                }
                */
                outputVolume.content[outputOffset] = outputValue;
            }
        }
    }
    
    /*
    // debugging
    if (true) {
        outputVolume.content[0] = 99999u; //sentinel
        outputVolume.content[1] = parms.clear;
        outputVolume.content[2] = width;
        outputVolume.content[3] = 99999u; //sentinel
    }
    */

    //return; // xxx debug
    
    if (ncylinders < 1u) {
        return;
    }
    // iterate over all cylinders
    for (var cylinderIndex=0u; cylinderIndex<ncylinders; cylinderIndex = cylinderIndex + 1u) {
        let descriptor = descriptors[cylinderIndex];
        let start = vec3f(descriptor.start);
        let direction = descriptor.direction;
        let length = descriptor.length;
        let radius = descriptor.radius;
        let capped = u32(descriptor.capped);
        let value = bitcast<u32>(descriptor.value);
        let end = start + (length * direction);
        let midpoint = 0.5 * (start + end);
        let cutoff = (0.5 * length) + radius;
        /*
        // debug dump all cylinder parameters at front of content
        outputVolume.content[0] = bitcast<u32>(99999.0); //sentinel
        outputVolume.content[1] = bitcast<u32>(start.x);
        outputVolume.content[2] = bitcast<u32>(start.y);
        outputVolume.content[3] = bitcast<u32>(start.z);
        outputVolume.content[4] = bitcast<u32>(direction.x);
        outputVolume.content[5] = bitcast<u32>(direction.y);
        outputVolume.content[6] = bitcast<u32>(direction.z);
        outputVolume.content[7] = bitcast<u32>(length);
        outputVolume.content[8] = bitcast<u32>(radius);
        outputVolume.content[9] = bitcast<u32>(value);
        outputVolume.content[10] = bitcast<u32>(capped);
        // dump end
        outputVolume.content[11] = bitcast<u32>(end.x);
        outputVolume.content[12] = bitcast<u32>(end.y);
        outputVolume.content[13] = bitcast<u32>(end.z);
        // dump midpoint
        outputVolume.content[14] = bitcast<u32>(midpoint.x);
        outputVolume.content[15] = bitcast<u32>(midpoint.y);
        outputVolume.content[16] = bitcast<u32>(midpoint.z);
        outputVolume.content[17] = bitcast<u32>(cutoff);
        outputVolume.content[18] = bitcast<u32>(99999.0); //sentinel
        */
        // iterate over all voxels in column
        for (var column=0u; column<width; column = column + 1u) {
            let outputOffset = startOffset + column;
            let output_index = index_of(outputOffset, &outputGeometry);
            if (output_index.is_valid) {
                let P = vec3f(output_index.ijk);
                let distance2midpoint = distance(P, midpoint);
                //distance2end = distance(P, end);
                //distance2start = distance(P, start);
                // heuristic to avoid processing voxels far from cylinder
                if (distance2midpoint < cutoff) {
                    var inside = false;
                    let projection = dot(P - start, direction);
                    // projection onto P+direction line
                    if (projection > 0) {
                        let Pprime = start + projection * direction;
                        let distance2line = distance(P, Pprime);
                        if (distance2line < radius) {
                            let Pprime_distance_to_start = distance(Pprime, start);
                            if (Pprime_distance_to_start < length) {
                                // inside cylinder
                                outputVolume.content[outputOffset] = value;
                                inside = true;
                            }
                        }
                    }
                    if (!inside && (capped > 0u)) {
                        // capped cylinder
                        let distance2end = distance(P, end);
                        let distance2start = distance(P, start);
                        if (distance2end < radius) {
                            outputVolume.content[outputOffset] = bitcast<u32>(descriptor.value);
                        } else if (distance2start < radius) {
                            outputVolume.content[outputOffset] = bitcast<u32>(descriptor.value);
                        }
                        //if ((distance2end < radius) || (distance2start < radius)) {
                        //    outputVolume.content[outputOffset] = value;
                        //}
                    }
                }
            }
        }
    }
    
}