
// Superclass for projection actions

import * as UpdateAction from "./UpdateAction";
import * as qdVector from "qd_vector";

const epsilon = 1e-15;

export function intersection_buffer(orbitMatrix, volume) {
    const result = new Float32Array(3 * 4);
    const volumeInv = qdVector.M_inverse(volume.matrix);
    const shape = volume.shape;
    const orbit2volume = qdVector.MM_product(volumeInv, orbitMatrix);
    //l("orbit2volume", orbit2volume);
    var cursor = 0;
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
        }
        result.set(descriptor, cursor);
        cursor += 4;
    }
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