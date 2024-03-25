
// Superclass for projection actions

import * as UpdateAction from "./UpdateAction";
import * as qdVector from "qd_vector";

const epsilon = 1e-15;

export function intersection_buffer(orbitMatrix, volume) {
    // 3 intersection quads + probe + 3 padding
    const result = new Float32Array(3 * 4 + 4);
    const volumeM = volume.matrix;
    const volumeInv = qdVector.M_inverse(volumeM);
    const shape = volume.shape;
    const orbit2volume = qdVector.MM_product(volumeInv, orbitMatrix);
    //l("orbit2volume", orbit2volume);
    var cursor = 0;
    var mindiff = null;
    for (var dimension=0; dimension<3; dimension++) {
        const m = orbit2volume[dimension];
        const denom = m[2];
        var descriptor;
        if (Math.abs(denom) < epsilon) {
            // invalid descriptor low > high
            descriptor = [0, 0, 1111, -1111];
        } else {
            // intersections on dimension in volume
            const low_index = 0;
            const high_index = shape[dimension];
            const c0 = - m[0] / denom;
            const c1 = - m[1] / denom;
            var low = (low_index - m[3]) / denom;
            var high = (high_index - m[3]) / denom;
            if (low > high) {
                [low, high] = [high, low]
            }
            descriptor = [c0, c1, low, high]
            const diff = high - low;
            if (mindiff) {
                mindiff = Math.min(mindiff, diff)
            } else {
                mindiff = diff;
            }
        }
        result.set(descriptor, cursor);
        cursor += 4;
    }
    // final value is probe increment
    //debugger;
    const volume0 = [0,0,0,1]
    const volume2orbit = qdVector.M_inverse(orbit2volume);
    const orbit0 = qdVector.Mv_product(volume2orbit, volume0);
    const orbit0m = qdVector.v_scale(-1, orbit0);
    // xxx there is probably a smarter way...
    function probe_it(volume1) {
        const orbit1 = qdVector.Mv_product(volume2orbit, volume1);
        const orbit_probe_v = qdVector.v_add(orbit0m, orbit1);
        return Math.abs(orbit_probe_v[2]);
    }
    var probe = Math.max(
        probe_it([1,0,0,1]),
        probe_it([0,0,1,1]),
        probe_it([0,1,0,1])
    );
    console.log("probe", probe);
    //probe = 1.0; // DEBUG
    result[cursor] = probe;
    return result;
};

export class Project extends UpdateAction.UpdateAction {
    constructor (source, target) {
        super();
        this.source = source;
        this.target = target;
        // subclass must define this.parameters
    };
    change_matrix(ijk2xyz) {
        this.parameters.set_matrix(ijk2xyz);
        this.parameters.push_buffer();
    };
    getWorkgroupCounts() {
        return [Math.ceil(this.target.size / 256), 1, 1];
    };
};