
// Mouse based rotation helper.

import * as qdVector from "qd_vector";

export class Orbiter {
    constructor (canvas, center, initial_rotation, callback) {
        const that = this;
        this.canvas = canvas
        this.center = center;  // null: center at origin
        if (this.center) {
            this.minus_center = qdVector.v_scale(-1, this.center);
            this.center_to_originM = qdVector.affine3d(null, this.minus_center);
            this.origin_to_centerM = qdVector.affine3d(null, this.center);
        } else {
            this.minus_center = null;
            this.center_to_originM = null;
            this.origin_to_centerM = null;
        }
        this.initial_rotation = initial_rotation || qdVector.eye(3);
        this.bounding_rect = canvas.getBoundingClientRect();
        this.callbacks = [];
        if (callback) {
            this.add_callback(callback);
        }
        canvas.addEventListener("pointerdown", function(e) {that.pointerdown(e)});
        canvas.addEventListener("pointermove", function(e) {that.pointermove(e)});
        canvas.addEventListener("pointerup", function(e) {that.pointerup(e)});
        canvas.addEventListener("pointercancel", function(e) {that.pointerup(e)});
        canvas.addEventListener("pointerout", function(e) {that.pointerup(e)});
        canvas.addEventListener("pointerleave", function(e) {that.pointerup(e)});
        this.active = false;
        this.current_rotation = qdVector.MM_product(qdVector.eye(3), this.initial_rotation);
        this.next_rotation = this.current_rotation;
        this.last_stats = null;
    };
    pointerdown(e) {
        this.active = true;
        this.last_stats = this.event_stats(e);
        //console.log("pointerdown at", this.last_stats);
        //console.log("  current rotation", this.current_rotation);
    };
    pointermove(e) {
        if (!this.active) {
            return;
        }
        this.do_rotation(e);
    };
    pointerup(e) {
        if (!this.active) {
            return;
        }
        this.do_rotation(e);
        this.active = false;
        this.current_rotation = this.next_rotation;
        //console.log("pointerup at", this.next_stats);
        //console.log("  current rotation", this.current_rotation);
    };
    do_rotation(e) {
        debugger;
        function clamp1(x) {
            return Math.max(-1, Math.min(1, x));
        }
        const last = this.last_stats;
        const now = this.event_stats(e);
        this.next_stats = now;   // only for debugging xxx
        const offset_x = clamp1(0.5 * (now.dx - last.dx));
        const offset_y = clamp1(0.5 * (now.dy - last.dy));
        const yaw = Math.asin(offset_x);
        const pitch = Math.asin(offset_y);
        const yawM = qdVector.M_yaw(yaw);
        const pitchM = qdVector.M_pitch(pitch);
        //const rotation = qdVector.MM_product(
        //    qdVector.MM_product(yawM, pitchM),
        //    this.current_rotation
        //);
        const rotation = qdVector.MM_product(
            this.current_rotation,
            qdVector.MM_product(yawM, pitchM),
        );
        this.next_rotation = rotation;
        const arotation = qdVector.affine3d(rotation)
        var affine = arotation;
        if (this.center) {
            // affine transform performing rotation at this.center:
            affine = qdVector.MM_product(
                qdVector.MM_product(this.origin_to_centerM, arotation),
                this.center_to_originM
            );
        }
        // send affine transform to all callbacks
        for (var callback of this.callbacks) {
            callback(affine);
        }
    };
    event_stats(e) {
        const brec = this.bounding_rect;
        const px = e.pageX;
        const py = e.pageY;
        const cx = brec.width/2 + brec.left;
        const cy = brec.height/2 + brec.top;
        const offsetx = (px - cx);
        const offsety = - (py - cy);
        const dx = offsetx * 2 / brec.width;
        const dy = offsety * 2 / brec.height;
        return {px, py, cx, cy, offsetx, offsety, dx, dy};
    };
    add_callback(callback) {
        this.callbacks.push(callback);
    };
};
