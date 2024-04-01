
// Module main entry point.  Defines module external interface.

export const name="webgpu_volume";

// special exports
export {do_sample} from "./proofs_of_concepts/sample_test";
export {do_paint} from "./proofs_of_concepts/paint_test";
export {do_combine} from "./proofs_of_concepts/combine_test";
export {do_paste} from "./proofs_of_concepts/paste_test";
export {do_mouse_paste} from "./proofs_of_concepts/mousepaste";
export {do_gray} from "./proofs_of_concepts/gray_test";
export {do_max_projection} from "./proofs_of_concepts/max_projection_test";
export {do_pipeline} from "./proofs_of_concepts/pipeline_test";

// Import all standard module.
// 'support' imports
import * as GPUContext from "./support/GPUContext.js";
import * as canvas_orbit from "./support/canvas_orbit.js";
// 'data_objects' imports
import * as CPUVolume from "./data_objects/CPUVolume.js";
import * as GPUColorPanel from "./data_objects/GPUColorPanel.js";
import * as GPUDataObject from "./data_objects/GPUDataObject.js";
import * as GPUDepthBuffer from "./data_objects/GPUDepthBuffer.js";
import * as GPUVolume from "./data_objects/GPUVolume.js";
// 'actions' imports
import * as CombineDepths from "./actions/CombineDepths.js";
import * as CopyAction from "./actions/CopyAction.js";
import * as DepthBufferRange from "./actions/DepthBufferRange.js";
import * as GPUAction from "./actions/GPUAction.js";
import * as IndexColorizePanel from "./actions/IndexColorizePanel.js";
import * as MaxProjection from "./actions/MaxProjection.js";
import * as MaxView from "./actions/MaxView.js";
import * as MixColorPanels from "./actions/MixColorPanels.js";
import * as MixView from "./actions/MixView.js";
import * as NormalAction from "./actions/NormalAction.js";
import * as PaintPanel from "./actions/PaintPanel.js";
import * as PastePanel from "./actions/PastePanel.js";
import * as Projection from "./actions/Projection.js";
import * as SampleVolume from "./actions/SampleVolume.js";
import * as Soften from "./actions/Soften.js";
import * as ThresholdAction from "./actions/ThresholdAction.js";
import * as ThresholdView from "./actions/ThresholdView.js";
import * as UpdateAction from "./actions/UpdateAction.js";
import * as UpdateGray from "./actions/UpdateGray.js";
import * as ViewVolume from "./actions/ViewVolume.js";
import * as VolumeAtDepth from "./actions/VolumeAtDepth.js";
// 'proofs_of_concepts' imports
import * as combine_test from "./proofs_of_concepts/combine_test.js";
import * as depth_range_view from "./proofs_of_concepts/depth_range_view.js";
import * as gray_test from "./proofs_of_concepts/gray_test.js";
import * as max_projection_test from "./proofs_of_concepts/max_projection_test.js";
import * as mix_test from "./proofs_of_concepts/mix_test.js";
import * as mousepaste from "./proofs_of_concepts/mousepaste.js";
import * as paint_test from "./proofs_of_concepts/paint_test.js";
import * as paste_test from "./proofs_of_concepts/paste_test.js";
import * as pipeline_test from "./proofs_of_concepts/pipeline_test.js";
import * as sample_test from "./proofs_of_concepts/sample_test.js";
import * as threshold_test from "./proofs_of_concepts/threshold_test.js";
import * as vol_depth_view from "./proofs_of_concepts/vol_depth_view.js";

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

// Export everything.
export {
    GPUContext,
    canvas_orbit,
    CPUVolume,
    GPUColorPanel,
    GPUDataObject,
    GPUDepthBuffer,
    GPUVolume,
    CombineDepths,
    CopyAction,
    DepthBufferRange,
    GPUAction,
    IndexColorizePanel,
    MaxProjection,
    MaxView,
    MixColorPanels,
    MixView,
    NormalAction,
    PaintPanel,
    PastePanel,
    Projection,
    SampleVolume,
    Soften,
    ThresholdAction,
    ThresholdView,
    UpdateAction,
    UpdateGray,
    ViewVolume,
    VolumeAtDepth,
    combine_test,
    depth_range_view,
    gray_test,
    max_projection_test,
    mix_test,
    mousepaste,
    paint_test,
    paste_test,
    pipeline_test,
    sample_test,
    threshold_test,
    vol_depth_view
};
