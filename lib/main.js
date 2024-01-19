
// Module main entry point.  Defines module external interface.

export const name="webgpu_volume";

export {do_sample} from "./sample_test";
export {do_paint} from "./paint_test";
export {do_combine} from "./combine_test";
export {do_paste} from "./paste_test";
export {do_mouse_paste} from "./mousepaste"

import * as GPUContext from "./GPUContext.js";
import * as GPUVolume from "./GPUVolume.js";
import * as SampleVolume from "./SampleVolume.js";
import * as GPUColorPanel from "./GPUColorPanel.js";
import * as PaintPanel from "./PaintPanel.js";

// convenience functions

export function context() {
    return new GPUContext.Context();
};
export function volume(shape, data, ijk2xyz) {
    return new GPUVolume.Volume(shape, data, ijk2xyz);
};
export function panel(width, height) {
    return new GPUColorPanel.Panel(width, height);
};
export function paint_panel(panel, to_canvas) {
    return new PaintPanel.PaintPanel(panel, to_canvas);
};
export function sample_volume(shape, ijk2xyz, volumeToSample) {
    return new SampleVolume.SampleVolume(shape, ijk2xyz, volumeToSample);
};
export function painter(rgbaImage, width, height, to_canvas) {
    return new PaintPanel.ImagePainter(rgbaImage, width, height, to_canvas);
};

export {
    GPUContext,
    GPUVolume,
    SampleVolume,
    GPUColorPanel,
    PaintPanel,
};
