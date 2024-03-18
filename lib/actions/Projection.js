
// Superclass for projection actions

import * as UpdateAction from "./UpdateAction";

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