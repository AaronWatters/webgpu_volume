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
      this.buffer_content = null;
    }
    attach_to_context(context2) {
      if (this.attached) {
        throw new Error("cannot re-attach attached object.");
      }
      this.attached = true;
      this.context = context2;
      const device = context2.device;
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
    load_buffer(buffer) {
      return this.gpu_buffer;
    }
    async pull_buffer() {
      const context2 = this.context;
      const device = context2.device;
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
      var result = new ArrayBuffer(arrayBuffer.byteLength);
      new Uint8Array(result).set(new Uint8Array(arrayBuffer));
      output_buffer.destroy();
      this.buffer_content = result;
      return result;
    }
    async push_buffer(array) {
      const context2 = this.context;
      const device = context2.device;
      var size = this.buffer_size;
      if (array) {
        size = array.byteLength;
        if (size > this.buffer_size) {
          throw new Error("push buffer too large " + [size, this.buffer_size]);
        }
      }
      const flags = this.usage_flags;
      const source_buffer = device.createBuffer({
        mappedAtCreation: true,
        size,
        usage: flags
      });
      if (array) {
        const arrayBuffer = source_buffer.getMappedRange();
        const arraytype = array.constructor;
        const mapped = new arraytype(arrayBuffer);
        mapped.set(array);
      } else {
        this.load_buffer(source_buffer);
      }
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
      const context2 = this.context;
      const device = context2.device;
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
    bindGroup(layout, context2) {
      const device = context2.device;
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
    const result = v_zero(N);
    for (var i = 0; i < N; i++) {
      result[i] = v1[i] + v2[i];
    }
    return result;
  }
  function v_minimum(v1, v2) {
    const N = v1.length;
    const result = v_zero(N);
    for (var i = 0; i < N; i++) {
      result[i] = Math.min(v1[i], v2[i]);
    }
    return result;
  }
  function v_maximum(v1, v2) {
    const N = v1.length;
    const result = v_zero(N);
    for (var i = 0; i < N; i++) {
      result[i] = Math.max(v1[i], v2[i]);
    }
    return result;
  }
  function v_scale(s, v) {
    const N = v.length;
    const result = v_zero(N);
    for (var i = 0; i < N; i++) {
      result[i] = s * v[i];
    }
    return result;
  }
  function M_zero(n, m) {
    const result = [];
    for (var i = 0; i < n; i++) {
      result.push(v_zero(m));
    }
    return result;
  }
  function affine3d(rotation3x3, translationv3) {
    const result = eye(4);
    if (rotation3x3) {
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
          result[i][j] = rotation3x3[i][j];
        }
      }
    }
    if (translationv3) {
      for (var i = 0; i < 3; i++) {
        result[i][3] = translationv3[i];
      }
    }
    return result;
  }
  function apply_affine3d(affine3d2, vector3d) {
    const v4 = vector3d.slice();
    v4.push(1);
    const v4transformed = Mv_product(affine3d2, v4);
    const v3transformed = v4transformed.slice(0, 3);
    return v3transformed;
  }
  function list_as_M(L, nrows, ncols) {
    const nitems = L.length;
    if (nitems != nrows * ncols) {
      throw new Error(`Length ${nitems} doesn't match rows ${nrows} and columns ${ncols}.`);
    }
    const result = [];
    var cursor = 0;
    for (var i = 0; i < nrows; i++) {
      const row = [];
      for (var j = 0; j < ncols; j++) {
        const item = L[cursor];
        row.push(item);
        cursor++;
      }
      result.push(row);
    }
    return result;
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
    const result = M_zero(n, n);
    for (var i = 0; i < n; i++) {
      result[i][i] = 1;
    }
    return result;
  }
  function Mv_product(M, v) {
    const [nrows, ncols] = M_shape(M);
    var result = v_zero(nrows);
    for (var i = 0; i < nrows; i++) {
      var value = 0;
      for (var j = 0; j < ncols; j++) {
        value += M[i][j] * v[j];
      }
      result[i] = value;
    }
    return result;
  }
  function MM_product(M1, M2) {
    const [nrows1, ncols1] = M_shape(M1);
    const [nrows2, ncols2] = M_shape(M2);
    if (ncols1 != nrows2) {
      throw new Error("incompatible matrices.");
    }
    var result = M_zero(nrows1, ncols2);
    for (var i = 0; i < nrows1; i++) {
      for (var j = 0; j < ncols2; j++) {
        var rij = 0;
        for (var k = 0; k < nrows2; k++) {
          rij += M1[i][k] * M2[k][j];
        }
        result[i][j] = rij;
      }
    }
    return result;
  }
  function M_copy(M) {
    const [nrows, ncols] = M_shape(M);
    const result = M_zero(nrows, ncols);
    for (var i = 0; i < nrows; i++) {
      for (var j = 0; j < ncols; j++) {
        result[i][j] = M[i][j];
      }
    }
    return result;
  }
  function swap_rows(M, i, j, in_place) {
    var result = M;
    if (!in_place) {
      result = M_copy(M);
    }
    const rowi = result[i];
    result[i] = result[j];
    result[j] = rowi;
    return result;
  }
  function shelf(M1, M2) {
    const [nrows1, ncols1] = M_shape(M1);
    const [nrows2, ncols2] = M_shape(M2);
    if (nrows1 != nrows2) {
      throw new Error("bad shapes: rows must match.");
    }
    const result = M_zero(nrows1, ncols1 + ncols2);
    for (var row = 0; row < nrows2; row++) {
      for (var col1 = 0; col1 < ncols1; col1++) {
        result[row][col1] = M1[row][col1];
      }
      for (var col2 = 0; col2 < ncols2; col2++) {
        result[row][col2 + ncols1] = M2[row][col2];
      }
    }
    return result;
  }
  function M_slice(M, minrow, mincol, maxrow, maxcol) {
    const nrows = maxrow - minrow;
    const ncols = maxcol - mincol;
    const result = M_zero(nrows, ncols);
    for (var i = 0; i < nrows; i++) {
      for (var j = 0; j < ncols; j++) {
        result[i][j] = M[i + minrow][j + mincol];
      }
    }
    return result;
  }
  function M_reduce(M) {
    var result = M_copy(M);
    const [nrows, ncols] = M_shape(M);
    const MN = Math.min(nrows, ncols);
    for (var col = 0; col < MN; col++) {
      var swaprow = col;
      var swapvalue = Math.abs(result[swaprow][col]);
      for (var row = col + 1; row < MN; row++) {
        const testvalue = Math.abs(result[row][col]);
        if (testvalue > swapvalue) {
          swapvalue = testvalue;
          swaprow = row;
        }
      }
      if (swaprow != row) {
        result = swap_rows(result, col, swaprow, true);
      }
      var pivot_value = result[col][col];
      var scale = 1 / pivot_value;
      var pivot_row = v_scale(scale, result[col]);
      for (var row = 0; row < MN; row++) {
        const vrow = result[row];
        if (row == col) {
          result[row] = pivot_row;
        } else {
          const row_value = vrow[col];
          const adjust = v_scale(-row_value, pivot_row);
          const adjusted_row = v_add(vrow, adjust);
          result[row] = adjusted_row;
        }
      }
    }
    return result;
  }
  function M_inverse(M) {
    const dim = M.length;
    const I = eye(dim);
    const Mext = shelf(M, I);
    const red = M_reduce(Mext);
    const inv = M_slice(red, 0, dim, dim, 2 * dim);
    return inv;
  }
  function M_roll(roll) {
    var cr = Math.cos(roll);
    var sr = Math.sin(roll);
    var rollM = [
      [cr, -sr, 0],
      [sr, cr, 0],
      [0, 0, 1]
    ];
    return rollM;
  }
  function M_pitch(pitch) {
    var cp = Math.cos(pitch);
    var sp = Math.sin(pitch);
    var pitchM = [
      [cp, 0, sp],
      [0, 1, 0],
      [-sp, 0, cp]
    ];
    return pitchM;
  }
  function M_yaw(yaw) {
    var cy = Math.cos(yaw);
    var sy = Math.sin(yaw);
    var yawM = [
      [1, 0, 0],
      [0, cy, sy],
      [0, -sy, cy]
    ];
    return yawM;
  }
  function v_dot(v1, v2) {
    const n = v1.length;
    var result = 0;
    for (var i = 0; i < n; i++) {
      result += v1[i] * v2[i];
    }
    return result;
  }
  function M_column_major_order(M) {
    var result = [];
    const [nrows, ncols] = M_shape(M);
    for (var col = 0; col < ncols; col++) {
      for (var row = 0; row < nrows; row++) {
        result.push(M[row][col]);
      }
    }
    return result;
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
    constructor(shape, data, ijk2xyz, data_format) {
      super();
      data_format = data_format || Uint32Array;
      this.data_format = data_format;
      if (!ijk2xyz) {
        ijk2xyz = list_as_M(id4x4list, 4, 4);
      }
      this.set_ijk2xyz(ijk2xyz);
      this.data = null;
      this.min_value = null;
      this.max_value = null;
      this.set_shape(shape, data);
      this.shape_offset = 0;
      this.ijk2xyz_offset = this.shape_offset + this.shape.length;
      this.xyz2ijk_offset = this.ijk2xyz_offset + this.ijk2xyz.length;
      this.content_offset = this.xyz2ijk_offset + this.xyz2ijk.length;
      this.buffer_size = (this.size + this.content_offset) * Int32Array.BYTES_PER_ELEMENT;
    }
    same_geometry(context2) {
      context2 = context2 || this.context;
      const result = new Volume(this.shape.slice(0, 3), null, this.matrix, this.data_format);
      result.attach_to_context(context2);
      return result;
    }
    max_extent() {
      const origin = apply_affine3d(this.matrix, [0, 0, 0]);
      const corner = apply_affine3d(this.matrix, this.shape);
      const arrow = v_add(v_scale(-1, origin), corner);
      return Math.sqrt(v_dot(arrow, arrow));
    }
    projected_range(projection, inverted) {
      var M = projection;
      if (inverted) {
        M = M_inverse(projection);
      }
      const combined = MM_product(M, this.matrix);
      const [I, J, K, _d] = this.shape;
      var max = null;
      var min = null;
      for (var ii of [0, I]) {
        for (var jj of [0, J]) {
          for (var kk of [0, K]) {
            const corner = [ii, jj, kk, 1];
            const pcorner = Mv_product(combined, corner);
            max = max ? v_maximum(max, pcorner) : pcorner;
            min = min ? v_minimum(min, pcorner) : pcorner;
          }
        }
      }
      return { min, max };
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
      this.data = new this.data_format(data);
      var min_value = this.data[0];
      var max_value = min_value;
      for (var v of this.data) {
        min_value = Math.min(v, min_value);
        max_value = Math.max(v, max_value);
      }
      this.min_value = min_value;
      this.max_value = max_value;
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
        const mappedData = new this.data_format(arrayBuffer);
        mappedData.set(this.data, this.content_offset);
      }
    }
    async pull_data() {
      const arrayBuffer = await this.pull_buffer();
      const mappedInts = new Uint32Array(arrayBuffer);
      this.data = mappedInts.slice(this.content_offset);
      return this.data;
    }
  }
  const GPUVolume = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Volume
  }, Symbol.toStringTag, { value: "Module" }));
  const volume_frame = "\n// Framework for image volume data in WebGPU.\n\n\nstruct VolumeGeometry {\n    // Volume dimensions. IJK + error indicator.\n    shape : vec4u,\n    // Convert index space to model space,\n    ijk2xyz : mat4x4f,\n    // Inverse: convert model space to index space.\n    xyz2ijk : mat4x4f\n}\n\nstruct VolumeU32 {\n    geometry : VolumeGeometry,\n    content : array<u32>\n}\n\nalias Volume = VolumeU32;\n\nstruct IndexOffset {\n    offset : u32,\n    is_valid : bool\n}\n\nstruct OffsetIndex {\n    ijk: vec3u,\n    is_valid: bool\n}\n\n// Buffer offset for volume index ijk.\nfn offset_of(ijk : vec3u, geom : ptr<function, VolumeGeometry>) -> IndexOffset {\n    var result : IndexOffset;\n    var shape = (*geom).shape.xyz;\n    //result.is_valid = all(ijk.zxy < shape);\n    result.is_valid = all(ijk.xyz < shape);\n    if (result.is_valid) {\n        let layer = ijk.x;\n        let row = ijk.y;\n        let column = ijk.z;\n        let height = shape.y;\n        let width = shape.z;\n        result.offset = (layer * height + row) * width + column;\n    }\n    return result;\n}\n\n// Convert array offset to checked ijk index\nfn index_of(offset: u32, geom : ptr<function, VolumeGeometry>) -> OffsetIndex {\n    var result : OffsetIndex;\n    result.is_valid = false;\n    var shape = (*geom).shape;\n    let depth = shape.x;\n    let height = shape.y;\n    let width = shape.z;\n    let LR = offset / width;\n    let column = offset - (LR * width);\n    let layer = LR / height;\n    let row = LR - (layer * height);\n    if (layer < depth) {\n        result.ijk.x = layer;\n        result.ijk.y = row;\n        result.ijk.z = column;\n        result.is_valid = true;\n    }\n    return result;\n}\n\n// Convert float vector indices to checked unsigned index\nfn offset_of_f(ijk_f : vec3f, geom : ptr<function, VolumeGeometry>) -> IndexOffset {\n    var shape = (*geom).shape;\n    var result : IndexOffset;\n    result.is_valid = false;\n    if (all(ijk_f >= vec3f(0.0, 0.0, 0.0)) && all(ijk_f < vec3f(shape.xyz))) {\n        result = offset_of(vec3u(ijk_f), geom);\n    }\n    return result;\n}\n\n// Convert model xyz to index space (as floats)\nfn to_index_f(xyz : vec3f, geom : ptr<function, VolumeGeometry>) -> vec3f {\n    var xyz2ijk = (*geom).xyz2ijk;\n    let xyz1 = vec4f(xyz, 1.0);\n    let ijk1 = xyz2ijk * xyz1;\n    return ijk1.xyz;\n}\n\n// Convert index floats to model space.\nfn to_model_f(ijk_f : vec3f, geom : ptr<function, VolumeGeometry>) -> vec3f {\n    var ijk2xyz = (*geom).ijk2xyz;\n    let ijk1 = vec4f(ijk_f, 1.0);\n    let xyz1 = ijk2xyz * ijk1;\n    return xyz1.xyz;\n}\n\n// Convert unsigned int indices to model space.\nfn to_model(ijk : vec3u, geom : ptr<function, VolumeGeometry>) -> vec3f {\n    return to_model_f(vec3f(ijk), geom);\n}\n\n// Convert xyz model position to checked index offset.\nfn offset_of_xyz(xyz : vec3f, geom : ptr<function, VolumeGeometry>) -> IndexOffset {\n    return offset_of_f(to_index_f(xyz, geom), geom);\n}";
  const depth_buffer$1 = '\n// Framework for 4 byte depth buffer\n\n// keep everything f32 for simplicity of transfers\n\nstruct depthShape {\n    height: f32,\n    width: f32,\n    // "null" marker depth and value.\n    default_depth: f32,\n    default_value: f32,\n}\n\nfn is_default(value: f32, depth:f32, for_shape: depthShape) -> bool {\n    return (for_shape.default_depth == depth) && (for_shape.default_value == value);\n}\n\nstruct DepthBufferF32 {\n    // height/width followed by default depth and default value.\n    shape: depthShape,\n    // content data followed by depth as a single array\n    data_and_depth: array<f32>,\n}\n\nstruct BufferLocation {\n    data_offset: u32,\n    depth_offset: u32,\n    ij: vec2i,\n    valid: bool,\n}\n\n// 2d u32 indices to array locations\nfn depth_buffer_location_of(ij: vec2i, shape: depthShape) -> BufferLocation {\n    var result : BufferLocation;\n    result.ij = ij;\n    let width = u32(shape.width);\n    let height = u32(shape.height);\n    let row = ij.x;\n    let col = ij.y;\n    let ucol = u32(col);\n    let urow = u32(row);\n    result.valid = ((row >= 0) && (col >= 0) && (urow < height) && (ucol < width));\n    if (result.valid) {\n        result.data_offset = urow * width + ucol;\n        result.depth_offset = height * width + result.data_offset;\n    }\n    return result;\n}\n\n// 2d f32 indices to array locations\nfn f_depth_buffer_location_of(xy: vec2f, shape: depthShape) -> BufferLocation {\n    return depth_buffer_location_of(vec2i(xy.xy), shape);\n}\n\nfn depth_buffer_indices(data_offset: u32, shape: depthShape) -> BufferLocation {\n    var result : BufferLocation;\n    let width = u32(shape.width);\n    let height = u32(shape.height);\n    let size = width * height;\n    result.valid = (data_offset < size);\n    if (result.valid) {\n        result.data_offset = data_offset;\n        result.depth_offset = size + data_offset;\n        let row = data_offset / width;\n        let col = data_offset - (row * width);\n        result.ij = vec2i(i32(row), i32(col));\n    }\n    return result;\n}';
  function volume_shader_code(suffix, context2) {
    const gpu_shader = volume_frame + suffix;
    return context2.device.createShaderModule({ code: gpu_shader });
  }
  function depth_shader_code(suffix, context2) {
    const gpu_shader = depth_buffer$1 + suffix;
    return context2.device.createShaderModule({ code: gpu_shader });
  }
  class Action {
    constructor() {
      this.attached = false;
    }
    attach_to_context(context2) {
      this.attached = true;
      this.context = context2;
    }
    run() {
      const context2 = this.context;
      const device = context2.device;
      const commandEncoder = device.createCommandEncoder();
      this.add_pass(commandEncoder);
      const gpuCommands = commandEncoder.finish();
      device.queue.submit([gpuCommands]);
    }
    add_pass(commandEncoder) {
    }
  }
  class ActionSequence extends Action {
    // xxx could add bookkeeping so only actions with updated inputs execute.
    constructor(actions) {
      super();
      this.actions = actions;
    }
    // attach_to_context not needed, assume actions already attached.
    add_pass(commandEncoder) {
      for (var action of this.actions) {
        action.add_pass(commandEncoder);
      }
    }
  }
  const embed_volume = "\n// Suffix for testing frame operations.\n\n@group(0) @binding(0) var<storage, read> inputVolume : Volume;\n\n@group(1) @binding(0) var<storage, read_write> outputVolume : Volume;\n\n// xxxx add additional transform matrix\n\n@compute @workgroup_size(8)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    var inputGeometry = inputVolume.geometry;\n    let inputOffset = global_id.x;\n    let inputIndex = index_of(inputOffset, &inputGeometry);\n    if (inputIndex.is_valid) {\n        var outputGeometry = outputVolume.geometry;\n        let xyz = to_model(inputIndex.ijk, &inputGeometry);\n        let out_offset = offset_of_xyz(xyz, &outputGeometry);\n        if (out_offset.is_valid) {\n            outputVolume.content[out_offset.offset] = inputVolume.content[inputOffset];\n        }\n    }\n}";
  class SampleVolume extends Action {
    constructor(shape, ijk2xyz, volumeToSample) {
      super();
      this.volumeToSample = volumeToSample;
      this.shape = shape;
      this.ijk2xyz = ijk2xyz;
      this.targetVolume = new Volume(shape, null, ijk2xyz);
    }
    attach_to_context(context2) {
      const device = context2.device;
      const source = this.volumeToSample;
      const target = this.targetVolume;
      this.targetVolume.attach_to_context(context2);
      const shaderModule = volume_shader_code(embed_volume, context2);
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
      this.sourceBindGroup = source.bindGroup(sourceLayout, context2);
      this.targetBindGroup = target.bindGroup(targetLayout, context2);
      this.attached = true;
      this.context = context2;
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
      const result = await this.targetVolume.pull_data();
      return result;
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
    resize(width, height) {
      const size = width * height;
      const buffer_size = size * Int32Array.BYTES_PER_ELEMENT;
      if (buffer_size > this.buffer_size) {
        throw new Error("buffer resize not yet implemented");
      }
      this.width = width;
      this.height = height;
      this.size = size;
    }
  }
  const GPUColorPanel = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Panel
  }, Symbol.toStringTag, { value: "Module" }));
  const painter_code = "\n// Paint colors to rectangle\nstruct Out {\n    @builtin(position) pos: vec4<f32>,\n    @location(0) color: vec4<f32>,\n}\n\nstruct uniforms_struct {\n    width: f32,\n    height: f32,\n    x0: f32,\n    y0: f32,\n    dx: f32,\n    dy: f32,\n    //minimum: f32,\n    //maximum: f32,\n}\n\n@binding(0) @group(0) var<uniform> uniforms: uniforms_struct;\n\n@vertex fn vertexMain(\n    @builtin(vertex_index) vi : u32,\n    @builtin(instance_index) ii : u32,\n    @location(0) color: u32,\n) -> Out {\n    let width = u32(uniforms.width);\n    let height = u32(uniforms.height);\n    let x0 = uniforms.x0;\n    let y0 = uniforms.y0;\n    let dw = uniforms.dx;\n    let dh = uniforms.dy;\n    const pos = array(\n        // lower right triangle of pixel\n        vec2f(0, 0), \n        vec2f(1, 0), \n        vec2f(1, 1),\n        // upper left triangle of pixel\n        vec2f(1, 1), \n        vec2f(0, 1), \n        vec2f(0, 0)\n    );\n    let row = ii / width;\n    let col = ii % width;\n    let offset = pos[vi];\n    let x = x0 + dw * (offset.x + f32(col));\n    let y = y0 + dh * (offset.y + f32(row));\n    let colorout = unpack4x8unorm(color);\n    return Out(vec4<f32>(x, y, 0., 1.), colorout);\n}\n\n@fragment fn fragmentMain(@location(0) color: vec4<f32>) \n-> @location(0) vec4f {\n    return color;\n}\n";
  function grey_to_rgba(grey_bytes) {
    console.log("converting grey to rgba");
    const ln = grey_bytes.length;
    const rgbaImage = new Uint8Array(ln * 4);
    for (var i = 0; i < ln; i++) {
      const grey = grey_bytes[i];
      const offset = i * 4;
      rgbaImage[offset] = grey;
      rgbaImage[offset + 1] = grey;
      rgbaImage[offset + 2] = grey;
      rgbaImage[offset + 3] = 255;
    }
    return rgbaImage;
  }
  class PaintPanelUniforms extends DataObject {
    constructor(panel2) {
      super();
      this.match_panel(panel2);
      this.usage_flags = GPUBufferUsage.STORAGE | GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.VERTEX;
    }
    match_panel(panel2) {
      const width = panel2.width;
      const height = panel2.height;
      const x0 = -1;
      const y0 = -1;
      const dx = 2 / width;
      const dy = 2 / height;
      this.set_array(
        width,
        height,
        x0,
        y0,
        dx,
        dy
      );
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
      this.buffer_size = this.array.byteLength;
    }
    reset(panel2) {
      this.match_panel(panel2);
      this.push_buffer(this.array);
    }
  }
  class ImagePainter {
    constructor(rgbaImage, width, height, to_canvas) {
      if (rgbaImage.byteLength == width * height) {
        rgbaImage = grey_to_rgba(rgbaImage);
      }
      var that = this;
      that.to_canvas = to_canvas;
      that.context = new Context();
      that.rgbaImage = rgbaImage;
      that.width = width;
      that.height = height;
      this.context.connect_then_call(() => that.init_image());
    }
    init_image() {
      this.panel = new Panel(this.width, this.height);
      this.painter = new PaintPanel(this.panel, this.to_canvas);
      this.panel.attach_to_context(this.context);
      this.painter.attach_to_context(this.context);
      this.panel.push_buffer(this.rgbaImage);
      this.painter.run();
    }
    change_image(rgbaImage) {
      if (rgbaImage.byteLength == this.width * this.height) {
        rgbaImage = grey_to_rgba(rgbaImage);
      }
      this.rgbaImage = rgbaImage;
      this.panel.push_buffer(rgbaImage);
      this.painter.reset(this.panel);
      this.painter.run();
    }
  }
  class PaintPanel extends Action {
    constructor(panel2, to_canvas) {
      super();
      this.panel = panel2;
      this.to_canvas = to_canvas;
      this.uniforms = new PaintPanelUniforms(panel2);
    }
    attach_to_context(context2) {
      this.context = context2;
      const device = context2.device;
      const to_canvas = this.to_canvas;
      this.webgpu_context = to_canvas.getContext("webgpu");
      const format = navigator.gpu.getPreferredCanvasFormat();
      this.webgpu_context.configure({ device, format });
      if (!this.panel.attached) {
        this.panel.attach_to_context(context2);
      }
      this.uniforms.attach_to_context(context2);
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
    reset(panel2) {
      this.panel = panel2;
      this.uniforms.reset(panel2);
    }
    add_pass(commandEncoder) {
      const view = this.webgpu_context.getCurrentTexture().createView();
      this.colorAttachments = [
        {
          view,
          loadOp: "clear",
          storeOp: "store"
        }
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
    }
  }
  const PaintPanel$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    ImagePainter,
    PaintPanel,
    PaintPanelUniforms,
    grey_to_rgba
  }, Symbol.toStringTag, { value: "Module" }));
  class UpdateAction extends Action {
    get_shader_module(context2) {
      throw new Error("get_shader_module must be define in subclass.");
    }
    attach_to_context(context2) {
      this.context = context2;
      const device = context2.device;
      const source = this.source;
      const target = this.target;
      const parms = this.parameters;
      parms.attach_to_context(context2);
      const shaderModule = this.get_shader_module(context2);
      const targetLayout = target.bindGroupLayout("storage");
      const sourceLayout = source.bindGroupLayout("read-only-storage");
      const parmsLayout = parms.bindGroupLayout("read-only-storage");
      const layout = device.createPipelineLayout({
        bindGroupLayouts: [
          sourceLayout,
          targetLayout,
          parmsLayout
        ]
      });
      this.pipeline = device.createComputePipeline({
        layout,
        compute: {
          module: shaderModule,
          entryPoint: "main"
        }
      });
      this.sourceBindGroup = source.bindGroup(sourceLayout, context2);
      this.targetBindGroup = target.bindGroup(targetLayout, context2);
      this.parmsBindGroup = parms.bindGroup(parmsLayout, context2);
      this.attached = true;
    }
    getWorkgroupCounts() {
      return [Math.ceil(this.target.size / 8), 1, 1];
    }
    add_pass(commandEncoder) {
      const passEncoder = commandEncoder.beginComputePass();
      const computePipeline = this.pipeline;
      passEncoder.setPipeline(computePipeline);
      passEncoder.setBindGroup(0, this.sourceBindGroup);
      passEncoder.setBindGroup(1, this.targetBindGroup);
      passEncoder.setBindGroup(2, this.parmsBindGroup);
      const [cx, cy, cz] = this.getWorkgroupCounts();
      passEncoder.dispatchWorkgroups(cx, cy, cz);
      passEncoder.end();
    }
  }
  const epsilon = 1e-15;
  function intersection_buffer(orbitMatrix, volume2) {
    const result = new Float32Array(3 * 4 + 4);
    const volumeM = volume2.matrix;
    const volumeInv = M_inverse(volumeM);
    const shape = volume2.shape;
    const orbit2volume = MM_product(volumeInv, orbitMatrix);
    var cursor = 0;
    for (var dimension = 0; dimension < 3; dimension++) {
      const m = orbit2volume[dimension];
      const denom = m[2];
      var descriptor;
      if (Math.abs(denom) < epsilon) {
        descriptor = [0, 0, 1111, -1111];
      } else {
        const low_index = 0;
        const high_index = shape[dimension];
        const c0 = -m[0] / denom;
        const c1 = -m[1] / denom;
        var low = (low_index - m[3]) / denom;
        var high = (high_index - m[3]) / denom;
        if (low > high) {
          [low, high] = [high, low];
        }
        descriptor = [c0, c1, low, high];
      }
      result.set(descriptor, cursor);
      cursor += 4;
    }
    const volume0 = [0, 0, 0, 1];
    const volume2orbit = M_inverse(orbit2volume);
    const orbit0 = Mv_product(volume2orbit, volume0);
    const orbit0m = v_scale(-1, orbit0);
    function probe_it(volume1) {
      const orbit1 = Mv_product(volume2orbit, volume1);
      const orbit_probe_v = v_add(orbit0m, orbit1);
      return Math.abs(orbit_probe_v[2]);
    }
    var probe = Math.max(
      probe_it([1, 0, 0, 1]),
      probe_it([0, 0, 1, 1]),
      probe_it([0, 1, 0, 1])
    );
    result[cursor] = probe;
    return result;
  }
  class Project extends UpdateAction {
    constructor(source, target) {
      super();
      this.source = source;
      this.target = target;
    }
    change_matrix(ijk2xyz) {
      this.parameters.set_matrix(ijk2xyz);
      this.parameters.push_buffer();
    }
    getWorkgroupCounts() {
      return [Math.ceil(this.target.size / 256), 1, 1];
    }
  }
  const volume_intercepts = "\n// Logic for loop boundaries in volume scans.\n// This prefix assumes volume_frame.wgsl and depth_buffer.wgsl.\n\n// v2 planar xyz intersection parameters:\n// v2 ranges from c0 * v0 + c1 * v1 + low to ... + high\nstruct Intersection2 {\n    c0: f32,\n    c1: f32,\n    low: f32,\n    high: f32,\n}\n\n// Intersection parameters for box borders\nalias Intersections3 = array<Intersection2, 3>;\n\n// Intersection end points\nstruct Endpoints2 {\n    offset: vec2f,\n    is_valid: bool,\n}\n\nfn scan_endpoints(\n    offset: vec2i, \n    int3: Intersections3, \n    geom_ptr: ptr<function, VolumeGeometry>, \n    ijk2xyz: mat4x4f,  // orbit to model affine matrix\n) -> Endpoints2 {\n    var initialized = false;\n    var result: Endpoints2;\n    result.is_valid = false;\n    for (var index=0; index<3; index++) {\n        let intersect = int3[index];\n        let ep = intercepts2(offset, intersect);\n        if (ep.is_valid) {\n            if (!initialized) {\n                result = ep;\n                initialized = true;\n            } else {\n                result = intersect2(result, ep);\n            }\n        }\n    }\n    if (result.is_valid) {\n        // verify that midpoint lies inside geometry\n        let low = result.offset[0];\n        let high = result.offset[1];\n        let mid = (low + high) / 2;\n        let mid_probe = probe_point(vec2f(offset), mid, ijk2xyz);\n        //let low_probe = probe_point(offset, low, ijk2xyz);\n        //let high_probe = probe_point(offset, high, ijk2xyz);\n        //let mid_probe = 0.5 * (low_probe + high_probe);\n        //let mid_probe = low_probe; // debugging\n        let mid_offset = offset_of_xyz(mid_probe, geom_ptr);\n        result.is_valid = mid_offset.is_valid;\n        // DEBUGGING\n        result.is_valid = true;\n    }\n    return result;\n}\n\nfn probe_point(offset: vec2f, depth: f32, ijk2xyz: mat4x4f) -> vec3f {\n    let ijkw = vec4f(vec2f(offset), f32(depth), 1.0);\n    let xyzw = ijk2xyz * ijkw;\n    return xyzw.xyz;\n}\n\nfn intercepts2(offset: vec2i, intc: Intersection2) -> Endpoints2 {\n    var result: Endpoints2;\n    let x = (intc.c0 * f32(offset[0])) + (intc.c1 * f32(offset[1]));\n    let high = floor(x + intc.high);\n    let low = ceil(x + intc.low);\n    result.is_valid = (high > low);\n    result.offset = vec2f(low, high);\n    return result;\n}\n\nfn intersect2(e1: Endpoints2, e2: Endpoints2) -> Endpoints2 {\n    var result = e1;\n    if (!e1.is_valid) {\n        result = e2;\n    } else {\n        if (e2.is_valid) {\n            let low = max(e1.offset[0], e2.offset[0]);\n            let high = min(e1.offset[1], e2.offset[1]);\n            result.offset = vec2f(low, high);\n            result.is_valid = (low <= high);\n        }\n    }\n    return result;\n}\n";
  const max_value_project = "\n// Project a volume by max value onto a depth buffer (suffix)\n// Assumes prefixes: \n//  depth_buffer.wgsl\n//  volume_frame.wgsl\n//  volume_intercept.wgsl\n\nstruct parameters {\n    ijk2xyz : mat4x4f,\n    int3: Intersections3,\n    dk: f32,  // k increment for probe\n    // 3 floats padding at end...???\n}\n\n@group(0) @binding(0) var<storage, read> inputVolume : Volume;\n\n@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    //let local_parms = parms;\n    let outputOffset = global_id.x;\n    let outputShape = outputDB.shape;\n    let outputLocation = depth_buffer_indices(outputOffset, outputShape);\n    // k increment length in xyz space\n    //let dk = 1.0f;  // fix this! -- k increment length in xyz space\n    let dk = parms.dk;\n    var initial_value_found = false;\n    if (outputLocation.valid) {\n        var inputGeometry = inputVolume.geometry;\n        var current_value = outputShape.default_value;\n        var current_depth = outputShape.default_depth;\n        let offsetij = vec2i(outputLocation.ij);\n        let ijk2xyz = parms.ijk2xyz;\n        var end_points = scan_endpoints(\n            offsetij,\n            parms.int3,\n            &inputGeometry,\n            ijk2xyz,\n        );\n        if (end_points.is_valid) {\n            let offsetij_f = vec2f(offsetij);\n            for (var depth = end_points.offset[0]; depth < end_points.offset[1]; depth += dk) {\n                //let ijkw = vec4i(offsetij, depth, 1);\n                //let f_ijk = vec4f(ijkw);\n                //let xyz_probe = parms.ijk2xyz * f_ijk;\n                let xyz_probe = probe_point(offsetij_f, depth, ijk2xyz);\n                let input_offset = offset_of_xyz(xyz_probe.xyz, &inputGeometry);\n                if (input_offset.is_valid) {\n                    let valueu32 = inputVolume.content[input_offset.offset];\n                    let value = bitcast<f32>(valueu32);\n                    if ((!initial_value_found) || (value > current_value)) {\n                        current_depth = f32(depth);\n                        current_value = value;\n                        initial_value_found = true;\n                    }\n                    // debug\n                    //let t = outputOffset/2u;\n                    //if (t * 2 == outputOffset) {\n                    //    current_value = bitcast<f32>(inputVolume.content[0]);\n                    //}\n                    // end debug\n                }\n            }\n        }\n        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;\n        outputDB.data_and_depth[outputLocation.data_offset] = current_value;\n    }\n}\n";
  class MaxProjectionParameters extends DataObject {
    constructor(ijk2xyz, volume2, depthBuffer) {
      super();
      this.volume = volume2;
      this.depthBuffer = depthBuffer;
      this.buffer_size = (4 * 4 + 4 * 3 + 4) * Int32Array.BYTES_PER_ELEMENT;
      this.set_matrix(ijk2xyz);
    }
    set_matrix(ijk2xyz) {
      this.ijk2xyz = M_column_major_order(ijk2xyz);
      this.intersections = intersection_buffer(ijk2xyz, this.volume);
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedFloats = new Float32Array(arrayBuffer);
      mappedFloats.set(this.ijk2xyz, 0);
      mappedFloats.set(this.intersections, 4 * 4);
    }
  }
  class MaxProject extends Project {
    constructor(fromVolume, toDepthBuffer, ijk2xyz) {
      super(fromVolume, toDepthBuffer);
      this.parameters = new MaxProjectionParameters(ijk2xyz, fromVolume, toDepthBuffer);
    }
    //change_matrix(ijk2xyz) {
    //    this.parameters.set_matrix(ijk2xyz);
    //    this.parameters.push_buffer();
    //};
    get_shader_module(context2) {
      const gpu_shader = volume_frame + depth_buffer$1 + volume_intercepts + max_value_project;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    //getWorkgroupCounts() {
    //    return [Math.ceil(this.target.size / 256), 1, 1];
    //};
  }
  class CopyData extends Action {
    constructor(fromDataObject, from_offset, toDataObject, to_offset, length) {
      super();
      this.fromDataObject = fromDataObject;
      this.toDataObject = toDataObject;
      this.from_offset = from_offset;
      this.to_offset = to_offset;
      this.length = length;
    }
    add_pass(commandEncoder) {
      const bpe = Int32Array.BYTES_PER_ELEMENT;
      commandEncoder.copyBufferToBuffer(
        this.fromDataObject.gpu_buffer,
        this.from_offset * bpe,
        this.toDataObject.gpu_buffer,
        this.to_offset * bpe,
        this.length * bpe
      );
    }
  }
  class DepthBuffer extends DataObject {
    constructor(shape, default_depth, default_value, data, depths, data_format) {
      super();
      [this.height, this.width] = shape;
      this.default_depth = default_depth;
      this.default_value = default_value;
      this.data_format = data_format || Uint32Array;
      this.data = null;
      this.depths = null;
      this.size = this.width * this.height;
      if (data) {
        this.set_data(data);
      }
      if (depths) {
        this.set_depths(depths);
      }
      this.content_offset = 4;
      this.depth_offset = this.size + this.content_offset;
      this.buffer_size = (this.size * 2 + this.content_offset) * Int32Array.BYTES_PER_ELEMENT;
    }
    flatten_action(onto_panel, buffer_offset) {
      buffer_offset = buffer_offset || this.content_offset;
      const [w, h] = [this.width, this.height];
      const [ow, oh] = [onto_panel.width, onto_panel.height];
      if (w != ow || h != oh) {
        throw new Error("w/h must match: " + [w, h, ow, oh]);
      }
      return new CopyData(
        this,
        buffer_offset,
        onto_panel,
        0,
        this.size
        // length
      );
    }
    copy_depths_action(onto_panel) {
      return this.flatten_action(onto_panel, this.depth_offset);
    }
    set_data(data) {
      const ln = data.length;
      if (this.size != ln) {
        throw new Error(`Data size ${ln} doesn't match ${this.size}`);
      }
      this.data = data;
    }
    set_depths(data) {
      const ln = data.length;
      if (this.size != ln) {
        throw new Error(`Data size ${ln} doesn't match ${this.size}`);
      }
      this.depths = data;
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedFloats = new Float32Array(arrayBuffer);
      const shape4 = [this.height, this.width, this.default_depth, this.default_value];
      mappedFloats.set(shape4, 0);
      if (this.data) {
        const mappedData = new this.data_format(arrayBuffer);
        mappedData.set(this.data, this.content_offset);
      }
      if (this.depths) {
        mappedFloats.set(this.depths, this.depth_offset);
      }
    }
    async pull_data() {
      const arrayBuffer = await this.pull_buffer();
      const mappedData = new this.data_format(arrayBuffer);
      this.data = mappedData.slice(this.content_offset, this.depths_offset);
      const mappedFloats = new Uint32Array(arrayBuffer);
      const shape4 = mappedFloats.slice(0, 4);
      this.height = shape4[0];
      this.width = shape4[1];
      this.default_depth = shape4[2];
      this.default_value = shape4[3];
      this.depths = mappedFloats.slice(this.depth_offset, this.depth_offset + this.size);
      return this.data;
    }
  }
  const convert_gray_prefix = "\n// Prefix for converting f32 to rgba gray values.\n// Prefix for convert_buffer.wgsl\n\nstruct parameters {\n    input_start: u32,\n    output_start: u32,\n    length: u32,\n    min_value: f32,\n    max_value: f32,\n}\n\nfn new_out_value(in_value: u32, out_value: u32, parms: parameters) -> u32 {\n    let in_float = bitcast<f32>(in_value);\n    let min_value = parms.min_value;\n    let max_value = parms.max_value;\n    let in_clamp = clamp(in_float, min_value, max_value);\n    let intensity = (in_clamp - min_value) / (max_value - min_value);\n    let gray_level = u32(intensity * 255.0);\n    //let color = vec4u(gray_level, gray_level, gray_level, 255u);\n    //let result = pack4xU8(color); ???error: unresolved call target 'pack4xU8'\n    let result = gray_level + 256 * (gray_level + 256 * (gray_level + 256 * 255));\n    //let result = 255u + 256 * (gray_level + 256 * (gray_level + 256 * gray_level));\n    return result;\n}";
  const convert_buffer = "\n// Suffix for converting or combining data from one data object buffer to another.\n\n// Assume that prefix defines struct parameters with members\n//   - input_start: u32\n//   - output_start: u32\n//   - length: u32\n// as well as any other members needed for conversion.\n//\n// And fn new_out_value(in_value: u32, out_value: u32, parms: parameters) -> u32 {...}\n\n\n@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;\n\n@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    // make a copy of parms for local use...\n    let local_parms = parms;\n    let offset = global_id.x;\n    let length = parms.length;\n    if (offset < length) {\n        let input_start = parms.input_start;\n        let output_start = parms.output_start;\n        let input_value = inputBuffer[input_start + offset];\n        let output_index = output_start + offset;\n        let output_value = outputBuffer[output_index];\n        let new_output_value = new_out_value(input_value, output_value, local_parms);\n        outputBuffer[output_index] = new_output_value;\n    }\n}\n";
  class GrayParameters extends DataObject {
    constructor(input_start, output_start, length, min_value, max_value) {
      super();
      this.input_start = input_start;
      this.output_start = output_start;
      this.length = length;
      this.min_value = min_value;
      this.max_value = max_value;
      this.buffer_size = 5 * Int32Array.BYTES_PER_ELEMENT;
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedUInts = new Uint32Array(arrayBuffer);
      mappedUInts[0] = this.input_start;
      mappedUInts[1] = this.output_start;
      mappedUInts[2] = this.length;
      const mappedFloats = new Float32Array(arrayBuffer);
      mappedFloats[3] = this.min_value;
      mappedFloats[4] = this.max_value;
    }
  }
  class UpdateGray extends UpdateAction {
    constructor(from_data_object, to_data_object, from_start, to_start, length, min_value, max_value) {
      super();
      this.from_start = from_start;
      this.to_start = to_start;
      this.length = length;
      this.min_value = min_value;
      this.max_value = max_value;
      this.source = from_data_object;
      this.target = to_data_object;
    }
    attach_to_context(context2) {
      this.parameters = new GrayParameters(
        this.from_start,
        this.to_start,
        this.length,
        this.min_value,
        this.max_value
      );
      super.attach_to_context(context2);
    }
    get_shader_module(context2) {
      const gpu_shader = convert_gray_prefix + convert_buffer;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    getWorkgroupCounts() {
      return [Math.ceil(this.length / 256), 1, 1];
    }
  }
  class ToGrayPanel extends UpdateGray {
    constructor(from_panel, to_panel, min_value, max_value) {
      const size = from_panel.size;
      if (size != to_panel.size) {
        throw new Error("panel sizes must match: " + [size, to_panel.size]);
      }
      super(from_panel, to_panel, 0, 0, size, min_value, max_value);
    }
    compute_extrema() {
      const buffer_content = this.source.buffer_content;
      if (buffer_content == null) {
        throw new Error("compute_extrema requires pulled buffer content.");
      }
      const values = new Float32Array(buffer_content);
      var min = values[0];
      var max = min;
      for (var value of values) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
      this.min_value = min;
      this.max_value = max;
    }
    async pull_extrema() {
      await this.source.pull_buffer();
      this.compute_extrema();
    }
  }
  function get_context() {
    return new Context();
  }
  function alert_and_error_if_no_gpu() {
    if (!navigator.gpu || !navigator.gpu.requestAdapter) {
      alert("Cannot get WebGPU context. This browser does not have WebGPU enabled.");
      throw new Error("Can't get WebGPU context.");
    }
  }
  class Context {
    constructor() {
      alert_and_error_if_no_gpu();
      this.adapter = null;
      this.device = null;
      this.connected = false;
    }
    async connect() {
      if (this.connected) {
        return;
      }
      this.adapter = await navigator.gpu.requestAdapter();
      if (this.adapter) {
        const max_buffer = this.adapter.limits.maxStorageBufferBindingSize;
        const required_limits = {};
        required_limits.maxStorageBufferBindingSize = max_buffer;
        required_limits.maxBufferSize = max_buffer;
        this.device = await this.adapter.requestDevice({
          "requiredLimits": required_limits
        });
        if (this.device) {
          this.device.addEventListener("uncapturederror", (event) => {
            console.error("A WebGPU error was not captured:", event.error);
          });
          this.connected = true;
        } else {
          throw new Error("Could not get device from gpu adapter");
        }
      } else {
        throw new Error("Could not get gpu adapter");
      }
    }
    onSubmittedWorkDone() {
      this.must_be_connected();
      return this.device.queue.onSubmittedWorkDone();
    }
    connect_then_call(callback) {
      var that = this;
      async function go() {
        await that.connect();
        callback();
      }
      go();
    }
    must_be_connected() {
      if (!this.connected) {
        throw new Error("context is not connected.");
      }
    }
    // Data object conveniences.
    volume(shape_in2, content_in, ijk2xyz_in, Float32Array2) {
      this.must_be_connected();
      const result = new Volume(shape_in2, content_in, ijk2xyz_in, Float32Array2);
      result.attach_to_context(this);
      return result;
    }
    depth_buffer(shape, default_depth, default_value, data, depths, data_format) {
      this.must_be_connected();
      const result = new DepthBuffer(
        shape,
        default_depth,
        default_value,
        data,
        depths,
        data_format
      );
      result.attach_to_context(this);
      return result;
    }
    panel(width, height) {
      this.must_be_connected();
      const result = new Panel(width, height);
      result.attach_to_context(this);
      return result;
    }
    // Action conveniences.
    sample(shape, ijk2xyz, volumeToSample) {
      this.must_be_connected();
      const result = new SampleVolume(shape, ijk2xyz, volumeToSample);
      result.attach_to_context(this);
      return result;
    }
    paint(panel2, to_canvas) {
      this.must_be_connected();
      const result = new PaintPanel(panel2, to_canvas);
      result.attach_to_context(this);
      return result;
    }
    to_gray_panel(from_panel, to_panel, min_value, max_value) {
      this.must_be_connected();
      const result = new ToGrayPanel(
        from_panel,
        to_panel,
        min_value,
        max_value
      );
      result.attach_to_context(this);
      return result;
    }
    max_projection(fromVolume, toDepthBuffer, ijk2xyz) {
      this.must_be_connected();
      const result = new MaxProject(
        fromVolume,
        toDepthBuffer,
        ijk2xyz
      );
      result.attach_to_context(this);
      return result;
    }
    sequence(actions) {
      this.must_be_connected();
      const result = new ActionSequence(
        actions
      );
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
    const context2 = new Context();
    await context2.connect();
    const ijk2xyz_in = [
      [1, 0, 0, 1],
      [0, 1, 0, 2],
      [0, 0, 1, 3],
      [0, 0, 0, 1]
    ];
    const shape_in2 = [2, 3, 2];
    const content_in = [30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const ijk2xyz_out = [
      [0, 1, 0, 1],
      [0, 0, 1, 2],
      [1, 0, 0, 3],
      [0, 0, 0, 1]
    ];
    const shape_out = [2, 2, 3];
    const content_out = [30, 2, 4, 6, 8, 10, 1, 3, 5, 7, 9, 11];
    const inputVolume = new Volume(shape_in2, content_in, ijk2xyz_in);
    inputVolume.attach_to_context(context2);
    const samplerAction = new SampleVolume(shape_out, ijk2xyz_out, inputVolume);
    samplerAction.attach_to_context(context2);
    samplerAction.run();
    const resultArray = await samplerAction.pull();
    console.log("expected", content_out);
    console.log("got output", resultArray);
  }
  function do_paint(canvas) {
    new ImagePainter(colors, 2, 2, canvas);
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
  const combine_depth_buffers = '\n// Suffix pasting input depth buffer over output where depth dominates\n// Requires "depth_buffer.wgsl"\n\n@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;\n\n@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;\n\n@group(2) @binding(0) var<storage, read> input_offset_ij_sign: vec3i;\n\n@compute @workgroup_size(8)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    let outputOffset = global_id.x;\n    let outputShape = outputDB.shape;\n    let outputLocation = depth_buffer_indices(outputOffset, outputShape);\n    if (outputLocation.valid) {\n        let inputIndices = outputLocation.ij + input_offset_ij_sign.xy;\n        let inputShape = inputDB.shape;\n        let inputLocation = depth_buffer_location_of(inputIndices, inputShape);\n        if (inputLocation.valid) {\n            var inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];\n            var outputDepth = outputDB.data_and_depth[outputLocation.depth_offset];\n            var sign = input_offset_ij_sign.z;\n            if (sign == 0) {\n                sign = 1;\n            }\n            if (((inputDepth - outputDepth) * f32(sign)) > 0.0) {\n                var inputData = inputDB.data_and_depth[inputLocation.data_offset];\n                if (!is_default(inputData, inputDepth, inputShape)) {\n                    outputDB.data_and_depth[outputLocation.depth_offset] = inputDepth;\n                    outputDB.data_and_depth[outputLocation.data_offset] = inputData;\n                }\n            }\n        }\n    }\n}';
  class CombinationParameters extends DataObject {
    // xxxx possibly refactor/generalize this.
    constructor(offset_ij, sign) {
      super();
      this.offset_ij = offset_ij;
      this.sign = sign;
      this.buffer_size = 3 * Int32Array.BYTES_PER_ELEMENT;
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedInts = new Uint32Array(arrayBuffer);
      mappedInts.set(this.offset_ij);
      mappedInts[2] = this.sign;
    }
  }
  class CombineDepths extends Action {
    constructor(outputDB, inputDB, offset_ij, sign) {
      super();
      this.outputDB = outputDB;
      this.inputDB = inputDB;
      this.offset_ij = offset_ij || [0, 0];
      this.sign = sign || 1;
      this.parameters = new CombinationParameters(this.offset_ij, this.sign);
    }
    attach_to_context(context2) {
      const device = context2.device;
      const source = this.inputDB;
      const target = this.outputDB;
      const parms = this.parameters;
      parms.attach_to_context(context2);
      const shaderModule = depth_shader_code(combine_depth_buffers, context2);
      const targetLayout = target.bindGroupLayout("storage");
      const sourceLayout = source.bindGroupLayout("read-only-storage");
      const parmsLayout = parms.bindGroupLayout("read-only-storage");
      const layout = device.createPipelineLayout({
        bindGroupLayouts: [
          sourceLayout,
          targetLayout,
          parmsLayout
        ]
      });
      this.pipeline = device.createComputePipeline({
        layout,
        compute: {
          module: shaderModule,
          entryPoint: "main"
        }
      });
      this.sourceBindGroup = source.bindGroup(sourceLayout, context2);
      this.targetBindGroup = target.bindGroup(targetLayout, context2);
      this.parmsBindGroup = parms.bindGroup(parmsLayout, context2);
      this.attached = true;
      this.context = context2;
    }
    add_pass(commandEncoder) {
      const passEncoder = commandEncoder.beginComputePass();
      const computePipeline = this.pipeline;
      passEncoder.setPipeline(computePipeline);
      passEncoder.setBindGroup(0, this.sourceBindGroup);
      passEncoder.setBindGroup(1, this.targetBindGroup);
      passEncoder.setBindGroup(2, this.parmsBindGroup);
      const workgroupCountX = Math.ceil(this.outputDB.size / 8);
      passEncoder.dispatchWorkgroups(workgroupCountX);
      passEncoder.end();
    }
  }
  function do_combine() {
    console.log("computing sample asyncronously");
    (async () => await do_combine_async())();
  }
  async function do_combine_async() {
    debugger;
    const context2 = new Context();
    await context2.connect();
    const input_shape = [2, 3];
    const input_data = [
      1,
      2,
      3,
      4,
      5,
      6
    ];
    const input_depths = [
      // depths
      5,
      10,
      5,
      10,
      5,
      5
    ];
    const default_depth = -100;
    const default_value = -100;
    const inputDB = new DepthBuffer(
      input_shape,
      default_depth,
      default_value,
      input_data,
      input_depths,
      Float32Array
    );
    const output_shape = [3, 2];
    const output_data = [
      7,
      8,
      9,
      10,
      11,
      12
    ];
    const output_depths = [
      1,
      1,
      1,
      1,
      1,
      1
    ];
    const outputDB = new DepthBuffer(
      output_shape,
      default_depth,
      default_value,
      output_data,
      output_depths,
      Float32Array
    );
    inputDB.attach_to_context(context2);
    outputDB.attach_to_context(context2);
    const offset_ij = [1, -1];
    const sign = 1;
    const combine_action = new CombineDepths(
      outputDB,
      inputDB,
      offset_ij,
      sign
    );
    combine_action.attach_to_context(context2);
    combine_action.run();
    const resultArray = await outputDB.pull_data();
    console.log("got result", resultArray);
    console.log("outputDB", outputDB);
  }
  const panel_buffer = "\n// Framework for panel buffer structure\n// A panel consists of a buffer representing a rectangular screen region.\n// with height and width.\n\nstruct PanelOffset {\n    offset: u32,\n    ij: vec2u,\n    is_valid: bool\n}\n\nfn panel_location_of(offset: u32, height_width: vec2u)-> PanelOffset  {\n    // location of buffer offset in row/col form.\n    let height = height_width[0];\n    let width = height_width[1];\n    var result : PanelOffset;\n    result.offset = offset;\n    result.is_valid = (offset < width * height);\n    if (result.is_valid) {\n        let row = offset / width;\n        let col = offset - row * width;\n        result.ij = vec2u(row, col);\n    }\n    return result;\n}\n\nfn panel_offset_of(ij: vec2u, height_width: vec2u) -> PanelOffset {\n    // buffer offset of row/col\n    var result : PanelOffset;\n    result.is_valid = all(ij < height_width);\n    if (result.is_valid) {\n        //const height = height_width[0];\n        let width = height_width[1];\n        result.offset = ij[0] * width + ij[1];\n        result.ij = ij;\n    }\n    return result;\n}\n\nfn f_panel_offset_of(xy: vec2f, height_width: vec2u)-> PanelOffset {\n    // buffer offset of vec2f row/col\n    var result : PanelOffset;\n    result.is_valid = ((xy[0] >= 0.0) && (xy[1] >= 0.0));\n    if (result.is_valid) {\n        result = panel_offset_of(vec2u(xy), height_width);\n    }\n    return result;\n}\n\n// xxxx this should be a builtin 'pack4xU8'...\nfn f_pack_color(color: vec3f) -> u32 {\n    let ucolor = vec3u(clamp(\n        255.0 * color, \n        vec3f(0.0, 0.0, 0.0),\n        vec3f(255.0, 255.0, 255.0)));\n    return ucolor[0] + \n        256u * (ucolor[1] + 256u * (ucolor[2] + 256u * 255u));\n}\n";
  const paste_panel = "\n// suffix for pasting one panel onto another\n\nstruct parameters {\n    in_hw: vec2u,\n    out_hw: vec2u,\n    offset: vec2i,\n}\n\n@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;\n\n@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    // input expected to be smaller, so loop over input\n    let inputOffset = global_id.x;\n    let in_hw = parms.in_hw;\n    let in_location = panel_location_of(inputOffset, in_hw);\n    if (in_location.is_valid) {\n        let paste_location = vec2f(parms.offset) + vec2f(in_location.ij);\n        let out_hw = parms.out_hw;\n        let out_location = f_panel_offset_of(paste_location, out_hw);\n        if (out_location.is_valid) {\n            let value = inputBuffer[in_location.offset];\n            outputBuffer[out_location.offset] = value;\n        }\n    }\n}";
  class PasteParameters extends DataObject {
    constructor(in_hw, out_hw, offset) {
      super();
      this.in_hw = in_hw;
      this.out_hw = out_hw;
      this.offset = offset;
      this.buffer_size = 6 * Int32Array.BYTES_PER_ELEMENT;
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedUInts = new Uint32Array(arrayBuffer);
      mappedUInts.set(this.in_hw);
      mappedUInts.set(this.out_hw, 2);
      const mappedInts = new Int32Array(arrayBuffer);
      mappedInts.set(this.offset, 4);
    }
  }
  class PastePanel extends UpdateAction {
    constructor(fromPanel, toPanel, offset) {
      super();
      const from_hw = [fromPanel.height, fromPanel.width];
      const to_hw = [toPanel.height, toPanel.width];
      this.parameters = new PasteParameters(from_hw, to_hw, offset);
      this.from_hw = from_hw;
      this.to_hw = to_hw;
      this.offset = offset;
      this.source = fromPanel;
      this.target = toPanel;
    }
    change_offset(new_offset) {
      this.offset = new_offset;
      this.parameters.offset = new_offset;
      this.parameters.push_buffer();
    }
    get_shader_module(context2) {
      const gpu_shader = panel_buffer + paste_panel;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    getWorkgroupCounts() {
      return [Math.ceil(this.source.size / 256), 1, 1];
    }
  }
  function do_paste() {
    console.log("pasting asyncronously");
    (async () => await do_paste_async())();
  }
  async function do_paste_async() {
    debugger;
    const context2 = new Context();
    await context2.connect();
    const input = new Panel(2, 2);
    const output = new Panel(3, 3);
    input.attach_to_context(context2);
    output.attach_to_context(context2);
    const inputA = new Uint32Array([
      10,
      20,
      30,
      40
    ]);
    input.push_buffer(inputA);
    const outputA = new Uint32Array([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9
    ]);
    output.push_buffer(outputA);
    const paste_action = new PastePanel(
      input,
      output,
      //[2,2], // xxxxx this can be inferred!
      //[3,3], // xxx
      [1, 0]
    );
    paste_action.attach_to_context(context2);
    paste_action.run();
    const resultArray = await output.pull_buffer();
    console.log("got result", resultArray);
  }
  function do_mouse_paste(to_canvas) {
    console.log("pasting asyncronously");
    defer(do_mouse_paste_async(to_canvas));
  }
  function defer(future) {
    (async () => await future)();
  }
  async function do_mouse_paste_async(to_canvas) {
    debugger;
    const context2 = new Context();
    await context2.connect();
    const W1 = 100;
    const W2 = 1e3;
    const small = new Panel(W1, W1);
    const big = new Panel(W2, W2);
    const target = new Panel(W2, W2);
    small.attach_to_context(context2);
    big.attach_to_context(context2);
    target.attach_to_context(context2);
    const smallA = new Uint8Array(W1 * W1);
    const HW1 = W1 / 2;
    for (var i = 0; i < W1; i++) {
      for (var j = 0; j < W1; j++) {
        const index = i * W1 + j;
        smallA[index] = (Math.abs(HW1 - i) + Math.abs(HW1 - j)) * 10 % 255;
      }
    }
    const smallA32 = grey_to_rgba(smallA);
    await small.push_buffer(smallA32);
    const bigA = new Uint8Array(W2 * W2);
    const HW2 = W2 / 2;
    for (var i = 0; i < W2; i++) {
      for (var j = 0; j < W2; j++) {
        const index = i * W2 + j;
        bigA[index] = (255 - 2 * (Math.abs(HW2 - i) + Math.abs(HW2 - j))) % 255;
      }
    }
    const bigA32 = grey_to_rgba(bigA);
    await big.push_buffer(bigA32);
    const paste_big = new PastePanel(
      big,
      target,
      [0, 0]
    );
    paste_big.attach_to_context(context2);
    paste_big.run();
    const SMoffset = HW2 - HW1;
    const paste_small = new PastePanel(
      small,
      target,
      [SMoffset, SMoffset]
    );
    paste_small.attach_to_context(context2);
    paste_small.run();
    const painter2 = new PaintPanel(target, to_canvas);
    painter2.attach_to_context(context2);
    painter2.run();
    const brec = to_canvas.getBoundingClientRect();
    const info = document.getElementById("info");
    info.textContent = "initial paste done.";
    const mousemove = function(e) {
      const px = e.pageX;
      const py = e.pageY;
      const cx = brec.width / 2 + brec.left;
      const cy = brec.height / 2 + brec.top;
      const offsetx = px - cx;
      const offsety = -(py - cy);
      const dx = offsetx * 2 / brec.width;
      const dy = offsety * 2 / brec.height;
      const i2 = 0.5 * (W2 * (dy + 1));
      const j2 = 0.5 * (W2 * (dx + 1));
      const offset = [i2 - HW1, j2 - HW1];
      info.textContent = "offset: " + offset;
      paste_small.change_offset(offset);
      paste_big.run();
      paste_small.run();
      painter2.run();
    };
    to_canvas.addEventListener("mousemove", mousemove);
  }
  function do_gray() {
    console.log("computing sample asyncronously");
    (async () => await do_gray_async())();
  }
  async function do_gray_async() {
    const context2 = new Context();
    await context2.connect();
    const input = new Panel(3, 3);
    const output = new Panel(3, 3);
    input.attach_to_context(context2);
    output.attach_to_context(context2);
    const A = new Float32Array([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9
    ]);
    input.push_buffer(A);
    const gray_action = new ToGrayPanel(input, output, 0, 10);
    gray_action.attach_to_context(context2);
    gray_action.run();
    const resultArray = await output.pull_buffer();
    console.log("got result", resultArray);
  }
  function do_max_projection() {
    console.log("computing sample asyncronously");
    (async () => await do_max_projection_async())();
  }
  async function do_max_projection_async() {
    debugger;
    const context2 = new Context();
    await context2.connect();
    const output_shape = [2, 3];
    const default_depth = -100;
    const default_value = -100;
    const input_data = null;
    const input_depths = null;
    const outputDB = new DepthBuffer(
      output_shape,
      default_depth,
      default_value,
      input_data,
      input_depths,
      Float32Array
    );
    const ijk2xyz_in = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];
    const shape_in2 = [2, 3, 2];
    const content_in = [30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const inputVolume = new Volume(shape_in2, content_in, ijk2xyz_in, Float32Array);
    inputVolume.attach_to_context(context2);
    outputDB.attach_to_context(context2);
    console.log("inputVolume", inputVolume);
    const project_action2 = new MaxProject(inputVolume, outputDB, ijk2xyz_in);
    project_action2.attach_to_context(context2);
    project_action2.run();
    const resultArray = await outputDB.pull_data();
    console.log("got result", resultArray);
    console.log("outputDB", outputDB);
  }
  class Orbiter {
    constructor(canvas, center, initial_rotation2, callback) {
      const that = this;
      this.canvas = canvas;
      this.center = center;
      if (this.center) {
        this.minus_center = v_scale(-1, this.center);
        this.center_to_originM = affine3d(null, this.minus_center);
        this.origin_to_centerM = affine3d(null, this.center);
      } else {
        this.minus_center = null;
        this.center_to_originM = null;
        this.origin_to_centerM = null;
      }
      this.initial_rotation = initial_rotation2 || eye(3);
      this.bounding_rect = canvas.getBoundingClientRect();
      this.callbacks = [];
      if (callback) {
        this.add_callback(callback);
      }
      canvas.addEventListener("pointerdown", function(e) {
        that.pointerdown(e);
      });
      canvas.addEventListener("pointermove", function(e) {
        that.pointermove(e);
      });
      canvas.addEventListener("pointerup", function(e) {
        that.pointerup(e);
      });
      canvas.addEventListener("pointercancel", function(e) {
        that.pointerup(e);
      });
      canvas.addEventListener("pointerout", function(e) {
        that.pointerup(e);
      });
      canvas.addEventListener("pointerleave", function(e) {
        that.pointerup(e);
      });
      this.active = false;
      this.current_rotation = MM_product(eye(3), this.initial_rotation);
      this.next_rotation = this.current_rotation;
      this.last_stats = null;
    }
    pointerdown(e) {
      this.active = true;
      this.last_stats = this.event_stats(e);
    }
    pointermove(e) {
      if (!this.active) {
        return;
      }
      this.do_rotation(e);
    }
    pointerup(e) {
      if (!this.active) {
        return;
      }
      this.do_rotation(e);
      this.active = false;
      this.current_rotation = this.next_rotation;
    }
    do_rotation(e) {
      const last = this.last_stats;
      const now = this.event_stats(e);
      this.next_stats = now;
      const scale = 1;
      const offset_x = scale * (now.dx - last.dx);
      const offset_y = scale * (now.dy - last.dy);
      const ascale = Math.PI / 2;
      const yaw = ascale * offset_x;
      const pitch = ascale * offset_y;
      const yawM = M_yaw(yaw);
      const pitchM = M_pitch(pitch);
      const rotation = MM_product(
        this.current_rotation,
        MM_product(yawM, pitchM)
      );
      this.next_rotation = rotation;
      const arotation = affine3d(rotation);
      var affine = arotation;
      if (this.center) {
        affine = MM_product(
          MM_product(this.origin_to_centerM, arotation),
          this.center_to_originM
        );
      }
      for (var callback of this.callbacks) {
        callback(affine);
      }
    }
    event_stats(e) {
      const brec = this.bounding_rect;
      const px = e.pageX;
      const py = e.pageY;
      const cx = brec.width / 2 + brec.left;
      const cy = brec.height / 2 + brec.top;
      const offsetx = px - cx;
      const offsety = -(py - cy);
      const dx = offsetx * 2 / brec.width;
      const dy = offsety * 2 / brec.height;
      return { px, py, cx, cy, offsetx, offsety, dx, dy };
    }
    add_callback(callback) {
      this.callbacks.push(callback);
    }
  }
  function do_pipeline(canvas, from_fn, kSlider, kValue) {
    console.log("computing sample asyncronously");
    (async () => await do_pipeline_async(canvas, from_fn, kSlider, kValue))();
  }
  var project_action;
  var sequence;
  var shape_in;
  var initial_rotation;
  function orbiter_callback(affine_transform) {
    const [K, J, I] = shape_in;
    const MaxS = Math.max(K, J, I);
    const translate_out = affine3d(null, [-MaxS, -MaxS, -MaxS]);
    const ijk2xyz_out = MM_product(affine_transform, translate_out);
    project_action.change_matrix(ijk2xyz_out);
    sequence.run();
  }
  async function do_pipeline_async(canvas, from_fn, kSlider, kValue) {
    debugger;
    from_fn = from_fn || "./mri.bin";
    initial_rotation = [
      [0, 0, -1],
      [1, 0, 0],
      [0, -1, 0]
    ];
    new Orbiter(
      canvas,
      null,
      // center,
      initial_rotation,
      orbiter_callback
      // callback,
    );
    const context2 = new Context();
    await context2.connect();
    const response = await fetch(from_fn);
    const content = await response.blob();
    const buffer = await content.arrayBuffer();
    console.log("buffer", buffer);
    const f32 = new Float32Array(buffer);
    console.log("f32", f32);
    shape_in = f32.slice(0, 3);
    console.log("shape_in", shape_in);
    const [K, J, I] = shape_in;
    if (kSlider) {
      kSlider.max = 3 * K;
      kSlider.min = -3 * K;
    }
    const MaxS = Math.max(K, J, I);
    const content_in = f32.slice(3);
    var ijk2xyz_out = MM_product(
      affine3d(initial_rotation),
      affine3d(null, [-MaxS, -MaxS, -MaxS])
    );
    const vol_rotation = eye(4);
    vol_rotation[1][1] = -1;
    const vol_translation = affine3d(null, [-K / 2, -J / 2, -I / 2]);
    var ijk2xyz_in = MM_product(vol_rotation, vol_translation);
    const inputVolume = context2.volume(shape_in, content_in, ijk2xyz_in, Float32Array);
    console.log("inputVolume", inputVolume);
    const output_shape = [MaxS * 2, MaxS * 2];
    const [height, width] = output_shape;
    const default_depth = -100;
    const default_value = -100;
    const outputDB = context2.depth_buffer(
      output_shape,
      default_depth,
      default_value,
      null,
      //input_data,
      null,
      // input_depths,
      Float32Array
    );
    console.log("outputDB", outputDB);
    project_action = context2.max_projection(inputVolume, outputDB, ijk2xyz_out);
    console.log("project_action", project_action);
    const max_panel = new Panel(width, height);
    max_panel.attach_to_context(context2);
    const flatten_action = outputDB.flatten_action(max_panel);
    flatten_action.attach_to_context(context2);
    const grey_panel = context2.panel(width, height);
    const minimum = inputVolume.min_value;
    const maximum = inputVolume.max_value;
    const gray_action = context2.to_gray_panel(max_panel, grey_panel, minimum, maximum);
    const painter2 = context2.paint(grey_panel, canvas);
    sequence = context2.sequence([
      project_action,
      flatten_action,
      gray_action,
      painter2
    ]);
    do_rotation(0, 0, 0, kSlider, kValue);
  }
  function do_rotation(roll, pitch, yaw, kSlider, kValue) {
    const R = M_roll(roll);
    const P = M_pitch(pitch);
    const Y = M_yaw(yaw);
    const RPY = MM_product(MM_product(R, P), Y);
    const [K, J, I] = shape_in;
    const MaxS = Math.max(K, J, I);
    var KK = -MaxS;
    if (kSlider) {
      KK = kSlider.value;
    }
    if (kValue) {
      kValue.textContent = KK;
    }
    const translate_out = MM_product(
      affine3d(initial_rotation),
      affine3d(null, [-MaxS, -MaxS, KK])
    );
    const rotate_out = affine3d(RPY);
    const ijk2xyz_out = MM_product(rotate_out, translate_out);
    project_action.change_matrix(ijk2xyz_out);
    sequence.run();
  }
  const name = "webgpu_volume";
  function context() {
    return new Context();
  }
  function depth_buffer(shape, data, depths, data_format) {
    return new DepthBuffer(shape, data, depths, data_format);
  }
  function combine_depths(outputDB, inputDB, offset_ij, sign) {
    return new CombineDepths(outputDB, inputDB, offset_ij, sign);
  }
  function volume(shape, data, ijk2xyz) {
    return new Volume(shape, data, ijk2xyz);
  }
  function panel(width, height) {
    return new Panel(width, height);
  }
  function paint_panel(panel2, to_canvas) {
    return new PaintPanel(panel2, to_canvas);
  }
  function sample_volume(shape, ijk2xyz, volumeToSample) {
    return new SampleVolume(shape, ijk2xyz, volumeToSample);
  }
  function painter(rgbaImage, width, height, to_canvas) {
    return new ImagePainter(rgbaImage, width, height, to_canvas);
  }
  exports2.GPUColorPanel = GPUColorPanel;
  exports2.GPUContext = GPUContext;
  exports2.GPUVolume = GPUVolume;
  exports2.PaintPanel = PaintPanel$1;
  exports2.SampleVolume = SampleVolume$1;
  exports2.combine_depths = combine_depths;
  exports2.context = context;
  exports2.depth_buffer = depth_buffer;
  exports2.do_combine = do_combine;
  exports2.do_gray = do_gray;
  exports2.do_max_projection = do_max_projection;
  exports2.do_mouse_paste = do_mouse_paste;
  exports2.do_paint = do_paint;
  exports2.do_paste = do_paste;
  exports2.do_pipeline = do_pipeline;
  exports2.do_sample = do_sample;
  exports2.name = name;
  exports2.paint_panel = paint_panel;
  exports2.painter = painter;
  exports2.panel = panel;
  exports2.sample_volume = sample_volume;
  exports2.volume = volume;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
