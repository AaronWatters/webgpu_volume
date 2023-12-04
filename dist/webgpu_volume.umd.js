(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.webgpu_volume = {}));
})(this, function(exports2) {
  "use strict";
  class DataObject {
    constructor() {
      this.buffer_size = 0;
      this.gpu_buffer = null;
      this.usage_flags = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;
      this.attached = false;
    }
    attach_to_context(context) {
      if (this.attached) {
        throw new Error("cannot re-attach attached object.");
      }
      this.attached = true;
      this.context = context;
      const device = context.device;
      this.allocate_buffer_mapped(device);
      this.load_buffer();
      this.gpu_buffer.unmap();
      return this.gpu_buffer;
    }
    allocate_buffer_mapped(device, flags) {
      device = device || this.context.device;
      flags = flags || this.usage_flags;
      this.gpu_buffer = device.createBuffer({
        mappedAtCreation: true,
        size: this.buffer_size,
        usage: flags
      });
      return this.gpu_buffer;
    }
    load_buffer() {
      return this.gpu_buffer;
    }
    async pull_buffer() {
      const context = this.context;
      const device = context.device;
      const out_flags = GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ;
      const output_buffer = device.createBuffer({
        size: this.buffer_size,
        usage: out_flags
      });
      const commandEncoder = device.createCommandEncoder();
      commandEncoder.copyBufferToBuffer(
        this.gpu_buffer,
        0,
        output_buffer,
        0,
        this.buffer_size
        /* size */
      );
      const gpuCommands = commandEncoder.finish();
      device.queue.submit([gpuCommands]);
      await output_buffer.mapAsync(GPUMapMode.READ);
      const arrayBuffer = output_buffer.getMappedRange();
      var result2 = new ArrayBuffer(arrayBuffer.byteLength);
      new Uint8Array(result2).set(new Uint8Array(arrayBuffer));
      output_buffer.destroy();
      return result2;
    }
    async push_buffer(array) {
      const context = this.context;
      const device = context.device;
      const size = array.byteLength;
      if (size > this.buffer_size) {
        throw new Error("push buffer too large " + [size, this.buffer_size]);
      }
      const arraytype = array.constructor;
      const flags = this.usage_flags;
      const source_buffer = device.createBuffer({
        mappedAtCreation: true,
        size,
        usage: flags
      });
      const arrayBuffer = source_buffer.getMappedRange();
      const mapped = new arraytype(arrayBuffer);
      mapped.set(array);
      source_buffer.unmap();
      const commandEncoder = device.createCommandEncoder();
      commandEncoder.copyBufferToBuffer(
        source_buffer,
        0,
        this.gpu_buffer,
        0,
        size
        /* size */
      );
      const gpuCommands = commandEncoder.finish();
      device.queue.submit([gpuCommands]);
      await device.queue.onSubmittedWorkDone();
      source_buffer.destroy();
    }
    bindGroupLayout(type) {
      const context = this.context;
      const device = context.device;
      type = type || "storage";
      const binding = 0;
      const layoutEntry = {
        binding,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type
        }
      };
      const layout = device.createBindGroupLayout({
        entries: [
          layoutEntry
        ]
      });
      return layout;
    }
    bindGroup(layout, context) {
      const device = context.device;
      const bindGroup = device.createBindGroup({
        layout,
        entries: [
          this.bindGroupEntry(0)
        ]
      });
      return bindGroup;
    }
    bindGroupEntry(binding) {
      return {
        binding,
        resource: {
          buffer: this.gpu_buffer
        }
      };
    }
  }
  function v_zero(n) {
    const b = new Float64Array(n);
    return Array.from(b);
  }
  function v_add(v1, v2) {
    const N = v1.length;
    const result2 = v_zero(N);
    for (var i = 0; i < N; i++) {
      result2[i] = v1[i] + v2[i];
    }
    return result2;
  }
  function v_scale(s, v) {
    const N = v.length;
    const result2 = v_zero(N);
    for (var i = 0; i < N; i++) {
      result2[i] = s * v[i];
    }
    return result2;
  }
  function M_zero(n, m) {
    const result2 = [];
    for (var i = 0; i < n; i++) {
      result2.push(v_zero(m));
    }
    return result2;
  }
  function list_as_M(L, nrows, ncols) {
    const nitems = L.length;
    if (nitems != nrows * ncols) {
      throw new Error(`Length ${nitems} doesn't match rows ${nrows} and columns ${ncols}.`);
    }
    const result2 = [];
    var cursor = 0;
    for (var i = 0; i < nrows; i++) {
      const row = [];
      for (var j = 0; j < ncols; j++) {
        const item = L[cursor];
        row.push(item);
        cursor++;
      }
      result2.push(row);
    }
    return result2;
  }
  function M_shape(M, check) {
    const nrows = M.length;
    const ncols = M[0].length;
    if (check) {
      for (var i = 0; i < nrows; i++) {
        if (M[i].length != ncols) {
          throw new Error("inconsistent shape.");
        }
      }
    }
    return [nrows, ncols];
  }
  function eye(n) {
    const result2 = M_zero(n, n);
    for (var i = 0; i < n; i++) {
      result2[i][i] = 1;
    }
    return result2;
  }
  function M_copy(M) {
    const [nrows, ncols] = M_shape(M);
    const result2 = M_zero(nrows, ncols);
    for (var i = 0; i < nrows; i++) {
      for (var j = 0; j < ncols; j++) {
        result2[i][j] = M[i][j];
      }
    }
    return result2;
  }
  function swap_rows(M, i, j, in_place) {
    var result2 = M;
    if (!in_place) {
      result2 = M_copy(M);
    }
    const rowi = result2[i];
    result2[i] = result2[j];
    result2[j] = rowi;
    return result2;
  }
  function shelf(M1, M2) {
    const [nrows1, ncols1] = M_shape(M1);
    const [nrows2, ncols2] = M_shape(M2);
    if (nrows1 != nrows2) {
      throw new Error("bad shapes: rows must match.");
    }
    const result2 = M_zero(nrows1, ncols1 + ncols2);
    for (var row = 0; row < nrows2; row++) {
      for (var col1 = 0; col1 < ncols1; col1++) {
        result2[row][col1] = M1[row][col1];
      }
      for (var col2 = 0; col2 < ncols2; col2++) {
        result2[row][col2 + ncols1] = M2[row][col2];
      }
    }
    return result2;
  }
  function M_slice(M, minrow, mincol, maxrow, maxcol) {
    const nrows = maxrow - minrow;
    const ncols = maxcol - mincol;
    const result2 = M_zero(nrows, ncols);
    for (var i = 0; i < nrows; i++) {
      for (var j = 0; j < ncols; j++) {
        result2[i][j] = M[i + minrow][j + mincol];
      }
    }
    return result2;
  }
  function M_reduce(M) {
    var result2 = M_copy(M);
    const [nrows, ncols] = M_shape(M);
    const MN = Math.min(nrows, ncols);
    for (var col = 0; col < MN; col++) {
      var swaprow = col;
      var swapvalue = Math.abs(result2[swaprow][col]);
      for (var row = col + 1; row < MN; row++) {
        const testvalue = Math.abs(result2[row][col]);
        if (testvalue > swapvalue) {
          swapvalue = testvalue;
          swaprow = row;
        }
      }
      if (swaprow != row) {
        result2 = swap_rows(result2, col, swaprow, true);
      }
      var pivot_value = result2[col][col];
      var scale = 1 / pivot_value;
      var pivot_row = v_scale(scale, result2[col]);
      for (var row = 0; row < MN; row++) {
        const vrow = result2[row];
        if (row == col) {
          result2[row] = pivot_row;
        } else {
          const row_value = vrow[col];
          const adjust = v_scale(-row_value, pivot_row);
          const adjusted_row = v_add(vrow, adjust);
          result2[row] = adjusted_row;
        }
      }
    }
    return result2;
  }
  function M_inverse(M) {
    const dim = M.length;
    const I = eye(dim);
    const Mext = shelf(M, I);
    const red = M_reduce(Mext);
    const inv = M_slice(red, 0, dim, dim, 2 * dim);
    return inv;
  }
  function M_column_major_order(M) {
    var result2 = [];
    const [nrows, ncols] = M_shape(M);
    for (var col = 0; col < ncols; col++) {
      for (var row = 0; row < nrows; row++) {
        result2.push(M[row][col]);
      }
    }
    return result2;
  }
  const id4x4list = [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1
  ];
  class Volume extends DataObject {
    constructor(shape, data, ijk2xyz) {
      super();
      if (!ijk2xyz) {
        ijk2xyz = list_as_M(id4x4list, 4, 4);
      }
      this.set_ijk2xyz(ijk2xyz);
      this.set_shape(shape, data);
      this.shape_offset = 0;
      this.ijk2xyz_offset = this.shape_offset + this.shape.length;
      this.xyz2ijk_offset = this.ijk2xyz_offset + this.ijk2xyz.length;
      this.content_offset = this.xyz2ijk_offset + this.xyz2ijk.length;
      this.buffer_size = (this.size + this.content_offset) * Int32Array.BYTES_PER_ELEMENT;
    }
    set_shape(shape, data) {
      const [I, J, K] = shape;
      this.size = I * J * K;
      this.shape = [I, J, K, 0];
      this.data = null;
      if (data) {
        this.set_data(data);
      }
    }
    set_data(data) {
      const ln = data.length;
      if (this.size != ln) {
        throw new Error(`Data size ${ln} doesn't match ${this.size}`);
      }
      this.data = data;
    }
    set_ijk2xyz(matrix) {
      this.matrix = matrix;
      const inv = M_inverse(matrix);
      const ListMatrix = M_column_major_order(matrix);
      this.ijk2xyz = ListMatrix;
      this.xyz2ijk = M_column_major_order(inv);
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedInts = new Uint32Array(arrayBuffer);
      mappedInts.set(this.shape, this.shape_offset);
      const mappedFloats = new Float32Array(arrayBuffer);
      mappedFloats.set(this.ijk2xyz, this.ijk2xyz_offset);
      mappedFloats.set(this.xyz2ijk, this.xyz2ijk_offset);
      if (this.data) {
        mappedInts.set(this.data, this.content_offset);
      }
    }
    async pull_data() {
      const arrayBuffer = await this.pull_buffer();
      const mappedInts = new Uint32Array(arrayBuffer);
      return mappedInts.slice(this.content_offset);
    }
  }
  const GPUVolume = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Volume
  }, Symbol.toStringTag, { value: "Module" }));
  const frame_declarations = "\n// Framework for image volume data in WebGPU.\n\n// replace the following line to get other content types.\n\n//alias ContentType=u32;\n\nstruct VolumeGeometry {\n    // Volume dimensions. IJK + error indicator.\n    shape : vec4u,\n    // Convert index space to model space,\n    ijk2xyz : mat4x4f,\n    // Inverse: convert model space to index space.\n    xyz2ijk : mat4x4f\n}\n\nstruct VolumeU32 {\n    geometry : VolumeGeometry,\n    content : array<u32>\n}\n\nalias Volume=VolumeU32;\n\n/*\nstruct VolumeU32 {\n    geometry : VolumeGeometry,\n    content : array<u32>\n}\n\nstruct VolumeU8 {\n    geometry : VolumeGeometry,\n    content : array<u32>\n}\n*/\n\nstruct IndexOffset {\n    offset : u32,\n    is_valid : bool\n}\n\nstruct OffsetIndex {\n    ijk: vec3u,\n    is_valid: bool\n}\n\n// Buffer offset for volume index ijk.\nfn offset_of(ijk : vec3u, geom : ptr<function, VolumeGeometry>) -> IndexOffset {\n    var result : IndexOffset;\n    var shape = (*geom).shape.xyz;\n    result.is_valid = all(ijk < shape);\n    if (result.is_valid) {\n        let layer = ijk.x;\n        let row = ijk.y;\n        let column = ijk.z;\n        let height = shape.y;\n        let width = shape.z;\n        result.offset = (layer * height + row) * width + column;\n    }\n    return result;\n}\n\n// Convert array offset to checked ijk index\nfn index_of(offset: u32, geom : ptr<function, VolumeGeometry>) -> OffsetIndex {\n    var result : OffsetIndex;\n    result.is_valid = false;\n    var shape = (*geom).shape;\n    let depth = shape.x;\n    let height = shape.y;\n    let width = shape.z;\n    let LR = offset / width;\n    let column = offset - (LR * width);\n    let layer = LR / height;\n    let row = LR - (layer * height);\n    if (layer < depth) {\n        result.ijk.x = layer;\n        result.ijk.y = row;\n        result.ijk.z = column;\n        result.is_valid = true;\n    }\n    return result;\n}\n\n// Convert float vector indices to checked unsigned index\nfn offset_of_f(ijk_f : vec3f, geom : ptr<function, VolumeGeometry>) -> IndexOffset {\n    var shape = (*geom).shape;\n    var result : IndexOffset;\n    result.is_valid = false;\n    if (all(ijk_f >= vec3f(0.0, 0.0, 0.0)) && all(ijk_f < vec3f(shape.xyz))) {\n        result = offset_of(vec3u(ijk_f), geom);\n    }\n    return result;\n}\n\n// Convert model xyz to index space (as floats)\nfn to_index_f(xyz : vec3f, geom : ptr<function, VolumeGeometry>) -> vec3f {\n    var xyz2ijk = (*geom).xyz2ijk;\n    let xyz1 = vec4f(xyz, 1.0);\n    let ijk1 = xyz2ijk * xyz1;\n    return ijk1.xyz;\n}\n\n// Convert index floats to model space.\nfn to_model_f(ijk_f : vec3f, geom : ptr<function, VolumeGeometry>) -> vec3f {\n    var ijk2xyz = (*geom).ijk2xyz;\n    let ijk1 = vec4f(ijk_f, 1.0);\n    let xyz1 = ijk2xyz * ijk1;\n    return xyz1.xyz;\n}\n\n// Convert unsigned int indices to model space.\nfn to_model(ijk : vec3u, geom : ptr<function, VolumeGeometry>) -> vec3f {\n    return to_model_f(vec3f(ijk), geom);\n}\n\n// Convert xyz model position to checked index offset.\nfn offset_of_xyz(xyz : vec3f, geom : ptr<function, VolumeGeometry>) -> IndexOffset {\n    return offset_of_f(to_index_f(xyz, geom), geom);\n}";
  function volume_shader_code(suffix, context) {
    const gpu_shader = frame_declarations + suffix;
    return context.device.createShaderModule({ code: gpu_shader });
  }
  class Action {
    constructor() {
      this.attached = false;
    }
    attach_to_context(context) {
      this.attached = true;
      this.context = context;
    }
    run() {
      const context = this.context;
      const device = context.device;
      const commandEncoder = device.createCommandEncoder();
      this.add_pass(commandEncoder);
      const gpuCommands = commandEncoder.finish();
      device.queue.submit([gpuCommands]);
    }
    add_pass(commandEncoder) {
    }
  }
  const embed_volume = "\n// Suffix for testing frame operations.\n\n@group(0) @binding(0) var<storage, read> inputVolume : Volume;\n\n@group(1) @binding(0) var<storage, read_write> outputVolume : Volume;\n\n@compute @workgroup_size(8)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    var inputGeometry = inputVolume.geometry;\n    let inputOffset = global_id.x;\n    let inputIndex = index_of(inputOffset, &inputGeometry);\n    if (inputIndex.is_valid) {\n        var outputGeometry = outputVolume.geometry;\n        let xyz = to_model(inputIndex.ijk, &inputGeometry);\n        let out_offset = offset_of_xyz(xyz, &outputGeometry);\n        if (out_offset.is_valid) {\n            outputVolume.content[out_offset.offset] = inputVolume.content[inputOffset];\n        }\n    }\n}";
  class SampleVolume extends Action {
    constructor(shape, ijk2xyz, volumeToSample) {
      super();
      this.volumeToSample = volumeToSample;
      this.shape = shape;
      this.ijk2xyz = ijk2xyz;
      this.targetVolume = new Volume(shape, null, ijk2xyz);
    }
    attach_to_context(context) {
      const device = context.device;
      const source = this.volumeToSample;
      const target = this.targetVolume;
      this.targetVolume.attach_to_context(context);
      const shaderModule = volume_shader_code(embed_volume, context);
      const targetLayout = target.bindGroupLayout("storage");
      const sourceLayout = source.bindGroupLayout("read-only-storage");
      const layout = device.createPipelineLayout({
        bindGroupLayouts: [
          sourceLayout,
          targetLayout
        ]
      });
      this.pipeline = device.createComputePipeline({
        layout,
        compute: {
          module: shaderModule,
          entryPoint: "main"
        }
      });
      this.sourceBindGroup = source.bindGroup(sourceLayout, context);
      this.targetBindGroup = target.bindGroup(targetLayout, context);
      this.attached = true;
      this.context = context;
    }
    add_pass(commandEncoder) {
      const passEncoder = commandEncoder.beginComputePass();
      const computePipeline = this.pipeline;
      passEncoder.setPipeline(computePipeline);
      passEncoder.setBindGroup(0, this.sourceBindGroup);
      passEncoder.setBindGroup(1, this.targetBindGroup);
      const workgroupCountX = Math.ceil(this.targetVolume.size / 8);
      passEncoder.dispatchWorkgroups(workgroupCountX);
      passEncoder.end();
    }
    async pull() {
      const result2 = await this.targetVolume.pull_data();
      return result2;
    }
  }
  const SampleVolume$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    SampleVolume
  }, Symbol.toStringTag, { value: "Module" }));
  class Panel extends DataObject {
    constructor(width, height) {
      super();
      this.width = width;
      this.height = height;
      this.size = width * height;
      this.buffer_size = this.size * Int32Array.BYTES_PER_ELEMENT;
      this.usage_flags = GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;
    }
  }
  const GPUColorPanel = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Panel
  }, Symbol.toStringTag, { value: "Module" }));
  const painter_code = "\n// Paint colors to rectangle\nstruct Out {\n    @builtin(position) pos: vec4<f32>,\n    @location(0) color: vec4<f32>,\n}\n\nstruct uniforms_struct {\n    width: f32,\n    height: f32,\n    x0: f32,\n    y0: f32,\n    dx: f32,\n    dy: f32,\n    //minimum: f32,\n    //maximum: f32,\n}\n\n@binding(0) @group(0) var<uniform> uniforms: uniforms_struct;\n\n@vertex fn vertexMain(\n    @builtin(vertex_index) vi : u32,\n    @builtin(instance_index) ii : u32,\n    @location(0) color: u32,\n) -> Out {\n    let width = u32(uniforms.width);\n    let height = u32(uniforms.height);\n    let x0 = uniforms.x0;\n    let y0 = uniforms.y0;\n    let dw = uniforms.dx;\n    let dh = uniforms.dy;\n    const pos = array(\n        // lower right triangle of pixel\n        vec2f(0, 0), \n        vec2f(1, 0), \n        vec2f(1, 1),\n        // upper left triangle of pixel\n        vec2f(1, 1), \n        vec2f(0, 1), \n        vec2f(0, 0)\n    );\n    let row = ii / width;\n    let col = ii % width;\n    let offset = pos[vi];\n    let x = x0 + dw * (offset.x + f32(col));\n    let y = y0 + dh * (offset.y + f32(row));\n    let colorout = unpack4x8unorm(color);\n    return Out(vec4<f32>(x, y, 0., 1.), colorout);\n}\n\n@fragment fn fragmentMain(@location(0) color: vec4<f32>) \n-> @location(0) vec4f {\n    return color;\n}\n";
  class PaintPanelUniforms extends DataObject {
    constructor(width, height, x0, y0, dx, dy) {
      super();
      this.set_array(
        width,
        height,
        x0,
        y0,
        dx,
        dy
      );
      this.buffer_size = this.array.byteLength;
      this.usage_flags = GPUBufferUsage.STORAGE | GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX;
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedFloats = new Float32Array(arrayBuffer);
      mappedFloats.set(this.array);
    }
    set_array(width, height, x0, y0, dx, dy) {
      this.array = new Float32Array([
        width,
        height,
        x0,
        y0,
        dx,
        dy
      ]);
    }
  }
  class PaintPanel extends Action {
    constructor(panel, to_canvas) {
      super();
      this.panel = panel;
      this.to_canvas = to_canvas;
      const width = panel.width;
      const height = panel.height;
      const x0 = -1;
      const y0 = -1;
      const dx = 2 / width;
      const dy = 2 / height;
      this.uniforms = new PaintPanelUniforms(
        width,
        height,
        x0,
        y0,
        dx,
        dy
      );
    }
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
        stepMode: "instance",
        //stepMode: 'vertex',
        attributes: [
          {
            shaderLocation: 0,
            offset: 0,
            format: "uint32"
          }
        ]
      };
      const shaderModule = device.createShaderModule({ code: painter_code });
      this.pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
          module: shaderModule,
          entryPoint: "vertexMain",
          buffers: [colorStride]
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fragmentMain",
          targets: [{ format }]
        }
      });
      const view = this.webgpu_context.getCurrentTexture().createView();
      this.colorAttachments = [
        {
          view,
          loadOp: "clear",
          storeOp: "store"
        }
      ];
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
              size: uniformsLength
            }
          }
        ]
      });
    }
    add_pass(commandEncoder) {
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
    }
  }
  const PaintPanel$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    PaintPanel,
    PaintPanelUniforms
  }, Symbol.toStringTag, { value: "Module" }));
  function get_context() {
    return new Context();
  }
  class Context {
    constructor() {
      this.adapter = null;
      this.device = null;
      this.connected = false;
    }
    async connect() {
      this.adapter = await navigator.gpu.requestAdapter();
      if (this.adapter) {
        this.device = await this.adapter.requestDevice();
        if (this.device) {
          this.device.addEventListener("uncapturederror", (event) => {
            console.error("A WebGPU error was not captured:", event.error);
          });
          this.connected = true;
        }
      }
    }
    must_be_connected() {
      if (!this.connected) {
        throw new Error("context is not connected.");
      }
    }
    // Data object conveniences.
    volume(shape, data, ijk2xyz) {
      this.must_be_connected();
      result = new Volume(shape, data, ijk2xyz);
      result.attach_to_context(this);
      return result;
    }
    panel(width, height) {
      this.must_be_connected();
      result = new Panel(width, height);
      result.attach_to_context(this);
      return result;
    }
    // Action conveniences.
    sample(shape, ijk2xyz, volumeToSample) {
      this.must_be_connected();
      result = new SampleVolume(shape, ijk2xyz, volumeToSample);
      result.attach_to_context(this);
      return result;
    }
    paint(panel, to_canvas) {
      this.must_be_connected();
      result = new PaintPanel(panel, to_canvas);
      result.attach_to_context(this);
      return result;
    }
  }
  const GPUContext = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Context,
    get_context
  }, Symbol.toStringTag, { value: "Module" }));
  function do_sample() {
    console.log("computing sample asyncronously");
    (async () => await do_sample_async())();
  }
  async function do_sample_async() {
    debugger;
    const context = new Context();
    await context.connect();
    const ijk2xyz_in = [
      [1, 0, 0, 1],
      [0, 1, 0, 2],
      [0, 0, 1, 3],
      [0, 0, 0, 1]
    ];
    const shape_in = [2, 3, 2];
    const content_in = [30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const ijk2xyz_out = [
      [0, 1, 0, 1],
      [0, 0, 1, 2],
      [1, 0, 0, 3],
      [0, 0, 0, 1]
    ];
    const shape_out = [2, 2, 3];
    const content_out = [30, 2, 4, 6, 8, 10, 1, 3, 5, 7, 9, 11];
    const inputVolume = new Volume(shape_in, content_in, ijk2xyz_in);
    inputVolume.attach_to_context(context);
    const samplerAction = new SampleVolume(shape_out, ijk2xyz_out, inputVolume);
    samplerAction.attach_to_context(context);
    samplerAction.run();
    const resultArray = await samplerAction.pull();
    console.log("expected", content_out);
    console.log("got output", resultArray);
  }
  function do_paint(to_canvas) {
    console.log("painting panel asyncronously");
    (async () => await do_paint_async(to_canvas))();
  }
  function RGBA(r, g, b, a) {
    return r * 255 + 256 * (g * 255 + 256 * (b * 255 + 256 * a * 255));
  }
  const colors = new Uint32Array([
    RGBA(1, 0, 0, 1),
    RGBA(0, 1, 0, 1),
    RGBA(0, 0, 1, 1),
    RGBA(1, 1, 0, 1)
  ]);
  async function do_paint_async(to_canvas) {
    const width = 2;
    const height = 2;
    const panel = new Panel(width, height);
    const painter = new PaintPanel(panel, to_canvas);
    const context = new Context();
    await context.connect();
    panel.attach_to_context(context);
    painter.attach_to_context(context);
    panel.push_buffer(colors);
    painter.run();
  }
  const name = "webgpu_volume";
  exports2.GPUColorPanel = GPUColorPanel;
  exports2.GPUContext = GPUContext;
  exports2.GPUVolume = GPUVolume;
  exports2.PaintPanel = PaintPanel$1;
  exports2.SampleVolume = SampleVolume$1;
  exports2.do_paint = do_paint;
  exports2.do_sample = do_sample;
  exports2.name = name;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
