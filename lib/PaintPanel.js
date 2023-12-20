
// Action to paint a Panel to canvas

import * as GPUAction from "./GPUAction.js";
import * as GPUDataObject from "./GPUDataObject";
import * as GPUContext from "./GPUContext.js";
import * as GPUColorPanel from "./GPUColorPanel.js";
import painter_code from "./Painter.wgsl?raw";

export function grey_to_rgba(grey_bytes) {
    console.log("converting grey to rgba")
    const ln = grey_bytes.length;
    const rgbaImage = new Uint8Array(ln * 4);
    for (var i=0; i<ln; i++) {
        const grey = grey_bytes[i];
        const offset = i*4;
        rgbaImage[offset] = grey;
        rgbaImage[offset+1] = grey;
        rgbaImage[offset+2] = grey;
        rgbaImage[offset+3] = 0;
    }
    return rgbaImage;
};

export class PaintPanelUniforms extends GPUDataObject.DataObject {
    constructor (
        panel
    ) {
        super();
        this.match_panel(panel);
        this.usage_flags = (
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.UNIFORM |
            GPUBufferUsage.COPY_DST |
            GPUBufferUsage.COPY_SRC |
            GPUBufferUsage.VERTEX
        );
    };
    match_panel(panel) {
        const width = panel.width;
        const height = panel.height;
        const x0 = -1;
        const y0 = -1;
        const dx = 2.0 / width;
        const dy = 2.0 / height;
        this.set_array(
            width,
            height,
            x0,
            y0,
            dx,
            dy,
        );
    };
    load_buffer(buffer) {
        buffer = buffer || this.gpu_buffer;
        const arrayBuffer = buffer.getMappedRange();
        const mappedFloats = new Float32Array(arrayBuffer);
        mappedFloats.set(this.array);
    };
    set_array(
        width,
        height,
        x0,
        y0,
        dx,
        dy,
    ) {
        this.array = new Float32Array([
            width,
            height,
            x0,
            y0,
            dx,
            dy,
        ]);
        this.buffer_size = this.array.byteLength;
    };
    reset(panel) {
        // assume connected to context
        this.match_panel(panel);
        this.push_buffer(this.array);
    };
};

export class ImagePainter {
    constructor (rgbaImage, width, height, to_canvas) {
        // automatically convert image if appropriate
        if (rgbaImage.length == width * height) {
            rgbaImage = grey_to_rgba(rgbaImage);
        }
        var that = this;
        that.to_canvas = to_canvas;
        that.context = new GPUContext.Context();
        that.rgbaImage = rgbaImage;
        that.width = width;
        that.height = height;
        this.context.connect_then_call(() => that.init_image());
    };
    init_image() {
        this.panel = new GPUColorPanel.Panel(this.width, this.height);
        this.painter = new PaintPanel(this.panel, this.to_canvas);
        this.panel.attach_to_context(this.context);
        this.painter.attach_to_context(this.context);
        this.panel.push_buffer(this.rgbaImage)
        this.painter.run();
    };
    change_image(rgbaImage) {
        // automatically convert image if appropriate
        if (rgbaImage.length == this.width * this.height) {
            rgbaImage = grey_to_rgba(rgbaImage);
        }
        this.rgbaImage = rgbaImage;
        this.panel.push_buffer(rgbaImage);
        this.painter.reset(this.panel);
        this.painter.run();
    };
}

export class PaintPanel extends GPUAction.Action {
    constructor (panel, to_canvas) {
        super();
        this.panel = panel;
        this.to_canvas = to_canvas;
        this.uniforms = new PaintPanelUniforms(panel);
    };
    attach_to_context(context) {
        this.context = context;
        const device = context.device;
        const to_canvas = this.to_canvas;
        this.webgpu_context = to_canvas.getContext("webgpu");
        const format = navigator.gpu.getPreferredCanvasFormat();
        this.webgpu_context.configure({ device, format });
        if (!this.panel.attached) {
            this.panel.attach_to_context(context);
        }
        this.uniforms.attach_to_context(context);
        const colorStride = {
            arrayStride: Uint32Array.BYTES_PER_ELEMENT,
            stepMode: 'instance',
            //stepMode: 'vertex',
            attributes: [
                {
                    shaderLocation: 0,
                    offset: 0,
                    format: 'uint32',
                },
            ],
        };
        const shaderModule = device.createShaderModule({code: painter_code});
        this.pipeline = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: shaderModule,
                entryPoint: "vertexMain",
                buffers: [colorStride],
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fragmentMain",
                targets: [{ format }],
            },
        });
        //const view = this.webgpu_context.getCurrentTexture().createView();
        //this.colorAttachments = [
        //    {
        //        view: view,
        //        loadOp: "clear",
        //        storeOp: "store",
        //    },
        //];
        const uniformsBuffer = this.uniforms.gpu_buffer;
        const uniformsLength = this.uniforms.buffer_size;
        this.uniformBindGroup = device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: uniformsBuffer,
                        offset: 0,
                        size: uniformsLength,
                    },
                },
                ],
        });
    };
    reset(panel) {
        // assume attached -- use new panel data.
        // test below is not needed?
        //const old_panel = this.panel;
        //if (old_panel.buffer_size != panel.buffer_size) {
        //    throw new Error("panel resize not yet implemented.");
        //}
        this.panel = panel;
        this.uniforms.reset(panel);
    };
    add_pass(commandEncoder) {
        const view = this.webgpu_context.getCurrentTexture().createView();
        this.colorAttachments = [
            {
                view: view,
                loadOp: "clear",
                storeOp: "store",
            },
        ];
        const colorAttachments = this.colorAttachments;
        const pipeline = this.pipeline;
        const colorbuffer = this.panel.gpu_buffer;
        const uniformBindGroup = this.uniformBindGroup;
        const passEncoder = commandEncoder.beginRenderPass({ colorAttachments });
        passEncoder.setPipeline(pipeline);
        passEncoder.setVertexBuffer(0, colorbuffer);
        passEncoder.setBindGroup(0, uniformBindGroup);
        passEncoder.draw(6, this.panel.size);
        passEncoder.end();
    };
}