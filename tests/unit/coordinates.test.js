import { describe, it, expect } from 'vitest';
import * as main from '../../lib/main';

// xxxx these mostly just exercise the code, not really testing anything much

describe('coordinates', () => {
    it('should normalize corners', () => {
        const canvas = {getBoundingClientRect: () => { return {width: 100, height: 100, left: 0, top: 0}; }};
        const ncs = new main.coordinates.NormalizedCanvasSpace(canvas);
        const [dx, dy] = ncs.normalize(0, 0);
        expect(dx).toBe(-1);
        expect(dy).toBe(1);
        const [dx2, dy2] = ncs.normalize(100, 100);
        expect(dx2).toBe(1);
        expect(dy2).toBe(-1);
    });
    it('should reverse normalize corners', () => {
        const canvas = {getBoundingClientRect: () => { return {width: 100, height: 100, left: 0, top: 0}; }};
        const ncs = new main.coordinates.NormalizedCanvasSpace(canvas);
        const [dx, dy] = ncs.normalize(0, 0);
        const [dx2, dy2] = ncs.normalize(100, 100);
        const [dx3, dy3] = ncs.normalize_event_coords({clientX: 0, clientY: 0});
        expect(dx3).toBe(dx);
        expect(dy3).toBe(dy);
        const [dx4, dy4] = ncs.normalize_event_coords({clientX: 100, clientY: 100});
        expect(dx4).toBe(dx2);
        expect(dy4).toBe(dy2);
    });
    it('should convert normalized to panel space', () => {
        const ps = new main.coordinates.PanelSpace(100, 100);
        const [i, j] = ps.normalized2ij([0, 0]);
        expect(i).toBe(50);
        expect(j).toBe(50);
        const [i2, j2] = ps.normalized2ij([1, 1]);
        expect(i2).toBe(100);
        expect(j2).toBe(100);
    });
    it('should convert panel to normalized space', () => {
        const ps = new main.coordinates.PanelSpace(100, 100);
        const [dx, dy] = ps.ij2normalized([50, 50]);
        expect(dx).toBe(0);
        expect(dy).toBe(0);
        const [dx2, dy2] = ps.ij2normalized([100, 100]);
        expect(dx2).toBe(1);
        expect(dy2).toBe(1);
    });
    it('should project ijk to world space', () => {
        const ijk2xyz = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
        const Pr = new main.coordinates.ProjectionSpace(ijk2xyz)
        const [x, y, z] = Pr.ijk2xyz_v([1, 2, 3]);
        expect(x).toBe(1);
        expect(y).toBe(2);
        expect(z).toBe(3);
    });
    it('should convert world coordinates to volume offsets and back', () => {
        const ijk2xyz = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
        const shape = [10, 20, 25];
        const Pr = new main.coordinates.VolumeSpace(ijk2xyz, shape);
        const xyz = [1, 2, 3];
        const ijk = Pr.xyz2ijk_v(xyz);
        expect(ijk).toEqual([1, 2, 3]);
        const offset = Pr.ijk2offset(ijk);
        const ijk2 = Pr.offset2ijk(offset);
        expect(ijk2).toEqual(ijk);
        const xyz2 = Pr.offset2xyz(offset);
        expect(xyz2).toEqual(xyz);
        const out_of_bounds = Pr.xyz2offset([100, 100, 101]);
        expect(out_of_bounds).toBeNull();
    });
});