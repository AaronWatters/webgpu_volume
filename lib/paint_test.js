
import * as GPUContext from "./GPUContext.js";
import * as GPUColorPanel from "./GPUColorPanel.js";
import * as PaintPanel from "./PaintPanel.js";

export function do_paint(to_canvas) {
    console.log("painting panel asyncronously");
    (async () => await do_paint_async(to_canvas) )();
};

function RGBA(r,g,b,a) {
    return (r * 255 + 256 * (g * 255 + 256 * (b * 255 + 256 * a * 255)));
};

const colors = new Uint32Array([
    RGBA(1, 0, 0, 1),
    RGBA(0, 1, 0, 1),
    RGBA(0, 0, 1, 1),
    RGBA(1, 1, 0, 1),
]);

async function do_paint_async(to_canvas) {
    const width = 2;
    const height = 2;
    const panel = new GPUColorPanel.Panel(width, height);
    const painter = new PaintPanel.PaintPanel(panel, to_canvas);
    const context = new GPUContext.Context();
    await context.connect();
    panel.attach_to_context(context);
    painter.attach_to_context(context);
    panel.push_buffer(colors);
    painter.run();
}
