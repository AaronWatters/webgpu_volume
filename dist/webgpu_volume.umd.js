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
      this.context = null;
    }
    attach_to_context(context2) {
      if (this.context == context2) {
        return this.gpu_buffer;
      }
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
      await device.queue.onSubmittedWorkDone();
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
  const GPUDataObject = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    DataObject
  }, Symbol.toStringTag, { value: "Module" }));
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
  class NormalizedCanvasSpace {
    constructor(canvas) {
      this.canvas = canvas;
    }
    normalize(px, py) {
      const brec = this.canvas.getBoundingClientRect();
      this.brec = brec;
      this.cx = brec.width / 2 + brec.left;
      this.cy = brec.height / 2 + brec.top;
      const offsetx = px - this.cx;
      const offsety = -(py - this.cy);
      const dx = offsetx * 2 / this.brec.width;
      const dy = offsety * 2 / this.brec.height;
      return [dx, dy];
    }
    normalize_event_coords(e) {
      return this.normalize(e.clientX, e.clientY);
    }
  }
  class PanelSpace {
    constructor(height, width) {
      this.height = height;
      this.width = width;
    }
    normalized2ij([dx, dy]) {
      const i = Math.floor((dy + 1) * this.height / 2);
      const j = Math.floor((dx + 1) * this.width / 2);
      return [i, j];
    }
    ij2normalized([i, j]) {
      const dx = 2 * j / this.width - 1;
      const dy = 2 * i / this.height - 1;
      return [dx, dy];
    }
    /*
    ij2offset([i, j]) {
        // panels are indexed from lower left corner
        if ((i < 0) || (i >= this.width) || (j < 0) || (j >= this.height)) {
            return null;
        }
        return i + j * this.width;
    };
    */
  }
  class ProjectionSpace {
    constructor(ijk2xyz) {
      this.change_matrix(ijk2xyz);
    }
    change_matrix(ijk2xyz) {
      this.ijk2xyz = ijk2xyz;
      this.xyz2ijk = M_inverse(ijk2xyz);
    }
    ijk2xyz_v(ijk) {
      return apply_affine3d(this.ijk2xyz, ijk);
    }
  }
  class VolumeSpace extends ProjectionSpace {
    constructor(ijk2xyz, shape) {
      super(ijk2xyz);
      this.shape = shape;
    }
    xyz2ijk_v(xyz) {
      return apply_affine3d(this.xyz2ijk, xyz);
    }
    ijk2offset(ijk) {
      const [depth, height, width] = this.shape.slice(0, 3);
      var [layer, row, column] = ijk;
      layer = Math.floor(layer);
      row = Math.floor(row);
      column = Math.floor(column);
      if (column < 0 || column >= width || row < 0 || row >= height || layer < 0 || layer >= depth) {
        return null;
      }
      return (layer * height + row) * width + column;
    }
    offset2ijk(offset) {
      const [I, J, K] = this.shape.slice(0, 3);
      const k = offset % K;
      const j = Math.floor(offset / K) % J;
      const i = Math.floor(offset / (K * J));
      return [i, j, k];
    }
    xyz2offset(xyz) {
      return this.ijk2offset(this.xyz2ijk_v(xyz));
    }
  }
  const coordinates = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    NormalizedCanvasSpace,
    PanelSpace,
    ProjectionSpace,
    VolumeSpace
  }, Symbol.toStringTag, { value: "Module" }));
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
  let Volume$1 = class Volume2 extends DataObject {
    constructor(shape, data, ijk2xyz, data_format) {
      super();
      data_format = data_format || Uint32Array;
      this.data_format = data_format;
      if (!ijk2xyz) {
        ijk2xyz = list_as_M(id4x4list, 4, 4);
      }
      this.data = null;
      this.min_value = null;
      this.max_value = null;
      this.set_shape(shape, data);
      this.set_ijk2xyz(ijk2xyz);
      this.shape_offset = 0;
      this.ijk2xyz_offset = this.shape_offset + this.shape.length;
      this.xyz2ijk_offset = this.ijk2xyz_offset + this.ijk2xyz.length;
      this.content_offset = this.xyz2ijk_offset + this.xyz2ijk.length;
      this.buffer_size = (this.size + this.content_offset) * Int32Array.BYTES_PER_ELEMENT;
    }
    same_geometry(context2) {
      context2 = context2 || this.context;
      const result = new Volume2(this.shape.slice(0, 3), null, this.matrix, this.data_format);
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
      this.space = new VolumeSpace(matrix, this.shape);
      const ListMatrix = M_column_major_order(matrix);
      this.ijk2xyz = ListMatrix;
      this.xyz2ijk = M_column_major_order(this.space.xyz2ijk);
    }
    sample_at(xyz) {
      if (!this.data) {
        throw new Error("No data to sample.");
      }
      const offset = this.space.xyz2offset(xyz);
      if (offset === null) {
        return null;
      }
      return this.data[offset];
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
  };
  const GPUVolume = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Volume: Volume$1
  }, Symbol.toStringTag, { value: "Module" }));
  const volume_frame = "\n// Framework for image volume data in WebGPU.\n\n\nstruct VolumeGeometry {\n    // Volume dimensions. IJK + error indicator.\n    shape : vec4u,\n    // Convert index space to model space,\n    ijk2xyz : mat4x4f,\n    // Inverse: convert model space to index space.\n    xyz2ijk : mat4x4f\n}\n\nstruct VolumeU32 {\n    geometry : VolumeGeometry,\n    content : array<u32>\n}\n\nalias Volume = VolumeU32;\n\nstruct IndexOffset {\n    offset : u32,\n    is_valid : bool\n}\n\nstruct OffsetIndex {\n    ijk: vec3u,\n    is_valid: bool\n}\n\n// Buffer offset for volume index ijk.\nfn offset_of(ijk : vec3u, geom : ptr<function, VolumeGeometry>) -> IndexOffset {\n    var result : IndexOffset;\n    var shape = (*geom).shape.xyz;\n    //result.is_valid = all(ijk.zxy < shape);\n    result.is_valid = all(ijk.xyz < shape);\n    if (result.is_valid) {\n        let layer = ijk.x;\n        let row = ijk.y;\n        let column = ijk.z;\n        let height = shape.y;\n        let width = shape.z;\n        result.offset = (layer * height + row) * width + column;\n    }\n    return result;\n}\n\n// Convert array offset to checked ijk index\nfn index_of(offset: u32, geom : ptr<function, VolumeGeometry>) -> OffsetIndex {\n    var result : OffsetIndex;\n    result.is_valid = false;\n    var shape = (*geom).shape;\n    let depth = shape.x;\n    let height = shape.y;\n    let width = shape.z;\n    let LR = offset / width;\n    let column = offset - (LR * width);\n    let layer = LR / height;\n    let row = LR - (layer * height);\n    if (layer < depth) {\n        result.ijk.x = layer;\n        result.ijk.y = row;\n        result.ijk.z = column;\n        result.is_valid = true;\n    }\n    return result;\n}\n\n// Convert float vector indices to checked unsigned index\nfn offset_of_f(ijk_f : vec3f, geom : ptr<function, VolumeGeometry>) -> IndexOffset {\n    var shape = (*geom).shape;\n    var result : IndexOffset;\n    result.is_valid = false;\n    if (all(ijk_f >= vec3f(0.0, 0.0, 0.0)) && all(ijk_f < vec3f(shape.xyz))) {\n        result = offset_of(vec3u(ijk_f), geom);\n    }\n    return result;\n}\n\n// Convert model xyz to index space (as floats)\nfn to_index_f(xyz : vec3f, geom : ptr<function, VolumeGeometry>) -> vec3f {\n    var xyz2ijk = (*geom).xyz2ijk;\n    let xyz1 = vec4f(xyz, 1.0);\n    let ijk1 = xyz2ijk * xyz1;\n    return ijk1.xyz;\n}\n\n// Convert index floats to model space.\nfn to_model_f(ijk_f : vec3f, geom : ptr<function, VolumeGeometry>) -> vec3f {\n    var ijk2xyz = (*geom).ijk2xyz;\n    let ijk1 = vec4f(ijk_f, 1.0);\n    let xyz1 = ijk2xyz * ijk1;\n    return xyz1.xyz;\n}\n\n// Convert unsigned int indices to model space.\nfn to_model(ijk : vec3u, geom : ptr<function, VolumeGeometry>) -> vec3f {\n    return to_model_f(vec3f(ijk), geom);\n}\n\n// Convert xyz model position to checked index offset.\nfn offset_of_xyz(xyz : vec3f, geom : ptr<function, VolumeGeometry>) -> IndexOffset {\n    return offset_of_f(to_index_f(xyz, geom), geom);\n}";
  const volume_frame$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: volume_frame
  }, Symbol.toStringTag, { value: "Module" }));
  const depth_buffer$1 = '\n// Framework for 4 byte depth buffer\n\n// keep everything f32 for simplicity of transfers\n\nstruct depthShape {\n    height: f32,\n    width: f32,\n    // "null" marker depth and value.\n    default_depth: f32,\n    default_value: f32,\n}\n\nfn is_default(value: f32, depth:f32, for_shape: depthShape) -> bool {\n    return (for_shape.default_depth == depth) && (for_shape.default_value == value);\n}\n\nstruct DepthBufferF32 {\n    // height/width followed by default depth and default value.\n    shape: depthShape,\n    // content data followed by depth as a single array\n    data_and_depth: array<f32>,\n}\n\nstruct BufferLocation {\n    data_offset: u32,\n    depth_offset: u32,\n    ij: vec2i,\n    valid: bool,\n}\n\n// 2d u32 indices to array locations\nfn depth_buffer_location_of(ij: vec2i, shape: depthShape) -> BufferLocation {\n    var result : BufferLocation;\n    result.ij = ij;\n    let width = u32(shape.width);\n    let height = u32(shape.height);\n    let row = ij.x;\n    let col = ij.y;\n    let ucol = u32(col);\n    let urow = u32(row);\n    result.valid = ((row >= 0) && (col >= 0) && (urow < height) && (ucol < width));\n    if (result.valid) {\n        result.data_offset = urow * width + ucol;\n        result.depth_offset = height * width + result.data_offset;\n    }\n    return result;\n}\n\n// 2d f32 indices to array locations\nfn f_depth_buffer_location_of(xy: vec2f, shape: depthShape) -> BufferLocation {\n    return depth_buffer_location_of(vec2i(xy.xy), shape);\n}\n\nfn depth_buffer_indices(data_offset: u32, shape: depthShape) -> BufferLocation {\n    var result : BufferLocation;\n    let width = u32(shape.width);\n    let height = u32(shape.height);\n    let size = width * height;\n    result.valid = (data_offset < size);\n    if (result.valid) {\n        result.data_offset = data_offset;\n        result.depth_offset = size + data_offset;\n        let row = data_offset / width;\n        let col = data_offset - (row * width);\n        result.ij = vec2i(i32(row), i32(col));\n    }\n    return result;\n}';
  const depth_buffer$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: depth_buffer$1
  }, Symbol.toStringTag, { value: "Module" }));
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
  const GPUAction = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Action,
    ActionSequence,
    depth_shader_code,
    volume_shader_code
  }, Symbol.toStringTag, { value: "Module" }));
  const embed_volume = "\n// Suffix for testing frame operations.\n\n@group(0) @binding(0) var<storage, read> inputVolume : Volume;\n\n@group(1) @binding(0) var<storage, read_write> outputVolume : Volume;\n\n// xxxx add additional transform matrix\n\n@compute @workgroup_size(8)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    var inputGeometry = inputVolume.geometry;\n    let inputOffset = global_id.x;\n    let inputIndex = index_of(inputOffset, &inputGeometry);\n    if (inputIndex.is_valid) {\n        var outputGeometry = outputVolume.geometry;\n        let xyz = to_model(inputIndex.ijk, &inputGeometry);\n        let out_offset = offset_of_xyz(xyz, &outputGeometry);\n        if (out_offset.is_valid) {\n            outputVolume.content[out_offset.offset] = inputVolume.content[inputOffset];\n        }\n    }\n}";
  const embed_volume$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: embed_volume
  }, Symbol.toStringTag, { value: "Module" }));
  class SampleVolume extends Action {
    constructor(shape, ijk2xyz, volumeToSample) {
      super();
      this.volumeToSample = volumeToSample;
      this.shape = shape;
      this.ijk2xyz = ijk2xyz;
      this.targetVolume = new Volume$1(shape, null, ijk2xyz);
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
    color_at([row, column]) {
      if (column < 0 || column >= this.width || row < 0 || row >= this.height) {
        return null;
      }
      const u32offset = column + row * this.width;
      const bpe = Int32Array.BYTES_PER_ELEMENT;
      const bytes = new Uint8Array(this.buffer_content, u32offset * bpe, bpe);
      return bytes;
    }
  }
  const GPUColorPanel = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Panel
  }, Symbol.toStringTag, { value: "Module" }));
  const painter_code = "\n// Paint colors to rectangle\nstruct Out {\n    @builtin(position) pos: vec4<f32>,\n    @location(0) color: vec4<f32>,\n}\n\nstruct uniforms_struct {\n    width: f32,\n    height: f32,\n    x0: f32,\n    y0: f32,\n    dx: f32,\n    dy: f32,\n    //minimum: f32,\n    //maximum: f32,\n}\n\n@binding(0) @group(0) var<uniform> uniforms: uniforms_struct;\n\n@vertex fn vertexMain(\n    @builtin(vertex_index) vi : u32,\n    @builtin(instance_index) ii : u32,\n    @location(0) color: u32,\n) -> Out {\n    let width = u32(uniforms.width);\n    let height = u32(uniforms.height);\n    let x0 = uniforms.x0;\n    let y0 = uniforms.y0;\n    let dw = uniforms.dx;\n    let dh = uniforms.dy;\n    const pos = array(\n        // lower right triangle of pixel\n        vec2f(0, 0), \n        vec2f(1, 0), \n        vec2f(1, 1),\n        // upper left triangle of pixel\n        vec2f(1, 1), \n        vec2f(0, 1), \n        vec2f(0, 0)\n    );\n    let row = ii / width;\n    let col = ii % width;\n    let offset = pos[vi];\n    let x = x0 + dw * (offset.x + f32(col));\n    let y = y0 + dh * (offset.y + f32(row));\n    let colorout = unpack4x8unorm(color);\n    return Out(vec4<f32>(x, y, 0., 1.), colorout);\n}\n\n@fragment fn fragmentMain(@location(0) color: vec4<f32>) \n-> @location(0) vec4f {\n    return color;\n}\n";
  const Painter = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: painter_code
  }, Symbol.toStringTag, { value: "Module" }));
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
    constructor(rgbaImage, width, height, to_canvas2) {
      if (rgbaImage.byteLength == width * height) {
        rgbaImage = grey_to_rgba(rgbaImage);
      }
      var that = this;
      that.to_canvas = to_canvas2;
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
    constructor(panel2, to_canvas2) {
      super();
      this.panel = panel2;
      this.to_canvas = to_canvas2;
      this.uniforms = new PaintPanelUniforms(panel2);
    }
    attach_to_context(context2) {
      this.context = context2;
      const device = context2.device;
      const to_canvas2 = this.to_canvas;
      this.webgpu_context = to_canvas2.getContext("webgpu");
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
      source.attach_to_context(context2);
      target.attach_to_context(context2);
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
  const UpdateAction$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    UpdateAction
  }, Symbol.toStringTag, { value: "Module" }));
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
  const Projection = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Project,
    intersection_buffer
  }, Symbol.toStringTag, { value: "Module" }));
  const volume_intercepts = "\n// Logic for loop boundaries in volume scans.\n// This prefix assumes volume_frame.wgsl and depth_buffer.wgsl.\n\n// v2 planar xyz intersection parameters:\n// v2 ranges from c0 * v0 + c1 * v1 + low to ... + high\nstruct Intersection2 {\n    c0: f32,\n    c1: f32,\n    low: f32,\n    high: f32,\n}\n\n// Intersection parameters for box borders\nalias Intersections3 = array<Intersection2, 3>;\n\n// Intersection end points\nstruct Endpoints2 {\n    offset: vec2f,\n    is_valid: bool,\n}\n\nfn scan_endpoints(\n    offset: vec2i, \n    int3: Intersections3, \n    geom_ptr: ptr<function, VolumeGeometry>, \n    ijk2xyz: mat4x4f,  // orbit to model affine matrix\n) -> Endpoints2 {\n    var initialized = false;\n    var result: Endpoints2;\n    result.is_valid = false;\n    for (var index=0; index<3; index++) {\n        let intersect = int3[index];\n        let ep = intercepts2(offset, intersect);\n        if (ep.is_valid) {\n            if (!initialized) {\n                result = ep;\n                initialized = true;\n            } else {\n                result = intersect2(result, ep);\n            }\n        }\n    }\n    if (result.is_valid) {\n        // verify that midpoint lies inside geometry\n        let low = result.offset[0];\n        let high = result.offset[1];\n        let mid = (low + high) / 2;\n        let mid_probe = probe_point(vec2f(offset), mid, ijk2xyz);\n        //let low_probe = probe_point(offset, low, ijk2xyz);\n        //let high_probe = probe_point(offset, high, ijk2xyz);\n        //let mid_probe = 0.5 * (low_probe + high_probe);\n        //let mid_probe = low_probe; // debugging\n        let mid_offset = offset_of_xyz(mid_probe, geom_ptr);\n        result.is_valid = mid_offset.is_valid;\n        // DEBUGGING\n        result.is_valid = true;\n    }\n    return result;\n}\n\nfn probe_point(offset: vec2f, depth: f32, ijk2xyz: mat4x4f) -> vec3f {\n    let ijkw = vec4f(vec2f(offset), f32(depth), 1.0);\n    let xyzw = ijk2xyz * ijkw;\n    return xyzw.xyz;\n}\n\nfn intercepts2(offset: vec2i, intc: Intersection2) -> Endpoints2 {\n    var result: Endpoints2;\n    let x = (intc.c0 * f32(offset[0])) + (intc.c1 * f32(offset[1]));\n    let high = floor(x + intc.high);\n    let low = ceil(x + intc.low);\n    result.is_valid = (high > low);\n    result.offset = vec2f(low, high);\n    return result;\n}\n\nfn intersect2(e1: Endpoints2, e2: Endpoints2) -> Endpoints2 {\n    var result = e1;\n    if (!e1.is_valid) {\n        result = e2;\n    } else {\n        if (e2.is_valid) {\n            let low = max(e1.offset[0], e2.offset[0]);\n            let high = min(e1.offset[1], e2.offset[1]);\n            result.offset = vec2f(low, high);\n            result.is_valid = (low <= high);\n        }\n    }\n    return result;\n}\n";
  const volume_intercepts$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: volume_intercepts
  }, Symbol.toStringTag, { value: "Module" }));
  const max_value_project = "\n// Project a volume by max value onto a depth buffer (suffix)\n// Assumes prefixes: \n//  depth_buffer.wgsl\n//  volume_frame.wgsl\n//  volume_intercept.wgsl\n\nstruct parameters {\n    ijk2xyz : mat4x4f,\n    int3: Intersections3,\n    dk: f32,  // k increment for probe\n    // 3 floats padding at end...???\n}\n\n@group(0) @binding(0) var<storage, read> inputVolume : Volume;\n\n@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    //let local_parms = parms;\n    let outputOffset = global_id.x;\n    let outputShape = outputDB.shape;\n    let outputLocation = depth_buffer_indices(outputOffset, outputShape);\n    // k increment length in xyz space\n    //let dk = 1.0f;  // fix this! -- k increment length in xyz space\n    let dk = parms.dk;\n    var initial_value_found = false;\n    if (outputLocation.valid) {\n        var inputGeometry = inputVolume.geometry;\n        var current_value = outputShape.default_value;\n        var current_depth = outputShape.default_depth;\n        let offsetij = vec2i(outputLocation.ij);\n        let ijk2xyz = parms.ijk2xyz;\n        var end_points = scan_endpoints(\n            offsetij,\n            parms.int3,\n            &inputGeometry,\n            ijk2xyz,\n        );\n        if (end_points.is_valid) {\n            let offsetij_f = vec2f(offsetij);\n            for (var depth = end_points.offset[0]; depth < end_points.offset[1]; depth += dk) {\n                //let ijkw = vec4i(offsetij, depth, 1);\n                //let f_ijk = vec4f(ijkw);\n                //let xyz_probe = parms.ijk2xyz * f_ijk;\n                let xyz_probe = probe_point(offsetij_f, depth, ijk2xyz);\n                let input_offset = offset_of_xyz(xyz_probe.xyz, &inputGeometry);\n                if (input_offset.is_valid) {\n                    let valueu32 = inputVolume.content[input_offset.offset];\n                    let value = bitcast<f32>(valueu32);\n                    if ((!initial_value_found) || (value > current_value)) {\n                        current_depth = f32(depth);\n                        current_value = value;\n                        initial_value_found = true;\n                    }\n                    // debug\n                    //let t = outputOffset/2u;\n                    //if (t * 2 == outputOffset) {\n                    //    current_value = bitcast<f32>(inputVolume.content[0]);\n                    //}\n                    // end debug\n                }\n            }\n        }\n        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;\n        outputDB.data_and_depth[outputLocation.data_offset] = current_value;\n    }\n}\n";
  const max_value_project$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: max_value_project
  }, Symbol.toStringTag, { value: "Module" }));
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
    get_shader_module(context2) {
      const gpu_shader = volume_frame + depth_buffer$1 + volume_intercepts + max_value_project;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    //getWorkgroupCounts() {
    //    return [Math.ceil(this.target.size / 256), 1, 1];
    //};
  }
  const MaxProjection = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    MaxProject
  }, Symbol.toStringTag, { value: "Module" }));
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
  const CopyAction = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    CopyData
  }, Symbol.toStringTag, { value: "Module" }));
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
      this.entries = this.size * 2 + this.content_offset;
      this.buffer_size = this.entries * Int32Array.BYTES_PER_ELEMENT;
    }
    clone_operation() {
      const clone = new DepthBuffer(
        [this.height, this.width],
        this.default_depth,
        this.default_value,
        null,
        null,
        this.data_format
      );
      clone.attach_to_context(this.context);
      const clone_action = new CopyData(
        this,
        0,
        clone,
        0,
        this.entries
      );
      clone_action.attach_to_context(this.context);
      return { clone, clone_action };
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
      this.data = mappedData.slice(this.content_offset, this.depth_offset);
      const mappedFloats = new Float32Array(arrayBuffer);
      const shape4 = mappedFloats.slice(0, 4);
      this.height = shape4[0];
      this.width = shape4[1];
      this.default_depth = shape4[2];
      this.default_value = shape4[3];
      this.depths = mappedFloats.slice(this.depth_offset, this.depth_offset + this.size);
      return this.data;
    }
    location([row, column], projection_space, in_volume) {
      const result = {};
      if (column < 0 || column >= this.width || row < 0 || row >= this.height) {
        return null;
      }
      const u32offset = column + row * this.width;
      const data = this.data[u32offset];
      const depth = this.depths[u32offset];
      if (data == this.default_value && depth == this.default_depth) {
        return null;
      }
      result.data = data;
      result.depth = depth;
      if (projection_space) {
        const probe = [row, column, depth];
        const xyz = projection_space.ijk2xyz_v(probe);
        result.xyz = xyz;
        if (in_volume) {
          const volume_ijk = in_volume.space.xyz2ijk_v(xyz);
          const int_ijk = volume_ijk.map((num) => Math.floor(num));
          result.volume_ijk = int_ijk;
          const volume_offset = in_volume.space.ijk2offset(volume_ijk);
          result.volume_offset = volume_offset;
          if (volume_offset != null) {
            result.volume_data = in_volume.data[volume_offset];
          }
        }
      }
      return result;
    }
  }
  const GPUDepthBuffer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    DepthBuffer
  }, Symbol.toStringTag, { value: "Module" }));
  const convert_gray_prefix = "\n// Prefix for converting f32 to rgba gray values.\n// Prefix for convert_buffer.wgsl\n\nstruct parameters {\n    input_start: u32,\n    output_start: u32,\n    length: u32,\n    min_value: f32,\n    max_value: f32,\n}\n\nfn new_out_value(in_value: u32, out_value: u32, parms: parameters) -> u32 {\n    let in_float = bitcast<f32>(in_value);\n    let min_value = parms.min_value;\n    let max_value = parms.max_value;\n    let in_clamp = clamp(in_float, min_value, max_value);\n    let intensity = (in_clamp - min_value) / (max_value - min_value);\n    let gray_level = u32(intensity * 255.0);\n    //let color = vec4u(gray_level, gray_level, gray_level, 255u);\n    //let result = pack4xU8(color); ???error: unresolved call target 'pack4xU8'\n    let result = gray_level + 256 * (gray_level + 256 * (gray_level + 256 * 255));\n    //let result = 255u + 256 * (gray_level + 256 * (gray_level + 256 * gray_level));\n    return result;\n}";
  const convert_gray_prefix$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: convert_gray_prefix
  }, Symbol.toStringTag, { value: "Module" }));
  const convert_buffer = "\n// Suffix for converting or combining data from one data object buffer to another.\n\n// Assume that prefix defines struct parameters with members\n//   - input_start: u32\n//   - output_start: u32\n//   - length: u32\n// as well as any other members needed for conversion.\n//\n// And fn new_out_value(in_value: u32, out_value: u32, parms: parameters) -> u32 {...}\n\n\n@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;\n\n@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    // make a copy of parms for local use...\n    let local_parms = parms;\n    let offset = global_id.x;\n    let length = parms.length;\n    if (offset < length) {\n        let input_start = parms.input_start;\n        let output_start = parms.output_start;\n        let input_value = inputBuffer[input_start + offset];\n        let output_index = output_start + offset;\n        let output_value = outputBuffer[output_index];\n        let new_output_value = new_out_value(input_value, output_value, local_parms);\n        outputBuffer[output_index] = new_output_value;\n    }\n}\n";
  const convert_buffer$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: convert_buffer
  }, Symbol.toStringTag, { value: "Module" }));
  const convert_depth_buffer = '\n\n// Suffix for converting or combining data from one depth buffer buffer to another.\n// This respects depth buffer default (null) markers.\n\n// Assume that prefix defines struct parameters with members needed for conversion.\n//\n// And fn new_out_value(in_value: u32, out_value: u32, parms: parameters) -> u32 {...}\n//\n// Requires "depth_buffer.wgsl".\n\n@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;\n\n@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    // make a copy of parms for local use...\n    let local_parms = parms;\n    let outputOffset = global_id.x;\n    let outputShape = outputDB.shape;\n    let outputLocation = depth_buffer_indices(outputOffset, outputShape);\n    if (outputLocation.valid) {\n        var current_value = outputShape.default_value; // ???\n        var current_depth = outputShape.default_depth;\n        let inputIndices = outputLocation.ij;\n        let inputShape = inputDB.shape;\n        let inputLocation = depth_buffer_location_of(inputIndices, inputShape);\n        if (inputLocation.valid) {\n            let inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];\n            let inputValue = inputDB.data_and_depth[inputLocation.data_offset];\n            if (!is_default(inputValue, inputDepth, inputShape)) {\n                let Uvalue = bitcast<u32>(inputValue);\n                let Ucurrent = bitcast<u32>(current_value);\n                current_value = bitcast<f32>( new_out_value(Uvalue, Ucurrent, local_parms));\n                current_depth = inputDepth;\n            }\n        }\n        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;\n        outputDB.data_and_depth[outputLocation.data_offset] = current_value;\n    }\n}';
  const convert_depth_buffer$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: convert_depth_buffer
  }, Symbol.toStringTag, { value: "Module" }));
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
  class PaintDepthBufferGray extends UpdateAction {
    constructor(from_depth_buffer, to_depth_buffer, min_value, max_value) {
      super();
      this.source = from_depth_buffer;
      this.target = to_depth_buffer;
      this.min_value = min_value;
      this.max_value = max_value;
      this.parameters = new GrayParameters(
        0,
        // not used
        0,
        // not used
        from_depth_buffer.size,
        // not used.
        min_value,
        max_value
      );
    }
    get_shader_module(context2) {
      const gpu_shader = depth_buffer$1 + convert_gray_prefix + convert_depth_buffer;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    getWorkgroupCounts() {
      return [Math.ceil(this.target.size / 256), 1, 1];
    }
  }
  const UpdateGray$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    PaintDepthBufferGray,
    ToGrayPanel,
    UpdateGray
  }, Symbol.toStringTag, { value: "Module" }));
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
      try {
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
      } finally {
        if (!this.connected) {
          alert("Failed to connect WebGPU. This browser does not have WebGPU enabled.");
        }
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
      const result = new Volume$1(shape_in2, content_in, ijk2xyz_in, Float32Array2);
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
    paint(panel2, to_canvas2) {
      this.must_be_connected();
      const result = new PaintPanel(panel2, to_canvas2);
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
    const inputVolume = new Volume$1(shape_in2, content_in, ijk2xyz_in);
    inputVolume.attach_to_context(context2);
    const samplerAction = new SampleVolume(shape_out, ijk2xyz_out, inputVolume);
    samplerAction.attach_to_context(context2);
    samplerAction.run();
    const resultArray = await samplerAction.pull();
    console.log("expected", content_out);
    console.log("got output", resultArray);
  }
  const sample_test = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    do_sample
  }, Symbol.toStringTag, { value: "Module" }));
  var context$1, to_canvas, painter$1;
  function do_paint(canvas) {
    painter$1 = new ImagePainter(colors, 2, 2, canvas);
  }
  function do_paint1(canvas) {
    console.log("painting panel asyncronously");
    to_canvas = canvas;
    context$1 = new Context();
    context$1.connect_then_call(do_paint_async);
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
  const colors2 = new Uint32Array([
    RGBA(0, 1, 0, 1),
    RGBA(0, 0, 1, 1),
    RGBA(1, 1, 0, 1),
    RGBA(1, 0, 0, 1)
  ]);
  var colorsA = colors;
  var colorsB = colors2;
  var panel$1;
  function do_paint_async() {
    const width = 2;
    const height = 2;
    panel$1 = new Panel(width, height);
    painter$1 = new PaintPanel(panel$1, to_canvas);
    panel$1.attach_to_context(context$1);
    painter$1.attach_to_context(context$1);
    panel$1.push_buffer(colorsA);
    painter$1.run();
  }
  function change_paint1(to_canvas2) {
    [colorsA, colorsB] = [colorsB, colorsA];
    panel$1.push_buffer(colorsA);
    painter$1.reset(panel$1);
    painter$1.run();
  }
  function change_paint(to_canvas2) {
    [colorsA, colorsB] = [colorsB, colorsA];
    painter$1.change_image(colorsA);
  }
  const paint_test = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    change_paint,
    change_paint1,
    do_paint,
    do_paint1
  }, Symbol.toStringTag, { value: "Module" }));
  const combine_depth_buffers = '\n// Suffix pasting input depth buffer over output where depth dominates\n// Requires "depth_buffer.wgsl"\n\n@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;\n\n@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;\n\n@group(2) @binding(0) var<storage, read> input_offset_ij_sign: vec3i;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    let outputOffset = global_id.x;\n    let outputShape = outputDB.shape;\n    let outputLocation = depth_buffer_indices(outputOffset, outputShape);\n    if (outputLocation.valid) {\n        let inputIndices = outputLocation.ij + input_offset_ij_sign.xy;\n        let inputShape = inputDB.shape;\n        let inputLocation = depth_buffer_location_of(inputIndices, inputShape);\n        if (inputLocation.valid) {\n            let inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];\n            let inputData = inputDB.data_and_depth[inputLocation.data_offset];\n            if (!is_default(inputData, inputDepth, inputShape)) {\n                let outputDepth = outputDB.data_and_depth[outputLocation.depth_offset];\n                let outputData = outputDB.data_and_depth[outputLocation.data_offset];\n                if (is_default(outputData, outputDepth, outputShape) || \n                    (((inputDepth - outputDepth) * f32(input_offset_ij_sign.z)) < 0.0)) {\n                    outputDB.data_and_depth[outputLocation.depth_offset] = inputDepth;\n                    outputDB.data_and_depth[outputLocation.data_offset] = inputData;\n                }\n            }\n            // DEBUG\n            //outputDB.data_and_depth[outputLocation.depth_offset] = bitcast<f32>(0x99999999u);\n            //outputDB.data_and_depth[outputLocation.data_offset] = bitcast<f32>(0x99999999u);\n            \n        //} else {\n            // DEBUG\n            //outputDB.data_and_depth[outputLocation.depth_offset] = 55.5;\n            //outputDB.data_and_depth[outputLocation.data_offset] = 55.5;\n        }\n    }\n}';
  const combine_depth_buffers$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: combine_depth_buffers
  }, Symbol.toStringTag, { value: "Module" }));
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
      const mappedInts = new Int32Array(arrayBuffer);
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
    getWorkgroupCounts() {
      return [Math.ceil(this.target.size / 256), 1, 1];
    }
  }
  const CombineDepths$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    CombineDepths
  }, Symbol.toStringTag, { value: "Module" }));
  function do_combine() {
    console.log("computing sample asyncronously");
    (async () => await do_combine_async0())();
  }
  async function do_combine_async0() {
    const context2 = new Context();
    await context2.connect();
    const shape = [3, 3];
    const dd = -666;
    const dv = -666;
    const input_data = [
      1,
      2,
      dv,
      4,
      5,
      6,
      7,
      8,
      9
    ];
    const input_depths = [
      1,
      2,
      dd,
      4,
      5,
      6,
      7,
      8,
      9
    ];
    const output_data = [
      9,
      8,
      7,
      6,
      5,
      4,
      dv,
      2,
      1
    ];
    const output_depths = [
      9,
      8,
      7,
      6,
      5,
      4,
      dd,
      2,
      1
    ];
    const inputDB = new DepthBuffer(
      shape,
      dd,
      dv,
      input_data,
      input_depths,
      Float32Array
    );
    const outputDB = new DepthBuffer(
      shape,
      dd,
      dv,
      output_data,
      output_depths,
      Float32Array
    );
    inputDB.attach_to_context(context2);
    outputDB.attach_to_context(context2);
    const combine_action = new CombineDepths(
      outputDB,
      inputDB
    );
    combine_action.attach_to_context(context2);
    combine_action.run();
    const resultArray = await outputDB.pull_data();
    console.log("got result", resultArray);
    console.log("outputDB", outputDB);
  }
  const combine_test = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    do_combine
  }, Symbol.toStringTag, { value: "Module" }));
  const panel_buffer = "\n// Framework for panel buffer structure\n// A panel consists of a buffer representing a rectangular screen region.\n// with height and width.\n\nstruct PanelOffset {\n    offset: u32,\n    ij: vec2u,\n    is_valid: bool\n}\n\nfn panel_location_of(offset: u32, height_width: vec2u)-> PanelOffset  {\n    // location of buffer offset in row/col form.\n    let height = height_width[0];\n    let width = height_width[1];\n    var result : PanelOffset;\n    result.offset = offset;\n    result.is_valid = (offset < width * height);\n    if (result.is_valid) {\n        let row = offset / width;\n        let col = offset - row * width;\n        result.ij = vec2u(row, col);\n    }\n    return result;\n}\n\nfn panel_offset_of(ij: vec2u, height_width: vec2u) -> PanelOffset {\n    // buffer offset of row/col\n    var result : PanelOffset;\n    result.is_valid = all(ij < height_width);\n    if (result.is_valid) {\n        //const height = height_width[0];\n        let width = height_width[1];\n        result.offset = ij[0] * width + ij[1];\n        result.ij = ij;\n    }\n    return result;\n}\n\nfn f_panel_offset_of(xy: vec2f, height_width: vec2u)-> PanelOffset {\n    // buffer offset of vec2f row/col\n    var result : PanelOffset;\n    result.is_valid = ((xy[0] >= 0.0) && (xy[1] >= 0.0));\n    if (result.is_valid) {\n        result = panel_offset_of(vec2u(xy), height_width);\n    }\n    return result;\n}\n\n// xxxx this should be a builtin 'pack4xU8'...\nfn f_pack_color(color: vec3f) -> u32 {\n    let ucolor = vec3u(clamp(\n        255.0 * color, \n        vec3f(0.0, 0.0, 0.0),\n        vec3f(255.0, 255.0, 255.0)));\n    return ucolor[0] + \n        256u * (ucolor[1] + 256u * (ucolor[2] + 256u * 255u));\n}\n";
  const panel_buffer$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: panel_buffer
  }, Symbol.toStringTag, { value: "Module" }));
  const paste_panel = "\n// suffix for pasting one panel onto another\n\nstruct parameters {\n    in_hw: vec2u,\n    out_hw: vec2u,\n    offset: vec2i,\n}\n\n@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;\n\n@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    // input expected to be smaller, so loop over input\n    let inputOffset = global_id.x;\n    let in_hw = parms.in_hw;\n    let in_location = panel_location_of(inputOffset, in_hw);\n    if (in_location.is_valid) {\n        let paste_location = vec2f(parms.offset) + vec2f(in_location.ij);\n        let out_hw = parms.out_hw;\n        let out_location = f_panel_offset_of(paste_location, out_hw);\n        if (out_location.is_valid) {\n            let value = inputBuffer[in_location.offset];\n            outputBuffer[out_location.offset] = value;\n        }\n    }\n}";
  const paste_panel$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: paste_panel
  }, Symbol.toStringTag, { value: "Module" }));
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
  const PastePanel$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    PastePanel
  }, Symbol.toStringTag, { value: "Module" }));
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
  const paste_test = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    do_paste
  }, Symbol.toStringTag, { value: "Module" }));
  function do_mouse_paste(to_canvas2) {
    console.log("pasting asyncronously");
    defer(do_mouse_paste_async(to_canvas2));
  }
  function defer(future) {
    (async () => await future)();
  }
  async function do_mouse_paste_async(to_canvas2) {
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
    const painter2 = new PaintPanel(target, to_canvas2);
    painter2.attach_to_context(context2);
    painter2.run();
    const brec = to_canvas2.getBoundingClientRect();
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
    to_canvas2.addEventListener("mousemove", mousemove);
  }
  const mousepaste = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    do_mouse_paste
  }, Symbol.toStringTag, { value: "Module" }));
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
  const gray_test = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    do_gray
  }, Symbol.toStringTag, { value: "Module" }));
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
    const inputVolume = new Volume$1(shape_in2, content_in, ijk2xyz_in, Float32Array);
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
  const max_projection_test = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    do_max_projection
  }, Symbol.toStringTag, { value: "Module" }));
  class Orbiter {
    constructor(canvas, center, initial_rotation2, callback) {
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
      this.attach_listeners_to(canvas);
      this.active = false;
      this.current_rotation = MM_product(eye(3), this.initial_rotation);
      this.next_rotation = this.current_rotation;
      this.last_stats = null;
    }
    attach_listeners_to(canvas) {
      const that = this;
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
  const canvas_orbit = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Orbiter
  }, Symbol.toStringTag, { value: "Module" }));
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
  const pipeline_test = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    do_pipeline,
    do_rotation
  }, Symbol.toStringTag, { value: "Module" }));
  class Volume {
    constructor(shape, data) {
      const [K, J, I] = shape;
      this.shape = shape;
      this.size = I * J * K;
      const ln = data.length;
      if (this.size != ln) {
        throw new Error(
          `data length ${ln} doesn't match shape ${shape}`
        );
      }
      this.data = new Float32Array(data);
    }
    gpu_volume(context2, dK, dJ, dI) {
      dK = dK || 1;
      dJ = dJ || 1;
      dI = dI || 1;
      const [K, J, I] = this.shape;
      const maxIJK = Math.max(I, J, K);
      const maxdIJK = Math.max(dI * I, dJ * J, dK * K);
      const s = maxIJK / maxdIJK;
      const scaling = [
        [s * dK, 0, 0, 0],
        [0, s * dJ, 0, 0],
        [0, 0, s * dI, 0],
        [0, 0, 0, 1]
      ];
      const swap = [
        [0, -1, 0, 0],
        [0, 0, 1, 0],
        [1, 0, 0, 0],
        [0, 0, 0, 1]
      ];
      const distortion = MM_product(swap, scaling);
      const translation = affine3d(null, [-K / 2, -J / 2, -I / 2]);
      const ijk2xyz = MM_product(distortion, translation);
      const volume2 = context2.volume(
        this.shape,
        this.data,
        ijk2xyz,
        Float32Array
      );
      return volume2;
    }
  }
  function volume_from_prefixed_data(data) {
    const shape = data.slice(0, 3);
    const suffix_data = data.slice(3);
    return new Volume(shape, suffix_data);
  }
  async function fetch_volume_prefixed(url, kind) {
    kind = kind || Float32Array;
    const buffer = await fetch_buffer(url);
    const prefixed_data = new kind(buffer);
    return volume_from_prefixed_data(prefixed_data);
  }
  async function fetch_volume(shape, url, kind = Float32Array) {
    const buffer = await fetch_buffer(url);
    const data = new kind(buffer);
    return new Volume(shape, data);
  }
  async function fetch_buffer(url) {
    const response = await fetch(url);
    const content = await response.blob();
    const buffer = await content.arrayBuffer();
    return buffer;
  }
  const CPUVolume = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Volume,
    fetch_volume,
    fetch_volume_prefixed
  }, Symbol.toStringTag, { value: "Module" }));
  const depth_buffer_range = '\n// Select a range in depths or values from a depth buffer \n// copied to output depth buffer at same ij locations where valid.\n\n// Requires "depth_buffer.wgsl".\n\nstruct parameters {\n    lower_bound: f32,\n    upper_bound: f32,\n    do_values: u32, // flag.  Do values if >0 else do depths.\n}\n\n@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;\n\n@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    let outputOffset = global_id.x;\n    let outputShape = outputDB.shape;\n    let outputLocation = depth_buffer_indices(outputOffset, outputShape);\n    if (outputLocation.valid) {\n        var current_value = outputShape.default_value;\n        var current_depth = outputShape.default_depth;\n        let inputIndices = outputLocation.ij;\n        let inputShape = inputDB.shape;\n        let inputLocation = depth_buffer_location_of(inputIndices, inputShape);\n        if (inputLocation.valid) {\n            let inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];\n            let inputValue = inputDB.data_and_depth[inputLocation.data_offset];\n            var testValue = inputDepth;\n            if (parms.do_values > 0) {\n                testValue = inputValue;\n            }\n            if ((!is_default(inputValue, inputDepth, inputShape)) &&\n                (parms.lower_bound <= testValue) && \n                (testValue <= parms.upper_bound)) {\n                current_depth = inputDepth;\n                current_value = inputValue;\n            }\n        }\n        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;\n        outputDB.data_and_depth[outputLocation.data_offset] = current_value;\n    }\n}';
  const depth_buffer_range$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: depth_buffer_range
  }, Symbol.toStringTag, { value: "Module" }));
  class RangeParameters extends DataObject {
    constructor(lower_bound, upper_bound, do_values) {
      super();
      this.lower_bound = lower_bound;
      this.upper_bound = upper_bound;
      this.do_values = do_values;
      this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedUInts = new Uint32Array(arrayBuffer);
      const mappedFloats = new Float32Array(arrayBuffer);
      mappedFloats[0] = this.lower_bound;
      mappedFloats[1] = this.upper_bound;
      mappedUInts[2] = this.do_values;
    }
  }
  class DepthRange extends UpdateAction {
    constructor(fromDepthBuffer, toDepthBuffer, lower_bound, upper_bound, do_values) {
      super();
      this.source = fromDepthBuffer;
      this.target = toDepthBuffer;
      this.parameters = new RangeParameters(lower_bound, upper_bound, do_values);
    }
    change_bounds(lower_bound, upper_bound) {
      this.parameters.lower_bound = lower_bound;
      this.parameters.upper_bound = upper_bound;
      this.parameters.push_buffer();
    }
    change_lower_bound(lower_bound) {
      this.change_bounds(lower_bound, this.parameters.upper_bound);
    }
    change_upper_bound(upper_bound) {
      this.change_bounds(this.parameters.lower_bound, upper_bound);
    }
    get_shader_module(context2) {
      const gpu_shader = depth_buffer$1 + depth_buffer_range;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    getWorkgroupCounts() {
      return [Math.ceil(this.source.size / 256), 1, 1];
    }
  }
  const DepthBufferRange = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    DepthRange
  }, Symbol.toStringTag, { value: "Module" }));
  const index_colorize = "\n// suffix for pasting one panel onto another\n\nstruct parameters {\n    in_hw: vec2u,\n    out_hw: vec2u,\n    default_color: u32,\n}\n\n@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;\n\n@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    // loop over output\n    let outputOffset = global_id.x;\n    let out_hw = parms.out_hw;\n    let out_location = panel_location_of(outputOffset, out_hw);\n    if (out_location.is_valid) {\n        // initial values arrive as f32\n        let color_index_f = bitcast<f32>(outputBuffer[out_location.offset]);\n        let color_index = u32(color_index_f);\n        let color_ij = vec2u(color_index, 0);\n        //let color_ij = vec2u(0, color_index);\n        let in_hw = parms.in_hw;\n        let color_location = panel_offset_of(color_ij, in_hw);\n        var value = parms.default_color;\n        value = 4294967295u - 256u * 255; // magenta\n        //value = 0;\n        if (color_location.is_valid) {\n            value = inputBuffer[color_location.offset];\n        }\n        // debug\n        //if (color_index < 1000) {\n        //    value = inputBuffer[color_index];\n        //    if (color_index > 5) {\n        //        value = 4294967295u - 256u * 255; // magenta\n        //    }\n        //    //value = 4294967295u - 256 * 256u * 255; // yellow\n        //    //value = 0;\n        //}\n        outputBuffer[out_location.offset] = value;\n    }\n}";
  const index_colorize$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: index_colorize
  }, Symbol.toStringTag, { value: "Module" }));
  class IndexColorParameters extends DataObject {
    constructor(in_hw, out_hw, default_color) {
      super();
      this.in_hw = in_hw;
      this.out_hw = out_hw;
      this.default_color = default_color;
      this.buffer_size = 6 * Int32Array.BYTES_PER_ELEMENT;
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedUInts = new Uint32Array(arrayBuffer);
      mappedUInts.set(this.in_hw);
      mappedUInts.set(this.out_hw, 2);
      mappedUInts[4] = this.default_color;
    }
  }
  class IndexColorizePanel extends UpdateAction {
    // all color values are Uint32 encoded RGBA
    constructor(fromIndexedColors, toPanel, default_color) {
      super();
      const ncolors = fromIndexedColors.width;
      if (ncolors != 1) {
        throw new Error("indexed colors should have width 1: " + ncolors);
      }
      const from_hw = [fromIndexedColors.height, ncolors];
      const to_hw = [toPanel.height, toPanel.width];
      this.parameters = new IndexColorParameters(from_hw, to_hw, default_color);
      this.from_hw = from_hw;
      this.to_hw = to_hw;
      this.default_color = default_color;
      this.source = fromIndexedColors;
      this.target = toPanel;
    }
    get_shader_module(context2) {
      const gpu_shader = panel_buffer + index_colorize;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    getWorkgroupCounts() {
      return [Math.ceil(this.target.size / 256), 1, 1];
    }
  }
  const IndexColorizePanel$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    IndexColorizePanel
  }, Symbol.toStringTag, { value: "Module" }));
  class View extends Action {
    constructor(ofVolume) {
      super();
      this.ofVolume = ofVolume;
      this.set_geometry();
    }
    async paint_on(canvas, orbiting) {
      const context2 = this.ofVolume.context;
      if (!context2) {
        throw new Error("Volume is not attached to GPU context.");
      }
      this.canvas_paint_sequence(context2, canvas);
      if (orbiting) {
        const orbiter_callback2 = this.get_orbiter_callback();
        const rotation = eye(3);
        this.orbiter = new Orbiter(
          canvas,
          null,
          // center,
          rotation,
          orbiter_callback2
          // callback,
        );
      }
      this.run();
    }
    pick_on(canvas, callback, etype) {
      etype = etype || "click";
      const canvas_space = new NormalizedCanvasSpace(canvas);
      const [width, height] = this.output_shape;
      this.panel_space = new PanelSpace(width, height);
      const that = this;
      canvas.addEventListener(etype, async function(event) {
        const pick = await that.pick(event, canvas_space);
        if (callback) {
          callback(pick);
        }
      });
    }
    async pick(event, canvas_space) {
      const normalized = canvas_space.normalize_event_coords(event);
      const panel_space = this.panel_space;
      const panel_coords = panel_space.normalized2ij(normalized);
      var panel_color = null;
      if (this.output_panel) {
        await this.output_panel.pull_buffer();
        panel_color = this.output_panel.color_at(panel_coords);
      }
      return {
        normalized_coords: normalized,
        panel_coords,
        //panel_offset: panel_offset,
        panel_color
      };
    }
    set_geometry() {
      const [K, J, I] = this.ofVolume.shape;
      this.MaxS = Math.max(K, J, I) * Math.sqrt(2);
      const side = Math.ceil(this.MaxS);
      this.output_shape = [side, side];
      this.initial_rotation = eye(3);
      this.affine_translation = affine3d(null, [-side / 2, -side / 2, -side / 2]);
      this.projection_matrix = MM_product(
        affine3d(this.initial_rotation),
        this.affine_translation
      );
      this.space = new ProjectionSpace(this.projection_matrix);
    }
    canvas_paint_sequence(context2, canvas) {
      this.attach_to_context(context2);
      const projection = this.panel_sequence(context2);
      this.output_panel = projection.output_panel;
      const painter2 = context2.paint(projection.output_panel, canvas);
      this.paint_sequence = context2.sequence([
        projection.sequence,
        painter2
      ]);
      return this.paint_sequence;
    }
    async run() {
      const sequence2 = this.paint_sequence || this.project_to_panel;
      sequence2.run();
    }
    panel_sequence(context2) {
      throw new Error("panel_sequence must be defined in subclass.");
    }
    _orbiter_callback(affine_transform) {
      const matrix = MM_product(affine_transform, this.projection_matrix);
      this.change_matrix(matrix);
      this.run();
    }
    change_matrix(matrix) {
      this.space = new ProjectionSpace(matrix);
    }
    get_orbiter_callback() {
      const that = this;
      return function(affine_transform) {
        return that._orbiter_callback(affine_transform);
      };
    }
    orbit2xyz_v(ijk) {
      return this.space.ijk2xyz_v(ijk);
    }
    xyz2volume_v(xyz) {
      return this.ofVolume.space.xyz2ijk_v(xyz);
    }
    orbit2volume_v(ijk) {
      return this.xyz2volume_v(this.orbit2xyz_v(ijk));
    }
    orbit_sample(ijk) {
      const xyz = this.orbit2xyz_v(ijk);
      const volume_indices = this.xyz2volume_v(xyz);
      var volume_offset = this.ofVolume.space.ijk2offset(volume_indices);
      var volume_sample = null;
      if (this.data && volume_offset !== null) {
        volume_sample = this.ofVolume.data[volume_offset];
      }
      return {
        xyz,
        volume_indices,
        volume_offset,
        volume_sample
      };
    }
    get_output_depth_buffer(context2, default_depth, default_value, kind) {
      default_depth = default_depth || -1e10;
      default_value = default_value || 0;
      kind = kind || Float32Array;
      context2 = context2 || this.context;
      return context2.depth_buffer(
        this.output_shape,
        default_depth,
        default_value,
        null,
        // no input data
        null,
        // no input depth
        kind
      );
    }
    get_output_panel(context2) {
      context2 = context2 || this.context;
      const [height, width] = this.output_shape;
      return context2.panel(width, height);
    }
    get_gray_panel_sequence(for_depth_buffer, min_value, max_value) {
      const context2 = this.context;
      const flat_panel = this.get_output_panel(context2);
      const flatten_action = for_depth_buffer.flatten_action(flat_panel);
      const gray_panel = this.get_output_panel(context2);
      const gray_action = context2.to_gray_panel(
        flat_panel,
        gray_panel,
        min_value,
        max_value
      );
      const gray_panel_sequence = context2.sequence([
        flatten_action,
        gray_action
      ]);
      return {
        sequence: gray_panel_sequence,
        output_panel: gray_panel
      };
    }
  }
  const ViewVolume = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    View
  }, Symbol.toStringTag, { value: "Module" }));
  let Max$1 = class Max extends View {
    async pick(event, canvas_space) {
      const result = await super.pick(event, canvas_space);
      const panel_coords = result.panel_coords;
      await this.max_depth_buffer.pull_data();
      result.maximum = this.max_depth_buffer.location(
        panel_coords,
        this.space,
        this.ofVolume
      );
      return result;
    }
    panel_sequence(context2) {
      context2 = context2 || this.context;
      const inputVolume = this.ofVolume;
      this.min_value = inputVolume.min_value;
      this.max_value = inputVolume.max_value;
      this.max_depth_buffer = this.get_output_depth_buffer(context2);
      this.max_panel = this.get_output_panel(context2);
      this.grey_panel = this.get_output_panel(context2);
      this.project_action = context2.max_projection(
        inputVolume,
        this.max_depth_buffer,
        this.projection_matrix
      );
      this.flatten_action = this.flatten_action = this.max_depth_buffer.flatten_action(
        this.max_panel
      );
      this.gray_action = context2.to_gray_panel(
        this.max_panel,
        this.grey_panel,
        this.min_value,
        this.max_value
      );
      this.project_to_panel = context2.sequence([
        this.project_action,
        this.flatten_action,
        this.gray_action
      ]);
      return {
        sequence: this.project_to_panel,
        output_panel: this.grey_panel
      };
    }
    //_orbiter_callback(affine_transform) {
    //    const matrix = qdVector.MM_product(affine_transform, this.projection_matrix);
    //    this.project_action.change_matrix(matrix);
    //    const sequence = this.paint_sequence || this.project_to_panel;
    //    sequence.run();
    //};
    change_matrix(matrix) {
      super.change_matrix(matrix);
      this.project_action.change_matrix(matrix);
    }
  };
  const MaxView = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Max: Max$1
  }, Symbol.toStringTag, { value: "Module" }));
  const mix_color_panels = "\n// suffix for pasting one panel onto another\n\nstruct parameters {\n    ratios: vec4f,\n    in_hw: vec2u,\n    out_hw: vec2u,\n}\n\n// Input and output panels interpreted as u32 rgba\n@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;\n\n@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    // loop over input\n    let inputOffset = global_id.x;\n    let in_hw = parms.in_hw;\n    let in_location = panel_location_of(inputOffset, in_hw);\n    let out_hw = parms.out_hw;\n    let out_location = panel_location_of(inputOffset, out_hw);\n    if ((in_location.is_valid) && (out_location.is_valid)) {\n        let in_u32 = inputBuffer[in_location.offset];\n        let out_u32 = outputBuffer[out_location.offset];\n        let in_color = unpack4x8unorm(in_u32);\n        let out_color = unpack4x8unorm(out_u32);\n        let ratios = parms.ratios;\n        const ones = vec4f(1.0, 1.0, 1.0, 1.0);\n        let mix_color = ((ones - ratios) * out_color) + (ratios * in_color);\n        let mix_value = f_pack_color(mix_color.xyz);\n        outputBuffer[out_location.offset] = mix_value;\n    }\n}";
  const mix_color_panels$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: mix_color_panels
  }, Symbol.toStringTag, { value: "Module" }));
  let MixParameters$1 = class MixParameters extends DataObject {
    constructor(in_hw, out_hw, ratios) {
      super();
      this.in_hw = in_hw;
      this.out_hw = out_hw;
      this.ratios = ratios;
      this.buffer_size = 8 * Int32Array.BYTES_PER_ELEMENT;
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedUInts = new Uint32Array(arrayBuffer);
      const mappedFloats = new Float32Array(arrayBuffer);
      mappedFloats.set(this.ratios, 0);
      mappedUInts.set(this.in_hw, 4);
      mappedUInts.set(this.out_hw, 6);
    }
  };
  class MixPanelsRatios extends UpdateAction {
    constructor(fromPanel, toPanel, ratios) {
      super();
      const from_hw = [fromPanel.height, fromPanel.width];
      const to_hw = [toPanel.height, toPanel.width];
      if (from_hw[0] != to_hw[0] || from_hw[0] != to_hw[0]) {
        throw new Error("Mixed panels to have same shape: " + from_hw + " :: " + to_hw);
      }
      for (var ratio of ratios) {
        if (ratio > 1 || ratio < 0) {
          throw new Error("Invalid ratio: " + ratio);
        }
      }
      this.parameters = new MixParameters$1(from_hw, to_hw, ratios);
      this.from_hw = from_hw;
      this.to_hw = to_hw;
      this.ratios = ratios;
      this.source = fromPanel;
      this.target = toPanel;
    }
    change_ratio(new_ratio) {
      this.ratios = [new_ratio, new_ratio, new_ratio, new_ratio];
      this.parameters.ratios = this.ratios;
      this.parameters.push_buffer();
    }
    get_shader_module(context2) {
      const gpu_shader = panel_buffer + mix_color_panels;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    getWorkgroupCounts() {
      return [Math.ceil(this.source.size / 256), 1, 1];
    }
  }
  class MixPanels extends MixPanelsRatios {
    constructor(fromPanel, toPanel, ratio) {
      const ratios = [ratio, ratio, ratio, ratio];
      super(fromPanel, toPanel, ratios);
    }
  }
  const MixColorPanels = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    MixPanels,
    MixPanelsRatios
  }, Symbol.toStringTag, { value: "Module" }));
  const mix_depth_buffers = "\n// Mix two depth buffers with color values.\n// The shapes of the buffers should usually match.\n\n@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;\n\n@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;\n\n@group(2) @binding(0) var<storage, read> ratios: vec4f;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    let outputOffset = global_id.x;\n    let outputShape = outputDB.shape;\n    let outputLocation = depth_buffer_indices(outputOffset, outputShape);\n    if (outputLocation.valid) {\n        var currentDepth = outputDB.data_and_depth[outputLocation.depth_offset];\n        var currentData = outputDB.data_and_depth[outputLocation.data_offset];\n        let inputShape = inputDB.shape;\n        let inputLocation = depth_buffer_indices(outputOffset, inputShape);\n        if (inputLocation.valid) {\n            let inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];\n            let inputData = inputDB.data_and_depth[inputLocation.data_offset];\n            if (!(is_default(inputData, inputDepth, inputShape))) {\n                //currentDepth = inputDepth;\n                currentDepth = min(currentDepth, inputDepth);\n                // DON'T always mix the colors ???\n                let in_u32 = bitcast<u32>(inputData);\n                let out_u32 = bitcast<u32>(currentData);\n                let in_color = unpack4x8unorm(in_u32);\n                let out_color = unpack4x8unorm(out_u32);\n                //let color = mix(out_color, in_color, ratios);\n                //currentData = bitcast<f32>(pack4x8unorm(mixed_color));\n                const ones = vec4f(1.0, 1.0, 1.0, 1.0);\n                let mix_color = ((ones - ratios) * out_color) + (ratios * in_color);\n                currentData = bitcast<f32>(f_pack_color(mix_color.xyz));\n            }\n        }\n        outputDB.data_and_depth[outputLocation.depth_offset] = currentDepth;\n        outputDB.data_and_depth[outputLocation.data_offset] = currentData;\n    }\n}";
  const mix_depth_buffers$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: mix_depth_buffers
  }, Symbol.toStringTag, { value: "Module" }));
  class MixParameters extends DataObject {
    constructor(ratios) {
      super();
      this.ratios = ratios;
      this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedFloats = new Float32Array(arrayBuffer);
      mappedFloats.set(this.ratios, 0);
    }
  }
  class MixDepthBuffers extends UpdateAction {
    constructor(fromDepthBuffer, toDepthBuffer, ratios) {
      super();
      this.source = fromDepthBuffer;
      this.target = toDepthBuffer;
      this.ratios = ratios;
      this.parameters = new MixParameters(ratios);
    }
    change_ratio(new_ratio) {
      this.ratios = [new_ratio, new_ratio, new_ratio, new_ratio];
      this.parameters.ratios = this.ratios;
      this.parameters.push_buffer();
    }
    get_shader_module(context2) {
      const gpu_shader = panel_buffer + depth_buffer$1 + mix_depth_buffers;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    getWorkgroupCounts() {
      return [Math.ceil(this.target.size / 256), 1, 1];
    }
  }
  const MixDepthBuffers$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    MixDepthBuffers
  }, Symbol.toStringTag, { value: "Module" }));
  const mix_dots_on_panel = "\nstruct parameters {\n    in_hw: vec2u,\n    n_dots: u32,\n}\n\nstruct dot {\n    ratios: vec4f,\n    pos: vec2f,\n    radius: f32,\n    color: u32,\n}\n\n@group(0) @binding(0) var<storage, read> inputDots : array<dot>;\n\n// Output panel interpreted as u32 rgba\n@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n/*\nfn debug_is_this_running(inputDot: dot) -> bool {\n    let in_hw = parms.in_hw;\n    let color = vec3f(1.0, 0.0, 1.0);\n    var u32_color = f_pack_color(color);\n    let size = in_hw.x * in_hw.y;\n    for (var i=0u; i<in_hw.x; i+=1u) {\n        for (var j=0u; j<in_hw.y; j+=1u) {\n            let offset = panel_offset_of(vec2u(i, j), in_hw);\n            if (i > u32(inputDot.pos.x)) {\n                u32_color = f_pack_color(vec3f(0.0, 1.0, 0.0));\n                outputBuffer[offset.offset] = u32_color;\n            }\n            if (j > u32(inputDot.pos.y)) {\n                u32_color = f_pack_color(vec3f(0.0, 0.0, 1.0));\n                outputBuffer[offset.offset] = u32_color;\n            }\n            //outputBuffer[offset.offset] = u32_color;\n        }\n    }\n    return true;\n}\n*/\n\n@compute @workgroup_size(256) // ??? too big?\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    // loop over input\n    let inputIndex = global_id.x;\n    let n_dots = parms.n_dots;\n    if (inputIndex >= n_dots) {\n        return;\n    }\n    let inputDot = inputDots[inputIndex];\n    //debug_is_this_running(inputDot);\n    let in_hw = parms.in_hw;\n    let inputOffset = inputDot.pos;\n    let radius = inputDot.radius;\n    let radius2 = radius * radius;\n    for (var di= - radius; di< radius; di+=1.0) {\n        for (var dj= - radius; dj< radius; dj+=1.0) {\n            if ((di*di + dj*dj <= radius2)) {\n                let location = vec2f(inputDot.pos.x + di, inputDot.pos.y + dj);\n                let offset = f_panel_offset_of(location, in_hw);\n                if (offset.is_valid) {\n                    let original_u32 = outputBuffer[offset.offset];\n                    let original_color = unpack4x8unorm(original_u32);\n                    let dot_u32 = inputDot.color;\n                    let dot_color = unpack4x8unorm(dot_u32);\n                    const ones = vec4f(1.0, 1.0, 1.0, 1.0);\n                    let ratios = inputDot.ratios;\n                    let mix_color = ((ones - ratios) * original_color) + (ratios * dot_color);\n                    let mix_value = f_pack_color(mix_color.xyz);\n                    outputBuffer[offset.offset] = mix_value;\n                }\n            }\n        }\n    }\n}\n";
  const mix_dots_on_panel$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: mix_dots_on_panel
  }, Symbol.toStringTag, { value: "Module" }));
  class MixDotsParameters extends DataObject {
    constructor(in_hw, n_dots) {
      super();
      this.in_hw = in_hw;
      this.n_dots = n_dots;
      this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedUInts = new Uint32Array(arrayBuffer);
      mappedUInts.set(this.in_hw, 0);
      mappedUInts.set([this.n_dots], 2);
    }
    change_n_dots(n_dots) {
      this.n_dots = n_dots;
      this.push_buffer();
    }
  }
  class ColoredDot {
    constructor(position, radius, u32color, ratios) {
      this.position = position;
      this.radius = radius;
      this.u32color = u32color;
      this.ratios = ratios;
    }
    put_on_panel(index, mappedFloats, mappedUInts) {
      const offset = index * 8;
      mappedFloats.set(this.ratios, offset);
      mappedFloats.set(this.position, offset + 4);
      mappedFloats.set([this.radius], offset + 6);
      mappedUInts.set([this.u32color], offset + 7);
    }
  }
  class DotsPanel extends Panel {
    constructor(max_ndots) {
      super(8, max_ndots);
      this.dots = [];
      this.max_ndots = max_ndots;
    }
    add_dot(position, radius, u32color, ratios) {
      const dot = new ColoredDot(position, radius, u32color, ratios);
      if (this.dots.length >= this.max_ndots) {
        throw new Error("Too many dots: " + this.dots.length);
      }
      this.dots.push(dot);
    }
    clear() {
      this.dots = [];
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedUInts = new Uint32Array(arrayBuffer);
      const mappedFloats = new Float32Array(arrayBuffer);
      for (var i = 0; i < this.dots.length; i++) {
        this.dots[i].put_on_panel(i, mappedFloats, mappedUInts);
      }
    }
  }
  class MixDotsOnPanel extends UpdateAction {
    constructor(on_panel, max_ndots) {
      super();
      this.on_panel = on_panel;
      this.max_ndots = max_ndots;
      this.dots_panel = new DotsPanel(max_ndots);
      const hw = [on_panel.height, on_panel.width];
      this.parameters = new MixDotsParameters(hw, 0);
      this.source = this.dots_panel;
      this.target = on_panel;
    }
    get_shader_module(context2) {
      const gpu_shader = panel_buffer + mix_dots_on_panel;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    ndots() {
      return this.dots_panel.dots.length;
    }
    push_dots() {
      this.parameters.change_n_dots(this.ndots());
      this.dots_panel.push_buffer();
    }
    add_pass(commandEncoder) {
      if (this.ndots() < 1) {
        return;
      }
      super.add_pass(commandEncoder);
    }
    getWorkgroupCounts() {
      const ndots = this.ndots();
      return [Math.ceil(ndots / 256), 1, 1];
    }
    clear(no_push = false) {
      this.dots_panel.clear();
      if (!no_push) {
        this.push_dots();
      }
    }
    add_dot(position, radius, u32color, ratios) {
      this.dots_panel.add_dot(position, radius, u32color, ratios);
    }
  }
  const MixDotsOnPanel$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    ColoredDot,
    DotsPanel,
    MixDotsOnPanel
  }, Symbol.toStringTag, { value: "Module" }));
  const threshold = "\n// Project a volume where the values cross a threshold\n// Assumes prefixes: \n//  panel_buffer.wgsl\n//  volume_frame.wgsl\n//  volume_intercept.wgsl\n\nstruct parameters {\n    ijk2xyz : mat4x4f,\n    int3: Intersections3,\n    dk: f32,\n    threshold_value: f32,\n    // 2 float padding at end...???\n}\n\n@group(0) @binding(0) var<storage, read> inputVolume : Volume;\n\n@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    //let local_parms = parms;\n    let outputOffset = global_id.x;\n    let outputShape = outputDB.shape;\n    let outputLocation = depth_buffer_indices(outputOffset, outputShape);\n    // k increment length in xyz space\n    //let dk = 1.0f;  // fix this! -- k increment length in xyz space\n    let dk = parms.dk;\n    var initial_value_found = false;\n    var compare_diff: f32;\n    var threshold_crossed = false;\n    if (outputLocation.valid) {\n        var inputGeometry = inputVolume.geometry;\n        var current_value = outputShape.default_value;\n        var current_depth = outputShape.default_depth;\n        let offsetij = vec2i(outputLocation.ij);\n        let ijk2xyz = parms.ijk2xyz;\n        var threshold_value = parms.threshold_value;\n        var end_points = scan_endpoints(\n            offsetij,\n            parms.int3,\n            &inputGeometry,\n            ijk2xyz,\n        );\n        if (end_points.is_valid) {\n            let offsetij_f = vec2f(offsetij);\n            for (var depth = end_points.offset[0]; depth < end_points.offset[1]; depth += dk) {\n                //let ijkw = vec4u(vec2u(outputLocation.ij), depth, 1u);\n                //let f_ijk = vec4f(ijkw);\n                //let xyz_probe = parms.ijk2xyz * f_ijk;\n                let xyz_probe = probe_point(offsetij_f, depth, ijk2xyz);\n                let input_offset = offset_of_xyz(xyz_probe.xyz, &inputGeometry);\n                if ((input_offset.is_valid) && (!threshold_crossed)) {\n                    let valueu32 = inputVolume.content[input_offset.offset];\n                    let value = bitcast<f32>(valueu32);\n                    let diff = value - threshold_value;\n                    if ((initial_value_found) && (!threshold_crossed)) {\n                        if (compare_diff * diff <= 0.0f) {\n                            threshold_crossed = true;\n                            current_depth = f32(depth);\n                            current_value = value;\n                            break;\n                        }\n                    }\n                    initial_value_found = true;\n                    compare_diff = diff;\n                }\n            }\n        }\n        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;\n        outputDB.data_and_depth[outputLocation.data_offset] = current_value;\n    }\n}\n";
  const threshold$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: threshold
  }, Symbol.toStringTag, { value: "Module" }));
  class ThresholdParameters extends DataObject {
    constructor(ijk2xyz, volume2, threshold_value) {
      super();
      this.volume = volume2;
      this.threshold_value = threshold_value;
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
      mappedFloats[4 * 4 + 3 * 4 + 1] = this.threshold_value;
    }
  }
  class ThresholdProject extends Project {
    constructor(fromVolume, toDepthBuffer, ijk2xyz, threshold_value) {
      super(fromVolume, toDepthBuffer);
      this.threshold_value = threshold_value;
      this.parameters = new ThresholdParameters(ijk2xyz, fromVolume, threshold_value);
    }
    change_threshold(value) {
      this.threshold_value = value;
      this.parameters.threshold_value = value;
      this.parameters.push_buffer();
    }
    get_shader_module(context2) {
      const gpu_shader = volume_frame + depth_buffer$1 + volume_intercepts + threshold;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    //getWorkgroupCounts() {
    //    return [Math.ceil(this.target.size / 256), 1, 1];
    //};
  }
  const ThresholdAction = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    ThresholdProject
  }, Symbol.toStringTag, { value: "Module" }));
  const normal_colors = "\n// for non-default entries of outputDB\n// put RGBA entries where RGB are scaled 255 representations of\n// approximate normals (direction of greatest increase) at the\n// corresponding location in the inputVolume\n\n// Assumes prefixes: \n//  panel_buffer.wgsl\n//  volume_frame.wgsl\n\nstruct parameters {\n    ijk2xyz : mat4x4f,\n    default_value: u32,\n}\n\n@group(0) @binding(0) var<storage, read> inputVolume : Volume;\n\n@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    let outputOffset = global_id.x;\n    let outputShape = outputDB.shape;\n    let outputLocation = depth_buffer_indices(outputOffset, outputShape);\n    if (outputLocation.valid) {\n        var inputGeometry = inputVolume.geometry;\n        var output_value = parms.default_value;\n        var offset_sum = vec3f(0.0f, 0.0f, 0.0f);\n        let depth = outputDB.data_and_depth[outputLocation.depth_offset];\n        let ij = outputLocation.ij;\n        let f_ijk = vec4f(f32(ij[0]), f32(ij[1]), depth, 1.0f);\n        let xyz_probe = parms.ijk2xyz * f_ijk;\n        let xyz = xyz_probe.xyz;\n        let input_offset = offset_of_xyz(xyz, &inputGeometry);\n        var offsets_are_valid = input_offset.is_valid;\n        const combinations = array(\n            vec3u(0,1,2),\n            vec3u(1,2,0),\n            vec3u(2,0,1),\n        );\n        if (offsets_are_valid) {\n            for (var q=0; q<3; q++) {\n                let combo = combinations[q];\n                let M = combo[0];\n                let N = combo[1];\n                let P = combo[2];\n                for (var m_shift=-1; m_shift<=1; m_shift++) {\n                    for (var n_shift=-1; n_shift<=1; n_shift++) {\n                        let vector_center_offset = input_offset.offset;\n                        let vector_center_indices = index_of(vector_center_offset, &inputGeometry);\n                        var left_indices = vector_center_indices.ijk;\n                        var right_indices = vector_center_indices.ijk;\n                        left_indices[P] += 1u;\n                        if (right_indices[P] == 0) {\n                            offsets_are_valid = false;\n                        } else {\n                            right_indices[P] = u32(i32(right_indices[P]) - 1);\n                            let left_offset = offset_of(left_indices, &inputGeometry);\n                            let right_offset = offset_of(right_indices, &inputGeometry);\n                            offsets_are_valid = offsets_are_valid && left_offset.is_valid && right_offset.is_valid;\n                            if (offsets_are_valid) {\n                                let left_point = to_model(left_indices, &inputGeometry);\n                                let right_point = to_model(right_indices, &inputGeometry);\n                                let left_value_u32 = inputVolume.content[left_offset.offset];\n                                let right_value_u32 = inputVolume.content[right_offset.offset];\n                                let weight = bitcast<f32>(left_value_u32) - bitcast<f32>(right_value_u32);\n                                let vector = (left_point - right_point);\n                                offset_sum += weight * vector;\n                            }\n                        } // don't break: set of measure 0\n                    }\n                }\n            }\n        }\n        if (offsets_are_valid) {\n            let L = length(offset_sum);\n            // default to white for 0 normal\n            output_value = 4294967295u;\n            if (L > 1e-10) {\n                let N = normalize(offset_sum);\n                // xxx should clamp?\n                let colors = vec3u((N + 1.0) * 127.5);\n                //let colors = vec3u(255, 0, 0);  // debug\n                //let result = pack4xU8(color); ???error: unresolved call target 'pack4xU8'\n                output_value = \n                    colors[0] + \n                    256 * (colors[1] + 256 * (colors[2] + 256 * 255));\n            }\n        } else {\n            //output_value = 255 * 256; // debug\n        }\n        //...\n        outputDB.data_and_depth[outputLocation.data_offset] = bitcast<f32>(output_value);\n    }\n}";
  const normal_colors$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: normal_colors
  }, Symbol.toStringTag, { value: "Module" }));
  class NormalParameters extends DataObject {
    constructor(ijk2xyz, default_value) {
      super();
      this.set_matrix(ijk2xyz);
      this.default_value = default_value;
      this.buffer_size = (4 * 4 + 4) * Int32Array.BYTES_PER_ELEMENT;
    }
    set_matrix(ijk2xyz) {
      this.ijk2xyz = M_column_major_order(ijk2xyz);
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedFloats = new Float32Array(arrayBuffer);
      mappedFloats.set(this.ijk2xyz, 0);
      mappedFloats[4 * 4] = this.default_value;
    }
  }
  class NormalColorize extends Project {
    constructor(fromVolume, toDepthBuffer, ijk2xyz, default_value) {
      super(fromVolume, toDepthBuffer);
      this.default_value = default_value;
      this.parameters = new NormalParameters(ijk2xyz, default_value);
    }
    get_shader_module(context2) {
      const gpu_shader = volume_frame + depth_buffer$1 + normal_colors;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    //getWorkgroupCounts() {
    //    return [Math.ceil(this.target.size / 256), 1, 1];
    //};
  }
  const NormalAction = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    NormalColorize
  }, Symbol.toStringTag, { value: "Module" }));
  const soften_volume = "\n// quick and dirty volume low pass filter\n\n// Assumes prefixes: \n//  panel_buffer.wgsl\n//  volume_frame.wgsl\n\n// weights per offset rectangular distance from voxel\nstruct parameters {\n    offset_weights: vec4f,\n}\n\n@group(0) @binding(0) var<storage, read> inputVolume : Volume;\n\n@group(1) @binding(0) var<storage, read_write> outputVolume : Volume;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    let columnOffset = global_id.x;\n    var inputGeometry = inputVolume.geometry;\n    var outputGeometry = outputVolume.geometry;\n    let width = outputGeometry.shape.xyz.z;\n    let startOffset = columnOffset * width;\n    for (var column=0u; column<width; column = column + 1u) {\n        let outputOffset = startOffset + column;\n        //process_voxel(outputOffset, inputGeometry, outputGeometry); -- xxx refactor inlined\n        let output_index = index_of(outputOffset, &outputGeometry);\n        if (output_index.is_valid) {\n            let input_index = index_of(outputOffset, &inputGeometry);\n            if (input_index.is_valid) {\n                // by default just copy along borders\n                let center = vec3i(output_index.ijk);\n                let offset_weights = parms.offset_weights;\n                var result_value = inputVolume.content[outputOffset];\n                var offsets_valid = all(input_index.ijk > vec3u(0u,0u,0u));\n                var accumulator = 0.0f;\n                for (var di=-1; di<=1; di++) {\n                    for (var dj=-1; dj<=1; dj++) {\n                        for (var dk=-1; dk<=1; dk++) {\n                            let shift = vec3i(di, dj, dk);\n                            let probe = vec3u(shift + center);\n                            let probe_offset = offset_of(probe, &inputGeometry);\n                            offsets_valid = offsets_valid && probe_offset.is_valid;\n                            if (offsets_valid) {\n                                let abs_offset = u32(abs(di) + abs(dj) + abs(dk));\n                                let weight = offset_weights[abs_offset];\n                                let probe_value = bitcast<f32>(inputVolume.content[probe_offset.offset]);\n                                accumulator += (weight * probe_value);\n                            }\n                        }\n                    }\n                }\n                if (offsets_valid) {\n                    result_value = bitcast<u32>(accumulator);\n                }\n                outputVolume.content[outputOffset] = result_value;\n            }\n        }\n    }\n}";
  const soften_volume$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: soften_volume
  }, Symbol.toStringTag, { value: "Module" }));
  const default_weights = new Float32Array([0.43855053, 0.03654588, 0.0151378, 0.02006508]);
  class SoftenParameters extends DataObject {
    constructor(offset_weights) {
      super();
      offset_weights = offset_weights || default_weights;
      this.offset_weights = offset_weights;
      this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedFloats = new Float32Array(arrayBuffer);
      mappedFloats.set(this.offset_weights, 0);
    }
  }
  class SoftenVolume extends UpdateAction {
    constructor(fromVolume, toVolume, offset_weights) {
      super();
      this.source = fromVolume;
      this.target = toVolume;
      this.offset_weights = offset_weights;
      this.parameters = new SoftenParameters(this.offset_weights);
    }
    get_shader_module(context2) {
      const gpu_shader = volume_frame + soften_volume;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    getWorkgroupCounts() {
      const width = this.target.shape[2];
      return [Math.ceil(this.target.size / width / 256), 1, 1];
    }
  }
  const Soften = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    SoftenVolume
  }, Symbol.toStringTag, { value: "Module" }));
  class Mix extends View {
    constructor(ofVolume, indexed_colors, ratio) {
      super(ofVolume);
      this.indexed_colors = indexed_colors;
      this.ratio = ratio;
    }
    async run() {
      await this.colors_promise;
      await this.soften_promise;
      super.run();
    }
    panel_sequence(context2) {
      context2 = context2 || this.context;
      const inputVolume = this.ofVolume;
      this.soft_volume = inputVolume.same_geometry(context2);
      this.depth_buffer = this.get_output_depth_buffer(context2);
      this.index_panel = this.get_output_panel(context2);
      this.output_panel = this.get_output_panel(context2);
      this.threshold_value = 0.5;
      const ncolors = this.indexed_colors.length;
      this.color_panel = context2.panel(1, ncolors);
      this.colors_promise = this.color_panel.push_buffer(this.indexed_colors);
      this.project_action = new ThresholdProject(
        inputVolume,
        this.depth_buffer,
        this.projection_matrix,
        this.threshold_value
      );
      this.project_action.attach_to_context(context2);
      this.index_flatten = this.depth_buffer.flatten_action(this.index_panel);
      this.soften_action = new SoftenVolume(inputVolume, this.soft_volume, null);
      this.soften_action.attach_to_context(context2);
      this.soften_action.run();
      this.soften_promise = context2.onSubmittedWorkDone();
      const default_color = 0;
      this.normal_colorize_action = new NormalColorize(
        this.soft_volume,
        this.depth_buffer,
        this.projection_matrix,
        default_color
      );
      this.normal_colorize_action.attach_to_context(context2);
      this.flatten_normals = this.depth_buffer.flatten_action(this.output_panel);
      this.index_colorize = new IndexColorizePanel(
        this.color_panel,
        this.index_panel,
        default_color
      );
      this.index_colorize.attach_to_context(context2);
      this.mix_action = new MixPanels(
        this.index_panel,
        this.output_panel,
        this.ratio
      );
      this.mix_action.attach_to_context(context2);
      this.project_to_panel = context2.sequence([
        this.project_action,
        this.index_flatten,
        //this.soften_action, // should execute only once (unless volume changes)
        this.normal_colorize_action,
        this.index_colorize,
        this.flatten_normals,
        this.mix_action
      ]);
      return {
        sequence: this.project_to_panel,
        output_panel: this.output_panel
      };
    }
    change_matrix(matrix) {
      this.project_action.change_matrix(matrix);
      this.normal_colorize_action.change_matrix(matrix);
    }
    change_ratio(ratio) {
      this.mix_action.change_ratio(ratio);
      this.run();
    }
  }
  const MixView = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Mix
  }, Symbol.toStringTag, { value: "Module" }));
  const volume_at_depth = "\n\n// Generate values for volume in projection at a given depth as a depth buffer.\n// Assumes prefixes: \n//  depth_buffer.wgsl\n//  volume_frame.wgsl\n//  volume_intercept.wgsl\n\nstruct parameters {\n    ijk2xyz : mat4x4f, // depth buffer to xyz affine transform matrix.\n    depth: f32,  // depth to probe\n    // 3 floats padding at end...???\n}\n\n@group(0) @binding(0) var<storage, read> inputVolume : Volume;\n\n@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;\n\n@group(2) @binding(0) var<storage, read> parms: parameters;\n\n@compute @workgroup_size(256)\nfn main(@builtin(global_invocation_id) global_id : vec3u) {\n    let outputOffset = global_id.x;\n    let outputShape = outputDB.shape;\n    let outputLocation = depth_buffer_indices(outputOffset, outputShape);\n    if (outputLocation.valid) {\n        // xxx refactor with max_value_project somehow?\n        var inputGeometry = inputVolume.geometry;\n        var current_value = outputShape.default_value;\n        var current_depth = outputShape.default_depth;\n        let offsetij_f = vec2f(outputLocation.ij);\n        let ijk2xyz = parms.ijk2xyz;\n        let depth = parms.depth;\n        let xyz_probe = probe_point(offsetij_f, depth, ijk2xyz);\n        let input_offset = offset_of_xyz(xyz_probe.xyz, &inputGeometry);\n        if (input_offset.is_valid) {\n            let valueu32 = inputVolume.content[input_offset.offset];\n            let value = bitcast<f32>(valueu32);\n            current_depth = f32(depth);\n            current_value = value;\n        }\n        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;\n        outputDB.data_and_depth[outputLocation.data_offset] = current_value;\n    }\n}\n";
  const volume_at_depth$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: volume_at_depth
  }, Symbol.toStringTag, { value: "Module" }));
  class DepthParameters extends DataObject {
    constructor(ijk2xyz, depth) {
      super();
      this.depth = depth;
      this.buffer_size = (4 * 4 + 4) * Int32Array.BYTES_PER_ELEMENT;
      this.set_matrix(ijk2xyz);
    }
    set_matrix(ijk2xyz) {
      this.ijk2xyz = M_column_major_order(ijk2xyz);
    }
    load_buffer(buffer) {
      buffer = buffer || this.gpu_buffer;
      const arrayBuffer = buffer.getMappedRange();
      const mappedFloats = new Float32Array(arrayBuffer);
      mappedFloats.set(this.ijk2xyz, 0);
      mappedFloats.set([this.depth], 4 * 4);
    }
    change_depth(depth) {
      this.depth = depth;
      this.push_buffer();
    }
  }
  class VolumeAtDepth extends Project {
    constructor(fromVolume, toDepthBuffer, ijk2xyz, depth) {
      super(fromVolume, toDepthBuffer);
      this.parameters = new DepthParameters(ijk2xyz, depth);
    }
    get_shader_module(context2) {
      const gpu_shader = volume_frame + depth_buffer$1 + volume_intercepts + volume_at_depth;
      return context2.device.createShaderModule({ code: gpu_shader });
    }
    change_depth(depth) {
      this.parameters.change_depth(depth);
    }
  }
  const VolumeAtDepth$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    VolumeAtDepth
  }, Symbol.toStringTag, { value: "Module" }));
  class SegmentationQuad extends View {
    constructor(segmentationVolume, intensityVolume, indexed_colors, range_callback) {
      super(segmentationVolume);
      this.segmentationVolume = segmentationVolume;
      this.intensityVolume = intensityVolume;
      this.range_callback = range_callback;
      this.indexed_colors = indexed_colors;
    }
    async paint_on(canvas, orbiting) {
      throw new Error("SegmentationQuad.paint_on not implemented.");
    }
    async paint_on_canvases(segmentationSliceCanvas, maxCanvas, intensitySliceCanvas, segmentationShadeCanvas, orbiting) {
      const context2 = this.ofVolume.context;
      if (!context2) {
        throw new Error("Volume is not attached to GPU context.");
      }
      this.attach_to_context(context2);
      const projections = this.panel_sequence(context2);
      const slice_painter = context2.paint(projections.seg_slice_panel, segmentationSliceCanvas);
      const max_painter = context2.paint(projections.max_panel, maxCanvas);
      const islice_painter = context2.paint(projections.intensity_slice_panel, intensitySliceCanvas);
      const shaded_painter = context2.paint(projections.shaded_panel, segmentationShadeCanvas);
      this.paint_sequence = context2.sequence([
        projections.sequence,
        slice_painter,
        max_painter,
        islice_painter,
        shaded_painter
      ]);
      if (orbiting) {
        const orbiter_callback2 = this.get_orbiter_callback();
        const rotation = eye(3);
        this.orbiter = new Orbiter(
          segmentationShadeCanvas,
          null,
          // center,
          rotation,
          orbiter_callback2
          // callback,
        );
        this.orbiter.attach_listeners_to(maxCanvas);
        this.orbiter.attach_listeners_to(intensitySliceCanvas);
        this.orbiter.attach_listeners_to(segmentationSliceCanvas);
      }
      this.run();
    }
    panel_sequence(context2) {
      context2 = context2 || this.context;
      this.min_value = this.intensityVolume.min_value;
      this.max_value = this.intensityVolume.max_value;
      this.change_range(this.projection_matrix);
      this.current_depth = (this.min_depth + this.max_depth) / 2;
      const actions_collector = [];
      const maxView = new Max$1(this.intensityVolume);
      this.maxView = maxView;
      maxView.attach_to_context(context2);
      const max_projections = maxView.panel_sequence(context2);
      actions_collector.push(max_projections.sequence);
      this.slice_depth_buffer = this.get_output_depth_buffer(context2);
      this.slice_value_panel = this.get_output_panel(context2);
      this.slice_gray_panel = this.get_output_panel(context2);
      this.slice_project_action = new VolumeAtDepth(
        this.intensityVolume,
        this.slice_depth_buffer,
        this.projection_matrix,
        this.current_depth
      );
      this.slice_project_action.attach_to_context(context2);
      actions_collector.push(this.slice_project_action);
      this.slice_flatten_action = this.slice_depth_buffer.flatten_action(this.slice_value_panel);
      actions_collector.push(this.slice_flatten_action);
      this.slice_gray_action = context2.to_gray_panel(
        this.slice_value_panel,
        this.slice_gray_panel,
        this.min_value,
        this.max_value
      );
      actions_collector.push(this.slice_gray_action);
      const ratio = 0.7;
      const mixView = new Mix(this.segmentationVolume, this.indexed_colors, ratio);
      mixView.attach_to_context(context2);
      this.mixView = mixView;
      const mix_projections = mixView.panel_sequence(context2);
      actions_collector.push(mix_projections.sequence);
      this.segmentation_depth_buffer = this.get_output_depth_buffer(context2);
      this.segmentation_value_panel = this.get_output_panel(context2);
      this.segmentation_color_panel = this.get_output_panel(context2);
      this.segmentation_project_action = new VolumeAtDepth(
        this.segmentationVolume,
        this.segmentation_depth_buffer,
        this.projection_matrix,
        this.current_depth
      );
      this.segmentation_project_action.attach_to_context(context2);
      actions_collector.push(this.segmentation_project_action);
      this.segmentation_flatten_action = this.segmentation_depth_buffer.flatten_action(this.segmentation_value_panel);
      actions_collector.push(this.segmentation_flatten_action);
      const default_color = 0;
      this.indexed_colorize = new IndexColorizePanel(
        mixView.color_panel,
        this.segmentation_value_panel,
        default_color
      );
      this.indexed_colorize.attach_to_context(context2);
      actions_collector.push(this.indexed_colorize);
      this.project_to_panel = context2.sequence(actions_collector);
      return {
        sequence: this.project_to_panel,
        seg_slice_panel: this.segmentation_value_panel,
        max_panel: max_projections.output_panel,
        intensity_slice_panel: this.slice_gray_panel,
        shaded_panel: mix_projections.output_panel
      };
    }
    async pick(event, canvas_space) {
      const result = await super.pick(event, canvas_space);
      const panel_coords = result.panel_coords;
      await this.maxView.max_depth_buffer.pull_data();
      result.maximum = this.maxView.max_depth_buffer.location(
        panel_coords,
        this.space,
        this.intensityVolume
      );
      await this.slice_depth_buffer.pull_data();
      result.intensity_slice = this.slice_depth_buffer.location(
        panel_coords,
        this.space,
        this.intensityVolume
      );
      await this.mixView.depth_buffer.pull_data();
      result.segmentation = this.mixView.depth_buffer.location(
        panel_coords,
        this.space,
        this.segmentationVolume
      );
      await this.segmentation_depth_buffer.pull_data();
      result.segmentation_slice = this.segmentation_depth_buffer.location(
        panel_coords,
        this.space,
        this.segmentationVolume
      );
      return result;
    }
    change_depth(depth) {
      this.current_depth = depth;
      this.slice_project_action.change_depth(depth);
      this.segmentation_project_action.change_depth(depth);
      this.run();
    }
    change_matrix(matrix) {
      super.change_matrix(matrix);
      this.maxView.change_matrix(matrix);
      this.slice_project_action.change_matrix(matrix);
      this.segmentation_project_action.change_matrix(matrix);
      this.mixView.change_matrix(matrix);
      this.change_range(matrix);
    }
    change_range(matrix) {
      const invert_matrix = true;
      const range = this.ofVolume.projected_range(matrix, invert_matrix);
      this.min_depth = range.min[2];
      this.max_depth = range.max[2];
      if (this.range_callback) {
        this.range_callback(this.min_depth, this.max_depth);
      }
    }
  }
  const SegmentationQuad$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    SegmentationQuad
  }, Symbol.toStringTag, { value: "Module" }));
  class SlicedThreshold extends View {
    constructor(ofVolume, threshold_value, debugging, range_callback) {
      super(ofVolume);
      this.threshold_value = threshold_value;
      this.debugging = debugging;
      this.range_callback = range_callback;
    }
    change_threshold(value) {
      this.project_action.change_threshold(value);
      this.run();
    }
    async run() {
      await this.soften_promise;
      super.run();
      if (this.debugging) {
        await this.context.onSubmittedWorkDone();
        this.threshold_depth_buffer.pull_data();
        this.level_depth_buffer.pull_data();
        this.level_clone_depth_buffer.pull_data();
        this.front_depth_buffer.pull_data();
        this.back_depth_buffer.pull_data();
        this.output_depth_buffer.pull_data();
        await this.context.onSubmittedWorkDone();
        debugger;
      }
    }
    panel_sequence(context2) {
      context2 = context2 || this.context;
      const inputVolume = this.ofVolume;
      this.min_value = inputVolume.min_value;
      this.max_value = inputVolume.max_value;
      this.change_range(this.projection_matrix);
      this.soft_volume = inputVolume.same_geometry(context2);
      this.soften_action = new SoftenVolume(inputVolume, this.soft_volume, null);
      this.soften_action.attach_to_context(context2);
      this.soften_action.run();
      this.soften_promise = context2.onSubmittedWorkDone();
      this.threshold_depth_buffer = this.get_output_depth_buffer(context2);
      this.threshold_value = this.threshold_value || (inputVolume.min_value + inputVolume.max_value) / 2;
      this.project_action = new ThresholdProject(
        inputVolume,
        this.threshold_depth_buffer,
        this.projection_matrix,
        this.threshold_value
      );
      this.project_action.attach_to_context(context2);
      const default_color = 0;
      this.normal_colorize_action = new NormalColorize(
        this.soft_volume,
        this.threshold_depth_buffer,
        this.projection_matrix,
        default_color
      );
      this.normal_colorize_action.attach_to_context(context2);
      const invert_matrix = true;
      const range = inputVolume.projected_range(this.projection_matrix, invert_matrix);
      this.current_depth = (range.max[2] + range.min[2]) / 2;
      this.level_depth_buffer = this.get_output_depth_buffer(context2);
      this.level_project_action = new VolumeAtDepth(
        inputVolume,
        this.level_depth_buffer,
        this.projection_matrix,
        this.current_depth
      );
      this.level_project_action.attach_to_context(context2);
      this.level_clone_operation = this.level_depth_buffer.clone_operation();
      this.clone_level_action = this.level_clone_operation.clone_action;
      this.level_clone_depth_buffer = this.level_clone_operation.clone;
      this.level_gray_action = new PaintDepthBufferGray(
        this.level_depth_buffer,
        this.level_clone_depth_buffer,
        inputVolume.min_value,
        inputVolume.max_value
      );
      this.level_gray_action.attach_to_context(context2);
      this.front_depth_buffer = this.get_output_depth_buffer(context2);
      const far_behind = -1e11;
      this.slice_front_action = new DepthRange(
        this.threshold_depth_buffer,
        this.front_depth_buffer,
        far_behind,
        //range.min[2],
        this.current_depth,
        0
        // slice depths, not values
      );
      this.slice_front_action.attach_to_context(context2);
      this.back_depth_buffer = this.get_output_depth_buffer(context2);
      const far_distant = 1e11;
      this.slice_back_action = new DepthRange(
        this.threshold_depth_buffer,
        this.back_depth_buffer,
        this.current_depth,
        far_distant,
        //range.max[2],
        0
        // slice depths, not values
      );
      this.slice_back_action.attach_to_context(context2);
      this.back_level_ratios = [0.5, 0.5, 0.5, 1];
      this.mix_back_level_action = new MixDepthBuffers(
        this.back_depth_buffer,
        //this.front_depth_buffer, // debug test
        this.level_clone_depth_buffer,
        this.back_level_ratios
      );
      this.mix_back_level_action.attach_to_context(context2);
      this.output_clone_operation = this.front_depth_buffer.clone_operation();
      this.output_clone_action = this.output_clone_operation.clone_action;
      this.output_depth_buffer = this.output_clone_operation.clone;
      {
        this.combine_ratios = [0.5, 0.5, 0.5, 1];
        this.combine_action = new MixDepthBuffers(
          this.level_clone_depth_buffer,
          //this.front_depth_buffer, // debug test
          this.output_depth_buffer,
          this.combine_ratios
        );
        this.combine_action.attach_to_context(context2);
      }
      this.panel = this.get_output_panel(context2);
      this.flatten_action = this.output_depth_buffer.flatten_action(this.panel);
      this.project_to_panel = context2.sequence([
        this.project_action,
        this.normal_colorize_action,
        this.level_project_action,
        this.clone_level_action,
        this.level_gray_action,
        this.slice_front_action,
        this.slice_back_action,
        this.mix_back_level_action,
        this.output_clone_action,
        this.combine_action,
        this.flatten_action
      ]);
      return {
        sequence: this.project_to_panel,
        output_panel: this.panel
      };
    }
    // remainder is very similar to TestDepthView
    change_matrix(matrix) {
      super.change_matrix(matrix);
      this.project_action.change_matrix(matrix);
      this.normal_colorize_action.change_matrix(matrix);
      this.level_project_action.change_matrix(matrix);
      this.change_range(matrix);
      this.update_levels();
    }
    change_range(matrix) {
      debugger;
      const invert_matrix = true;
      const range = this.ofVolume.projected_range(matrix, invert_matrix);
      this.min_depth = range.min[2];
      this.max_depth = range.max[2];
      if (this.range_callback) {
        this.range_callback(this.min_depth, this.max_depth);
      }
    }
    change_depth(new_depth) {
      this.current_depth = new_depth;
    }
    update_levels() {
      this.level_project_action.change_depth(this.current_depth);
      this.slice_front_action.change_bounds(this.min_depth, this.current_depth);
      this.slice_back_action.change_bounds(this.current_depth, this.max_depth);
    }
  }
  const SlicedThresholdView = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    SlicedThreshold
  }, Symbol.toStringTag, { value: "Module" }));
  class Threshold extends View {
    constructor(ofVolume, soften) {
      super(ofVolume);
      this.soften = soften;
    }
    async run() {
      if (this.soften) {
        await this.soften_promise;
      }
      super.run();
    }
    panel_sequence(context2) {
      context2 = context2 || this.context;
      const inputVolume = this.ofVolume;
      this.depth_buffer = this.get_output_depth_buffer(context2);
      this.panel = this.get_output_panel(context2);
      this.min_value = inputVolume.min_value;
      this.max_value = inputVolume.max_value;
      this.threshold_value = (inputVolume.min_value + inputVolume.max_value) / 2;
      var project_volume = inputVolume;
      if (this.soften) {
        this.soft_volume = inputVolume.same_geometry(context2);
        this.soften_action = new SoftenVolume(inputVolume, this.soft_volume, null);
        this.soften_action.attach_to_context(context2);
        this.soften_action.run();
        this.soften_promise = context2.onSubmittedWorkDone();
        project_volume = this.soft_volume;
      }
      this.project_action = new ThresholdProject(
        project_volume,
        this.depth_buffer,
        this.projection_matrix,
        this.threshold_value
      );
      this.project_action.attach_to_context(context2);
      const default_color = 0;
      this.colorize_action = new NormalColorize(
        inputVolume,
        this.depth_buffer,
        this.projection_matrix,
        default_color
      );
      this.colorize_action.attach_to_context(context2);
      this.flatten_action = this.depth_buffer.flatten_action(this.panel);
      this.project_to_panel = context2.sequence([
        this.project_action,
        this.colorize_action,
        this.flatten_action
      ]);
      return {
        sequence: this.project_to_panel,
        output_panel: this.panel
      };
    }
    //run() { // xxx move to viewVolume.View
    //    const sequence = this.paint_sequence || this.project_to_panel;
    //    sequence.run();
    //};
    /*
    _orbiter_callback(affine_transform) {
        // xxxx move to viewVolume.View ???
        const matrix = qdVector.MM_product(affine_transform, this.projection_matrix);
        this.project_action.change_matrix(matrix);
        this.colorize_action.change_matrix(matrix);
        this.run();
        //const sequence = this.paint_sequence || this.project_to_panel;
        //sequence.run();
    };
    */
    change_matrix(matrix) {
      super.change_matrix(matrix);
      this.project_action.change_matrix(matrix);
      this.colorize_action.change_matrix(matrix);
    }
    change_threshold(value) {
      this.project_action.change_threshold(value);
      this.run();
    }
  }
  const ThresholdView = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Threshold
  }, Symbol.toStringTag, { value: "Module" }));
  class Triptych extends View {
    constructor(ofVolume, range_callback) {
      super(ofVolume);
      this.range_callback = range_callback;
    }
    async run() {
      await this.soften_promise;
      super.run();
    }
    async paint_on(canvas, orbiting) {
      throw new Error("Triptych.paint_on not implemented.");
    }
    async paint_on_canvases(iso_canvas, max_canvas, slice_canvas, orbiting) {
      const context2 = this.ofVolume.context;
      if (!context2) {
        throw new Error("Volume is not attached to GPU context.");
      }
      this.attach_to_context(context2);
      const projections = this.panel_sequence(context2);
      const iso_painter = context2.paint(projections.iso_output_panel, iso_canvas);
      const max_painter = context2.paint(projections.max_output_panel, max_canvas);
      const slice_painter = context2.paint(projections.slice_output_panel, slice_canvas);
      this.paint_sequence = context2.sequence([
        projections.sequence,
        iso_painter,
        max_painter,
        slice_painter
      ]);
      if (orbiting) {
        const orbiter_callback2 = this.get_orbiter_callback();
        const rotation = eye(3);
        this.orbiter = new Orbiter(
          slice_canvas,
          null,
          // center,
          rotation,
          orbiter_callback2
          // callback,
        );
        this.orbiter.attach_listeners_to(iso_canvas);
        this.orbiter.attach_listeners_to(max_canvas);
      }
      this.run();
    }
    async pick(event, canvas_space) {
      const result = await super.pick(event, canvas_space);
      const panel_coords = result.panel_coords;
      await this.slice_depth_buffer.pull_data();
      result.slice_depth = this.slice_depth_buffer.location(panel_coords, this.space, this.ofVolume);
      await this.max_depth_buffer.pull_data();
      result.max_depth = this.max_depth_buffer.location(panel_coords, this.space, this.ofVolume);
      await this.threshold_depth_buffer.pull_data();
      result.threshold_depth = this.threshold_depth_buffer.location(panel_coords, this.space, this.ofVolume);
      return result;
    }
    panel_sequence(context2) {
      debugger;
      context2 = context2 || this.context;
      const actions_collector = [];
      const inputVolume = this.ofVolume;
      this.min_value = inputVolume.min_value;
      this.max_value = inputVolume.max_value;
      this.change_range(this.projection_matrix);
      this.current_depth = (this.min_depth + this.max_depth) / 2;
      this.soft_volume = inputVolume.same_geometry(context2);
      this.soften_action = new SoftenVolume(inputVolume, this.soft_volume, null);
      this.soften_action.attach_to_context(context2);
      this.soften_action.run();
      this.soften_promise = context2.onSubmittedWorkDone();
      this.threshold_depth_buffer = this.get_output_depth_buffer(context2);
      this.threshold_value = (inputVolume.min_value + inputVolume.max_value) / 2;
      this.soft_volume;
      this.threshold_project_action = new ThresholdProject(
        inputVolume,
        this.threshold_depth_buffer,
        this.projection_matrix,
        this.threshold_value
      );
      this.threshold_project_action.attach_to_context(context2);
      actions_collector.push(this.threshold_project_action);
      const default_color = 0;
      this.colorize_action = new NormalColorize(
        this.soft_volume,
        this.threshold_depth_buffer,
        this.projection_matrix,
        default_color
      );
      this.colorize_action.attach_to_context(context2);
      actions_collector.push(this.colorize_action);
      this.iso_panel = this.get_output_panel(context2);
      this.iso_flatten_action = this.threshold_depth_buffer.flatten_action(this.iso_panel);
      actions_collector.push(this.iso_flatten_action);
      this.max_depth_buffer = this.get_output_depth_buffer(context2);
      this.max_value = inputVolume.max_value;
      this.max_project_action = context2.max_projection(
        inputVolume,
        this.max_depth_buffer,
        this.projection_matrix
      );
      actions_collector.push(this.max_project_action);
      this.max_panel = this.get_output_panel(context2);
      this.max_flatten_action = this.max_depth_buffer.flatten_action(this.max_panel);
      actions_collector.push(this.max_flatten_action);
      this.max_gray_panel = this.get_output_panel(context2);
      this.max_gray_action = context2.to_gray_panel(
        this.max_panel,
        this.max_gray_panel,
        this.min_value,
        this.max_value
      );
      actions_collector.push(this.max_gray_action);
      this.slice_depth_buffer = this.get_output_depth_buffer(context2);
      this.slice_value_panel = this.get_output_panel(context2);
      this.slice_gray_panel = this.get_output_panel(context2);
      this.slice_project_action = new VolumeAtDepth(
        inputVolume,
        this.slice_depth_buffer,
        this.projection_matrix,
        this.current_depth
      );
      this.slice_project_action.attach_to_context(context2);
      actions_collector.push(this.slice_project_action);
      this.slice_flatten_action = this.slice_depth_buffer.flatten_action(this.slice_value_panel);
      actions_collector.push(this.slice_flatten_action);
      this.slice_gray_action = context2.to_gray_panel(
        this.slice_value_panel,
        this.slice_gray_panel,
        this.min_value,
        this.max_value
      );
      actions_collector.push(this.slice_gray_action);
      this.slice_output_panel = this.slice_gray_panel;
      this.max_output_panel = this.max_gray_panel;
      this.iso_output_panel = this.iso_panel;
      this.project_to_panel = context2.sequence(actions_collector);
      return {
        sequence: this.project_to_panel,
        iso_output_panel: this.iso_panel,
        max_output_panel: this.max_gray_panel,
        slice_output_panel: this.slice_gray_panel
        //panel: this.panel,
        //depth_buffer: this.threshold_depth_buffer,
      };
    }
    change_threshold(value) {
      this.threshold_value = value;
      this.threshold_project_action.change_threshold(value);
      this.run();
    }
    change_matrix(matrix) {
      super.change_matrix(matrix);
      this.threshold_project_action.change_matrix(matrix);
      this.colorize_action.change_matrix(matrix);
      this.max_project_action.change_matrix(matrix);
      this.slice_project_action.change_matrix(matrix);
      this.change_range(matrix);
    }
    change_depth(depth) {
      this.slice_project_action.change_depth(depth);
      this.current_depth = depth;
      this.run();
    }
    change_range(matrix) {
      const invert_matrix = true;
      const range = this.ofVolume.projected_range(matrix, invert_matrix);
      this.min_depth = range.min[2];
      this.max_depth = range.max[2];
      if (this.range_callback) {
        this.range_callback(this.min_depth, this.max_depth);
      }
    }
  }
  const Triptych$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Triptych
  }, Symbol.toStringTag, { value: "Module" }));
  class Max extends View {
    async pick(event, canvas_space) {
      const result = await super.pick(event, canvas_space);
      const panel_coords = result.panel_coords;
      await this.max_depth_buffer.pull_data();
      result.maximum = this.max_depth_buffer.location(
        panel_coords,
        this.space,
        this.ofVolume
      );
      return result;
    }
    panel_sequence(context2) {
      context2 = context2 || this.context;
      const inputVolume = this.ofVolume;
      this.min_value = inputVolume.min_value;
      this.max_value = inputVolume.max_value;
      this.max_depth_buffer = this.get_output_depth_buffer(context2);
      this.max_panel = this.get_output_panel(context2);
      this.grey_panel = this.get_output_panel(context2);
      this.project_action = context2.max_projection(
        inputVolume,
        this.max_depth_buffer,
        this.projection_matrix
      );
      this.flatten_action = this.flatten_action = this.max_depth_buffer.flatten_action(
        this.max_panel
      );
      this.gray_action = context2.to_gray_panel(
        this.max_panel,
        this.grey_panel,
        this.min_value,
        this.max_value
      );
      const max_dots = 1e3;
      this.dots_action = new MixDotsOnPanel(
        this.grey_panel,
        max_dots
      );
      this.dots_action.attach_to_context(context2);
      this.project_to_panel = context2.sequence([
        this.project_action,
        this.flatten_action,
        this.gray_action,
        this.dots_action
      ]);
      return {
        sequence: this.project_to_panel,
        output_panel: this.grey_panel
      };
    }
    //_orbiter_callback(affine_transform) {
    //    const matrix = qdVector.MM_product(affine_transform, this.projection_matrix);
    //    this.project_action.change_matrix(matrix);
    //    const sequence = this.paint_sequence || this.project_to_panel;
    //    sequence.run();
    //};
    change_matrix(matrix) {
      super.change_matrix(matrix);
      this.project_action.change_matrix(matrix);
    }
  }
  const MaxDotView = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Max
  }, Symbol.toStringTag, { value: "Module" }));
  class TestRangeView extends View {
    panel_sequence(context2) {
      context2 = context2 || this.context;
      const inputVolume = this.ofVolume;
      this.min_value = inputVolume.min_value;
      this.max_value = inputVolume.max_value;
      const origin = [0, 0, 0, 1];
      const projection = M_inverse(this.projection_matrix);
      const porigin = Mv_product(projection, origin);
      this.current_depth = porigin[2];
      this.max_depth_buffer = this.get_output_depth_buffer(context2);
      this.max_project_action = context2.max_projection(
        inputVolume,
        this.max_depth_buffer,
        this.projection_matrix
      );
      this.level_depth_buffer = this.get_output_depth_buffer(context2);
      this.level_project_action = new VolumeAtDepth(
        inputVolume,
        this.level_depth_buffer,
        this.projection_matrix,
        this.current_depth
      );
      this.level_project_action.attach_to_context(context2);
      this.front_depth_buffer = this.get_output_depth_buffer(context2);
      this.slice_front_action = new DepthRange(
        this.max_depth_buffer,
        this.front_depth_buffer,
        this.min_value,
        this.current_depth,
        0
        // slice depths, not values
      );
      this.slice_front_action.attach_to_context(context2);
      this.back_depth_buffer = this.get_output_depth_buffer(context2);
      this.slice_back_action = new DepthRange(
        this.max_depth_buffer,
        this.back_depth_buffer,
        this.current_depth,
        this.max_value,
        0
        // slice depths, not values
      );
      this.slice_back_action.attach_to_context(context2);
      this.front_to_gray = this.get_gray_panel_sequence(
        this.front_depth_buffer,
        this.min_value,
        this.max_value
      );
      this.back_to_gray = this.get_gray_panel_sequence(
        this.back_depth_buffer,
        this.min_value,
        this.max_value
      );
      this.level_to_gray = this.get_gray_panel_sequence(
        this.level_depth_buffer,
        this.min_value,
        this.max_value
      );
      this.back_level_ratios = [0.9, 0.9, 0.5, 0];
      this.mix_back_and_level = new MixPanelsRatios(
        this.level_to_gray.output_panel,
        this.back_to_gray.output_panel,
        // to_panel
        this.back_level_ratios
      );
      this.mix_back_and_level.attach_to_context(context2);
      this.back_front_ratios = [0, 0.5, 0, 0];
      this.back_front_ratios = [0, 0.3, 0, 0];
      this.mix_back_and_front = new MixPanelsRatios(
        this.front_to_gray.output_panel,
        this.back_to_gray.output_panel,
        // to_panel
        this.back_front_ratios
      );
      this.mix_back_and_front.attach_to_context(context2);
      this.output_panel = this.back_to_gray.output_panel;
      this.project_to_panel = context2.sequence([
        this.max_project_action,
        this.level_project_action,
        this.slice_front_action,
        this.slice_back_action,
        this.front_to_gray.sequence,
        this.back_to_gray.sequence,
        this.level_to_gray.sequence,
        this.mix_back_and_level,
        this.mix_back_and_front
      ]);
      return {
        sequence: this.project_to_panel,
        output_panel: this.output_panel
      };
    }
    // remainder is very similar to TestDepthView
    change_matrix(matrix) {
      this.max_project_action.change_matrix(matrix);
      this.level_project_action.change_matrix(matrix);
      this.change_range(matrix);
    }
    change_depth(depth) {
      this.level_project_action.change_depth(depth);
      this.slice_front_action.change_upper_bound(depth);
      this.slice_back_action.change_lower_bound(depth);
      this.run();
    }
    on_range_change(callback) {
      this.range_change_callback = callback;
      this.change_range(this.projection_matrix);
    }
    change_range(matrix) {
      const callback = this.range_change_callback;
      if (callback) {
        const invert = true;
        const range = this.ofVolume.projected_range(matrix, invert);
        const min_depth = range.min[2];
        const max_depth = range.max[2];
        console.log("new range min", min_depth, "max", max_depth);
        this.slice_back_action.change_upper_bound(max_depth);
        this.slice_front_action.change_lower_bound(min_depth);
        callback(min_depth, max_depth);
      }
    }
  }
  const depth_range_view = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    TestRangeView
  }, Symbol.toStringTag, { value: "Module" }));
  class MixPipeline {
    constructor(volume_url, indexed_colors, canvas, ratio) {
      ratio = ratio || 0.7;
      this.ratio = ratio;
      this.indexed_colors = new Uint32Array(indexed_colors);
      this.canvas = canvas;
      this.volume_url = volume_url;
      this.connect_future = this.connect();
      this.volume_future = this.load();
    }
    async connect() {
      this.context = new Context();
      await this.context.connect();
    }
    async load() {
      const context2 = this.context;
      const response = await fetch(this.volume_url);
      const content = await response.blob();
      const buffer = await content.arrayBuffer();
      console.log("buffer", buffer);
      const input_u32 = new Uint32Array(buffer);
      const f32 = new Float32Array(input_u32);
      console.log("f32", f32);
      this.volume_shape = f32.slice(0, 3);
      this.volume_content = f32.slice(3);
      const [K, J, I] = this.volume_shape;
      const vol_rotation = eye(4);
      vol_rotation[1][1] = -1;
      const vol_translation = affine3d(null, [-K / 2, -J / 2, -I / 2]);
      this.volume_matrix = MM_product(vol_rotation, vol_translation);
      debugger;
      await this.connect_future;
      this.volume = context2.volume(
        this.volume_shape,
        this.volume_content,
        this.volume_matrix,
        Float32Array
      );
      this.soft_volume = context2.volume(
        this.volume_shape,
        null,
        // no content
        this.volume_matrix,
        Float32Array
      );
      this.soften_action = new SoftenVolume(this.volume, this.soft_volume, null);
      this.soften_action.attach_to_context(context2);
      console.log("input Volume", this.volume);
      this.volume.min_value;
      this.volume.max_value;
      const ncolors = this.indexed_colors.length;
      this.color_panel = context2.panel(1, ncolors);
      debugger;
      await this.color_panel.push_buffer(this.indexed_colors);
      const MaxS = Math.max(K, J, I);
      const side = Math.ceil(Math.sqrt(2) * MaxS);
      this.output_shape = [side, side];
      const default_depth = 0;
      const default_value = 0;
      this.depth_buffer = context2.depth_buffer(
        this.output_shape,
        default_depth,
        default_value,
        null,
        //input_data,
        null,
        // input_depths,
        Float32Array
      );
      this.threshold_value = 0.5;
      this.initial_rotation = [
        [0, 0, 1],
        [1, 0, 0],
        [0, 1, 0]
      ];
      this.affine_translation = affine3d(null, [-side / 2, -side / 2, -side]);
      this.projection_matrix = MM_product(
        affine3d(this.initial_rotation),
        this.affine_translation
      );
      this.project_action = new ThresholdProject(
        this.volume,
        this.depth_buffer,
        this.projection_matrix,
        this.threshold_value
      );
      this.project_action.attach_to_context(context2);
      const [height, width] = this.output_shape;
      this.index_panel = context2.panel(width, height);
      this.index_flatten = this.depth_buffer.flatten_action(this.index_panel);
      const default_color = 0;
      this.index_colorize = new IndexColorizePanel(
        this.color_panel,
        this.index_panel,
        default_color
      );
      this.index_colorize.attach_to_context(context2);
      this.colorize_action = new NormalColorize(
        this.soft_volume,
        // do normal colorization using softened volume
        this.depth_buffer,
        this.projection_matrix,
        default_color
      );
      this.colorize_action.attach_to_context(context2);
      this.orbiter = new Orbiter(
        this.canvas,
        null,
        // center,
        this.initial_rotation,
        this.get_orbiter_callback()
        // callback,
      );
      this.panel = context2.panel(width, height);
      this.flatten_action = this.depth_buffer.flatten_action(this.panel);
      const ratio = this.ratio;
      this.mix_action = new MixPanels(
        this.index_panel,
        this.panel,
        ratio
      );
      this.mix_action.attach_to_context(context2);
      this.painter = context2.paint(this.panel, this.canvas);
      this.sequence = context2.sequence([
        this.soften_action,
        // this only needs to run once, really...
        this.project_action,
        this.index_flatten,
        this.index_colorize,
        this.colorize_action,
        this.flatten_action,
        this.mix_action,
        //this.gray_action, 
        this.painter
      ]);
      this.sequence.run();
    }
    async debug_button_callback() {
      debugger;
      await this.index_panel.pull_buffer();
      await this.depth_buffer.pull_buffer();
      console.log("pipeline", this);
    }
    async run() {
      await this.volume_future;
      this.sequence.run();
    }
    get_orbiter_callback() {
      const that = this;
      function callback(affine_transform) {
        that.change_parameters(affine_transform);
      }
      return callback;
    }
    change_parameters(affine_transform, ratio) {
      if (affine_transform) {
        const M = MM_product(
          affine_transform,
          this.affine_translation
        );
        this.projection_matrix = M;
        this.project_action.change_matrix(M);
        this.colorize_action.change_matrix(M);
      }
      if (ratio) {
        this.mix_action.change_ratio(ratio);
      }
      this.run();
    }
  }
  const mix_test = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    MixPipeline
  }, Symbol.toStringTag, { value: "Module" }));
  class ThresholdPipeline {
    constructor(volume_url, canvas, slider) {
      this.slider = slider;
      this.canvas = canvas;
      this.volume_url = volume_url;
      this.connect_future = this.connect();
      this.volume_future = this.load();
    }
    async connect() {
      this.context = new Context();
      await this.context.connect();
    }
    async load() {
      const context2 = this.context;
      const response = await fetch(this.volume_url);
      const content = await response.blob();
      const buffer = await content.arrayBuffer();
      console.log("buffer", buffer);
      const f32 = new Float32Array(buffer);
      console.log("f32", f32);
      this.volume_shape = f32.slice(0, 3);
      this.volume_content = f32.slice(3);
      const [K, J, I] = this.volume_shape;
      const vol_rotation = eye(4);
      vol_rotation[1][1] = -1;
      const vol_translation = affine3d(null, [-K / 2, -J / 2, -I / 2]);
      this.volume_matrix = MM_product(vol_rotation, vol_translation);
      debugger;
      await this.connect_future;
      this.volume = context2.volume(
        this.volume_shape,
        this.volume_content,
        this.volume_matrix,
        Float32Array
      );
      console.log("input Volume", this.volume);
      const mm = this.volume.min_value;
      const MM = this.volume.max_value;
      this.slider.min = mm;
      this.slider.max = MM;
      this.slider.value = (mm + MM) / 2;
      this.slider.step = (MM - mm) / 100;
      const MaxS = Math.max(K, J, I);
      const side = Math.ceil(Math.sqrt(2) * MaxS);
      this.output_shape = [side, side];
      const default_depth = -1e4;
      const default_value = -1e4;
      this.depth_buffer = context2.depth_buffer(
        this.output_shape,
        default_depth,
        default_value,
        null,
        //input_data,
        null,
        // input_depths,
        Float32Array
      );
      this.threshold_value = 33e3;
      this.initial_rotation = [
        [0, 0, 1],
        [1, 0, 0],
        [0, 1, 0]
      ];
      this.affine_translation = affine3d(null, [-side / 2, -side / 2, -side]);
      this.projection_matrix = MM_product(
        affine3d(this.initial_rotation),
        this.affine_translation
      );
      this.project_action = new ThresholdProject(
        this.volume,
        this.depth_buffer,
        this.projection_matrix,
        this.threshold_value
      );
      this.project_action.attach_to_context(context2);
      const default_color = 0;
      this.colorize_action = new NormalColorize(
        this.volume,
        this.depth_buffer,
        this.projection_matrix,
        default_color
      );
      this.colorize_action.attach_to_context(context2);
      this.orbiter = new Orbiter(
        this.canvas,
        null,
        // center,
        this.initial_rotation,
        this.get_orbiter_callback()
        // callback,
      );
      const [height, width] = this.output_shape;
      this.panel = context2.panel(width, height);
      this.flatten_action = this.depth_buffer.flatten_action(this.panel);
      this.grey_panel = context2.panel(width, height);
      this.painter = context2.paint(this.panel, this.canvas);
      this.sequence = context2.sequence([
        this.project_action,
        this.colorize_action,
        this.flatten_action,
        //this.gray_action, 
        this.painter
      ]);
      this.sequence.run();
    }
    async run() {
      await this.volume_future;
      this.sequence.run();
    }
    get_orbiter_callback() {
      const that = this;
      function callback(affine_transform) {
        that.change_parameters(affine_transform);
      }
      return callback;
    }
    change_parameters(affine_transform, threshold2) {
      if (affine_transform) {
        const M = MM_product(
          affine_transform,
          this.affine_translation
        );
        this.projection_matrix = M;
        this.project_action.change_matrix(M);
        this.colorize_action.change_matrix(M);
      }
      if (threshold2) {
        this.project_action.change_threshold(threshold2);
      }
      this.run();
    }
  }
  const threshold_test = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    ThresholdPipeline
  }, Symbol.toStringTag, { value: "Module" }));
  class TestDepthView extends View {
    panel_sequence(context2) {
      context2 = context2 || this.context;
      const inputVolume = this.ofVolume;
      this.min_value = inputVolume.min_value;
      this.max_value = inputVolume.max_value;
      const origin = [0, 0, 0, 1];
      const projection = M_inverse(this.projection_matrix);
      const porigin = Mv_product(projection, origin);
      this.current_depth = porigin[2];
      this.depth_buffer = this.get_output_depth_buffer(context2);
      this.value_panel = this.get_output_panel(context2);
      this.grey_panel = this.get_output_panel(context2);
      this.project_action = new VolumeAtDepth(
        this.ofVolume,
        this.depth_buffer,
        this.projection_matrix,
        this.current_depth
      );
      this.project_action.attach_to_context(context2);
      this.flatten_action = this.depth_buffer.flatten_action(this.value_panel);
      this.gray_action = context2.to_gray_panel(
        this.value_panel,
        this.grey_panel,
        this.min_value,
        this.max_value
      );
      this.project_to_panel = context2.sequence([
        this.project_action,
        this.flatten_action,
        this.gray_action
      ]);
      return {
        sequence: this.project_to_panel,
        output_panel: this.grey_panel
      };
    }
    change_matrix(matrix) {
      this.project_action.change_matrix(matrix);
      this.change_range(matrix);
    }
    change_depth(depth) {
      this.project_action.change_depth(depth);
      this.run();
    }
    on_range_change(callback) {
      this.range_change_callback = callback;
      this.change_range(this.projection_matrix);
    }
    change_range(matrix) {
      const callback = this.range_change_callback;
      if (callback) {
        const invert = true;
        const range = this.ofVolume.projected_range(matrix, invert);
        const min_depth = range.min[2];
        const max_depth = range.max[2];
        console.log("new range min", min_depth, "max", max_depth);
        callback(min_depth, max_depth);
      }
    }
  }
  const vol_depth_view = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    TestDepthView
  }, Symbol.toStringTag, { value: "Module" }));
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
    return new Volume$1(shape, data, ijk2xyz);
  }
  function panel(width, height) {
    return new Panel(width, height);
  }
  function paint_panel(panel2, to_canvas2) {
    return new PaintPanel(panel2, to_canvas2);
  }
  function sample_volume(shape, ijk2xyz, volumeToSample) {
    return new SampleVolume(shape, ijk2xyz, volumeToSample);
  }
  function painter(rgbaImage, width, height, to_canvas2) {
    return new ImagePainter(rgbaImage, width, height, to_canvas2);
  }
  exports2.CPUVolume = CPUVolume;
  exports2.CombineDepths = CombineDepths$1;
  exports2.CopyAction = CopyAction;
  exports2.DepthBufferRange = DepthBufferRange;
  exports2.GPUAction = GPUAction;
  exports2.GPUColorPanel = GPUColorPanel;
  exports2.GPUContext = GPUContext;
  exports2.GPUDataObject = GPUDataObject;
  exports2.GPUDepthBuffer = GPUDepthBuffer;
  exports2.GPUVolume = GPUVolume;
  exports2.IndexColorizePanel = IndexColorizePanel$1;
  exports2.MaxDotView = MaxDotView;
  exports2.MaxProjection = MaxProjection;
  exports2.MaxView = MaxView;
  exports2.MixColorPanels = MixColorPanels;
  exports2.MixDepthBuffers = MixDepthBuffers$1;
  exports2.MixDotsOnPanel = MixDotsOnPanel$1;
  exports2.MixView = MixView;
  exports2.NormalAction = NormalAction;
  exports2.PaintPanel = PaintPanel$1;
  exports2.Painter_wgsl = Painter;
  exports2.PastePanel = PastePanel$1;
  exports2.Projection = Projection;
  exports2.SampleVolume = SampleVolume$1;
  exports2.SegmentationQuad = SegmentationQuad$1;
  exports2.SlicedThresholdView = SlicedThresholdView;
  exports2.Soften = Soften;
  exports2.ThresholdAction = ThresholdAction;
  exports2.ThresholdView = ThresholdView;
  exports2.Triptych = Triptych$1;
  exports2.UpdateAction = UpdateAction$1;
  exports2.UpdateGray = UpdateGray$1;
  exports2.ViewVolume = ViewVolume;
  exports2.VolumeAtDepth = VolumeAtDepth$1;
  exports2.canvas_orbit = canvas_orbit;
  exports2.combine_depth_buffers_wgsl = combine_depth_buffers$1;
  exports2.combine_depths = combine_depths;
  exports2.combine_test = combine_test;
  exports2.context = context;
  exports2.convert_buffer_wgsl = convert_buffer$1;
  exports2.convert_depth_buffer_wgsl = convert_depth_buffer$1;
  exports2.convert_gray_prefix_wgsl = convert_gray_prefix$1;
  exports2.coordinates = coordinates;
  exports2.depth_buffer = depth_buffer;
  exports2.depth_buffer_range_wgsl = depth_buffer_range$1;
  exports2.depth_buffer_wgsl = depth_buffer$2;
  exports2.depth_range_view = depth_range_view;
  exports2.do_combine = do_combine;
  exports2.do_gray = do_gray;
  exports2.do_max_projection = do_max_projection;
  exports2.do_mouse_paste = do_mouse_paste;
  exports2.do_paint = do_paint;
  exports2.do_paste = do_paste;
  exports2.do_pipeline = do_pipeline;
  exports2.do_sample = do_sample;
  exports2.embed_volume_wgsl = embed_volume$1;
  exports2.gray_test = gray_test;
  exports2.index_colorize_wgsl = index_colorize$1;
  exports2.max_projection_test = max_projection_test;
  exports2.max_value_project_wgsl = max_value_project$1;
  exports2.mix_color_panels_wgsl = mix_color_panels$1;
  exports2.mix_depth_buffers_wgsl = mix_depth_buffers$1;
  exports2.mix_dots_on_panel_wgsl = mix_dots_on_panel$1;
  exports2.mix_test = mix_test;
  exports2.mousepaste = mousepaste;
  exports2.name = name;
  exports2.normal_colors_wgsl = normal_colors$1;
  exports2.paint_panel = paint_panel;
  exports2.paint_test = paint_test;
  exports2.painter = painter;
  exports2.panel = panel;
  exports2.panel_buffer_wgsl = panel_buffer$1;
  exports2.paste_panel_wgsl = paste_panel$1;
  exports2.paste_test = paste_test;
  exports2.pipeline_test = pipeline_test;
  exports2.sample_test = sample_test;
  exports2.sample_volume = sample_volume;
  exports2.soften_volume_wgsl = soften_volume$1;
  exports2.threshold_test = threshold_test;
  exports2.threshold_wgsl = threshold$1;
  exports2.vol_depth_view = vol_depth_view;
  exports2.volume = volume;
  exports2.volume_at_depth_wgsl = volume_at_depth$1;
  exports2.volume_frame_wgsl = volume_frame$1;
  exports2.volume_intercepts_wgsl = volume_intercepts$1;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
