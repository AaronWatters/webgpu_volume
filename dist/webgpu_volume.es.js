class x {
  constructor() {
    this.buffer_size = 0, this.gpu_buffer = null, this.usage_flags = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST, this.attached = !1, this.buffer_content = null, this.context = null;
  }
  attach_to_context(t) {
    if (this.context == t)
      return this.gpu_buffer;
    if (this.attached)
      throw new Error("cannot re-attach attached object.");
    this.attached = !0, this.context = t;
    const e = t.device;
    return this.allocate_buffer_mapped(e), this.load_buffer(), this.gpu_buffer.unmap(), this.gpu_buffer;
  }
  allocate_buffer_mapped(t, e) {
    return t = t || this.context.device, e = e || this.usage_flags, this.gpu_buffer = t.createBuffer({
      mappedAtCreation: !0,
      size: this.buffer_size,
      usage: e
    }), this.gpu_buffer;
  }
  load_buffer(t) {
    return this.gpu_buffer;
  }
  async pull_buffer() {
    const e = this.context.device, n = GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ, o = e.createBuffer({
      size: this.buffer_size,
      usage: n
    }), s = e.createCommandEncoder();
    s.copyBufferToBuffer(
      this.gpu_buffer,
      0,
      o,
      0,
      this.buffer_size
      /* size */
    );
    const a = s.finish();
    e.queue.submit([a]), await e.queue.onSubmittedWorkDone(), await o.mapAsync(GPUMapMode.READ);
    const r = o.getMappedRange();
    var u = new ArrayBuffer(r.byteLength);
    return new Uint8Array(u).set(new Uint8Array(r)), o.destroy(), this.buffer_content = u, u;
  }
  async push_buffer(t) {
    const n = this.context.device;
    var o = this.buffer_size;
    if (t && (o = t.byteLength, o > this.buffer_size))
      throw new Error("push buffer too large " + [o, this.buffer_size]);
    const s = this.usage_flags, a = n.createBuffer({
      mappedAtCreation: !0,
      size: o,
      usage: s
    });
    if (t) {
      const _ = a.getMappedRange(), c = t.constructor;
      new c(_).set(t);
    } else
      this.load_buffer(a);
    a.unmap();
    const r = n.createCommandEncoder();
    r.copyBufferToBuffer(
      a,
      0,
      this.gpu_buffer,
      0,
      o
      /* size */
    );
    const u = r.finish();
    n.queue.submit([u]), await n.queue.onSubmittedWorkDone(), a.destroy();
  }
  bindGroupLayout(t) {
    const n = this.context.device;
    t = t || "storage";
    const s = {
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: t
      }
    };
    return n.createBindGroupLayout({
      entries: [
        s
      ]
    });
  }
  bindGroup(t, e) {
    return e.device.createBindGroup({
      layout: t,
      entries: [
        this.bindGroupEntry(0)
      ]
    });
  }
  bindGroupEntry(t) {
    return {
      binding: t,
      resource: {
        buffer: this.gpu_buffer
      }
    };
  }
}
const Fn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DataObject: x
}, Symbol.toStringTag, { value: "Module" })), ge = "qd_vector";
function R(i) {
  const t = new Float64Array(i);
  return Array.from(t);
}
function st(i, t) {
  const e = i.length, n = R(e);
  for (var o = 0; o < e; o++)
    n[o] = i[o] + t[o];
  return n;
}
function Tt(i, t) {
  const e = i.length, n = R(e);
  for (var o = 0; o < e; o++)
    n[o] = Math.min(i[o], t[o]);
  return n;
}
function qt(i, t) {
  const e = i.length, n = R(e);
  for (var o = 0; o < e; o++)
    n[o] = Math.max(i[o], t[o]);
  return n;
}
function O(i, t) {
  const e = t.length, n = R(e);
  for (var o = 0; o < e; o++)
    n[o] = i * t[o];
  return n;
}
function ve(i, t) {
  return st(
    i,
    O(-1, t)
  );
}
function Ut(i) {
  var t = 0;
  for (var e of i)
    t += e * e;
  return Math.sqrt(t);
}
function be(i) {
  var t = Ut(i);
  return O(1 / t, i);
}
function X(i, t) {
  const e = [];
  for (var n = 0; n < i; n++)
    e.push(R(t));
  return e;
}
function b(i, t) {
  const e = k(4);
  if (i)
    for (var n = 0; n < 3; n++)
      for (var o = 0; o < 3; o++)
        e[n][o] = i[n][o];
  if (t)
    for (var n = 0; n < 3; n++)
      e[n][3] = t[n];
  return e;
}
function et(i, t) {
  const e = t.slice();
  return e.push(1), q(i, e).slice(0, 3);
}
function xe(i) {
  const t = [], e = i.length;
  for (var n = 0; n < e; n++)
    t.push(...i[n]);
  return t;
}
function It(i, t, e) {
  const n = i.length;
  if (n != t * e)
    throw new Error(`Length ${n} doesn't match rows ${t} and columns ${e}.`);
  const o = [];
  for (var s = 0, a = 0; a < t; a++) {
    const u = [];
    for (var r = 0; r < e; r++) {
      const _ = i[s];
      u.push(_), s++;
    }
    o.push(u);
  }
  return o;
}
function B(i, t) {
  const e = i.length, n = i[0].length;
  if (t) {
    for (var o = 0; o < e; o++)
      if (i[o].length != n)
        throw new Error("inconsistent shape.");
  }
  return [e, n];
}
function k(i) {
  const t = X(i, i);
  for (var e = 0; e < i; e++)
    t[e][e] = 1;
  return t;
}
function q(i, t) {
  const [e, n] = B(i);
  for (var o = R(e), s = 0; s < e; s++) {
    for (var a = 0, r = 0; r < n; r++)
      a += i[s][r] * t[r];
    o[s] = a;
  }
  return o;
}
function m(i, t) {
  const [e, n] = B(i), [o, s] = B(t);
  if (n != o)
    throw new Error("incompatible matrices.");
  for (var a = X(e, s), r = 0; r < e; r++)
    for (var u = 0; u < s; u++) {
      for (var _ = 0, c = 0; c < o; c++)
        _ += i[r][c] * t[c][u];
      a[r][u] = _;
    }
  return a;
}
function vt(i) {
  const [t, e] = B(i), n = X(t, e);
  for (var o = 0; o < t; o++)
    for (var s = 0; s < e; s++)
      n[o][s] = i[o][s];
  return n;
}
function ye(i, t = 1e-3) {
  const e = vt(i);
  for (var n of e)
    for (var o = 0; o < n.length; o++) {
      const s = n[o], a = Math.round(s);
      Math.abs(s - a) < t && (n[o] = a);
    }
  return e;
}
function Ft(i, t, e, n) {
  var o = i;
  n || (o = vt(i));
  const s = o[t];
  return o[t] = o[e], o[e] = s, o;
}
function Ct(i, t) {
  const [e, n] = B(i), [o, s] = B(t);
  if (e != o)
    throw new Error("bad shapes: rows must match.");
  const a = X(e, n + s);
  for (var r = 0; r < o; r++) {
    for (var u = 0; u < n; u++)
      a[r][u] = i[r][u];
    for (var _ = 0; _ < s; _++)
      a[r][_ + n] = t[r][_];
  }
  return a;
}
function Rt(i, t, e, n, o) {
  const s = n - t, a = o - e, r = X(s, a);
  for (var u = 0; u < s; u++)
    for (var _ = 0; _ < a; _++)
      r[u][_] = i[u + t][_ + e];
  return r;
}
function Nt(i) {
  var t = vt(i);
  const [e, n] = B(i), o = Math.min(e, n);
  for (var s = 0; s < o; s++) {
    for (var a = s, r = Math.abs(t[a][s]), u = s + 1; u < o; u++) {
      const h = Math.abs(t[u][s]);
      h > r && (r = h, a = u);
    }
    a != u && (t = Ft(t, s, a, !0));
    for (var _ = t[s][s], c = 1 / _, l = O(c, t[s]), u = 0; u < o; u++) {
      const p = t[u];
      if (u == s)
        t[u] = l;
      else {
        const f = p[s], d = O(-f, l), y = st(p, d);
        t[u] = y;
      }
    }
  }
  return t;
}
function U(i) {
  const t = i.length, e = k(t), n = Ct(i, e), o = Nt(n);
  return Rt(o, 0, t, t, 2 * t);
}
function Wt(i) {
  var t = Math.cos(i), e = Math.sin(i), n = [
    [t, -e, 0],
    [e, t, 0],
    [0, 0, 1]
  ];
  return n;
}
function Bt(i) {
  var t = Math.cos(i), e = Math.sin(i), n = [
    [t, 0, e],
    [0, 1, 0],
    [-e, 0, t]
  ];
  return n;
}
function Mt(i) {
  var t = Math.cos(i), e = Math.sin(i), n = [
    [1, 0, 0],
    [0, t, e],
    [0, -e, t]
  ];
  return n;
}
function Yt(i, t) {
  const e = i.length;
  for (var n = 0, o = 0; o < e; o++)
    n += i[o] * t[o];
  return n;
}
function we(i, t) {
  const [e, n, o] = i, [s, a, r] = t;
  return [
    n * r - o * a,
    o * s - e * r,
    e * a - n * s
  ];
}
function je(i) {
  var t = [];
  const [e, n] = B(i);
  for (var o = 0; o < e; o++)
    for (var s = 0; s < n; s++)
      t.push(i[o][s]);
  return t;
}
function I(i) {
  var t = [];
  const [e, n] = B(i);
  for (var o = 0; o < n; o++)
    for (var s = 0; s < e; s++)
      t.push(i[s][o]);
  return t;
}
function ze(i) {
  var t = [];
  const [e, n] = B(i);
  for (var o = 0; o < n; o++) {
    for (var s = [], a = 0; a < e; a++)
      s.push(i[a][o]);
    t.push(s);
  }
  return t;
}
const ke = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MM_product: m,
  M_as_list: xe,
  M_column_major_order: I,
  M_copy: vt,
  M_inverse: U,
  M_pitch: Bt,
  M_reduce: Nt,
  M_roll: Wt,
  M_row_major_order: je,
  M_shape: B,
  M_slice: Rt,
  M_tolerate: ye,
  M_transpose: ze,
  M_yaw: Mt,
  M_zero: X,
  Mv_product: q,
  affine3d: b,
  apply_affine3d: et,
  eye: k,
  list_as_M: It,
  name: ge,
  shelf: Ct,
  swap_rows: Ft,
  v_add: st,
  v_cross: we,
  v_dot: Yt,
  v_length: Ut,
  v_maximum: qt,
  v_minimum: Tt,
  v_normalize: be,
  v_scale: O,
  v_sub: ve,
  v_zero: R
}, Symbol.toStringTag, { value: "Module" }));
class $t {
  constructor(t) {
    this.canvas = t;
  }
  // normalize from canvas space to [-1, 1] x [-1, 1]
  normalize(t, e) {
    const n = this.canvas.getBoundingClientRect();
    this.brec = n, this.cx = n.width / 2 + n.left, this.cy = n.height / 2 + n.top;
    const o = t - this.cx, s = -(e - this.cy), a = o * 2 / this.brec.width, r = s * 2 / this.brec.height;
    return [a, r];
  }
  normalize_event_coords(t) {
    return this.normalize(t.clientX, t.clientY);
  }
}
class Kt {
  // convert normalized coordinates to panel coordinates and back again.
  constructor(t, e) {
    this.height = t, this.width = e;
  }
  normalized2ij([t, e]) {
    const n = Math.floor((e + 1) * this.height / 2), o = Math.floor((t + 1) * this.width / 2);
    return [n, o];
  }
  ij2normalized([t, e]) {
    const n = 2 * e / this.width - 1, o = 2 * t / this.height - 1;
    return [n, o];
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
class pt {
  // A space with an affine transformation from IJK to XYZ.
  constructor(t) {
    this.change_matrix(t);
  }
  change_matrix(t) {
    this.ijk2xyz = t, this.xyz2ijk = U(t);
  }
  ijk2xyz_v(t) {
    return et(this.ijk2xyz, t);
  }
}
class Jt extends pt {
  constructor(t, e) {
    super(t), this.shape = e;
  }
  xyz2ijk_v(t) {
    return et(this.xyz2ijk, t);
  }
  ijk2offset(t) {
    const [e, n, o] = this.shape.slice(0, 3);
    var [s, a, r] = t;
    return s = Math.floor(s), a = Math.floor(a), r = Math.floor(r), r < 0 || r >= o || a < 0 || a >= n || s < 0 || s >= e ? null : (s * n + a) * o + r;
  }
  offset2ijk(t) {
    const [e, n, o] = this.shape.slice(0, 3), s = t % o, a = Math.floor(t / o) % n;
    return [Math.floor(t / (o * n)), a, s];
  }
  xyz2offset(t) {
    return this.ijk2offset(this.xyz2ijk_v(t));
  }
  offset2xyz(t) {
    return this.ijk2xyz_v(this.offset2ijk(t));
  }
}
const Cn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NormalizedCanvasSpace: $t,
  PanelSpace: Kt,
  ProjectionSpace: pt,
  VolumeSpace: Jt,
  qdVector: ke
}, Symbol.toStringTag, { value: "Module" })), Be = [
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
let it = class Xt extends x {
  constructor(t, e, n, o) {
    super(), o = o || Uint32Array, this.data_format = o, n || (n = It(Be, 4, 4)), this.data = null, this.min_value = null, this.max_value = null, this.set_shape(t, e), this.set_ijk2xyz(n), this.shape_offset = 0, this.ijk2xyz_offset = this.shape_offset + this.shape.length, this.xyz2ijk_offset = this.ijk2xyz_offset + this.ijk2xyz.length, this.content_offset = this.xyz2ijk_offset + this.xyz2ijk.length, this.buffer_size = (this.size + this.content_offset) * Int32Array.BYTES_PER_ELEMENT;
  }
  same_geometry(t) {
    t = t || this.context;
    const e = new Xt(this.shape.slice(0, 3), null, this.matrix, this.data_format);
    return e.attach_to_context(t), e;
  }
  max_extent() {
    const t = et(this.matrix, [0, 0, 0]), e = et(this.matrix, this.shape), n = st(O(-1, t), e);
    return Math.sqrt(Yt(n, n));
  }
  projected_range(t, e) {
    var n = t;
    e && (n = U(t));
    const o = m(n, this.matrix), [s, a, r, u] = this.shape;
    var _ = null, c = null;
    for (var l of [0, s])
      for (var h of [0, a])
        for (var p of [0, r]) {
          const d = q(o, [l, h, p, 1]);
          _ = _ ? qt(_, d) : d, c = c ? Tt(c, d) : d;
        }
    return { min: c, max: _ };
  }
  set_shape(t, e) {
    const [n, o, s] = t;
    this.size = n * o * s, this.shape = [n, o, s, 0], this.data = null, e && this.set_data(e);
  }
  set_data(t) {
    const e = t.length;
    if (this.size != e)
      throw new Error(`Data size ${e} doesn't match ${this.size}`);
    this.data = new this.data_format(t);
    var n = this.data[0], o = n;
    for (var s of this.data)
      n = Math.min(s, n), o = Math.max(s, o);
    this.min_value = n, this.max_value = o;
  }
  set_ijk2xyz(t) {
    this.matrix = t, this.space = new Jt(t, this.shape);
    const e = I(t);
    this.ijk2xyz = e, this.xyz2ijk = I(this.space.xyz2ijk);
  }
  sample_at(t) {
    if (!this.data)
      throw new Error("No data to sample.");
    const e = this.space.xyz2offset(t);
    return e === null ? null : this.data[e];
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange();
    new Uint32Array(e).set(this.shape, this.shape_offset);
    const o = new Float32Array(e);
    o.set(this.ijk2xyz, this.ijk2xyz_offset), o.set(this.xyz2ijk, this.xyz2ijk_offset), this.data && new this.data_format(e).set(this.data, this.content_offset);
  }
  async pull_data() {
    const t = await this.pull_buffer(), e = new Uint32Array(t);
    return this.data = e.slice(this.content_offset), this.data;
  }
};
const Rn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Volume: it
}, Symbol.toStringTag, { value: "Module" })), Q = `
// Framework for image volume data in WebGPU.


struct VolumeGeometry {
    // Volume dimensions. IJK + error indicator.
    shape : vec4u,
    // Convert index space to model space,
    ijk2xyz : mat4x4f,
    // Inverse: convert model space to index space.
    xyz2ijk : mat4x4f
}

struct VolumeU32 {
    geometry : VolumeGeometry,
    content : array<u32>
}

alias Volume = VolumeU32;

struct IndexOffset {
    offset : u32,
    is_valid : bool
}

struct OffsetIndex {
    ijk: vec3u,
    is_valid: bool
}

// Buffer offset for volume index ijk.
fn offset_of(ijk : vec3u, geom : ptr<function, VolumeGeometry>) -> IndexOffset {
    var result : IndexOffset;
    var shape = (*geom).shape.xyz;
    //result.is_valid = all(ijk.zxy < shape);
    result.is_valid = all(ijk.xyz < shape);
    if (result.is_valid) {
        let layer = ijk.x;
        let row = ijk.y;
        let column = ijk.z;
        let height = shape.y;
        let width = shape.z;
        result.offset = (layer * height + row) * width + column;
    }
    return result;
}

// Convert array offset to checked ijk index
fn index_of(offset: u32, geom : ptr<function, VolumeGeometry>) -> OffsetIndex {
    var result : OffsetIndex;
    result.is_valid = false;
    var shape = (*geom).shape;
    let depth = shape.x;
    let height = shape.y;
    let width = shape.z;
    let LR = offset / width;
    let column = offset - (LR * width);
    let layer = LR / height;
    let row = LR - (layer * height);
    if (layer < depth) {
        result.ijk.x = layer;
        result.ijk.y = row;
        result.ijk.z = column;
        result.is_valid = true;
    }
    return result;
}

// Convert float vector indices to checked unsigned index
fn offset_of_f(ijk_f : vec3f, geom : ptr<function, VolumeGeometry>) -> IndexOffset {
    var shape = (*geom).shape;
    var result : IndexOffset;
    result.is_valid = false;
    if (all(ijk_f >= vec3f(0.0, 0.0, 0.0)) && all(ijk_f < vec3f(shape.xyz))) {
        result = offset_of(vec3u(ijk_f), geom);
    }
    return result;
}

// Convert model xyz to index space (as floats)
fn to_index_f(xyz : vec3f, geom : ptr<function, VolumeGeometry>) -> vec3f {
    var xyz2ijk = (*geom).xyz2ijk;
    let xyz1 = vec4f(xyz, 1.0);
    let ijk1 = xyz2ijk * xyz1;
    return ijk1.xyz;
}

// Convert index floats to model space.
fn to_model_f(ijk_f : vec3f, geom : ptr<function, VolumeGeometry>) -> vec3f {
    var ijk2xyz = (*geom).ijk2xyz;
    let ijk1 = vec4f(ijk_f, 1.0);
    let xyz1 = ijk2xyz * ijk1;
    return xyz1.xyz;
}

// Convert unsigned int indices to model space.
fn to_model(ijk : vec3u, geom : ptr<function, VolumeGeometry>) -> vec3f {
    return to_model_f(vec3f(ijk), geom);
}

// Convert xyz model position to checked index offset.
fn offset_of_xyz(xyz : vec3f, geom : ptr<function, VolumeGeometry>) -> IndexOffset {
    return offset_of_f(to_index_f(xyz, geom), geom);
}`, E = `
// Framework for 4 byte depth buffer

// keep everything f32 for simplicity of transfers

struct depthShape {
    height: f32,
    width: f32,
    // "null" marker depth and value.
    default_depth: f32,
    default_value: f32,
}

fn is_default(value: f32, depth:f32, for_shape: depthShape) -> bool {
    return (for_shape.default_depth == depth) && (for_shape.default_value == value);
}

struct DepthBufferF32 {
    // height/width followed by default depth and default value.
    shape: depthShape,
    // content data followed by depth as a single array
    data_and_depth: array<f32>,
}

struct BufferLocation {
    data_offset: u32,
    depth_offset: u32,
    ij: vec2i,
    valid: bool,
}

// 2d u32 indices to array locations
fn depth_buffer_location_of(ij: vec2i, shape: depthShape) -> BufferLocation {
    var result : BufferLocation;
    result.ij = ij;
    let width = u32(shape.width);
    let height = u32(shape.height);
    let row = ij.x;
    let col = ij.y;
    let ucol = u32(col);
    let urow = u32(row);
    result.valid = ((row >= 0) && (col >= 0) && (urow < height) && (ucol < width));
    if (result.valid) {
        result.data_offset = urow * width + ucol;
        result.depth_offset = height * width + result.data_offset;
    }
    return result;
}

// 2d f32 indices to array locations
fn f_depth_buffer_location_of(xy: vec2f, shape: depthShape) -> BufferLocation {
    return depth_buffer_location_of(vec2i(xy.xy), shape);
}

fn depth_buffer_indices(data_offset: u32, shape: depthShape) -> BufferLocation {
    var result : BufferLocation;
    let width = u32(shape.width);
    let height = u32(shape.height);
    let size = width * height;
    result.valid = (data_offset < size);
    if (result.valid) {
        result.data_offset = data_offset;
        result.depth_offset = size + data_offset;
        let row = data_offset / width;
        let col = data_offset - (row * width);
        result.ij = vec2i(i32(row), i32(col));
    }
    return result;
}`;
function Qt(i, t) {
  const e = Q + i;
  return t.device.createShaderModule({ code: e });
}
function Ht(i, t) {
  const e = E + i;
  return t.device.createShaderModule({ code: e });
}
class V {
  constructor() {
    this.attached = !1;
  }
  attach_to_context(t) {
    this.attached = !0, this.context = t;
  }
  run() {
    const e = this.context.device, n = e.createCommandEncoder();
    this.add_pass(n);
    const o = n.finish();
    e.queue.submit([o]);
  }
  add_pass(t) {
  }
}
class Zt extends V {
  // xxx could add bookkeeping so only actions with updated inputs execute.
  constructor(t) {
    super(), this.actions = t;
  }
  // attach_to_context not needed, assume actions already attached.
  add_pass(t) {
    for (var e of this.actions)
      e.add_pass(t);
  }
}
const Nn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Action: V,
  ActionSequence: Zt,
  depth_shader_code: Ht,
  volume_shader_code: Qt
}, Symbol.toStringTag, { value: "Module" })), Me = `
// Suffix for testing frame operations.

@group(0) @binding(0) var<storage, read> inputVolume : Volume;

@group(1) @binding(0) var<storage, read_write> outputVolume : Volume;

// xxxx add additional transform matrix

@compute @workgroup_size(8)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    var inputGeometry = inputVolume.geometry;
    let inputOffset = global_id.x;
    let inputIndex = index_of(inputOffset, &inputGeometry);
    if (inputIndex.is_valid) {
        var outputGeometry = outputVolume.geometry;
        let xyz = to_model(inputIndex.ijk, &inputGeometry);
        let out_offset = offset_of_xyz(xyz, &outputGeometry);
        if (out_offset.is_valid) {
            outputVolume.content[out_offset.offset] = inputVolume.content[inputOffset];
        }
    }
}`;
class St extends V {
  constructor(t, e, n) {
    super(), this.volumeToSample = n, this.shape = t, this.ijk2xyz = e, this.targetVolume = new it(t, null, e);
  }
  attach_to_context(t) {
    const e = t.device, n = this.volumeToSample, o = this.targetVolume;
    this.targetVolume.attach_to_context(t);
    const s = Qt(Me, t), a = o.bindGroupLayout("storage"), r = n.bindGroupLayout("read-only-storage"), u = e.createPipelineLayout({
      bindGroupLayouts: [
        r,
        a
      ]
    });
    this.pipeline = e.createComputePipeline({
      layout: u,
      compute: {
        module: s,
        entryPoint: "main"
      }
    }), this.sourceBindGroup = n.bindGroup(r, t), this.targetBindGroup = o.bindGroup(a, t), this.attached = !0, this.context = t;
  }
  add_pass(t) {
    const e = t.beginComputePass(), n = this.pipeline;
    e.setPipeline(n), e.setBindGroup(0, this.sourceBindGroup), e.setBindGroup(1, this.targetBindGroup);
    const o = Math.ceil(this.targetVolume.size / 8);
    e.dispatchWorkgroups(o), e.end();
  }
  async pull() {
    return await this.targetVolume.pull_data();
  }
}
const Wn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SampleVolume: St
}, Symbol.toStringTag, { value: "Module" }));
class z extends x {
  constructor(t, e) {
    super(), this.width = t, this.height = e, this.size = t * e, this.buffer_size = this.size * Int32Array.BYTES_PER_ELEMENT, this.usage_flags = GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;
  }
  resize(t, e) {
    const n = t * e;
    if (n * Int32Array.BYTES_PER_ELEMENT > this.buffer_size)
      throw new Error("buffer resize not yet implemented");
    this.width = t, this.height = e, this.size = n;
  }
  color_at([t, e]) {
    if (e < 0 || e >= this.width || t < 0 || t >= this.height)
      return null;
    const n = e + t * this.width, o = Int32Array.BYTES_PER_ELEMENT;
    return new Uint8Array(this.buffer_content, n * o, o);
  }
}
const Yn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Panel: z
}, Symbol.toStringTag, { value: "Module" })), Se = `
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
`;
function nt(i) {
  console.log("converting grey to rgba");
  const t = i.length, e = new Uint8Array(t * 4);
  for (var n = 0; n < t; n++) {
    const o = i[n], s = n * 4;
    e[s] = o, e[s + 1] = o, e[s + 2] = o, e[s + 3] = 255;
  }
  return e;
}
class te extends x {
  constructor(t) {
    super(), this.match_panel(t), this.usage_flags = GPUBufferUsage.STORAGE | GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.VERTEX;
  }
  match_panel(t) {
    const e = t.width, n = t.height, o = -1, s = -1, a = 2 / e, r = 2 / n;
    this.set_array(
      e,
      n,
      o,
      s,
      a,
      r
    );
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange();
    new Float32Array(e).set(this.array);
  }
  set_array(t, e, n, o, s, a) {
    this.array = new Float32Array([
      t,
      e,
      n,
      o,
      s,
      a
    ]), this.buffer_size = this.array.byteLength;
  }
  reset(t) {
    this.match_panel(t), this.push_buffer(this.array);
  }
}
class ee {
  constructor(t, e, n, o) {
    t.byteLength == e * n && (t = nt(t));
    var s = this;
    s.to_canvas = o, s.context = new w(), s.rgbaImage = t, s.width = e, s.height = n, this.context.connect_then_call(() => s.init_image());
  }
  init_image() {
    this.panel = new z(this.width, this.height), this.painter = new at(this.panel, this.to_canvas), this.panel.attach_to_context(this.context), this.painter.attach_to_context(this.context), this.panel.push_buffer(this.rgbaImage), this.painter.run();
  }
  change_image(t) {
    t.byteLength == this.width * this.height && (t = nt(t)), this.rgbaImage = t, this.panel.push_buffer(t), this.painter.reset(this.panel), this.painter.run();
  }
}
class at extends V {
  constructor(t, e) {
    super(), this.panel = t, this.to_canvas = e, this.uniforms = new te(t);
  }
  attach_to_context(t) {
    this.context = t;
    const e = t.device, n = this.to_canvas;
    this.webgpu_context = n.getContext("webgpu");
    const o = navigator.gpu.getPreferredCanvasFormat();
    this.webgpu_context.configure({ device: e, format: o }), this.panel.attached || this.panel.attach_to_context(t), this.uniforms.attach_to_context(t);
    const s = {
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
    }, a = e.createShaderModule({ code: Se });
    this.pipeline = e.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: a,
        entryPoint: "vertexMain",
        buffers: [s]
      },
      fragment: {
        module: a,
        entryPoint: "fragmentMain",
        targets: [{ format: o }]
      }
    });
    const r = this.uniforms.gpu_buffer, u = this.uniforms.buffer_size;
    this.uniformBindGroup = e.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: r,
            offset: 0,
            size: u
          }
        }
      ]
    });
  }
  reset(t) {
    this.panel = t, this.uniforms.reset(t);
  }
  add_pass(t) {
    const e = this.webgpu_context.getCurrentTexture().createView();
    this.colorAttachments = [
      {
        view: e,
        loadOp: "clear",
        storeOp: "store"
      }
    ];
    const n = this.colorAttachments, o = this.pipeline, s = this.panel.gpu_buffer, a = this.uniformBindGroup, r = t.beginRenderPass({ colorAttachments: n });
    r.setPipeline(o), r.setVertexBuffer(0, s), r.setBindGroup(0, a), r.draw(6, this.panel.size), r.end();
  }
}
const $n = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ImagePainter: ee,
  PaintPanel: at,
  PaintPanelUniforms: te,
  grey_to_rgba: nt
}, Symbol.toStringTag, { value: "Module" }));
class M extends V {
  get_shader_module(t) {
    throw new Error("get_shader_module must be define in subclass.");
  }
  attach_to_context(t) {
    this.context = t;
    const e = t.device, n = this.source, o = this.target, s = this.parameters;
    n.attach_to_context(t), o.attach_to_context(t), s.attach_to_context(t);
    const a = this.get_shader_module(t), r = o.bindGroupLayout("storage"), u = n.bindGroupLayout("read-only-storage"), _ = s.bindGroupLayout("read-only-storage"), c = e.createPipelineLayout({
      bindGroupLayouts: [
        u,
        r,
        _
      ]
    });
    this.pipeline = e.createComputePipeline({
      layout: c,
      compute: {
        module: a,
        entryPoint: "main"
      }
    }), this.sourceBindGroup = n.bindGroup(u, t), this.targetBindGroup = o.bindGroup(r, t), this.parmsBindGroup = s.bindGroup(_, t), this.attached = !0;
  }
  getWorkgroupCounts() {
    return [Math.ceil(this.target.size / 8), 1, 1];
  }
  add_pass(t) {
    const e = t.beginComputePass(), n = this.pipeline;
    e.setPipeline(n), e.setBindGroup(0, this.sourceBindGroup), e.setBindGroup(1, this.targetBindGroup), e.setBindGroup(2, this.parmsBindGroup);
    const [o, s, a] = this.getWorkgroupCounts();
    e.dispatchWorkgroups(o, s, a), e.end();
  }
}
const Kn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  UpdateAction: M
}, Symbol.toStringTag, { value: "Module" })), Pe = 1e-15;
function Pt(i, t) {
  const e = new Float32Array(16), n = t.matrix, o = U(n), s = t.shape, a = m(o, i);
  for (var r = 0, u = 0; u < 3; u++) {
    const v = a[u], g = v[2];
    var _;
    if (Math.abs(g) < Pe)
      _ = [0, 0, 1111, -1111];
    else {
      const $ = s[u], G = -v[0] / g, _t = -v[1] / g;
      var c = (0 - v[3]) / g, l = ($ - v[3]) / g;
      c > l && ([c, l] = [l, c]), _ = [G, _t, c, l];
    }
    e.set(_, r), r += 4;
  }
  const h = [0, 0, 0, 1], p = U(a), f = q(p, h), d = O(-1, f);
  function y(v) {
    const g = q(p, v), S = st(d, g);
    return Math.abs(S[2]);
  }
  var j = Math.max(
    y([1, 0, 0, 1]),
    y([0, 0, 1, 1]),
    y([0, 1, 0, 1])
  );
  return e[r] = j, e;
}
class rt extends M {
  constructor(t, e) {
    super(), this.source = t, this.target = e;
  }
  change_matrix(t) {
    this.parameters.set_matrix(t), this.parameters.push_buffer();
  }
  getWorkgroupCounts() {
    return [Math.ceil(this.target.size / 256), 1, 1];
  }
}
const Jn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Project: rt,
  intersection_buffer: Pt
}, Symbol.toStringTag, { value: "Module" })), Dt = `
// Logic for loop boundaries in volume scans.
// This prefix assumes volume_frame.wgsl and depth_buffer.wgsl.

// v2 planar xyz intersection parameters:
// v2 ranges from c0 * v0 + c1 * v1 + low to ... + high
struct Intersection2 {
    c0: f32,
    c1: f32,
    low: f32,
    high: f32,
}

// Intersection parameters for box borders
alias Intersections3 = array<Intersection2, 3>;

// Intersection end points
struct Endpoints2 {
    offset: vec2f,
    is_valid: bool,
}

fn scan_endpoints(
    offset: vec2i, 
    int3: Intersections3, 
    geom_ptr: ptr<function, VolumeGeometry>, 
    ijk2xyz: mat4x4f,  // orbit to model affine matrix
) -> Endpoints2 {
    var initialized = false;
    var result: Endpoints2;
    result.is_valid = false;
    for (var index=0; index<3; index++) {
        let intersect = int3[index];
        let ep = intercepts2(offset, intersect);
        if (ep.is_valid) {
            if (!initialized) {
                result = ep;
                initialized = true;
            } else {
                result = intersect2(result, ep);
            }
        }
    }
    if (result.is_valid) {
        // verify that midpoint lies inside geometry
        let low = result.offset[0];
        let high = result.offset[1];
        let mid = (low + high) / 2;
        let mid_probe = probe_point(vec2f(offset), mid, ijk2xyz);
        //let low_probe = probe_point(offset, low, ijk2xyz);
        //let high_probe = probe_point(offset, high, ijk2xyz);
        //let mid_probe = 0.5 * (low_probe + high_probe);
        //let mid_probe = low_probe; // debugging
        let mid_offset = offset_of_xyz(mid_probe, geom_ptr);
        result.is_valid = mid_offset.is_valid;
        // DEBUGGING
        //result.is_valid = true;
    }
    return result;
}

fn probe_point(offset: vec2f, depth: f32, ijk2xyz: mat4x4f) -> vec3f {
    let ijkw = vec4f(vec2f(offset), f32(depth), 1.0);
    let xyzw = ijk2xyz * ijkw;
    return xyzw.xyz;
}


// Data for probing a volume along a line segment in the depth direction.
struct probeInterpolation {
    start_probe: vec3f,
    voxel_offset: vec3f,
    voxel_count: u32,
    depth_offset: f32,
}

fn probe_stats(offset: vec2f, start_depth: f32, end_depth: f32, ijk2xyz: mat4x4f) 
    -> probeInterpolation {
    var result: probeInterpolation;
    let start_xyz = probe_point(offset, start_depth, ijk2xyz);
    result.start_probe = start_xyz;
    let end_xyz = probe_point(offset, end_depth, ijk2xyz);
    let vector = end_xyz - start_xyz;
    let max_component = max(max(abs(vector[0]), abs(vector[1])), abs(vector[2]));
    result.voxel_offset = vector / max_component;
    result.voxel_count = u32(max_component);
    result.depth_offset = (end_depth - start_depth) / max_component;
    return result;
}

// Locate a voxel probe along a line segment in the depth direction as xyz
fn voxel_probe(iteration: u32, stats: probeInterpolation) -> vec3f {
    return stats.start_probe + f32(iteration) * stats.voxel_offset;
}

// Locate a voxel probe along a line segment in the depth direction as volume index offset.
fn voxel_probe_offset(
    iteration: u32, 
    stats: probeInterpolation, 
    geom : ptr<function, VolumeGeometry>) -> IndexOffset {
    let probe = voxel_probe(iteration, stats);
    //return offset_of_f(probe, geom);
    return offset_of_xyz(probe, geom);
}

fn intercepts2(offset: vec2i, intc: Intersection2) -> Endpoints2 {
    var result: Endpoints2;
    let x = (intc.c0 * f32(offset[0])) + (intc.c1 * f32(offset[1]));
    let high = floor(x + intc.high);
    let low = ceil(x + intc.low);
    result.is_valid = (high > low);
    result.offset = vec2f(low, high);
    return result;
}

fn intersect2(e1: Endpoints2, e2: Endpoints2) -> Endpoints2 {
    var result = e1;
    if (!e1.is_valid) {
        result = e2;
    } else {
        if (e2.is_valid) {
            let low = max(e1.offset[0], e2.offset[0]);
            let high = min(e1.offset[1], e2.offset[1]);
            result.offset = vec2f(low, high);
            result.is_valid = (low <= high);
        }
    }
    return result;
}
`, De = `
// Project a volume by max value onto a depth buffer (suffix)
// Assumes prefixes: 
//  depth_buffer.wgsl
//  volume_frame.wgsl
//  volume_intercept.wgsl

struct parameters {
    ijk2xyz : mat4x4f,
    int3: Intersections3,
    dk: f32,  // k increment for probe  ??? historical????
    // 3 floats padding at end...???
}

@group(0) @binding(0) var<storage, read> inputVolume : Volume;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    //let local_parms = parms;
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    // k increment length in xyz space
    //let dk = 1.0f;  // fix this! -- k increment length in xyz space
    let dk = parms.dk;
    var initial_value_found = false;
    if (outputLocation.valid) {
        var inputGeometry = inputVolume.geometry;
        var current_value = outputShape.default_value;
        var current_depth = outputShape.default_depth;
        let offsetij = vec2i(outputLocation.ij);
        let ijk2xyz = parms.ijk2xyz;
        var end_points = scan_endpoints(
            offsetij,
            parms.int3,
            &inputGeometry,
            ijk2xyz,
        );
        if (end_points.is_valid) {
            let offsetij_f = vec2f(offsetij);

            // using probe_offsets..
            let start_depth = end_points.offset[0];
            let end_depth = end_points.offset[1];
            let probe_stats = probe_stats(offsetij_f, start_depth, end_depth, ijk2xyz);
            let ddepth = (end_depth - start_depth) / f32(probe_stats.voxel_count);
            for (var iteration=0u; iteration<=probe_stats.voxel_count; iteration++) {
                let input_offset = voxel_probe_offset(iteration, probe_stats, &inputGeometry);
                if (input_offset.is_valid) {
                    let valueu32 = inputVolume.content[input_offset.offset];
                    let value = bitcast<f32>(valueu32);
                    if ((!initial_value_found) || (value > current_value)) {
                        current_depth = ddepth * f32(iteration) + start_depth;
                        current_value = value;
                        initial_value_found = true;
                    }
                }
            }
/*
            // previous version
            for (var depth = end_points.offset[0]; depth < end_points.offset[1]; depth += dk) {
                let xyz_probe = probe_point(offsetij_f, depth, ijk2xyz);
                let input_offset = offset_of_xyz(xyz_probe.xyz, &inputGeometry);
                if (input_offset.is_valid) {
                    let valueu32 = inputVolume.content[input_offset.offset];
                    let value = bitcast<f32>(valueu32);
                    if ((!initial_value_found) || (value > current_value)) {
                        current_depth = f32(depth);
                        current_value = value;
                        initial_value_found = true;
                    }
                } 
            } 
            */
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;
        outputDB.data_and_depth[outputLocation.data_offset] = current_value;
    }
}
`;
class Oe extends x {
  constructor(t, e, n) {
    super(), this.volume = e, this.depthBuffer = n, this.buffer_size = (4 * 4 + 4 * 3 + 4) * Int32Array.BYTES_PER_ELEMENT, this.set_matrix(t);
  }
  set_matrix(t) {
    this.ijk2xyz = I(t), this.intersections = Pt(t, this.volume);
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Float32Array(e);
    n.set(this.ijk2xyz, 0), n.set(this.intersections, 4 * 4);
  }
}
class Ot extends rt {
  constructor(t, e, n) {
    super(t, e), this.parameters = new Oe(n, t, e);
  }
  get_shader_module(t) {
    const e = Q + E + Dt + De;
    return t.device.createShaderModule({ code: e });
  }
  //getWorkgroupCounts() {
  //    return [Math.ceil(this.target.size / 256), 1, 1];
  //};
}
const Xn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MaxProject: Ot
}, Symbol.toStringTag, { value: "Module" }));
class zt extends V {
  constructor(t, e, n, o, s) {
    super(), this.fromDataObject = t, this.toDataObject = n, this.from_offset = e, this.to_offset = o, this.length = s;
  }
  add_pass(t) {
    const e = Int32Array.BYTES_PER_ELEMENT;
    t.copyBufferToBuffer(
      this.fromDataObject.gpu_buffer,
      this.from_offset * e,
      this.toDataObject.gpu_buffer,
      this.to_offset * e,
      this.length * e
    );
  }
}
const Qn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CopyData: zt
}, Symbol.toStringTag, { value: "Module" }));
class F extends x {
  constructor(t, e, n, o, s, a) {
    super(), [this.height, this.width] = t, this.default_depth = e, this.default_value = n, this.data_format = a || Uint32Array, this.data = null, this.depths = null, this.size = this.width * this.height, o && this.set_data(o), s && this.set_depths(s), this.content_offset = 4, this.depth_offset = this.size + this.content_offset, this.entries = this.size * 2 + this.content_offset, this.buffer_size = this.entries * Int32Array.BYTES_PER_ELEMENT;
  }
  clone_operation() {
    const t = new F(
      [this.height, this.width],
      this.default_depth,
      this.default_value,
      null,
      null,
      this.data_format
    );
    t.attach_to_context(this.context);
    const e = new zt(
      this,
      0,
      t,
      0,
      this.entries
    );
    return e.attach_to_context(this.context), { clone: t, clone_action: e };
  }
  flatten_action(t, e) {
    e = e || this.content_offset;
    const [n, o] = [this.width, this.height], [s, a] = [t.width, t.height];
    if (n != s || o != a)
      throw new Error("w/h must match: " + [n, o, s, a]);
    return new zt(
      this,
      e,
      t,
      0,
      this.size
      // length
    );
  }
  copy_depths_action(t) {
    return this.flatten_action(t, this.depth_offset);
  }
  set_data(t) {
    const e = t.length;
    if (this.size != e)
      throw new Error(`Data size ${e} doesn't match ${this.size}`);
    this.data = t;
  }
  set_depths(t) {
    const e = t.length;
    if (this.size != e)
      throw new Error(`Data size ${e} doesn't match ${this.size}`);
    this.depths = t;
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Float32Array(e), o = [this.height, this.width, this.default_depth, this.default_value];
    n.set(o, 0), this.data && new this.data_format(e).set(this.data, this.content_offset), this.depths && n.set(this.depths, this.depth_offset);
  }
  async pull_data() {
    const t = await this.pull_buffer(), e = new this.data_format(t);
    this.data = e.slice(this.content_offset, this.depth_offset);
    const n = new Float32Array(t), o = n.slice(0, 4);
    return this.height = o[0], this.width = o[1], this.default_depth = o[2], this.default_value = o[3], this.depths = n.slice(this.depth_offset, this.depth_offset + this.size), this.data;
  }
  location([t, e], n, o) {
    const s = {};
    if (e < 0 || e >= this.width || t < 0 || t >= this.height)
      return null;
    const a = e + t * this.width, r = this.data[a], u = this.depths[a];
    if (r == this.default_value && u == this.default_depth)
      return null;
    if (s.data = r, s.depth = u, n) {
      const _ = [t, e, u], c = n.ijk2xyz_v(_);
      if (s.xyz = c, o) {
        const l = o.space.xyz2ijk_v(c), h = l.map((f) => Math.floor(f));
        s.volume_ijk = h;
        const p = o.space.ijk2offset(l);
        s.volume_offset = p, p != null && (s.volume_data = o.data[p]);
      }
    }
    return s;
  }
}
const Hn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DepthBuffer: F
}, Symbol.toStringTag, { value: "Module" })), ne = `
// Prefix for converting f32 to rgba gray values.
// Prefix for convert_buffer.wgsl

struct parameters {
    input_start: u32,
    output_start: u32,
    length: u32,
    min_value: f32,
    max_value: f32,
}

fn new_out_value(in_value: u32, out_value: u32, parms: parameters) -> u32 {
    let in_float = bitcast<f32>(in_value);
    let min_value = parms.min_value;
    let max_value = parms.max_value;
    let in_clamp = clamp(in_float, min_value, max_value);
    let intensity = (in_clamp - min_value) / (max_value - min_value);
    let gray_level = u32(intensity * 255.0);
    //let color = vec4u(gray_level, gray_level, gray_level, 255u);
    //let result = pack4xU8(color); ???error: unresolved call target 'pack4xU8'
    let result = gray_level + 256 * (gray_level + 256 * (gray_level + 256 * 255));
    //let result = 255u + 256 * (gray_level + 256 * (gray_level + 256 * gray_level));
    return result;
}`, Ee = `
// Suffix for converting or combining data from one data object buffer to another.

// Assume that prefix defines struct parameters with members
//   - input_start: u32
//   - output_start: u32
//   - length: u32
// as well as any other members needed for conversion.
//
// And fn new_out_value(in_value: u32, out_value: u32, parms: parameters) -> u32 {...}


@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;

@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    // make a copy of parms for local use...
    let local_parms = parms;
    let offset = global_id.x;
    let length = parms.length;
    if (offset < length) {
        let input_start = parms.input_start;
        let output_start = parms.output_start;
        let input_value = inputBuffer[input_start + offset];
        let output_index = output_start + offset;
        let output_value = outputBuffer[output_index];
        let new_output_value = new_out_value(input_value, output_value, local_parms);
        outputBuffer[output_index] = new_output_value;
    }
}
`, Ve = `

// Suffix for converting or combining data from one depth buffer buffer to another.
// This respects depth buffer default (null) markers.

// Assume that prefix defines struct parameters with members needed for conversion.
//
// And fn new_out_value(in_value: u32, out_value: u32, parms: parameters) -> u32 {...}
//
// Requires "depth_buffer.wgsl".

@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    // make a copy of parms for local use...
    let local_parms = parms;
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    if (outputLocation.valid) {
        var current_value = outputShape.default_value; // ???
        var current_depth = outputShape.default_depth;
        let inputIndices = outputLocation.ij;
        let inputShape = inputDB.shape;
        let inputLocation = depth_buffer_location_of(inputIndices, inputShape);
        if (inputLocation.valid) {
            let inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];
            let inputValue = inputDB.data_and_depth[inputLocation.data_offset];
            if (!is_default(inputValue, inputDepth, inputShape)) {
                let Uvalue = bitcast<u32>(inputValue);
                let Ucurrent = bitcast<u32>(current_value);
                current_value = bitcast<f32>( new_out_value(Uvalue, Ucurrent, local_parms));
                current_depth = inputDepth;
            }
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;
        outputDB.data_and_depth[outputLocation.data_offset] = current_value;
    }
}`;
class oe extends x {
  constructor(t, e, n, o, s) {
    super(), this.input_start = t, this.output_start = e, this.length = n, this.min_value = o, this.max_value = s, this.buffer_size = 5 * Int32Array.BYTES_PER_ELEMENT;
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Uint32Array(e);
    n[0] = this.input_start, n[1] = this.output_start, n[2] = this.length;
    const o = new Float32Array(e);
    o[3] = this.min_value, o[4] = this.max_value;
  }
}
class se extends M {
  constructor(t, e, n, o, s, a, r) {
    super(), this.from_start = n, this.to_start = o, this.length = s, this.min_value = a, this.max_value = r, this.source = t, this.target = e;
  }
  attach_to_context(t) {
    this.parameters = new oe(
      this.from_start,
      this.to_start,
      this.length,
      this.min_value,
      this.max_value
    ), super.attach_to_context(t);
  }
  get_shader_module(t) {
    const e = ne + Ee;
    return t.device.createShaderModule({ code: e });
  }
  getWorkgroupCounts() {
    return [Math.ceil(this.length / 256), 1, 1];
  }
}
class Et extends se {
  constructor(t, e, n, o) {
    const s = t.size;
    if (s != e.size)
      throw new Error("panel sizes must match: " + [s, e.size]);
    super(t, e, 0, 0, s, n, o);
  }
  compute_extrema() {
    const t = this.source.buffer_content;
    if (t == null)
      throw new Error("compute_extrema requires pulled buffer content.");
    const e = new Float32Array(t);
    var n = e[0], o = n;
    for (var s of e)
      n = Math.min(n, s), o = Math.max(o, s);
    this.min_value = n, this.max_value = o;
  }
  async pull_extrema() {
    await this.source.pull_buffer(), this.compute_extrema();
  }
}
class ie extends M {
  constructor(t, e, n, o) {
    super(), this.source = t, this.target = e, this.min_value = n, this.max_value = o, this.parameters = new oe(
      0,
      // not used
      0,
      // not used
      t.size,
      // not used.
      n,
      o
    );
  }
  get_shader_module(t) {
    const e = E + ne + Ve;
    return t.device.createShaderModule({ code: e });
  }
  getWorkgroupCounts() {
    return [Math.ceil(this.target.size / 256), 1, 1];
  }
}
const Zn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  PaintDepthBufferGray: ie,
  ToGrayPanel: Et,
  UpdateGray: se
}, Symbol.toStringTag, { value: "Module" }));
function Ge() {
  return new w();
}
async function Le() {
  const i = new w();
  return await i.connect(), i;
}
function Ae() {
  if (!navigator.gpu || !navigator.gpu.requestAdapter)
    throw alert("Cannot get WebGPU context. This browser does not have WebGPU enabled."), new Error("Can't get WebGPU context.");
}
class w {
  constructor() {
    Ae(), this.adapter = null, this.device = null, this.connected = !1;
  }
  async connect() {
    try {
      if (this.connected)
        return;
      if (this.adapter = await navigator.gpu.requestAdapter(), this.adapter) {
        const t = this.adapter.limits.maxStorageBufferBindingSize, e = {};
        if (e.maxStorageBufferBindingSize = t, e.maxBufferSize = t, this.device = await this.adapter.requestDevice({
          requiredLimits: e
        }), this.device)
          this.device.addEventListener("uncapturederror", (n) => {
            console.error("A WebGPU error was not captured:", n.error);
          }), this.connected = !0;
        else
          throw new Error("Could not get device from gpu adapter");
      } else
        throw new Error("Could not get gpu adapter");
    } finally {
      this.connected || alert("Failed to connect WebGPU. This browser does not have WebGPU enabled.");
    }
  }
  destroy() {
    this.connected && (this.device.destroy(), this.connected = !1), this.device = null, this.adapter = null;
  }
  onSubmittedWorkDone() {
    return this.must_be_connected(), this.device.queue.onSubmittedWorkDone();
  }
  connect_then_call(t) {
    var e = this;
    async function n() {
      await e.connect(), t();
    }
    n();
  }
  must_be_connected() {
    if (!this.connected)
      throw new Error("context is not connected.");
  }
  // Data object conveniences.
  volume(t, e, n, o) {
    this.must_be_connected();
    const s = new it(t, e, n, o);
    return s.attach_to_context(this), s;
  }
  depth_buffer(t, e, n, o, s, a) {
    this.must_be_connected();
    const r = new F(
      t,
      e,
      n,
      o,
      s,
      a
    );
    return r.attach_to_context(this), r;
  }
  panel(t, e) {
    this.must_be_connected();
    const n = new z(t, e);
    return n.attach_to_context(this), n;
  }
  // Action conveniences.
  sample(t, e, n) {
    this.must_be_connected();
    const o = new St(t, e, n);
    return o.attach_to_context(this), o;
  }
  paint(t, e) {
    this.must_be_connected();
    const n = new at(t, e);
    return n.attach_to_context(this), n;
  }
  to_gray_panel(t, e, n, o) {
    this.must_be_connected();
    const s = new Et(
      t,
      e,
      n,
      o
    );
    return s.attach_to_context(this), s;
  }
  max_projection(t, e, n) {
    this.must_be_connected();
    const o = new Ot(
      t,
      e,
      n
    );
    return o.attach_to_context(this), o;
  }
  sequence(t) {
    this.must_be_connected();
    const e = new Zt(
      t
    );
    return e.attach_to_context(this), e;
  }
}
const to = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Context: w,
  get_connected_context: Le,
  get_context: Ge
}, Symbol.toStringTag, { value: "Module" }));
function Te() {
  console.log("computing sample asyncronously"), (async () => await qe())();
}
async function qe() {
  debugger;
  const i = new w();
  await i.connect();
  const t = [
    [1, 0, 0, 1],
    [0, 1, 0, 2],
    [0, 0, 1, 3],
    [0, 0, 0, 1]
  ], e = [2, 3, 2], n = [30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], o = [
    [0, 1, 0, 1],
    [0, 0, 1, 2],
    [1, 0, 0, 3],
    [0, 0, 0, 1]
  ], s = [2, 2, 3], a = [30, 2, 4, 6, 8, 10, 1, 3, 5, 7, 9, 11], r = new it(e, n, t);
  r.attach_to_context(i);
  const u = new St(s, o, r);
  u.attach_to_context(i), u.run();
  const _ = await u.pull();
  console.log("expected", a), console.log("got output", _);
}
const eo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  do_sample: Te
}, Symbol.toStringTag, { value: "Module" }));
var ft, ae, A;
function Ue(i) {
  A = new ee(re, 2, 2, i);
}
function Ie(i) {
  console.log("painting panel asyncronously"), ae = i, ft = new w(), ft.connect_then_call(Ce);
}
function D(i, t, e, n) {
  return i * 255 + 256 * (t * 255 + 256 * (e * 255 + 256 * n * 255));
}
const re = new Uint32Array([
  D(1, 0, 0, 1),
  D(0, 1, 0, 1),
  D(0, 0, 1, 1),
  D(1, 1, 0, 1)
]), Fe = new Uint32Array([
  D(0, 1, 0, 1),
  D(0, 0, 1, 1),
  D(1, 1, 0, 1),
  D(1, 0, 0, 1)
]);
var T = re, dt = Fe, K;
function Ce() {
  K = new z(2, 2), A = new at(K, ae), K.attach_to_context(ft), A.attach_to_context(ft), K.push_buffer(T), A.run();
}
function Re(i) {
  [T, dt] = [dt, T], K.push_buffer(T), A.reset(K), A.run();
}
function Ne(i) {
  [T, dt] = [dt, T], A.change_image(T);
}
const no = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  change_paint: Ne,
  change_paint1: Re,
  do_paint: Ue,
  do_paint1: Ie
}, Symbol.toStringTag, { value: "Module" })), We = `
// Suffix pasting input depth buffer over output where depth dominates
// Requires "depth_buffer.wgsl"

@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> input_offset_ij_sign: vec3i;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    if (outputLocation.valid) {
        let inputIndices = outputLocation.ij + input_offset_ij_sign.xy;
        let inputShape = inputDB.shape;
        let inputLocation = depth_buffer_location_of(inputIndices, inputShape);
        if (inputLocation.valid) {
            let inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];
            let inputData = inputDB.data_and_depth[inputLocation.data_offset];
            if (!is_default(inputData, inputDepth, inputShape)) {
                let outputDepth = outputDB.data_and_depth[outputLocation.depth_offset];
                let outputData = outputDB.data_and_depth[outputLocation.data_offset];
                if (is_default(outputData, outputDepth, outputShape) || 
                    (((inputDepth - outputDepth) * f32(input_offset_ij_sign.z)) < 0.0)) {
                    outputDB.data_and_depth[outputLocation.depth_offset] = inputDepth;
                    outputDB.data_and_depth[outputLocation.data_offset] = inputData;
                }
            }
            // DEBUG
            //outputDB.data_and_depth[outputLocation.depth_offset] = bitcast<f32>(0x99999999u);
            //outputDB.data_and_depth[outputLocation.data_offset] = bitcast<f32>(0x99999999u);
            
        //} else {
            // DEBUG
            //outputDB.data_and_depth[outputLocation.depth_offset] = 55.5;
            //outputDB.data_and_depth[outputLocation.data_offset] = 55.5;
        }
    }
}`;
class Ye extends x {
  // xxxx possibly refactor/generalize this.
  constructor(t, e) {
    super(), this.offset_ij = t, this.sign = e, this.buffer_size = 3 * Int32Array.BYTES_PER_ELEMENT;
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Int32Array(e);
    n.set(this.offset_ij), n[2] = this.sign;
  }
}
class ue extends V {
  constructor(t, e, n, o) {
    super(), this.outputDB = t, this.inputDB = e, this.offset_ij = n || [0, 0], this.sign = o || 1, this.parameters = new Ye(this.offset_ij, this.sign);
  }
  attach_to_context(t) {
    const e = t.device, n = this.inputDB, o = this.outputDB, s = this.parameters;
    s.attach_to_context(t);
    const a = Ht(We, t), r = o.bindGroupLayout("storage"), u = n.bindGroupLayout("read-only-storage"), _ = s.bindGroupLayout("read-only-storage"), c = e.createPipelineLayout({
      bindGroupLayouts: [
        u,
        r,
        _
      ]
    });
    this.pipeline = e.createComputePipeline({
      layout: c,
      compute: {
        module: a,
        entryPoint: "main"
      }
    }), this.sourceBindGroup = n.bindGroup(u, t), this.targetBindGroup = o.bindGroup(r, t), this.parmsBindGroup = s.bindGroup(_, t), this.attached = !0, this.context = t;
  }
  add_pass(t) {
    const e = t.beginComputePass(), n = this.pipeline;
    e.setPipeline(n), e.setBindGroup(0, this.sourceBindGroup), e.setBindGroup(1, this.targetBindGroup), e.setBindGroup(2, this.parmsBindGroup);
    const o = Math.ceil(this.outputDB.size / 8);
    e.dispatchWorkgroups(o), e.end();
  }
  getWorkgroupCounts() {
    return [Math.ceil(this.target.size / 256), 1, 1];
  }
}
const oo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CombineDepths: ue
}, Symbol.toStringTag, { value: "Module" }));
function $e() {
  console.log("computing sample asyncronously"), (async () => await Ke())();
}
async function Ke() {
  const i = new w();
  await i.connect();
  const t = [3, 3], e = -666, n = -666, o = [
    1,
    2,
    n,
    4,
    5,
    6,
    7,
    8,
    9
  ], s = [
    1,
    2,
    e,
    4,
    5,
    6,
    7,
    8,
    9
  ], a = [
    9,
    8,
    7,
    6,
    5,
    4,
    n,
    2,
    1
  ], r = [
    9,
    8,
    7,
    6,
    5,
    4,
    e,
    2,
    1
  ], u = new F(
    t,
    e,
    n,
    o,
    s,
    Float32Array
  ), _ = new F(
    t,
    e,
    n,
    a,
    r,
    Float32Array
  );
  u.attach_to_context(i), _.attach_to_context(i);
  const c = new ue(
    _,
    u
  );
  c.attach_to_context(i), c.run();
  const l = await _.pull_data();
  console.log("got result", l), console.log("outputDB", _);
}
const so = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  do_combine: $e
}, Symbol.toStringTag, { value: "Module" })), ut = `
// Framework for panel buffer structure
// A panel consists of a buffer representing a rectangular screen region.
// with height and width.

struct PanelOffset {
    offset: u32,
    ij: vec2u,
    is_valid: bool
}

fn panel_location_of(offset: u32, height_width: vec2u)-> PanelOffset  {
    // location of buffer offset in row/col form.
    let height = height_width[0];
    let width = height_width[1];
    var result : PanelOffset;
    result.offset = offset;
    result.is_valid = (offset < width * height);
    if (result.is_valid) {
        let row = offset / width;
        let col = offset - row * width;
        result.ij = vec2u(row, col);
    }
    return result;
}

fn panel_offset_of(ij: vec2u, height_width: vec2u) -> PanelOffset {
    // buffer offset of row/col
    var result : PanelOffset;
    result.is_valid = all(ij < height_width);
    if (result.is_valid) {
        //const height = height_width[0];
        let width = height_width[1];
        result.offset = ij[0] * width + ij[1];
        result.ij = ij;
    }
    return result;
}

fn f_panel_offset_of(xy: vec2f, height_width: vec2u)-> PanelOffset {
    // buffer offset of vec2f row/col
    var result : PanelOffset;
    result.is_valid = ((xy[0] >= 0.0) && (xy[1] >= 0.0));
    if (result.is_valid) {
        result = panel_offset_of(vec2u(xy), height_width);
    }
    return result;
}

// xxxx this should be a builtin 'pack4xU8'...
fn f_pack_color(color: vec3f) -> u32 {
    let ucolor = vec3u(clamp(
        255.0 * color, 
        vec3f(0.0, 0.0, 0.0),
        vec3f(255.0, 255.0, 255.0)));
    return ucolor[0] + 
        256u * (ucolor[1] + 256u * (ucolor[2] + 256u * 255u));
}
`, Je = `
// suffix for pasting one panel onto another

struct parameters {
    in_hw: vec2u,
    out_hw: vec2u,
    offset: vec2i,
}

@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;

@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    // input expected to be smaller, so loop over input
    let inputOffset = global_id.x;
    let in_hw = parms.in_hw;
    let in_location = panel_location_of(inputOffset, in_hw);
    if (in_location.is_valid) {
        let paste_location = vec2f(parms.offset) + vec2f(in_location.ij);
        let out_hw = parms.out_hw;
        let out_location = f_panel_offset_of(paste_location, out_hw);
        if (out_location.is_valid) {
            let value = inputBuffer[in_location.offset];
            outputBuffer[out_location.offset] = value;
        }
    }
}`;
class Xe extends x {
  constructor(t, e, n) {
    super(), this.in_hw = t, this.out_hw = e, this.offset = n, this.buffer_size = 6 * Int32Array.BYTES_PER_ELEMENT;
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Uint32Array(e);
    n.set(this.in_hw), n.set(this.out_hw, 2), new Int32Array(e).set(this.offset, 4);
  }
}
class mt extends M {
  constructor(t, e, n) {
    super();
    const o = [t.height, t.width], s = [e.height, e.width];
    this.parameters = new Xe(o, s, n), this.from_hw = o, this.to_hw = s, this.offset = n, this.source = t, this.target = e;
  }
  change_offset(t) {
    this.offset = t, this.parameters.offset = t, this.parameters.push_buffer();
  }
  get_shader_module(t) {
    const e = ut + Je;
    return t.device.createShaderModule({ code: e });
  }
  getWorkgroupCounts() {
    return [Math.ceil(this.source.size / 256), 1, 1];
  }
}
const io = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  PastePanel: mt
}, Symbol.toStringTag, { value: "Module" }));
function Qe() {
  console.log("pasting asyncronously"), (async () => await He())();
}
async function He() {
  debugger;
  const i = new w();
  await i.connect();
  const t = new z(2, 2), e = new z(3, 3);
  t.attach_to_context(i), e.attach_to_context(i);
  const n = new Uint32Array([
    10,
    20,
    30,
    40
  ]);
  t.push_buffer(n);
  const o = new Uint32Array([
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
  e.push_buffer(o);
  const s = new mt(
    t,
    e,
    //[2,2], // xxxxx this can be inferred!
    //[3,3], // xxx
    [1, 0]
  );
  s.attach_to_context(i), s.run();
  const a = await e.pull_buffer();
  console.log("got result", a);
}
const ao = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  do_paste: Qe
}, Symbol.toStringTag, { value: "Module" }));
function Ze(i) {
  console.log("pasting asyncronously"), tn(en(i));
}
function tn(i) {
  (async () => await i)();
}
async function en(i) {
  debugger;
  const t = new w();
  await t.connect();
  const e = 100, n = 1e3, o = new z(e, e), s = new z(n, n), a = new z(n, n);
  o.attach_to_context(t), s.attach_to_context(t), a.attach_to_context(t);
  const r = new Uint8Array(e * e), u = e / 2;
  for (var _ = 0; _ < e; _++)
    for (var c = 0; c < e; c++) {
      const G = _ * e + c;
      r[G] = (Math.abs(u - _) + Math.abs(u - c)) * 10 % 255;
    }
  const l = nt(r);
  await o.push_buffer(l);
  const h = new Uint8Array(n * n), p = n / 2;
  for (var _ = 0; _ < n; _++)
    for (var c = 0; c < n; c++) {
      const L = _ * n + c;
      h[L] = (255 - 2 * (Math.abs(p - _) + Math.abs(p - c))) % 255;
    }
  const f = nt(h);
  await s.push_buffer(f);
  const d = new mt(
    s,
    a,
    [0, 0]
  );
  d.attach_to_context(t), d.run();
  const y = p - u, j = new mt(
    o,
    a,
    [y, y]
  );
  j.attach_to_context(t), j.run();
  const v = new at(a, i);
  v.attach_to_context(t), v.run();
  const g = i.getBoundingClientRect(), S = document.getElementById("info");
  S.textContent = "initial paste done.";
  const $ = function(G) {
    const _t = G.pageX, L = G.pageY, Z = g.width / 2 + g.left, ct = g.height / 2 + g.top, lt = _t - Z, xt = -(L - ct), yt = lt * 2 / g.width, wt = xt * 2 / g.height, jt = 0.5 * (n * (wt + 1)), me = 0.5 * (n * (yt + 1)), At = [jt - u, me - u];
    S.textContent = "offset: " + At, j.change_offset(At), d.run(), j.run(), v.run();
  };
  i.addEventListener("mousemove", $);
}
const ro = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  do_mouse_paste: Ze
}, Symbol.toStringTag, { value: "Module" }));
function nn() {
  console.log("computing sample asyncronously"), (async () => await on())();
}
async function on() {
  const i = new w();
  await i.connect();
  const t = new z(3, 3), e = new z(3, 3);
  t.attach_to_context(i), e.attach_to_context(i);
  const n = new Float32Array([
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
  t.push_buffer(n);
  const o = new Et(t, e, 0, 10);
  o.attach_to_context(i), o.run();
  const s = await e.pull_buffer();
  console.log("got result", s);
}
const uo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  do_gray: nn
}, Symbol.toStringTag, { value: "Module" }));
function sn() {
  console.log("computing sample asyncronously"), (async () => await an())();
}
async function an() {
  debugger;
  const i = new w();
  await i.connect();
  const t = [2, 3], e = -100, n = -100, o = null, s = null, a = new F(
    t,
    e,
    n,
    o,
    s,
    Float32Array
  ), r = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ], u = [2, 3, 2], _ = [30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], c = new it(u, _, r, Float32Array);
  c.attach_to_context(i), a.attach_to_context(i), console.log("inputVolume", c);
  const l = new Ot(c, a, r);
  l.attach_to_context(i), l.run();
  const h = await a.pull_data();
  console.log("got result", h), console.log("outputDB", a);
}
const _o = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  do_max_projection: sn
}, Symbol.toStringTag, { value: "Module" }));
class N {
  constructor(t, e, n, o) {
    this.canvas = t, this.center = e, this.center ? (this.minus_center = O(-1, this.center), this.center_to_originM = b(null, this.minus_center), this.origin_to_centerM = b(null, this.center)) : (this.minus_center = null, this.center_to_originM = null, this.origin_to_centerM = null), this.initial_rotation = n || k(3), this.bounding_rect = t.getBoundingClientRect(), this.callbacks = [], o && this.add_callback(o), this.attach_listeners_to(t), this.active = !1, this.current_rotation = m(k(3), this.initial_rotation), this.next_rotation = this.current_rotation, this.last_stats = null;
  }
  attach_listeners_to(t) {
    const e = this;
    t.addEventListener("pointerdown", function(n) {
      e.pointerdown(n);
    }), t.addEventListener("pointermove", function(n) {
      e.pointermove(n);
    }), t.addEventListener("pointerup", function(n) {
      e.pointerup(n);
    }), t.addEventListener("pointercancel", function(n) {
      e.pointerup(n);
    }), t.addEventListener("pointerout", function(n) {
      e.pointerup(n);
    }), t.addEventListener("pointerleave", function(n) {
      e.pointerup(n);
    });
  }
  pointerdown(t) {
    this.active = !0, this.last_stats = this.event_stats(t);
  }
  pointermove(t) {
    this.active && this.do_rotation(t);
  }
  pointerup(t) {
    this.active && (this.do_rotation(t), this.active = !1, this.current_rotation = this.next_rotation);
  }
  do_rotation(t) {
    const e = this.last_stats, n = this.event_stats(t);
    this.next_stats = n;
    const o = 1, s = o * (n.dx - e.dx), a = o * (n.dy - e.dy), r = Math.PI / 2, u = r * s, _ = r * a, c = Mt(u), l = Bt(_), h = m(
      this.current_rotation,
      m(c, l)
    );
    this.next_rotation = h;
    const p = b(h);
    var f = p;
    this.center && (f = m(
      m(this.origin_to_centerM, p),
      this.center_to_originM
    ));
    for (var d of this.callbacks)
      d(f);
  }
  event_stats(t) {
    const e = this.bounding_rect, n = t.pageX, o = t.pageY, s = e.width / 2 + e.left, a = e.height / 2 + e.top, r = n - s, u = -(o - a), _ = r * 2 / e.width, c = u * 2 / e.height;
    return { px: n, py: o, cx: s, cy: a, offsetx: r, offsety: u, dx: _, dy: c };
  }
  add_callback(t) {
    this.callbacks.push(t);
  }
}
const co = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Orbiter: N
}, Symbol.toStringTag, { value: "Module" }));
function rn(i, t, e, n) {
  console.log("computing sample asyncronously"), (async () => await _n(i, t, e, n))();
}
var tt, Vt, J, ht;
function un(i) {
  const [t, e, n] = J, o = Math.max(t, e, n), s = b(null, [-o, -o, -o]), a = m(i, s);
  tt.change_matrix(a), Vt.run();
}
async function _n(i, t, e, n) {
  debugger;
  t = t || "./mri.bin", ht = [
    [0, 0, -1],
    [1, 0, 0],
    [0, -1, 0]
  ], new N(
    i,
    null,
    // center,
    ht,
    un
    // callback,
  );
  const o = new w();
  await o.connect();
  const r = await (await (await fetch(t)).blob()).arrayBuffer();
  console.log("buffer", r);
  const u = new Float32Array(r);
  console.log("f32", u), J = u.slice(0, 3), console.log("shape_in", J);
  const [_, c, l] = J;
  e && (e.max = 3 * _, e.min = -3 * _);
  const h = Math.max(_, c, l), p = u.slice(3);
  var f = m(
    b(ht),
    b(null, [-h, -h, -h])
  );
  const d = k(4);
  d[1][1] = -1;
  const y = b(null, [-_ / 2, -c / 2, -l / 2]);
  var j = m(d, y);
  const v = o.volume(J, p, j, Float32Array);
  console.log("inputVolume", v);
  const g = [h * 2, h * 2], [S, $] = g, L = o.depth_buffer(
    g,
    -100,
    -100,
    null,
    //input_data,
    null,
    // input_depths,
    Float32Array
  );
  console.log("outputDB", L), tt = o.max_projection(v, L, f), console.log("project_action", tt);
  const Z = new z($, S);
  Z.attach_to_context(o);
  const ct = L.flatten_action(Z);
  ct.attach_to_context(o);
  const lt = o.panel($, S), xt = v.min_value, yt = v.max_value, wt = o.to_gray_panel(Z, lt, xt, yt), jt = o.paint(lt, i);
  Vt = o.sequence([
    tt,
    ct,
    wt,
    jt
  ]), _e(0, 0, 0, e, n);
}
function _e(i, t, e, n, o) {
  const s = Wt(i), a = Bt(t), r = Mt(e), u = m(m(s, a), r), [_, c, l] = J, h = Math.max(_, c, l);
  var p = -h;
  n && (p = n.value), o && (o.textContent = p);
  const f = m(
    b(ht),
    b(null, [-h, -h, p])
  ), d = b(u), y = m(d, f);
  tt.change_matrix(y), Vt.run();
}
const lo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  do_pipeline: rn,
  do_rotation: _e
}, Symbol.toStringTag, { value: "Module" }));
class Gt {
  constructor(t, e) {
    const [n, o, s] = t;
    this.shape = t, this.size = s * o * n;
    const a = e.length;
    if (this.size != a)
      throw new Error(
        `data length ${a} doesn't match shape ${t}`
      );
    this.data = new Float32Array(e);
  }
  gpu_volume(t, e, n, o) {
    e = e || 1, n = n || 1, o = o || 1;
    const [s, a, r] = this.shape, u = Math.max(r, a, s), _ = Math.max(o * r, n * a, e * s), c = u / _, l = [
      [c * e, 0, 0, 0],
      [0, c * n, 0, 0],
      [0, 0, c * o, 0],
      [0, 0, 0, 1]
    ], p = m([
      [0, -1, 0, 0],
      [0, 0, 1, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 1]
    ], l), f = b(null, [-s / 2, -a / 2, -r / 2]), d = m(p, f);
    return t.volume(
      this.shape,
      this.data,
      d,
      Float32Array
    );
  }
}
function cn(i) {
  const t = i.slice(0, 3), e = i.slice(3);
  return new Gt(t, e);
}
async function ln(i, t) {
  t = t || Float32Array;
  const e = await ce(i), n = new t(e);
  return cn(n);
}
async function hn(i, t, e = Float32Array) {
  const n = await ce(t), o = new e(n);
  return new Gt(i, o);
}
async function ce(i) {
  return await (await (await fetch(i)).blob()).arrayBuffer();
}
const ho = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Volume: Gt,
  fetch_volume: hn,
  fetch_volume_prefixed: ln
}, Symbol.toStringTag, { value: "Module" })), pn = `
// Select a range in depths or values from a depth buffer 
// copied to output depth buffer at same ij locations where valid.

// Requires "depth_buffer.wgsl".

struct parameters {
    lower_bound: f32,
    upper_bound: f32,
    do_values: u32, // flag.  Do values if >0 else do depths.
}

@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    if (outputLocation.valid) {
        var current_value = outputShape.default_value;
        var current_depth = outputShape.default_depth;
        let inputIndices = outputLocation.ij;
        let inputShape = inputDB.shape;
        let inputLocation = depth_buffer_location_of(inputIndices, inputShape);
        if (inputLocation.valid) {
            let inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];
            let inputValue = inputDB.data_and_depth[inputLocation.data_offset];
            var testValue = inputDepth;
            if (parms.do_values > 0) {
                testValue = inputValue;
            }
            if ((!is_default(inputValue, inputDepth, inputShape)) &&
                (parms.lower_bound <= testValue) && 
                (testValue <= parms.upper_bound)) {
                current_depth = inputDepth;
                current_value = inputValue;
            }
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;
        outputDB.data_and_depth[outputLocation.data_offset] = current_value;
    }
}`;
class fn extends x {
  constructor(t, e, n) {
    super(), this.lower_bound = t, this.upper_bound = e, this.do_values = n, this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Uint32Array(e), o = new Float32Array(e);
    o[0] = this.lower_bound, o[1] = this.upper_bound, n[2] = this.do_values;
  }
}
class ot extends M {
  constructor(t, e, n, o, s) {
    super(), this.source = t, this.target = e, this.parameters = new fn(n, o, s);
  }
  change_bounds(t, e) {
    this.parameters.lower_bound = t, this.parameters.upper_bound = e, this.parameters.push_buffer();
  }
  change_lower_bound(t) {
    this.change_bounds(t, this.parameters.upper_bound);
  }
  change_upper_bound(t) {
    this.change_bounds(this.parameters.lower_bound, t);
  }
  get_shader_module(t) {
    const e = E + pn;
    return t.device.createShaderModule({ code: e });
  }
  getWorkgroupCounts() {
    return [Math.ceil(this.source.size / 256), 1, 1];
  }
}
const po = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DepthRange: ot
}, Symbol.toStringTag, { value: "Module" })), dn = `
// suffix for pasting one panel onto another

struct parameters {
    in_hw: vec2u,
    out_hw: vec2u,
    default_color: u32,
}

@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;

@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    // loop over output
    let outputOffset = global_id.x;
    let out_hw = parms.out_hw;
    let out_location = panel_location_of(outputOffset, out_hw);
    if (out_location.is_valid) {
        // initial values arrive as f32
        let color_index_f = bitcast<f32>(outputBuffer[out_location.offset]);
        let color_index = u32(color_index_f);
        let color_ij = vec2u(color_index, 0);
        //let color_ij = vec2u(0, color_index);
        let in_hw = parms.in_hw;
        let color_location = panel_offset_of(color_ij, in_hw);
        var value = parms.default_color;
        //value = 4294967295u - 256u * 255; // magenta
        //value = 0;
        if (color_location.is_valid) {
            value = inputBuffer[color_location.offset];
        }
        // debug
        //if (color_index < 1000) {
        //    value = inputBuffer[color_index];
        //    if (color_index > 5) {
        //        value = 4294967295u - 256u * 255; // magenta
        //    }
        //    //value = 4294967295u - 256 * 256u * 255; // yellow
        //    //value = 0;
        //}
        outputBuffer[out_location.offset] = value;
    }
}`;
class mn extends x {
  constructor(t, e, n) {
    super(), this.in_hw = t, this.out_hw = e, this.default_color = n, this.buffer_size = 6 * Int32Array.BYTES_PER_ELEMENT;
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Uint32Array(e);
    n.set(this.in_hw), n.set(this.out_hw, 2), n[4] = this.default_color;
  }
}
class bt extends M {
  // all color values are Uint32 encoded RGBA
  constructor(t, e, n) {
    super();
    const o = t.width;
    if (o != 1)
      throw new Error("indexed colors should have width 1: " + o);
    const s = [t.height, o], a = [e.height, e.width];
    this.parameters = new mn(s, a, n), this.from_hw = s, this.to_hw = a, this.default_color = n, this.source = t, this.target = e;
  }
  get_shader_module(t) {
    const e = ut + dn;
    return t.device.createShaderModule({ code: e });
  }
  getWorkgroupCounts() {
    return [Math.ceil(this.target.size / 256), 1, 1];
  }
}
const fo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  IndexColorizePanel: bt
}, Symbol.toStringTag, { value: "Module" }));
class P extends V {
  constructor(t) {
    super(), this.ofVolume = t, this.set_geometry();
  }
  async paint_on(t, e) {
    const n = this.ofVolume.context;
    if (!n)
      throw new Error("Volume is not attached to GPU context.");
    if (this.canvas_paint_sequence(n, t), e) {
      const o = this.get_orbiter_callback(), s = k(3);
      this.orbiter = new N(
        t,
        null,
        // center,
        s,
        o
        // callback,
      );
    }
    this.run();
  }
  pick_on(t, e, n) {
    n = n || "click";
    const o = new $t(t), [s, a] = this.output_shape;
    this.panel_space = new Kt(s, a);
    const r = this;
    t.addEventListener(n, async function(u) {
      const _ = await r.pick(u, o);
      e && e(_);
    });
  }
  async pick(t, e) {
    const n = e.normalize_event_coords(t), s = this.panel_space.normalized2ij(n);
    var a = null;
    return this.output_panel && (await this.output_panel.pull_buffer(), a = this.output_panel.color_at(s)), {
      normalized_coords: n,
      panel_coords: s,
      //panel_offset: panel_offset,
      panel_color: a
    };
  }
  set_geometry() {
    const [t, e, n] = this.ofVolume.shape;
    this.MaxS = Math.max(t, e, n) * Math.sqrt(2);
    const o = Math.ceil(this.MaxS);
    this.output_shape = [o, o], this.initial_rotation = k(3), this.affine_translation = b(null, [-o / 2, -o / 2, -o / 2]), this.projection_matrix = m(
      b(this.initial_rotation),
      this.affine_translation
    ), this.space = new pt(this.projection_matrix);
  }
  canvas_paint_sequence(t, e) {
    this.attach_to_context(t);
    const n = this.panel_sequence(t);
    this.output_panel = n.output_panel;
    const o = t.paint(n.output_panel, e);
    return this.paint_sequence = t.sequence([
      n.sequence,
      o
    ]), this.paint_sequence;
  }
  async run() {
    (this.paint_sequence || this.project_to_panel).run();
  }
  panel_sequence(t) {
    throw new Error("panel_sequence must be defined in subclass.");
  }
  _orbiter_callback(t) {
    const e = m(t, this.projection_matrix);
    this.change_matrix(e), this.run();
  }
  change_matrix(t) {
    this.space = new pt(t);
  }
  get_orbiter_callback() {
    const t = this;
    return function(e) {
      return t._orbiter_callback(e);
    };
  }
  orbit2xyz_v(t) {
    return this.space.ijk2xyz_v(t);
  }
  xyz2volume_v(t) {
    return this.ofVolume.space.xyz2ijk_v(t);
  }
  orbit2volume_v(t) {
    return this.xyz2volume_v(this.orbit2xyz_v(t));
  }
  orbit_sample(t) {
    const e = this.orbit2xyz_v(t), n = this.xyz2volume_v(e);
    var o = this.ofVolume.space.ijk2offset(n), s = null;
    return this.data && o !== null && (s = this.ofVolume.data[o]), {
      xyz: e,
      volume_indices: n,
      volume_offset: o,
      volume_sample: s
    };
  }
  get_output_depth_buffer(t, e, n, o) {
    return e = e || -1e10, n = n || 0, o = o || Float32Array, t = t || this.context, t.depth_buffer(
      this.output_shape,
      e,
      n,
      null,
      // no input data
      null,
      // no input depth
      o
    );
  }
  get_output_panel(t) {
    t = t || this.context;
    const [e, n] = this.output_shape;
    return t.panel(n, e);
  }
  get_gray_panel_sequence(t, e, n) {
    const o = this.context, s = this.get_output_panel(o), a = t.flatten_action(s), r = this.get_output_panel(o), u = o.to_gray_panel(
      s,
      r,
      e,
      n
    );
    return {
      sequence: o.sequence([
        a,
        u
      ]),
      output_panel: r
    };
  }
}
const mo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  View: P
}, Symbol.toStringTag, { value: "Module" }));
let le = class extends P {
  async pick(t, e) {
    const n = await super.pick(t, e), o = n.panel_coords;
    return await this.max_depth_buffer.pull_data(), n.maximum = this.max_depth_buffer.location(
      o,
      this.space,
      this.ofVolume
    ), n;
  }
  panel_sequence(t) {
    t = t || this.context;
    const e = this.ofVolume;
    return this.min_value = e.min_value, this.max_value = e.max_value, this.max_depth_buffer = this.get_output_depth_buffer(t), this.max_panel = this.get_output_panel(t), this.grey_panel = this.get_output_panel(t), this.project_action = t.max_projection(
      e,
      this.max_depth_buffer,
      this.projection_matrix
    ), this.flatten_action = this.flatten_action = this.max_depth_buffer.flatten_action(
      this.max_panel
    ), this.gray_action = t.to_gray_panel(
      this.max_panel,
      this.grey_panel,
      this.min_value,
      this.max_value
    ), this.project_to_panel = t.sequence([
      this.project_action,
      this.flatten_action,
      this.gray_action
    ]), {
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
  change_matrix(t) {
    super.change_matrix(t), this.project_action.change_matrix(t);
  }
};
const vo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Max: le
}, Symbol.toStringTag, { value: "Module" })), gn = `
// suffix for pasting one panel onto another

struct parameters {
    ratios: vec4f,
    in_hw: vec2u,
    out_hw: vec2u,
}

// Input and output panels interpreted as u32 rgba
@group(0) @binding(0) var<storage, read> inputBuffer : array<u32>;

@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    // loop over input
    let inputOffset = global_id.x;
    let in_hw = parms.in_hw;
    let in_location = panel_location_of(inputOffset, in_hw);
    let out_hw = parms.out_hw;
    let out_location = panel_location_of(inputOffset, out_hw);
    if ((in_location.is_valid) && (out_location.is_valid)) {
        let in_u32 = inputBuffer[in_location.offset];
        let out_u32 = outputBuffer[out_location.offset];
        let in_color = unpack4x8unorm(in_u32);
        let out_color = unpack4x8unorm(out_u32);
        let ratios = parms.ratios;
        const ones = vec4f(1.0, 1.0, 1.0, 1.0);
        let mix_color = ((ones - ratios) * out_color) + (ratios * in_color);
        let mix_value = f_pack_color(mix_color.xyz);
        outputBuffer[out_location.offset] = mix_value;
    }
}`;
let vn = class extends x {
  constructor(t, e, n) {
    super(), this.in_hw = t, this.out_hw = e, this.ratios = n, this.buffer_size = 8 * Int32Array.BYTES_PER_ELEMENT;
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Uint32Array(e);
    new Float32Array(e).set(this.ratios, 0), n.set(this.in_hw, 4), n.set(this.out_hw, 6);
  }
};
class gt extends M {
  constructor(t, e, n) {
    super();
    const o = [t.height, t.width], s = [e.height, e.width];
    if (o[0] != s[0] || o[0] != s[0])
      throw new Error("Mixed panels to have same shape: " + o + " :: " + s);
    for (var a of n)
      if (a > 1 || a < 0)
        throw new Error("Invalid ratio: " + a);
    this.parameters = new vn(o, s, n), this.from_hw = o, this.to_hw = s, this.ratios = n, this.source = t, this.target = e;
  }
  change_ratio(t) {
    this.ratios = [t, t, t, t], this.parameters.ratios = this.ratios, this.parameters.push_buffer();
  }
  get_shader_module(t) {
    const e = ut + gn;
    return t.device.createShaderModule({ code: e });
  }
  getWorkgroupCounts() {
    return [Math.ceil(this.source.size / 256), 1, 1];
  }
}
class Lt extends gt {
  constructor(t, e, n) {
    const o = [n, n, n, n];
    super(t, e, o);
  }
}
const xo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MixPanels: Lt,
  MixPanelsRatios: gt
}, Symbol.toStringTag, { value: "Module" })), bn = `
// Mix two depth buffers with color values.
// The shapes of the buffers should usually match.

@group(0) @binding(0) var<storage, read> inputDB : DepthBufferF32;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> ratios: vec4f;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    if (outputLocation.valid) {
        var currentDepth = outputDB.data_and_depth[outputLocation.depth_offset];
        var currentData = outputDB.data_and_depth[outputLocation.data_offset];
        let inputShape = inputDB.shape;
        let inputLocation = depth_buffer_indices(outputOffset, inputShape);
        if (inputLocation.valid) {
            let inputDepth = inputDB.data_and_depth[inputLocation.depth_offset];
            let inputData = inputDB.data_and_depth[inputLocation.data_offset];
            if (!(is_default(inputData, inputDepth, inputShape))) {
                //currentDepth = inputDepth;
                currentDepth = min(currentDepth, inputDepth);
                // DON'T always mix the colors ???
                let in_u32 = bitcast<u32>(inputData);
                let out_u32 = bitcast<u32>(currentData);
                let in_color = unpack4x8unorm(in_u32);
                let out_color = unpack4x8unorm(out_u32);
                //let color = mix(out_color, in_color, ratios);
                //currentData = bitcast<f32>(pack4x8unorm(mixed_color));
                const ones = vec4f(1.0, 1.0, 1.0, 1.0);
                let mix_color = ((ones - ratios) * out_color) + (ratios * in_color);
                currentData = bitcast<f32>(f_pack_color(mix_color.xyz));
            }
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = currentDepth;
        outputDB.data_and_depth[outputLocation.data_offset] = currentData;
    }
}`;
class xn extends x {
  constructor(t) {
    super(), this.ratios = t, this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange();
    new Float32Array(e).set(this.ratios, 0);
  }
}
class kt extends M {
  constructor(t, e, n) {
    super(), this.source = t, this.target = e, this.ratios = n, this.parameters = new xn(n);
  }
  change_ratio(t) {
    this.ratios = [t, t, t, t], this.parameters.ratios = this.ratios, this.parameters.push_buffer();
  }
  get_shader_module(t) {
    const e = ut + E + bn;
    return t.device.createShaderModule({ code: e });
  }
  getWorkgroupCounts() {
    return [Math.ceil(this.target.size / 256), 1, 1];
  }
}
const yo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MixDepthBuffers: kt
}, Symbol.toStringTag, { value: "Module" })), yn = `
struct parameters {
    in_hw: vec2u,
    n_dots: u32,
}

struct dot {
    ratios: vec4f,
    pos: vec2f,
    radius: f32,
    color: u32,
}

@group(0) @binding(0) var<storage, read> inputDots : array<dot>;

// Output panel interpreted as u32 rgba
@group(1) @binding(0) var<storage, read_write> outputBuffer : array<u32>;

@group(2) @binding(0) var<storage, read> parms: parameters;

/*
fn debug_is_this_running(inputDot: dot) -> bool {
    let in_hw = parms.in_hw;
    let color = vec3f(1.0, 0.0, 1.0);
    var u32_color = f_pack_color(color);
    let size = in_hw.x * in_hw.y;
    for (var i=0u; i<in_hw.x; i+=1u) {
        for (var j=0u; j<in_hw.y; j+=1u) {
            let offset = panel_offset_of(vec2u(i, j), in_hw);
            if (i > u32(inputDot.pos.x)) {
                u32_color = f_pack_color(vec3f(0.0, 1.0, 0.0));
                outputBuffer[offset.offset] = u32_color;
            }
            if (j > u32(inputDot.pos.y)) {
                u32_color = f_pack_color(vec3f(0.0, 0.0, 1.0));
                outputBuffer[offset.offset] = u32_color;
            }
            //outputBuffer[offset.offset] = u32_color;
        }
    }
    return true;
}
*/

@compute @workgroup_size(256) // ??? too big?
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    // loop over input
    let inputIndex = global_id.x;
    let n_dots = parms.n_dots;
    if (inputIndex >= n_dots) {
        return;
    }
    let inputDot = inputDots[inputIndex];
    //debug_is_this_running(inputDot);
    let in_hw = parms.in_hw;
    let inputOffset = inputDot.pos;
    let radius = inputDot.radius;
    let radius2 = radius * radius;
    for (var di= - radius; di< radius; di+=1.0) {
        for (var dj= - radius; dj< radius; dj+=1.0) {
            if ((di*di + dj*dj <= radius2)) {
                let location = vec2f(inputDot.pos.x + di, inputDot.pos.y + dj);
                let offset = f_panel_offset_of(location, in_hw);
                if (offset.is_valid) {
                    let original_u32 = outputBuffer[offset.offset];
                    let original_color = unpack4x8unorm(original_u32);
                    let dot_u32 = inputDot.color;
                    let dot_color = unpack4x8unorm(dot_u32);
                    const ones = vec4f(1.0, 1.0, 1.0, 1.0);
                    let ratios = inputDot.ratios;
                    let mix_color = ((ones - ratios) * original_color) + (ratios * dot_color);
                    let mix_value = f_pack_color(mix_color.xyz);
                    outputBuffer[offset.offset] = mix_value;
                }
            }
        }
    }
}
`;
class wn extends x {
  constructor(t, e) {
    super(), this.in_hw = t, this.n_dots = e, this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Uint32Array(e);
    n.set(this.in_hw, 0), n.set([this.n_dots], 2);
  }
  change_n_dots(t) {
    this.n_dots = t, this.push_buffer();
  }
}
class he {
  constructor(t, e, n, o) {
    this.position = t, this.radius = e, this.u32color = n, this.ratios = o;
  }
  put_on_panel(t, e, n) {
    const o = t * 8;
    e.set(this.ratios, o), e.set(this.position, o + 4), e.set([this.radius], o + 6), n.set([this.u32color], o + 7);
  }
}
class pe extends z {
  constructor(t) {
    super(8, t), this.dots = [], this.max_ndots = t;
  }
  add_dot(t, e, n, o) {
    const s = new he(t, e, n, o);
    if (this.dots.length >= this.max_ndots)
      throw new Error("Too many dots: " + this.dots.length);
    this.dots.push(s);
  }
  clear() {
    this.dots = [];
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Uint32Array(e), o = new Float32Array(e);
    for (var s = 0; s < this.dots.length; s++)
      this.dots[s].put_on_panel(s, o, n);
  }
}
class fe extends M {
  constructor(t, e) {
    super(), this.on_panel = t, this.max_ndots = e, this.dots_panel = new pe(e);
    const n = [t.height, t.width];
    this.parameters = new wn(n, 0), this.source = this.dots_panel, this.target = t;
  }
  get_shader_module(t) {
    const e = ut + yn;
    return t.device.createShaderModule({ code: e });
  }
  ndots() {
    return this.dots_panel.dots.length;
  }
  push_dots() {
    this.parameters.change_n_dots(this.ndots()), this.dots_panel.push_buffer();
  }
  add_pass(t) {
    this.ndots() < 1 || super.add_pass(t);
  }
  getWorkgroupCounts() {
    const t = this.ndots();
    return [Math.ceil(t / 256), 1, 1];
  }
  clear(t = !1) {
    this.dots_panel.clear(), t || this.push_dots();
  }
  add_dot(t, e, n, o) {
    this.dots_panel.add_dot(t, e, n, o);
  }
}
const wo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ColoredDot: he,
  DotsPanel: pe,
  MixDotsOnPanel: fe
}, Symbol.toStringTag, { value: "Module" })), jn = `
// Project a volume where the values cross a threshold
// Assumes prefixes: 
//  panel_buffer.wgsl
//  volume_frame.wgsl
//  volume_intercept.wgsl

struct parameters {
    ijk2xyz : mat4x4f,
    int3: Intersections3,
    dk: f32,
    threshold_value: f32,
    // 2 float padding at end...???
}

@group(0) @binding(0) var<storage, read> inputVolume : Volume;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    //let local_parms = parms;
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    // k increment length in xyz space
    //let dk = 1.0f;  // fix this! -- k increment length in xyz space
    let dk = parms.dk;
    var initial_value_found = false;
    var compare_diff: f32;
    var threshold_crossed = false;
    if (outputLocation.valid) {
        var inputGeometry = inputVolume.geometry;
        var current_value = outputShape.default_value;
        var current_depth = outputShape.default_depth;
        let offsetij = vec2i(outputLocation.ij);
        let ijk2xyz = parms.ijk2xyz;
        var threshold_value = parms.threshold_value;
        var end_points = scan_endpoints(
            offsetij,
            parms.int3,
            &inputGeometry,
            ijk2xyz,
        );
        if (end_points.is_valid) {
            let offsetij_f = vec2f(offsetij);
            for (var depth = end_points.offset[0]; depth < end_points.offset[1]; depth += dk) {
                //let ijkw = vec4u(vec2u(outputLocation.ij), depth, 1u);
                //let f_ijk = vec4f(ijkw);
                //let xyz_probe = parms.ijk2xyz * f_ijk;
                let xyz_probe = probe_point(offsetij_f, depth, ijk2xyz);
                let input_offset = offset_of_xyz(xyz_probe.xyz, &inputGeometry);
                if ((input_offset.is_valid) && (!threshold_crossed)) {
                    let valueu32 = inputVolume.content[input_offset.offset];
                    let value = bitcast<f32>(valueu32);
                    let diff = value - threshold_value;
                    if ((initial_value_found) && (!threshold_crossed)) {
                        if (compare_diff * diff <= 0.0f) {
                            threshold_crossed = true;
                            current_depth = f32(depth);
                            current_value = value;
                            break;
                        }
                    }
                    initial_value_found = true;
                    compare_diff = diff;
                }
            }
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;
        outputDB.data_and_depth[outputLocation.data_offset] = current_value;
    }
}
`;
class zn extends x {
  constructor(t, e, n) {
    super(), this.volume = e, this.threshold_value = n, this.buffer_size = (4 * 4 + 4 * 3 + 4) * Int32Array.BYTES_PER_ELEMENT, this.set_matrix(t);
  }
  set_matrix(t) {
    this.ijk2xyz = I(t), this.intersections = Pt(t, this.volume);
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Float32Array(e);
    n.set(this.ijk2xyz, 0), n.set(this.intersections, 4 * 4), n[4 * 4 + 3 * 4 + 1] = this.threshold_value;
  }
}
class W extends rt {
  constructor(t, e, n, o) {
    super(t, e), this.threshold_value = o, this.parameters = new zn(n, t, o);
  }
  change_threshold(t) {
    this.threshold_value = t, this.parameters.threshold_value = t, this.parameters.push_buffer();
  }
  get_shader_module(t) {
    const e = Q + E + Dt + jn;
    return t.device.createShaderModule({ code: e });
  }
  //getWorkgroupCounts() {
  //    return [Math.ceil(this.target.size / 256), 1, 1];
  //};
}
const jo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ThresholdProject: W
}, Symbol.toStringTag, { value: "Module" })), kn = `
// for non-default entries of outputDB
// put RGBA entries where RGB are scaled 255 representations of
// approximate normals (direction of greatest increase) at the
// corresponding location in the inputVolume

// Assumes prefixes: 
//  panel_buffer.wgsl
//  volume_frame.wgsl

struct parameters {
    ijk2xyz : mat4x4f,
    default_value: u32,
}

@group(0) @binding(0) var<storage, read> inputVolume : Volume;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    if (outputLocation.valid) {
        var inputGeometry = inputVolume.geometry;
        var output_value = parms.default_value;
        var offset_sum = vec3f(0.0f, 0.0f, 0.0f);
        let depth = outputDB.data_and_depth[outputLocation.depth_offset];
        let ij = outputLocation.ij;
        let f_ijk = vec4f(f32(ij[0]), f32(ij[1]), depth, 1.0f);
        let xyz_probe = parms.ijk2xyz * f_ijk;
        let xyz = xyz_probe.xyz;
        let input_offset = offset_of_xyz(xyz, &inputGeometry);
        var offsets_are_valid = input_offset.is_valid;
        const combinations = array(
            vec3u(0,1,2),
            vec3u(1,2,0),
            vec3u(2,0,1),
        );
        if (offsets_are_valid) {
            for (var q=0; q<3; q++) {
                let combo = combinations[q];
                let M = combo[0];
                let N = combo[1];
                let P = combo[2];
                for (var m_shift=-1; m_shift<=1; m_shift++) {
                    for (var n_shift=-1; n_shift<=1; n_shift++) {
                        let vector_center_offset = input_offset.offset;
                        let vector_center_indices = index_of(vector_center_offset, &inputGeometry);
                        var left_indices = vector_center_indices.ijk;
                        var right_indices = vector_center_indices.ijk;
                        left_indices[P] += 1u;
                        if (right_indices[P] == 0) {
                            offsets_are_valid = false;
                        } else {
                            right_indices[P] = u32(i32(right_indices[P]) - 1);
                            let left_offset = offset_of(left_indices, &inputGeometry);
                            let right_offset = offset_of(right_indices, &inputGeometry);
                            offsets_are_valid = offsets_are_valid && left_offset.is_valid && right_offset.is_valid;
                            if (offsets_are_valid) {
                                let left_point = to_model(left_indices, &inputGeometry);
                                let right_point = to_model(right_indices, &inputGeometry);
                                let left_value_u32 = inputVolume.content[left_offset.offset];
                                let right_value_u32 = inputVolume.content[right_offset.offset];
                                let weight = bitcast<f32>(left_value_u32) - bitcast<f32>(right_value_u32);
                                let vector = (left_point - right_point);
                                offset_sum += weight * vector;
                            }
                        } // don't break: set of measure 0
                    }
                }
            }
        }
        if (offsets_are_valid) {
            let L = length(offset_sum);
            // default to white for 0 normal
            output_value = 4294967295u;
            if (L > 1e-10) {
                let N = normalize(offset_sum);
                // xxx should clamp?
                let colors = vec3u((N + 1.0) * 127.5);
                //let colors = vec3u(255, 0, 0);  // debug
                //let result = pack4xU8(color); ???error: unresolved call target 'pack4xU8'
                output_value = 
                    colors[0] + 
                    256 * (colors[1] + 256 * (colors[2] + 256 * 255));
            }
        } else {
            //output_value = 255 * 256; // debug
        }
        //...
        outputDB.data_and_depth[outputLocation.data_offset] = bitcast<f32>(output_value);
    }
}`;
class Bn extends x {
  constructor(t, e) {
    super(), this.set_matrix(t), this.default_value = e, this.buffer_size = (4 * 4 + 4) * Int32Array.BYTES_PER_ELEMENT;
  }
  set_matrix(t) {
    this.ijk2xyz = I(t);
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Float32Array(e);
    n.set(this.ijk2xyz, 0), n[4 * 4] = this.default_value;
  }
}
class Y extends rt {
  constructor(t, e, n, o) {
    super(t, e), this.default_value = o, this.parameters = new Bn(n, o);
  }
  get_shader_module(t) {
    const e = Q + E + kn;
    return t.device.createShaderModule({ code: e });
  }
  //getWorkgroupCounts() {
  //    return [Math.ceil(this.target.size / 256), 1, 1];
  //};
}
const zo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NormalColorize: Y
}, Symbol.toStringTag, { value: "Module" })), Mn = `
// quick and dirty volume low pass filter

// Assumes prefixes: 
//  panel_buffer.wgsl
//  volume_frame.wgsl

// weights per offset rectangular distance from voxel
struct parameters {
    offset_weights: vec4f,
}

@group(0) @binding(0) var<storage, read> inputVolume : Volume;

@group(1) @binding(0) var<storage, read_write> outputVolume : Volume;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let columnOffset = global_id.x;
    var inputGeometry = inputVolume.geometry;
    var outputGeometry = outputVolume.geometry;
    let width = outputGeometry.shape.xyz.z;
    let startOffset = columnOffset * width;
    for (var column=0u; column<width; column = column + 1u) {
        let outputOffset = startOffset + column;
        //process_voxel(outputOffset, inputGeometry, outputGeometry); -- xxx refactor inlined
        let output_index = index_of(outputOffset, &outputGeometry);
        if (output_index.is_valid) {
            let input_index = index_of(outputOffset, &inputGeometry);
            if (input_index.is_valid) {
                // by default just copy along borders
                let center = vec3i(output_index.ijk);
                let offset_weights = parms.offset_weights;
                var result_value = inputVolume.content[outputOffset];
                var offsets_valid = all(input_index.ijk > vec3u(0u,0u,0u));
                var accumulator = 0.0f;
                for (var di=-1; di<=1; di++) {
                    for (var dj=-1; dj<=1; dj++) {
                        for (var dk=-1; dk<=1; dk++) {
                            let shift = vec3i(di, dj, dk);
                            let probe = vec3u(shift + center);
                            let probe_offset = offset_of(probe, &inputGeometry);
                            offsets_valid = offsets_valid && probe_offset.is_valid;
                            if (offsets_valid) {
                                let abs_offset = u32(abs(di) + abs(dj) + abs(dk));
                                let weight = offset_weights[abs_offset];
                                let probe_value = bitcast<f32>(inputVolume.content[probe_offset.offset]);
                                accumulator += (weight * probe_value);
                            }
                        }
                    }
                }
                if (offsets_valid) {
                    result_value = bitcast<u32>(accumulator);
                }
                outputVolume.content[outputOffset] = result_value;
            }
        }
    }
}`, Sn = new Float32Array([0.43855053, 0.03654588, 0.0151378, 0.02006508]);
class Pn extends x {
  constructor(t) {
    super(), t = t || Sn, this.offset_weights = t, this.buffer_size = 4 * Int32Array.BYTES_PER_ELEMENT;
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange();
    new Float32Array(e).set(this.offset_weights, 0);
  }
}
class H extends M {
  constructor(t, e, n) {
    super(), this.source = t, this.target = e, this.offset_weights = n, this.parameters = new Pn(this.offset_weights);
  }
  get_shader_module(t) {
    const e = Q + Mn;
    return t.device.createShaderModule({ code: e });
  }
  getWorkgroupCounts() {
    const t = this.target.shape[2];
    return [Math.ceil(this.target.size / t / 256), 1, 1];
  }
}
const ko = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SoftenVolume: H
}, Symbol.toStringTag, { value: "Module" }));
class de extends P {
  constructor(t, e, n) {
    super(t), this.indexed_colors = e, this.ratio = n;
  }
  async run() {
    await this.colors_promise, super.run();
  }
  panel_sequence(t) {
    t = t || this.context;
    const e = this.ofVolume;
    this.soft_volume = e.same_geometry(t), this.depth_buffer = this.get_output_depth_buffer(t), this.index_panel = this.get_output_panel(t), this.output_panel = this.get_output_panel(t), this.threshold_value = 0.5;
    const n = this.indexed_colors.length;
    this.color_panel = t.panel(1, n), this.colors_promise = this.color_panel.push_buffer(this.indexed_colors), this.project_action = new W(
      e,
      this.depth_buffer,
      this.projection_matrix,
      this.threshold_value
    ), this.project_action.attach_to_context(t), this.index_flatten = this.depth_buffer.flatten_action(this.index_panel), this.soften_action = new H(e, this.soft_volume, null), this.soften_action.attach_to_context(t);
    const o = 0;
    return this.normal_colorize_action = new Y(
      this.soft_volume,
      this.depth_buffer,
      this.projection_matrix,
      o
    ), this.normal_colorize_action.attach_to_context(t), this.flatten_normals = this.depth_buffer.flatten_action(this.output_panel), this.index_colorize = new bt(
      this.color_panel,
      this.index_panel,
      o
    ), this.index_colorize.attach_to_context(t), this.mix_action = new Lt(
      this.index_panel,
      this.output_panel,
      this.ratio
    ), this.mix_action.attach_to_context(t), this.project_to_panel = t.sequence([
      this.project_action,
      this.index_flatten,
      this.soften_action,
      // should execute only once (unless volume changes)
      this.normal_colorize_action,
      this.index_colorize,
      this.flatten_normals,
      this.mix_action
    ]), {
      sequence: this.project_to_panel,
      output_panel: this.output_panel
    };
  }
  change_matrix(t) {
    this.project_action.change_matrix(t), this.normal_colorize_action.change_matrix(t);
  }
  change_ratio(t) {
    this.mix_action.change_ratio(t), this.run();
  }
}
const Bo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Mix: de
}, Symbol.toStringTag, { value: "Module" })), Dn = `

// Generate values for volume in projection at a given depth as a depth buffer.
// Assumes prefixes: 
//  depth_buffer.wgsl
//  volume_frame.wgsl
//  volume_intercept.wgsl

struct parameters {
    ijk2xyz : mat4x4f, // depth buffer to xyz affine transform matrix.
    depth: f32,  // depth to probe
    // 3 floats padding at end...???
}

@group(0) @binding(0) var<storage, read> inputVolume : Volume;

@group(1) @binding(0) var<storage, read_write> outputDB : DepthBufferF32;

@group(2) @binding(0) var<storage, read> parms: parameters;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let outputOffset = global_id.x;
    let outputShape = outputDB.shape;
    let outputLocation = depth_buffer_indices(outputOffset, outputShape);
    if (outputLocation.valid) {
        // xxx refactor with max_value_project somehow?
        var inputGeometry = inputVolume.geometry;
        var current_value = outputShape.default_value;
        var current_depth = outputShape.default_depth;
        let offsetij_f = vec2f(outputLocation.ij);
        let ijk2xyz = parms.ijk2xyz;
        let depth = parms.depth;
        let xyz_probe = probe_point(offsetij_f, depth, ijk2xyz);
        let input_offset = offset_of_xyz(xyz_probe.xyz, &inputGeometry);
        if (input_offset.is_valid) {
            let valueu32 = inputVolume.content[input_offset.offset];
            let value = bitcast<f32>(valueu32);
            current_depth = f32(depth);
            current_value = value;
        }
        outputDB.data_and_depth[outputLocation.depth_offset] = current_depth;
        outputDB.data_and_depth[outputLocation.data_offset] = current_value;
    }
}
`;
class On extends x {
  constructor(t, e) {
    super(), this.depth = e, this.buffer_size = (4 * 4 + 4) * Int32Array.BYTES_PER_ELEMENT, this.set_matrix(t);
  }
  set_matrix(t) {
    this.ijk2xyz = I(t);
  }
  load_buffer(t) {
    t = t || this.gpu_buffer;
    const e = t.getMappedRange(), n = new Float32Array(e);
    n.set(this.ijk2xyz, 0), n.set([this.depth], 4 * 4);
  }
  change_depth(t) {
    this.depth = t, this.push_buffer();
  }
}
class C extends rt {
  constructor(t, e, n, o) {
    super(t, e), this.parameters = new On(n, o);
  }
  get_shader_module(t) {
    const e = Q + E + Dt + Dn;
    return t.device.createShaderModule({ code: e });
  }
  change_depth(t) {
    this.parameters.change_depth(t);
  }
}
const Mo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VolumeAtDepth: C
}, Symbol.toStringTag, { value: "Module" }));
class En extends P {
  constructor(t, e, n, o) {
    super(t), this.segmentationVolume = t, this.intensityVolume = e, this.range_callback = o, this.indexed_colors = n;
  }
  async paint_on(t, e) {
    throw new Error("SegmentationQuad.paint_on not implemented.");
  }
  async paint_on_canvases(t, e, n, o, s) {
    const a = this.ofVolume.context;
    if (!a)
      throw new Error("Volume is not attached to GPU context.");
    this.attach_to_context(a);
    const r = this.panel_sequence(a), u = a.paint(r.seg_slice_panel, t), _ = a.paint(r.max_panel, e), c = a.paint(r.intensity_slice_panel, n), l = a.paint(r.shaded_panel, o);
    if (this.paint_sequence = a.sequence([
      r.sequence,
      u,
      _,
      c,
      l
    ]), s) {
      const h = this.get_orbiter_callback(), p = k(3);
      this.orbiter = new N(
        o,
        null,
        // center,
        p,
        h
        // callback,
      ), this.orbiter.attach_listeners_to(e), this.orbiter.attach_listeners_to(n), this.orbiter.attach_listeners_to(t);
    }
    this.run();
  }
  async change_volumes(t, e) {
    this.segmentationVolume.set_data(t.data), this.segmentationVolume.push_buffer(), this.intensityVolume.set_data(e.data), this.intensityVolume.push_buffer(), this.run();
  }
  panel_sequence(t) {
    t = t || this.context, this.min_value = this.intensityVolume.min_value, this.max_value = this.intensityVolume.max_value, this.change_range(this.projection_matrix), this.current_depth = (this.min_depth + this.max_depth) / 2;
    const e = [], n = new le(this.intensityVolume);
    this.maxView = n, n.attach_to_context(t);
    const o = n.panel_sequence(t);
    e.push(o.sequence), this.slice_depth_buffer = this.get_output_depth_buffer(t), this.slice_value_panel = this.get_output_panel(t), this.slice_gray_panel = this.get_output_panel(t), this.slice_project_action = new C(
      this.intensityVolume,
      this.slice_depth_buffer,
      this.projection_matrix,
      this.current_depth
    ), this.slice_project_action.attach_to_context(t), e.push(this.slice_project_action), this.slice_flatten_action = this.slice_depth_buffer.flatten_action(this.slice_value_panel), e.push(this.slice_flatten_action), this.slice_gray_action = t.to_gray_panel(
      this.slice_value_panel,
      this.slice_gray_panel,
      this.min_value,
      this.max_value
    ), e.push(this.slice_gray_action);
    const s = 0.7, a = new de(this.segmentationVolume, this.indexed_colors, s);
    a.attach_to_context(t), this.mixView = a;
    const r = a.panel_sequence(t);
    e.push(r.sequence), this.segmentation_depth_buffer = this.get_output_depth_buffer(t), this.segmentation_value_panel = this.get_output_panel(t), this.segmentation_color_panel = this.get_output_panel(t), this.segmentation_project_action = new C(
      this.segmentationVolume,
      this.segmentation_depth_buffer,
      this.projection_matrix,
      this.current_depth
    ), this.segmentation_project_action.attach_to_context(t), e.push(this.segmentation_project_action), this.segmentation_flatten_action = this.segmentation_depth_buffer.flatten_action(this.segmentation_value_panel), e.push(this.segmentation_flatten_action);
    const u = 0;
    return this.indexed_colorize = new bt(
      a.color_panel,
      this.segmentation_value_panel,
      u
    ), this.indexed_colorize.attach_to_context(t), e.push(this.indexed_colorize), this.project_to_panel = t.sequence(e), {
      sequence: this.project_to_panel,
      seg_slice_panel: this.segmentation_value_panel,
      max_panel: o.output_panel,
      intensity_slice_panel: this.slice_gray_panel,
      shaded_panel: r.output_panel
    };
  }
  async pick(t, e) {
    const n = await super.pick(t, e), o = n.panel_coords;
    return await this.maxView.max_depth_buffer.pull_data(), n.maximum = this.maxView.max_depth_buffer.location(
      o,
      this.space,
      this.intensityVolume
    ), await this.slice_depth_buffer.pull_data(), n.intensity_slice = this.slice_depth_buffer.location(
      o,
      this.space,
      this.intensityVolume
    ), await this.mixView.depth_buffer.pull_data(), n.segmentation = this.mixView.depth_buffer.location(
      o,
      this.space,
      this.segmentationVolume
    ), await this.segmentation_depth_buffer.pull_data(), n.segmentation_slice = this.segmentation_depth_buffer.location(
      o,
      this.space,
      this.segmentationVolume
    ), n;
  }
  change_depth(t) {
    this.current_depth = t, this.slice_project_action.change_depth(t), this.segmentation_project_action.change_depth(t), this.run();
  }
  change_matrix(t) {
    super.change_matrix(t), this.maxView.change_matrix(t), this.slice_project_action.change_matrix(t), this.segmentation_project_action.change_matrix(t), this.mixView.change_matrix(t), this.change_range(t);
  }
  change_range(t) {
    const n = this.ofVolume.projected_range(t, !0);
    this.min_depth = n.min[2], this.max_depth = n.max[2], this.range_callback && this.range_callback(this.min_depth, this.max_depth);
  }
}
const So = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SegmentationQuad: En
}, Symbol.toStringTag, { value: "Module" }));
class Vn extends P {
  constructor(t, e, n, o) {
    super(t), this.threshold_value = e, this.debugging = n, this.range_callback = o;
  }
  change_threshold(t) {
    this.project_action.change_threshold(t), this.run();
  }
  async run() {
    if (await this.soften_promise, super.run(), this.debugging) {
      await this.context.onSubmittedWorkDone(), this.threshold_depth_buffer.pull_data(), this.level_depth_buffer.pull_data(), this.level_clone_depth_buffer.pull_data(), this.front_depth_buffer.pull_data(), this.back_depth_buffer.pull_data(), this.output_depth_buffer.pull_data(), await this.context.onSubmittedWorkDone();
      debugger;
    }
  }
  panel_sequence(t) {
    t = t || this.context;
    const e = this.ofVolume;
    this.min_value = e.min_value, this.max_value = e.max_value, this.change_range(this.projection_matrix), this.soft_volume = e.same_geometry(t), this.soften_action = new H(e, this.soft_volume, null), this.soften_action.attach_to_context(t), this.soften_action.run(), this.soften_promise = t.onSubmittedWorkDone(), this.threshold_depth_buffer = this.get_output_depth_buffer(t), this.threshold_value = this.threshold_value || (e.min_value + e.max_value) / 2, this.project_action = new W(
      e,
      this.threshold_depth_buffer,
      this.projection_matrix,
      this.threshold_value
    ), this.project_action.attach_to_context(t);
    const n = 0;
    this.normal_colorize_action = new Y(
      this.soft_volume,
      this.threshold_depth_buffer,
      this.projection_matrix,
      n
    ), this.normal_colorize_action.attach_to_context(t);
    const s = e.projected_range(this.projection_matrix, !0);
    this.current_depth = (s.max[2] + s.min[2]) / 2, this.level_depth_buffer = this.get_output_depth_buffer(t), this.level_project_action = new C(
      e,
      this.level_depth_buffer,
      this.projection_matrix,
      this.current_depth
    ), this.level_project_action.attach_to_context(t), this.level_clone_operation = this.level_depth_buffer.clone_operation(), this.clone_level_action = this.level_clone_operation.clone_action, this.level_clone_depth_buffer = this.level_clone_operation.clone, this.level_gray_action = new ie(
      this.level_depth_buffer,
      this.level_clone_depth_buffer,
      e.min_value,
      e.max_value
    ), this.level_gray_action.attach_to_context(t), this.front_depth_buffer = this.get_output_depth_buffer(t);
    const a = -1e11;
    this.slice_front_action = new ot(
      this.threshold_depth_buffer,
      this.front_depth_buffer,
      a,
      //range.min[2],
      this.current_depth,
      0
      // slice depths, not values
    ), this.slice_front_action.attach_to_context(t), this.back_depth_buffer = this.get_output_depth_buffer(t);
    const r = 1e11;
    return this.slice_back_action = new ot(
      this.threshold_depth_buffer,
      this.back_depth_buffer,
      this.current_depth,
      r,
      //range.max[2],
      0
      // slice depths, not values
    ), this.slice_back_action.attach_to_context(t), this.back_level_ratios = [0.5, 0.5, 0.5, 1], this.mix_back_level_action = new kt(
      this.back_depth_buffer,
      //this.front_depth_buffer, // debug test
      this.level_clone_depth_buffer,
      this.back_level_ratios
    ), this.mix_back_level_action.attach_to_context(t), this.output_clone_operation = this.front_depth_buffer.clone_operation(), this.output_clone_action = this.output_clone_operation.clone_action, this.output_depth_buffer = this.output_clone_operation.clone, this.combine_ratios = [0.5, 0.5, 0.5, 1], this.combine_action = new kt(
      this.level_clone_depth_buffer,
      //this.front_depth_buffer, // debug test
      this.output_depth_buffer,
      this.combine_ratios
    ), this.combine_action.attach_to_context(t), this.panel = this.get_output_panel(t), this.flatten_action = this.output_depth_buffer.flatten_action(this.panel), this.project_to_panel = t.sequence([
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
    ]), {
      sequence: this.project_to_panel,
      output_panel: this.panel
    };
  }
  // remainder is very similar to TestDepthView
  change_matrix(t) {
    super.change_matrix(t), this.project_action.change_matrix(t), this.normal_colorize_action.change_matrix(t), this.level_project_action.change_matrix(t), this.change_range(t), this.update_levels();
  }
  change_range(t) {
    debugger;
    const n = this.ofVolume.projected_range(t, !0);
    this.min_depth = n.min[2], this.max_depth = n.max[2], this.range_callback && this.range_callback(this.min_depth, this.max_depth);
  }
  change_depth(t) {
    this.current_depth = t;
  }
  update_levels() {
    this.level_project_action.change_depth(this.current_depth), this.slice_front_action.change_bounds(this.min_depth, this.current_depth), this.slice_back_action.change_bounds(this.current_depth, this.max_depth);
  }
}
const Po = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SlicedThreshold: Vn
}, Symbol.toStringTag, { value: "Module" }));
class Gn extends P {
  constructor(t, e) {
    super(t), this.soften = e;
  }
  async run() {
    this.soften && await this.soften_promise, super.run();
  }
  panel_sequence(t) {
    t = t || this.context;
    const e = this.ofVolume;
    this.depth_buffer = this.get_output_depth_buffer(t), this.panel = this.get_output_panel(t), this.min_value = e.min_value, this.max_value = e.max_value, this.threshold_value = (e.min_value + e.max_value) / 2;
    var n = e;
    this.soften && (this.soft_volume = e.same_geometry(t), this.soften_action = new H(e, this.soft_volume, null), this.soften_action.attach_to_context(t), this.soften_action.run(), this.soften_promise = t.onSubmittedWorkDone(), n = this.soft_volume), this.project_action = new W(
      n,
      this.depth_buffer,
      this.projection_matrix,
      this.threshold_value
    ), this.project_action.attach_to_context(t);
    const o = 0;
    return this.colorize_action = new Y(
      e,
      this.depth_buffer,
      this.projection_matrix,
      o
    ), this.colorize_action.attach_to_context(t), this.flatten_action = this.depth_buffer.flatten_action(this.panel), this.project_to_panel = t.sequence([
      this.project_action,
      this.colorize_action,
      this.flatten_action
    ]), {
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
  change_matrix(t) {
    super.change_matrix(t), this.project_action.change_matrix(t), this.colorize_action.change_matrix(t);
  }
  change_threshold(t) {
    this.project_action.change_threshold(t), this.run();
  }
}
const Do = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Threshold: Gn
}, Symbol.toStringTag, { value: "Module" }));
class Ln extends P {
  constructor(t, e) {
    super(t), this.range_callback = e;
  }
  async run() {
    await this.soften_promise, super.run();
  }
  async paint_on(t, e) {
    throw new Error("Triptych.paint_on not implemented.");
  }
  async paint_on_canvases(t, e, n, o) {
    const s = this.ofVolume.context;
    if (!s)
      throw new Error("Volume is not attached to GPU context.");
    this.attach_to_context(s);
    const a = this.panel_sequence(s), r = s.paint(a.iso_output_panel, t), u = s.paint(a.max_output_panel, e), _ = s.paint(a.slice_output_panel, n);
    if (this.paint_sequence = s.sequence([
      a.sequence,
      r,
      u,
      _
    ]), o) {
      const c = this.get_orbiter_callback(), l = k(3);
      this.orbiter = new N(
        n,
        null,
        // center,
        l,
        c
        // callback,
      ), this.orbiter.attach_listeners_to(t), this.orbiter.attach_listeners_to(e);
    }
    this.run();
  }
  async pick(t, e) {
    const n = await super.pick(t, e), o = n.panel_coords;
    return await this.slice_depth_buffer.pull_data(), n.slice_depth = this.slice_depth_buffer.location(o, this.space, this.ofVolume), await this.max_depth_buffer.pull_data(), n.max_depth = this.max_depth_buffer.location(o, this.space, this.ofVolume), await this.threshold_depth_buffer.pull_data(), n.threshold_depth = this.threshold_depth_buffer.location(o, this.space, this.ofVolume), n;
  }
  panel_sequence(t) {
    debugger;
    t = t || this.context;
    const e = [], n = this.ofVolume;
    this.min_value = n.min_value, this.max_value = n.max_value, this.change_range(this.projection_matrix), this.current_depth = (this.min_depth + this.max_depth) / 2, this.soft_volume = n.same_geometry(t), this.soften_action = new H(n, this.soft_volume, null), this.soften_action.attach_to_context(t), this.soften_action.run(), this.soften_promise = t.onSubmittedWorkDone(), this.threshold_depth_buffer = this.get_output_depth_buffer(t), this.threshold_value = (n.min_value + n.max_value) / 2, this.soft_volume, this.threshold_project_action = new W(
      n,
      this.threshold_depth_buffer,
      this.projection_matrix,
      this.threshold_value
    ), this.threshold_project_action.attach_to_context(t), e.push(this.threshold_project_action);
    const o = 0;
    return this.colorize_action = new Y(
      this.soft_volume,
      this.threshold_depth_buffer,
      this.projection_matrix,
      o
    ), this.colorize_action.attach_to_context(t), e.push(this.colorize_action), this.iso_panel = this.get_output_panel(t), this.iso_flatten_action = this.threshold_depth_buffer.flatten_action(this.iso_panel), e.push(this.iso_flatten_action), this.max_depth_buffer = this.get_output_depth_buffer(t), this.max_value = n.max_value, this.max_project_action = t.max_projection(
      n,
      this.max_depth_buffer,
      this.projection_matrix
    ), e.push(this.max_project_action), this.max_panel = this.get_output_panel(t), this.max_flatten_action = this.max_depth_buffer.flatten_action(this.max_panel), e.push(this.max_flatten_action), this.max_gray_panel = this.get_output_panel(t), this.max_gray_action = t.to_gray_panel(
      this.max_panel,
      this.max_gray_panel,
      this.min_value,
      this.max_value
    ), e.push(this.max_gray_action), this.slice_depth_buffer = this.get_output_depth_buffer(t), this.slice_value_panel = this.get_output_panel(t), this.slice_gray_panel = this.get_output_panel(t), this.slice_project_action = new C(
      n,
      this.slice_depth_buffer,
      this.projection_matrix,
      this.current_depth
    ), this.slice_project_action.attach_to_context(t), e.push(this.slice_project_action), this.slice_flatten_action = this.slice_depth_buffer.flatten_action(this.slice_value_panel), e.push(this.slice_flatten_action), this.slice_gray_action = t.to_gray_panel(
      this.slice_value_panel,
      this.slice_gray_panel,
      this.min_value,
      this.max_value
    ), e.push(this.slice_gray_action), this.slice_output_panel = this.slice_gray_panel, this.max_output_panel = this.max_gray_panel, this.iso_output_panel = this.iso_panel, this.project_to_panel = t.sequence(e), {
      sequence: this.project_to_panel,
      iso_output_panel: this.iso_panel,
      max_output_panel: this.max_gray_panel,
      slice_output_panel: this.slice_gray_panel
      //panel: this.panel,
      //depth_buffer: this.threshold_depth_buffer,
    };
  }
  change_threshold(t) {
    this.threshold_value = t, this.threshold_project_action.change_threshold(t), this.run();
  }
  change_matrix(t) {
    super.change_matrix(t), this.threshold_project_action.change_matrix(t), this.colorize_action.change_matrix(t), this.max_project_action.change_matrix(t), this.slice_project_action.change_matrix(t), this.change_range(t);
  }
  change_depth(t) {
    this.slice_project_action.change_depth(t), this.current_depth = t, this.run();
  }
  change_range(t) {
    const n = this.ofVolume.projected_range(t, !0);
    this.min_depth = n.min[2], this.max_depth = n.max[2], this.range_callback && this.range_callback(this.min_depth, this.max_depth);
  }
}
const Oo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Triptych: Ln
}, Symbol.toStringTag, { value: "Module" }));
class An extends P {
  async pick(t, e) {
    const n = await super.pick(t, e), o = n.panel_coords;
    return await this.max_depth_buffer.pull_data(), n.maximum = this.max_depth_buffer.location(
      o,
      this.space,
      this.ofVolume
    ), n;
  }
  panel_sequence(t) {
    t = t || this.context;
    const e = this.ofVolume;
    this.min_value = e.min_value, this.max_value = e.max_value, this.max_depth_buffer = this.get_output_depth_buffer(t), this.max_panel = this.get_output_panel(t), this.grey_panel = this.get_output_panel(t), this.project_action = t.max_projection(
      e,
      this.max_depth_buffer,
      this.projection_matrix
    ), this.flatten_action = this.flatten_action = this.max_depth_buffer.flatten_action(
      this.max_panel
    ), this.gray_action = t.to_gray_panel(
      this.max_panel,
      this.grey_panel,
      this.min_value,
      this.max_value
    );
    const n = 1e3;
    return this.dots_action = new fe(
      this.grey_panel,
      n
    ), this.dots_action.attach_to_context(t), this.project_to_panel = t.sequence([
      this.project_action,
      this.flatten_action,
      this.gray_action,
      this.dots_action
    ]), {
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
  change_matrix(t) {
    super.change_matrix(t), this.project_action.change_matrix(t);
  }
}
const Eo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Max: An
}, Symbol.toStringTag, { value: "Module" }));
class Tn extends P {
  panel_sequence(t) {
    t = t || this.context;
    const e = this.ofVolume;
    this.min_value = e.min_value, this.max_value = e.max_value;
    const n = [0, 0, 0, 1], o = U(this.projection_matrix), s = q(o, n);
    return this.current_depth = s[2], this.max_depth_buffer = this.get_output_depth_buffer(t), this.max_project_action = t.max_projection(
      e,
      this.max_depth_buffer,
      this.projection_matrix
    ), this.level_depth_buffer = this.get_output_depth_buffer(t), this.level_project_action = new C(
      e,
      this.level_depth_buffer,
      this.projection_matrix,
      this.current_depth
    ), this.level_project_action.attach_to_context(t), this.front_depth_buffer = this.get_output_depth_buffer(t), this.slice_front_action = new ot(
      this.max_depth_buffer,
      this.front_depth_buffer,
      this.min_value,
      this.current_depth,
      0
      // slice depths, not values
    ), this.slice_front_action.attach_to_context(t), this.back_depth_buffer = this.get_output_depth_buffer(t), this.slice_back_action = new ot(
      this.max_depth_buffer,
      this.back_depth_buffer,
      this.current_depth,
      this.max_value,
      0
      // slice depths, not values
    ), this.slice_back_action.attach_to_context(t), this.front_to_gray = this.get_gray_panel_sequence(
      this.front_depth_buffer,
      this.min_value,
      this.max_value
    ), this.back_to_gray = this.get_gray_panel_sequence(
      this.back_depth_buffer,
      this.min_value,
      this.max_value
    ), this.level_to_gray = this.get_gray_panel_sequence(
      this.level_depth_buffer,
      this.min_value,
      this.max_value
    ), this.back_level_ratios = [0.9, 0.9, 0.5, 0], this.mix_back_and_level = new gt(
      this.level_to_gray.output_panel,
      this.back_to_gray.output_panel,
      // to_panel
      this.back_level_ratios
    ), this.mix_back_and_level.attach_to_context(t), this.back_front_ratios = [0, 0.5, 0, 0], this.back_front_ratios = [0, 0.3, 0, 0], this.mix_back_and_front = new gt(
      this.front_to_gray.output_panel,
      this.back_to_gray.output_panel,
      // to_panel
      this.back_front_ratios
    ), this.mix_back_and_front.attach_to_context(t), this.output_panel = this.back_to_gray.output_panel, this.project_to_panel = t.sequence([
      this.max_project_action,
      this.level_project_action,
      this.slice_front_action,
      this.slice_back_action,
      this.front_to_gray.sequence,
      this.back_to_gray.sequence,
      this.level_to_gray.sequence,
      this.mix_back_and_level,
      this.mix_back_and_front
    ]), {
      sequence: this.project_to_panel,
      output_panel: this.output_panel
    };
  }
  // remainder is very similar to TestDepthView
  change_matrix(t) {
    this.max_project_action.change_matrix(t), this.level_project_action.change_matrix(t), this.change_range(t);
  }
  change_depth(t) {
    this.level_project_action.change_depth(t), this.slice_front_action.change_upper_bound(t), this.slice_back_action.change_lower_bound(t), this.run();
  }
  on_range_change(t) {
    this.range_change_callback = t, this.change_range(this.projection_matrix);
  }
  change_range(t) {
    const e = this.range_change_callback;
    if (e) {
      const o = this.ofVolume.projected_range(t, !0), s = o.min[2], a = o.max[2];
      console.log("new range min", s, "max", a), this.slice_back_action.change_upper_bound(a), this.slice_front_action.change_lower_bound(s), e(s, a);
    }
  }
}
const Vo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  TestRangeView: Tn
}, Symbol.toStringTag, { value: "Module" }));
class qn {
  constructor(t, e, n, o) {
    o = o || 0.7, this.ratio = o, this.indexed_colors = new Uint32Array(e), this.canvas = n, this.volume_url = t, this.connect_future = this.connect(), this.volume_future = this.load();
  }
  async connect() {
    this.context = new w(), await this.context.connect();
  }
  async load() {
    const t = this.context, o = await (await (await fetch(this.volume_url)).blob()).arrayBuffer();
    console.log("buffer", o);
    const s = new Uint32Array(o), a = new Float32Array(s);
    console.log("f32", a), this.volume_shape = a.slice(0, 3), this.volume_content = a.slice(3);
    const [r, u, _] = this.volume_shape, c = k(4);
    c[1][1] = -1;
    const l = b(null, [-r / 2, -u / 2, -_ / 2]);
    this.volume_matrix = m(c, l);
    debugger;
    await this.connect_future, this.volume = t.volume(
      this.volume_shape,
      this.volume_content,
      this.volume_matrix,
      Float32Array
    ), this.soft_volume = t.volume(
      this.volume_shape,
      null,
      // no content
      this.volume_matrix,
      Float32Array
    ), this.soften_action = new H(this.volume, this.soft_volume, null), this.soften_action.attach_to_context(t), console.log("input Volume", this.volume), this.volume.min_value, this.volume.max_value;
    const h = this.indexed_colors.length;
    this.color_panel = t.panel(1, h);
    debugger;
    await this.color_panel.push_buffer(this.indexed_colors);
    const p = Math.max(r, u, _), f = Math.ceil(Math.sqrt(2) * p);
    this.output_shape = [f, f];
    const d = 0, y = 0;
    this.depth_buffer = t.depth_buffer(
      this.output_shape,
      d,
      y,
      null,
      //input_data,
      null,
      // input_depths,
      Float32Array
    ), this.threshold_value = 0.5, this.initial_rotation = [
      [0, 0, 1],
      [1, 0, 0],
      [0, 1, 0]
    ], this.affine_translation = b(null, [-f / 2, -f / 2, -f]), this.projection_matrix = m(
      b(this.initial_rotation),
      this.affine_translation
    ), this.project_action = new W(
      this.volume,
      this.depth_buffer,
      this.projection_matrix,
      this.threshold_value
    ), this.project_action.attach_to_context(t);
    const [j, v] = this.output_shape;
    this.index_panel = t.panel(v, j), this.index_flatten = this.depth_buffer.flatten_action(this.index_panel);
    const g = 0;
    this.index_colorize = new bt(
      this.color_panel,
      this.index_panel,
      g
    ), this.index_colorize.attach_to_context(t), this.colorize_action = new Y(
      this.soft_volume,
      // do normal colorization using softened volume
      this.depth_buffer,
      this.projection_matrix,
      g
    ), this.colorize_action.attach_to_context(t), this.orbiter = new N(
      this.canvas,
      null,
      // center,
      this.initial_rotation,
      this.get_orbiter_callback()
      // callback,
    ), this.panel = t.panel(v, j), this.flatten_action = this.depth_buffer.flatten_action(this.panel);
    const S = this.ratio;
    this.mix_action = new Lt(
      this.index_panel,
      this.panel,
      S
    ), this.mix_action.attach_to_context(t), this.painter = t.paint(this.panel, this.canvas), this.sequence = t.sequence([
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
    ]), this.sequence.run();
  }
  async debug_button_callback() {
    debugger;
    await this.index_panel.pull_buffer(), await this.depth_buffer.pull_buffer(), console.log("pipeline", this);
  }
  async run() {
    await this.volume_future, this.sequence.run();
  }
  get_orbiter_callback() {
    const t = this;
    function e(n) {
      t.change_parameters(n);
    }
    return e;
  }
  change_parameters(t, e) {
    if (t) {
      const n = m(
        t,
        this.affine_translation
      );
      this.projection_matrix = n, this.project_action.change_matrix(n), this.colorize_action.change_matrix(n);
    }
    e && this.mix_action.change_ratio(e), this.run();
  }
}
const Go = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MixPipeline: qn
}, Symbol.toStringTag, { value: "Module" }));
class Un {
  constructor(t, e, n) {
    this.slider = n, this.canvas = e, this.volume_url = t, this.connect_future = this.connect(), this.volume_future = this.load();
  }
  async connect() {
    this.context = new w(), await this.context.connect();
  }
  async load() {
    const t = this.context, o = await (await (await fetch(this.volume_url)).blob()).arrayBuffer();
    console.log("buffer", o);
    const s = new Float32Array(o);
    console.log("f32", s), this.volume_shape = s.slice(0, 3), this.volume_content = s.slice(3);
    const [a, r, u] = this.volume_shape, _ = k(4);
    _[1][1] = -1;
    const c = b(null, [-a / 2, -r / 2, -u / 2]);
    this.volume_matrix = m(_, c);
    debugger;
    await this.connect_future, this.volume = t.volume(
      this.volume_shape,
      this.volume_content,
      this.volume_matrix,
      Float32Array
    ), console.log("input Volume", this.volume);
    const l = this.volume.min_value, h = this.volume.max_value;
    this.slider.min = l, this.slider.max = h, this.slider.value = (l + h) / 2, this.slider.step = (h - l) / 100;
    const p = Math.max(a, r, u), f = Math.ceil(Math.sqrt(2) * p);
    this.output_shape = [f, f];
    const d = -1e4, y = -1e4;
    this.depth_buffer = t.depth_buffer(
      this.output_shape,
      d,
      y,
      null,
      //input_data,
      null,
      // input_depths,
      Float32Array
    ), this.threshold_value = 33e3, this.initial_rotation = [
      [0, 0, 1],
      [1, 0, 0],
      [0, 1, 0]
    ], this.affine_translation = b(null, [-f / 2, -f / 2, -f]), this.projection_matrix = m(
      b(this.initial_rotation),
      this.affine_translation
    ), this.project_action = new W(
      this.volume,
      this.depth_buffer,
      this.projection_matrix,
      this.threshold_value
    ), this.project_action.attach_to_context(t);
    const j = 0;
    this.colorize_action = new Y(
      this.volume,
      this.depth_buffer,
      this.projection_matrix,
      j
    ), this.colorize_action.attach_to_context(t), this.orbiter = new N(
      this.canvas,
      null,
      // center,
      this.initial_rotation,
      this.get_orbiter_callback()
      // callback,
    );
    const [v, g] = this.output_shape;
    this.panel = t.panel(g, v), this.flatten_action = this.depth_buffer.flatten_action(this.panel), this.grey_panel = t.panel(g, v), this.painter = t.paint(this.panel, this.canvas), this.sequence = t.sequence([
      this.project_action,
      this.colorize_action,
      this.flatten_action,
      //this.gray_action, 
      this.painter
    ]), this.sequence.run();
  }
  async run() {
    await this.volume_future, this.sequence.run();
  }
  get_orbiter_callback() {
    const t = this;
    function e(n) {
      t.change_parameters(n);
    }
    return e;
  }
  change_parameters(t, e) {
    if (t) {
      const n = m(
        t,
        this.affine_translation
      );
      this.projection_matrix = n, this.project_action.change_matrix(n), this.colorize_action.change_matrix(n);
    }
    e && this.project_action.change_threshold(e), this.run();
  }
}
const Lo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ThresholdPipeline: Un
}, Symbol.toStringTag, { value: "Module" }));
class In extends P {
  panel_sequence(t) {
    t = t || this.context;
    const e = this.ofVolume;
    this.min_value = e.min_value, this.max_value = e.max_value;
    const n = [0, 0, 0, 1], o = U(this.projection_matrix), s = q(o, n);
    return this.current_depth = s[2], this.depth_buffer = this.get_output_depth_buffer(t), this.value_panel = this.get_output_panel(t), this.grey_panel = this.get_output_panel(t), this.project_action = new C(
      this.ofVolume,
      this.depth_buffer,
      this.projection_matrix,
      this.current_depth
    ), this.project_action.attach_to_context(t), this.flatten_action = this.depth_buffer.flatten_action(this.value_panel), this.gray_action = t.to_gray_panel(
      this.value_panel,
      this.grey_panel,
      this.min_value,
      this.max_value
    ), this.project_to_panel = t.sequence([
      this.project_action,
      this.flatten_action,
      this.gray_action
    ]), {
      sequence: this.project_to_panel,
      output_panel: this.grey_panel
    };
  }
  change_matrix(t) {
    this.project_action.change_matrix(t), this.change_range(t);
  }
  change_depth(t) {
    this.project_action.change_depth(t), this.run();
  }
  on_range_change(t) {
    this.range_change_callback = t, this.change_range(this.projection_matrix);
  }
  change_range(t) {
    const e = this.range_change_callback;
    if (e) {
      const o = this.ofVolume.projected_range(t, !0), s = o.min[2], a = o.max[2];
      console.log("new range min", s, "max", a), e(s, a);
    }
  }
}
const Ao = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  TestDepthView: In
}, Symbol.toStringTag, { value: "Module" })), To = "webgpu_volume";
function qo() {
  return new w();
}
export {
  ho as CPUVolume,
  oo as CombineDepths,
  Qn as CopyAction,
  po as DepthBufferRange,
  Nn as GPUAction,
  Yn as GPUColorPanel,
  to as GPUContext,
  Fn as GPUDataObject,
  Hn as GPUDepthBuffer,
  Rn as GPUVolume,
  fo as IndexColorizePanel,
  Eo as MaxDotView,
  Xn as MaxProjection,
  vo as MaxView,
  xo as MixColorPanels,
  yo as MixDepthBuffers,
  wo as MixDotsOnPanel,
  Bo as MixView,
  zo as NormalAction,
  $n as PaintPanel,
  Se as Painter_wgsl,
  io as PastePanel,
  Jn as Projection,
  Wn as SampleVolume,
  So as SegmentationQuad,
  Po as SlicedThresholdView,
  ko as Soften,
  jo as ThresholdAction,
  Do as ThresholdView,
  Oo as Triptych,
  Kn as UpdateAction,
  Zn as UpdateGray,
  mo as ViewVolume,
  Mo as VolumeAtDepth,
  co as canvas_orbit,
  We as combine_depth_buffers_wgsl,
  so as combine_test,
  qo as context,
  Ee as convert_buffer_wgsl,
  Ve as convert_depth_buffer_wgsl,
  ne as convert_gray_prefix_wgsl,
  Cn as coordinates,
  pn as depth_buffer_range_wgsl,
  E as depth_buffer_wgsl,
  Vo as depth_range_view,
  $e as do_combine,
  nn as do_gray,
  sn as do_max_projection,
  Ze as do_mouse_paste,
  Ue as do_paint,
  Qe as do_paste,
  rn as do_pipeline,
  Te as do_sample,
  Me as embed_volume_wgsl,
  uo as gray_test,
  dn as index_colorize_wgsl,
  _o as max_projection_test,
  De as max_value_project_wgsl,
  gn as mix_color_panels_wgsl,
  bn as mix_depth_buffers_wgsl,
  yn as mix_dots_on_panel_wgsl,
  Go as mix_test,
  ro as mousepaste,
  To as name,
  kn as normal_colors_wgsl,
  no as paint_test,
  ut as panel_buffer_wgsl,
  Je as paste_panel_wgsl,
  ao as paste_test,
  lo as pipeline_test,
  eo as sample_test,
  Mn as soften_volume_wgsl,
  Lo as threshold_test,
  jn as threshold_wgsl,
  Ao as vol_depth_view,
  Dn as volume_at_depth_wgsl,
  Q as volume_frame_wgsl,
  Dt as volume_intercepts_wgsl
};
