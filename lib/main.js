
export const name="webgpu_volume";

export {do_sample} from "./sample_test"
export {do_paint} from "./paint_test"

import * as GPUContext from "./GPUContext.js";
import * as GPUVolume from "./GPUVolume.js";
import * as SampleVolume from "./SampleVolume.js";
import * as GPUColorPanel from "./GPUColorPanel.js";
import * as PaintPanel from "./PaintPanel.js";

export {
    GPUContext,
    GPUVolume,
    SampleVolume,
    GPUColorPanel,
    PaintPanel,
};
