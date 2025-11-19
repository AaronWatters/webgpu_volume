// Project a volume by max value onto a depth buffer (suffix)
// Assumes prefixes: 
//  depth_buffer.wgsl
//  volume_frame.wgsl
//  volume_intercept.wgsl
//
// This interpretation iterates through the volume voxels
// and projects into the output depth buffer where depth
// increases.

// parameters and buffers are consistent with max_value_project
struct parameters {
    ijk2xyz : mat4x4f,
    int3: Intersections3, // not used in this implementation
    dk: f32,  // k increment for probe  ??? historical????
    // 3 floats padding at end...???
}

@group(0) @binding(0) var<storage, read> inputVolume : Volume;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> parms: parameters;

// Each work item processes a JK offset (column,row) through the volume depth
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    
    let JKOffset = global_id.x;
    var inputGeometry = inputVolume.geometry;
    let volumeShape = inputGeometry.shape;
    let volumeDepth = volumeShape.x;
    let volumeHeight = volumeShape.y;
    let volumeWidth = volumeShape.z;
    let totalJK = volumeHeight * volumeWidth;
    var ijk2xyz = parms.ijk2xyz;
    let xyz2ijk = ijk2xyz; // temp debug...

    if (JKOffset < totalJK) {

        var J = JKOffset % volumeWidth;
        var K = JKOffset / volumeWidth;
        
        for (var i=0u; i<volumeDepth; i++) {

            var IJK = vec3u(i, J, K);
            let indexOffset = offset_of(IJK, &inputGeometry);
            if (indexOffset.is_valid) {
                
                var input_offset = indexOffset.offset;
                let valueu32 = inputVolume.content[input_offset];
                let valuef32 = bitcast<f32>(valueu32);
                let xyz = to_model(IJK, &inputGeometry);
                let ijk = xyz2ijk * vec4f(xyz.x, xyz.y, xyz.z, 1.0);
                let dbShape = outputDB.shape;
                let ij_f = ijk.xy / ijk.w;
                let dbLocation = f_depth_buffer_location_of(ij_f, dbShape);
                if (dbLocation.valid) {
                    // determine depth buffer extent of all corners of IJK voxel
                    var mini = dbLocation.ij.x;
                    var minj = dbLocation.ij.y;
                    var maxi = mini;
                    var maxj = minj;
                    for (var di=0u; di<=1; di++) {
                        var ii = i + di;
                        for (var dj=0u; dj<=1; dj++) {
                            var jj = J + dj;
                            for (var dk=0u; dk<=1; dk++) {
                                var kk = K + dk;
                                let corner_ijk = vec3u(ii, jj, kk);
                                let corner_xyz = to_model(corner_ijk, &inputGeometry);
                                let corner_ijk_f4 = xyz2ijk * vec4f(corner_xyz.x, corner_xyz.y, corner_xyz.z, 1.0);
                                let corner_ij_f = corner_ijk_f4.xy / corner_ijk_f4.w;
                                let corner_dbLocation = f_depth_buffer_location_of(corner_ij_f, dbShape);
                                if (corner_dbLocation.valid) {
                                    mini = min(mini, corner_dbLocation.ij.x);
                                    minj = min(minj, corner_dbLocation.ij.y);
                                    maxi = max(maxi, corner_dbLocation.ij.x);
                                    maxj = max(maxj, corner_dbLocation.ij.y);
                                }
                            }
                        }
                    }
                    for (var id=mini; id<=maxi; id++) {
                        for (var jd=minj; jd<=maxj; jd++) {
                            let ijd = vec2i(id, jd);
                            let dbLocation = depth_buffer_location_of(ijd, dbShape);
                            if (dbLocation.valid) {
                                let data_offset = dbLocation.data_offset;
                                let existing_value = outputDB.data_and_depth[data_offset];
                                let depth_offset = dbLocation.depth_offset;
                                if (valuef32 > existing_value) {
                                    // xxx note no data lock here
                                    outputDB.data_and_depth[depth_offset] = ijk.z;
                                    outputDB.data_and_depth[data_offset] = valuef32;
                                } else {
                                    //do nothing
                                }
                            }
                        }
                    }
                    
                }
                
            } else {
                //outputDB.data_and_depth[1] = -7765.0; // debug
            }
        }
        
    }
    
}
