
// Paint colors to rectangle
struct Out {
    @builtin(position) pos: vec4<f32>,
    @location(0) color: vec4<f32>,
}

struct uniforms_struct {
    width: f32,
    height: f32,
    x0: f32,
    y0: f32,
    dx: f32,
    dy: f32,
    //minimum: f32,
    //maximum: f32,
}

@binding(0) @group(0) var<uniform> uniforms: uniforms_struct;

@vertex fn vertexMain(
    @builtin(vertex_index) vi : u32,
    @builtin(instance_index) ii : u32,
    @location(0) color: u32,
) -> Out {
    let width = u32(uniforms.width);
    let height = u32(uniforms.height);
    let x0 = uniforms.x0;
    let y0 = uniforms.y0;
    let dw = uniforms.dx;
    let dh = uniforms.dy;
    const pos = array(
        // lower right triangle of pixel
        vec2f(0, 0), 
        vec2f(1, 0), 
        vec2f(1, 1),
        // upper left triangle of pixel
        vec2f(1, 1), 
        vec2f(0, 1), 
        vec2f(0, 0)
    );
    let row = ii / width;
    let col = ii % width;
    let offset = pos[vi];
    let x = x0 + dw * (offset.x + f32(col));
    let y = y0 + dh * (offset.y + f32(row));
    let colorout = unpack4x8unorm(color);
    return Out(vec4<f32>(x, y, 0., 1.), colorout);
}

@fragment fn fragmentMain(@location(0) color: vec4<f32>) 
-> @location(0) vec4f {
    return color;
}
