
// Module main entry point.  Defines module external interface.

export const name="webgpu_volume";

export {do_sample} from "./proofs_of_concepts/sample_test";
export {do_paint} from "./proofs_of_concepts/paint_test";
export {do_combine} from "./proofs_of_concepts/combine_test";
export {do_paste} from "./proofs_of_concepts/paste_test";
export {do_mouse_paste} from "./proofs_of_concepts/mousepaste";
export {do_gray} from "./proofs_of_concepts/gray_test";
export {do_max_projection} from "./proofs_of_concepts/max_projection_test";
export {do_pipeline} from "./proofs_of_concepts/pipeline_test";

import * as GPUContext from "./support/GPUContext.js";
import * as GPUVolume from "./data_objects/GPUVolume.js";
import * as SampleVolume from "./actions/SampleVolume.js";
import * as GPUColorPanel from "./data_objects/GPUColorPanel.js";
import * as PaintPanel from "./actions/PaintPanel.js";
import * as GPUDepthBuffer from "./data_objects/GPUDepthBuffer.js";
import * as CombineDepths from "./actions/CombineDepths.js";

// convenience functions
export function context() {
    return new GPUContext.Context();
};
// xxxx remove these in favor of context methods?
export function depth_buffer(shape, data, depths, data_format) {
    return new GPUDepthBuffer.DepthBuffer(shape, data, depths, data_format);
};
export function combine_depths(outputDB, inputDB, offset_ij, sign) {
    return new CombineDepths.CombineDepths(outputDB, inputDB, offset_ij, sign);
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
