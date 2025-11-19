// Very simple test of max projection scan action.

import * as GPUContext from "../support/GPUContext";
import * as MaxScan from "../actions/MaxScan";
import * as qdVector from "qd_vector";
import * as CPUVolume from "../data_objects/CPUVolume";
import * as GPUDepthBuffer from "../data_objects/GPUDepthBuffer";

export async function scan_test_async() {
    debugger;

    
    const VolumeData = [6,7,8,9,10,9,8,7,];
    const VolumeShape = [2,2,2];
    const cpuVolume = new CPUVolume.Volume(VolumeShape, VolumeData);
    const ijk2xyz = qdVector.eye(4);
    
    const context = new GPUContext.Context();
    await context.connect();
    
    const gpuVolume = cpuVolume.gpu_volume(context);
    gpuVolume.attach_to_context(context);
    
    const depthBufferShape = [2,2];
    const defaultValue = -1234;
    const defaultDepth = -1000
    const outputDepthBuffer = new GPUDepthBuffer.DepthBuffer(
        depthBufferShape,
        defaultDepth,
        defaultValue,
        null,
        null,
        Float32Array,
    );
    await outputDepthBuffer.attach_to_context(context);
    const projector = new MaxScan.MaxScan(
        gpuVolume,
        outputDepthBuffer,
        ijk2xyz,
    );
    projector.attach_to_context(context);
    await projector.run();
    const result = await outputDepthBuffer.pull_data();
    console.log("Max scan data:", result);
    //const depths = await outputDepthBuffer.pull_depths();
    console.log("Max scan depths:", outputDepthBuffer.depths);
    console.log("Projector", projector);
    
   console.log("scan_test_async complete");
}