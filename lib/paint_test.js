

// test for painting a panel to a canvas.

import * as GPUContext from "./GPUContext.js";
import * as GPUColorPanel from "./GPUColorPanel.js";
import * as PaintPanel from "./PaintPanel.js";

var context, to_canvas, painter;

export function do_paint(canvas) {
    painter = new PaintPanel.ImagePainter(colors, 2, 2, canvas);
};

export function do_paint1(canvas) {
    console.log("painting panel asyncronously");
    to_canvas = canvas;
    //(async () => await do_paint_async(to_canvas) )();
    context = new GPUContext.Context();
    context.connect_then_call(do_paint_async);
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

const colors2 = new Uint32Array([
    RGBA(0, 1, 0, 1),
    RGBA(0, 0, 1, 1),
    RGBA(1, 1, 0, 1),
    RGBA(1, 0, 0, 1),
]);

var colorsA = colors;
var colorsB = colors2;
var panel;

function do_paint_async() {
    const width = 2;
    const height = 2;
    panel = new GPUColorPanel.Panel(width, height);
    painter = new PaintPanel.PaintPanel(panel, to_canvas);
    //const context = new GPUContext.Context();
    //await context.connect();
    panel.attach_to_context(context);
    painter.attach_to_context(context);
    panel.push_buffer(colorsA);
    painter.run();
};

export function change_paint1(to_canvas) {
    [colorsA, colorsB] = [colorsB, colorsA];
    panel.push_buffer(colorsA);
    painter.reset(panel);
    painter.run();
};

export function change_paint(to_canvas) {
    [colorsA, colorsB] = [colorsB, colorsA];
    painter.change_image(colorsA);
};
