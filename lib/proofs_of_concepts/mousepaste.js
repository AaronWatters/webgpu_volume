
// experimental interactive mouse pasting...

import * as GPUContext from "../support/GPUContext.js";
import * as GPUColorPanel from "../data_objects/GPUColorPanel.js";
import * as PastePanel from "../actions/PastePanel.js";
import * as PaintPanel from "../actions/PaintPanel.js";

export function do_mouse_paste(to_canvas) {
    console.log("pasting asyncronously");
    //(async () => await do_mouse_paste_async(to_canvas) )();
    defer(do_mouse_paste_async(to_canvas))
};

function defer(future) {
    (async () => await future )();
}

async function do_mouse_paste_async(to_canvas) {
    debugger;
    const context = new GPUContext.Context();
    await context.connect();
    const W1 = 100;
    const W2 = 1000;
    const small = new GPUColorPanel.Panel(W1, W1);
    const big = new GPUColorPanel.Panel(W2,W2);
    const target = new GPUColorPanel.Panel(W2,W2);
    small.attach_to_context(context);
    big.attach_to_context(context);
    target.attach_to_context(context);
    const smallA = new Uint8Array(W1 * W1);
    const HW1 = W1 / 2;
    for (var i=0; i<W1; i++) {
        for (var j=0; j<W1; j++) {
            const index = i * W1 + j;
            smallA[index] = ((Math.abs(HW1 - i) + Math.abs(HW1 - j)) * 10) % 255;
        }
    }
    const smallA32 = PaintPanel.grey_to_rgba(smallA);
    await small.push_buffer(smallA32);
    const bigA = new Uint8Array(W2 * W2);
    const HW2 = W2 / 2;
    for (var i=0; i<W2; i++) {
        for (var j=0; j<W2; j++) {
            const index = i * W2 + j;
            bigA[index] = (255 - 2*(Math.abs(HW2 - i) + Math.abs(HW2 - j))) % 255;
        }
    }
    const bigA32 = PaintPanel.grey_to_rgba(bigA);
    await big.push_buffer(bigA32);
    const paste_big = new PastePanel.PastePanel(
        big,
        target,
        [0,0],
    );
    paste_big.attach_to_context(context);
    paste_big.run();
    
    const SMoffset = HW2 - HW1
    const paste_small = new PastePanel.PastePanel(
        small,
        target,
        [SMoffset, SMoffset],
    );
    paste_small.attach_to_context(context);
    paste_small.run();
    
    const painter = new PaintPanel.PaintPanel(target, to_canvas);
    painter.attach_to_context(context);
    painter.run();

    const brec = to_canvas.getBoundingClientRect();
    const info = document.getElementById("info");
    info.textContent = "initial paste done."

    const mousemove = function (e) {
        const px = e.pageX;
        const py = e.pageY;
        //div2.textContent = "page: " + [px, py];
        const cx = brec.width/2 + brec.left;
        const cy = brec.height/2 + brec.top;
        const offsetx = px - cx;
        const offsety = - (py - cy);
        //div3.textContent = "offsets: " + [offsetx, offsety];
        const dx = offsetx * 2 / brec.width;
        const dy = offsety * 2 / brec.height;
        const i = 0.5 * (W2 * (dy + 1));
        const j = 0.5 * (W2 * (dx + 1));
        const offset = [i - HW1, j - HW1];
        //paste_small.offset = offset;
        info.textContent = "offset: " + offset;
        paste_small.change_offset(offset);
        paste_big.run();
        paste_small.run();
        painter.run();
    };
    to_canvas.addEventListener("mousemove", mousemove);
};