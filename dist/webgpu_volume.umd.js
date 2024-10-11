(function(_,b){typeof exports=="object"&&typeof module<"u"?b(exports):typeof define=="function"&&define.amd?define(["exports"],b):(_=typeof globalThis<"u"?globalThis:_||self,b(_.webgpu_volume={}))})(this,function(_){"use strict";class b{constructor(){this.buffer_size=0,this.gpu_buffer=null,this.usage_flags=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST,this.attached=!1,this.buffer_content=null,this.context=null}attach_to_context(t){if(this.context==t)return this.gpu_buffer;if(this.attached)throw new Error("cannot re-attach attached object.");this.attached=!0,this.context=t;const e=t.device;return this.allocate_buffer_mapped(e),this.load_buffer(),this.gpu_buffer.unmap(),this.gpu_buffer}allocate_buffer_mapped(t,e){return t=t||this.context.device,e=e||this.usage_flags,this.gpu_buffer=t.createBuffer({mappedAtCreation:!0,size:this.buffer_size,usage:e}),this.gpu_buffer}load_buffer(t){return this.gpu_buffer}async pull_buffer(){const e=this.context.device,n=GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ,o=e.createBuffer({size:this.buffer_size,usage:n}),i=e.createCommandEncoder();i.copyBufferToBuffer(this.gpu_buffer,0,o,0,this.buffer_size);const a=i.finish();e.queue.submit([a]),await e.queue.onSubmittedWorkDone(),await o.mapAsync(GPUMapMode.READ);const r=o.getMappedRange();var u=new ArrayBuffer(r.byteLength);return new Uint8Array(u).set(new Uint8Array(r)),o.destroy(),this.buffer_content=u,u}async push_buffer(t){const n=this.context.device;var o=this.buffer_size;if(t&&(o=t.byteLength,o>this.buffer_size))throw new Error("push buffer too large "+[o,this.buffer_size]);const i=this.usage_flags,a=n.createBuffer({mappedAtCreation:!0,size:o,usage:i});if(t){const l=a.getMappedRange(),c=t.constructor;new c(l).set(t)}else this.load_buffer(a);a.unmap();const r=n.createCommandEncoder();r.copyBufferToBuffer(a,0,this.gpu_buffer,0,o);const u=r.finish();n.queue.submit([u]),await n.queue.onSubmittedWorkDone(),a.destroy()}bindGroupLayout(t){const n=this.context.device;t=t||"storage";const i={binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:t}};return n.createBindGroupLayout({entries:[i]})}bindGroup(t,e){return e.device.createBindGroup({layout:t,entries:[this.bindGroupEntry(0)]})}bindGroupEntry(t){return{binding:t,resource:{buffer:this.gpu_buffer}}}}const Ce=Object.freeze(Object.defineProperty({__proto__:null,DataObject:b},Symbol.toStringTag,{value:"Module"})),Fe="qd_vector";function A(s){const t=new Float64Array(s);return Array.from(t)}function et(s,t){const e=s.length,n=A(e);for(var o=0;o<e;o++)n[o]=s[o]+t[o];return n}function qt(s,t){const e=s.length,n=A(e);for(var o=0;o<e;o++)n[o]=Math.min(s[o],t[o]);return n}function Ut(s,t){const e=s.length,n=A(e);for(var o=0;o<e;o++)n[o]=Math.max(s[o],t[o]);return n}function E(s,t){const e=t.length,n=A(e);for(var o=0;o<e;o++)n[o]=s*t[o];return n}function Re(s,t){return et(s,E(-1,t))}function It(s){var t=0;for(var e of s)t+=e*e;return Math.sqrt(t)}function Ne(s){var t=It(s);return E(1/t,s)}function J(s,t){const e=[];for(var n=0;n<s;n++)e.push(A(t));return e}function x(s,t){const e=M(4);if(s)for(var n=0;n<3;n++)for(var o=0;o<3;o++)e[n][o]=s[n][o];if(t)for(var n=0;n<3;n++)e[n][3]=t[n];return e}function nt(s,t){const e=t.slice();return e.push(1),L(s,e).slice(0,3)}function We(s){const t=[],e=s.length;for(var n=0;n<e;n++)t.push(...s[n]);return t}function Ct(s,t,e){const n=s.length;if(n!=t*e)throw new Error(`Length ${n} doesn't match rows ${t} and columns ${e}.`);const o=[];for(var i=0,a=0;a<t;a++){const u=[];for(var r=0;r<e;r++){const l=s[i];u.push(l),i++}o.push(u)}return o}function B(s,t){const e=s.length,n=s[0].length;if(t){for(var o=0;o<e;o++)if(s[o].length!=n)throw new Error("inconsistent shape.")}return[e,n]}function M(s){const t=J(s,s);for(var e=0;e<s;e++)t[e][e]=1;return t}function L(s,t){const[e,n]=B(s);for(var o=A(e),i=0;i<e;i++){for(var a=0,r=0;r<n;r++)a+=s[i][r]*t[r];o[i]=a}return o}function m(s,t){const[e,n]=B(s),[o,i]=B(t);if(n!=o)throw new Error("incompatible matrices.");for(var a=J(e,i),r=0;r<e;r++)for(var u=0;u<i;u++){for(var l=0,c=0;c<o;c++)l+=s[r][c]*t[c][u];a[r][u]=l}return a}function lt(s){const[t,e]=B(s),n=J(t,e);for(var o=0;o<t;o++)for(var i=0;i<e;i++)n[o][i]=s[o][i];return n}function Ye(s,t=.001){const e=lt(s);for(var n of e)for(var o=0;o<n.length;o++){const i=n[o],a=Math.round(i);Math.abs(i-a)<t&&(n[o]=a)}return e}function Ft(s,t,e,n){var o=s;n||(o=lt(s));const i=o[t];return o[t]=o[e],o[e]=i,o}function Rt(s,t){const[e,n]=B(s),[o,i]=B(t);if(e!=o)throw new Error("bad shapes: rows must match.");const a=J(e,n+i);for(var r=0;r<o;r++){for(var u=0;u<n;u++)a[r][u]=s[r][u];for(var l=0;l<i;l++)a[r][l+n]=t[r][l]}return a}function Nt(s,t,e,n,o){const i=n-t,a=o-e,r=J(i,a);for(var u=0;u<i;u++)for(var l=0;l<a;l++)r[u][l]=s[u+t][l+e];return r}function Wt(s){var t=lt(s);const[e,n]=B(s),o=Math.min(e,n);for(var i=0;i<o;i++){for(var a=i,r=Math.abs(t[a][i]),u=i+1;u<o;u++){const p=Math.abs(t[u][i]);p>r&&(r=p,a=u)}a!=u&&(t=Ft(t,i,a,!0));for(var l=t[i][i],c=1/l,h=E(c,t[i]),u=0;u<o;u++){const f=t[u];if(u==i)t[u]=h;else{const d=f[i],g=E(-d,h),w=et(f,g);t[u]=w}}}return t}function T(s){const t=s.length,e=M(t),n=Rt(s,e),o=Wt(n);return Nt(o,0,t,t,2*t)}function Yt(s){var t=Math.cos(s),e=Math.sin(s),n=[[t,-e,0],[e,t,0],[0,0,1]];return n}function wt(s){var t=Math.cos(s),e=Math.sin(s),n=[[t,0,e],[0,1,0],[-e,0,t]];return n}function jt(s){var t=Math.cos(s),e=Math.sin(s),n=[[1,0,0],[0,t,e],[0,-e,t]];return n}function $t(s,t){const e=s.length;for(var n=0,o=0;o<e;o++)n+=s[o]*t[o];return n}function $e(s,t){const[e,n,o]=s,[i,a,r]=t;return[n*r-o*a,o*i-e*r,e*a-n*i]}function Ke(s){var t=[];const[e,n]=B(s);for(var o=0;o<e;o++)for(var i=0;i<n;i++)t.push(s[o][i]);return t}function q(s){var t=[];const[e,n]=B(s);for(var o=0;o<n;o++)for(var i=0;i<e;i++)t.push(s[i][o]);return t}function Je(s){var t=[];const[e,n]=B(s);for(var o=0;o<n;o++){for(var i=[],a=0;a<e;a++)i.push(s[a][o]);t.push(i)}return t}const Xe=Object.freeze(Object.defineProperty({__proto__:null,MM_product:m,M_as_list:We,M_column_major_order:q,M_copy:lt,M_inverse:T,M_pitch:wt,M_reduce:Wt,M_roll:Yt,M_row_major_order:Ke,M_shape:B,M_slice:Nt,M_tolerate:Ye,M_transpose:Je,M_yaw:jt,M_zero:J,Mv_product:L,affine3d:x,apply_affine3d:nt,eye:M,list_as_M:Ct,name:Fe,shelf:Rt,swap_rows:Ft,v_add:et,v_cross:$e,v_dot:$t,v_length:It,v_maximum:Ut,v_minimum:qt,v_normalize:Ne,v_scale:E,v_sub:Re,v_zero:A},Symbol.toStringTag,{value:"Module"}));class Kt{constructor(t){this.canvas=t}normalize(t,e){const n=this.canvas.getBoundingClientRect();this.brec=n,this.cx=n.width/2+n.left,this.cy=n.height/2+n.top;const o=t-this.cx,i=-(e-this.cy),a=o*2/this.brec.width,r=i*2/this.brec.height;return[a,r]}normalize_event_coords(t){return this.normalize(t.clientX,t.clientY)}}class Jt{constructor(t,e){this.height=t,this.width=e}normalized2ij([t,e]){const n=Math.floor((e+1)*this.height/2),o=Math.floor((t+1)*this.width/2);return[n,o]}ij2normalized([t,e]){const n=2*e/this.width-1,o=2*t/this.height-1;return[n,o]}}class ct{constructor(t){this.change_matrix(t)}change_matrix(t){this.ijk2xyz=t,this.xyz2ijk=T(t)}ijk2xyz_v(t){return nt(this.ijk2xyz,t)}}class Xt extends ct{constructor(t,e){super(t),this.shape=e}xyz2ijk_v(t){return nt(this.xyz2ijk,t)}ijk2offset(t){const[e,n,o]=this.shape.slice(0,3);var[i,a,r]=t;return i=Math.floor(i),a=Math.floor(a),r=Math.floor(r),r<0||r>=o||a<0||a>=n||i<0||i>=e?null:(i*n+a)*o+r}offset2ijk(t){const[e,n,o]=this.shape.slice(0,3),i=t%o,a=Math.floor(t/o)%n;return[Math.floor(t/(o*n)),a,i]}xyz2offset(t){return this.ijk2offset(this.xyz2ijk_v(t))}offset2xyz(t){return this.ijk2xyz_v(this.offset2ijk(t))}}const Qe=Object.freeze(Object.defineProperty({__proto__:null,NormalizedCanvasSpace:Kt,PanelSpace:Jt,ProjectionSpace:ct,VolumeSpace:Xt,qdVector:Xe},Symbol.toStringTag,{value:"Module"})),He=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];let ot=class Ie extends b{constructor(t,e,n,o){super(),o=o||Uint32Array,this.data_format=o,n||(n=Ct(He,4,4)),this.data=null,this.min_value=null,this.max_value=null,this.set_shape(t,e),this.set_ijk2xyz(n),this.shape_offset=0,this.ijk2xyz_offset=this.shape_offset+this.shape.length,this.xyz2ijk_offset=this.ijk2xyz_offset+this.ijk2xyz.length,this.content_offset=this.xyz2ijk_offset+this.xyz2ijk.length,this.buffer_size=(this.size+this.content_offset)*Int32Array.BYTES_PER_ELEMENT}same_geometry(t){t=t||this.context;const e=new Ie(this.shape.slice(0,3),null,this.matrix,this.data_format);return e.attach_to_context(t),e}max_extent(){const t=nt(this.matrix,[0,0,0]),e=nt(this.matrix,this.shape),n=et(E(-1,t),e);return Math.sqrt($t(n,n))}projected_range(t,e){var n=t;e&&(n=T(t));const o=m(n,this.matrix),[i,a,r,u]=this.shape;var l=null,c=null;for(var h of[0,i])for(var p of[0,a])for(var f of[0,r]){const g=L(o,[h,p,f,1]);l=l?Ut(l,g):g,c=c?qt(c,g):g}return{min:c,max:l}}set_shape(t,e){const[n,o,i]=t;this.size=n*o*i,this.shape=[n,o,i,0],this.data=null,e&&this.set_data(e)}set_data(t){const e=t.length;if(this.size!=e)throw new Error(`Data size ${e} doesn't match ${this.size}`);this.data=new this.data_format(t);var n=this.data[0],o=n;for(var i of this.data)n=Math.min(i,n),o=Math.max(i,o);this.min_value=n,this.max_value=o}set_ijk2xyz(t){this.matrix=t,this.space=new Xt(t,this.shape);const e=q(t);this.ijk2xyz=e,this.xyz2ijk=q(this.space.xyz2ijk)}sample_at(t){if(!this.data)throw new Error("No data to sample.");const e=this.space.xyz2offset(t);return e===null?null:this.data[e]}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange();new Uint32Array(e).set(this.shape,this.shape_offset);const o=new Float32Array(e);o.set(this.ijk2xyz,this.ijk2xyz_offset),o.set(this.xyz2ijk,this.xyz2ijk_offset),this.data&&new this.data_format(e).set(this.data,this.content_offset)}async pull_data(){const t=await this.pull_buffer(),e=new Uint32Array(t);return this.data=e.slice(this.content_offset),this.data}};const Ze=Object.freeze(Object.defineProperty({__proto__:null,Volume:ot},Symbol.toStringTag,{value:"Module"})),U=`
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
}`,O=`
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
}`;function Qt(s,t){const e=U+s;return t.device.createShaderModule({code:e})}function Ht(s,t){const e=O+s;return t.device.createShaderModule({code:e})}class V{constructor(){this.attached=!1}attach_to_context(t){this.attached=!0,this.context=t}run(){const e=this.context.device,n=e.createCommandEncoder();this.add_pass(n);const o=n.finish();e.queue.submit([o])}add_pass(t){}}class Zt extends V{constructor(t){super(),this.actions=t}add_pass(t){for(var e of this.actions)e.add_pass(t)}}const tn=Object.freeze(Object.defineProperty({__proto__:null,Action:V,ActionSequence:Zt,depth_shader_code:Ht,volume_shader_code:Qt},Symbol.toStringTag,{value:"Module"})),te=`
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
}`;class zt extends V{constructor(t,e,n){super(),this.volumeToSample=n,this.shape=t,this.ijk2xyz=e,this.targetVolume=new ot(t,null,e)}attach_to_context(t){const e=t.device,n=this.volumeToSample,o=this.targetVolume;this.targetVolume.attach_to_context(t);const i=Qt(te,t),a=o.bindGroupLayout("storage"),r=n.bindGroupLayout("read-only-storage"),u=e.createPipelineLayout({bindGroupLayouts:[r,a]});this.pipeline=e.createComputePipeline({layout:u,compute:{module:i,entryPoint:"main"}}),this.sourceBindGroup=n.bindGroup(r,t),this.targetBindGroup=o.bindGroup(a,t),this.attached=!0,this.context=t}add_pass(t){const e=t.beginComputePass(),n=this.pipeline;e.setPipeline(n),e.setBindGroup(0,this.sourceBindGroup),e.setBindGroup(1,this.targetBindGroup);const o=Math.ceil(this.targetVolume.size/8);e.dispatchWorkgroups(o),e.end()}async pull(){return await this.targetVolume.pull_data()}}const en=Object.freeze(Object.defineProperty({__proto__:null,SampleVolume:zt},Symbol.toStringTag,{value:"Module"}));class z extends b{constructor(t,e){super(),this.width=t,this.height=e,this.size=t*e,this.buffer_size=this.size*Int32Array.BYTES_PER_ELEMENT,this.usage_flags=GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}resize(t,e){const n=t*e;if(n*Int32Array.BYTES_PER_ELEMENT>this.buffer_size)throw new Error("buffer resize not yet implemented");this.width=t,this.height=e,this.size=n}color_at([t,e]){if(e<0||e>=this.width||t<0||t>=this.height)return null;const n=e+t*this.width,o=Int32Array.BYTES_PER_ELEMENT;return new Uint8Array(this.buffer_content,n*o,o)}}const nn=Object.freeze(Object.defineProperty({__proto__:null,Panel:z},Symbol.toStringTag,{value:"Module"})),ee=`
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
`;function it(s){console.log("converting grey to rgba");const t=s.length,e=new Uint8Array(t*4);for(var n=0;n<t;n++){const o=s[n],i=n*4;e[i]=o,e[i+1]=o,e[i+2]=o,e[i+3]=255}return e}class ne extends b{constructor(t){super(),this.match_panel(t),this.usage_flags=GPUBufferUsage.STORAGE|GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC|GPUBufferUsage.VERTEX}match_panel(t){const e=t.width,n=t.height,o=-1,i=-1,a=2/e,r=2/n;this.set_array(e,n,o,i,a,r)}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange();new Float32Array(e).set(this.array)}set_array(t,e,n,o,i,a){this.array=new Float32Array([t,e,n,o,i,a]),this.buffer_size=this.array.byteLength}reset(t){this.match_panel(t),this.push_buffer(this.array)}}class oe{constructor(t,e,n,o){t.byteLength==e*n&&(t=it(t));var i=this;i.to_canvas=o,i.context=new j,i.rgbaImage=t,i.width=e,i.height=n,this.context.connect_then_call(()=>i.init_image())}init_image(){this.panel=new z(this.width,this.height),this.painter=new st(this.panel,this.to_canvas),this.panel.attach_to_context(this.context),this.painter.attach_to_context(this.context),this.panel.push_buffer(this.rgbaImage),this.painter.run()}change_image(t){t.byteLength==this.width*this.height&&(t=it(t)),this.rgbaImage=t,this.panel.push_buffer(t),this.painter.reset(this.panel),this.painter.run()}}class st extends V{constructor(t,e){super(),this.panel=t,this.to_canvas=e,this.uniforms=new ne(t)}attach_to_context(t){this.context=t;const e=t.device,n=this.to_canvas;this.webgpu_context=n.getContext("webgpu");const o=navigator.gpu.getPreferredCanvasFormat();this.webgpu_context.configure({device:e,format:o}),this.panel.attached||this.panel.attach_to_context(t),this.uniforms.attach_to_context(t);const i={arrayStride:Uint32Array.BYTES_PER_ELEMENT,stepMode:"instance",attributes:[{shaderLocation:0,offset:0,format:"uint32"}]},a=e.createShaderModule({code:ee});this.pipeline=e.createRenderPipeline({layout:"auto",vertex:{module:a,entryPoint:"vertexMain",buffers:[i]},fragment:{module:a,entryPoint:"fragmentMain",targets:[{format:o}]}});const r=this.uniforms.gpu_buffer,u=this.uniforms.buffer_size;this.uniformBindGroup=e.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r,offset:0,size:u}}]})}reset(t){this.panel=t,this.uniforms.reset(t)}add_pass(t){const e=this.webgpu_context.getCurrentTexture().createView();this.colorAttachments=[{view:e,loadOp:"clear",storeOp:"store"}];const n=this.colorAttachments,o=this.pipeline,i=this.panel.gpu_buffer,a=this.uniformBindGroup,r=t.beginRenderPass({colorAttachments:n});r.setPipeline(o),r.setVertexBuffer(0,i),r.setBindGroup(0,a),r.draw(6,this.panel.size),r.end()}}const on=Object.freeze(Object.defineProperty({__proto__:null,ImagePainter:oe,PaintPanel:st,PaintPanelUniforms:ne,grey_to_rgba:it},Symbol.toStringTag,{value:"Module"}));class S extends V{get_shader_module(t){throw new Error("get_shader_module must be define in subclass.")}attach_to_context(t){this.context=t;const e=t.device,n=this.source,o=this.target,i=this.parameters;n.attach_to_context(t),o.attach_to_context(t),i.attach_to_context(t);const a=this.get_shader_module(t),r=o.bindGroupLayout("storage"),u=n.bindGroupLayout("read-only-storage"),l=i.bindGroupLayout("read-only-storage"),c=e.createPipelineLayout({bindGroupLayouts:[u,r,l]});this.pipeline=e.createComputePipeline({layout:c,compute:{module:a,entryPoint:"main"}}),this.sourceBindGroup=n.bindGroup(u,t),this.targetBindGroup=o.bindGroup(r,t),this.parmsBindGroup=i.bindGroup(l,t),this.attached=!0}getWorkgroupCounts(){return[Math.ceil(this.target.size/8),1,1]}add_pass(t){const e=t.beginComputePass(),n=this.pipeline;e.setPipeline(n),e.setBindGroup(0,this.sourceBindGroup),e.setBindGroup(1,this.targetBindGroup),e.setBindGroup(2,this.parmsBindGroup);const[o,i,a]=this.getWorkgroupCounts();e.dispatchWorkgroups(o,i,a),e.end()}}const sn=Object.freeze(Object.defineProperty({__proto__:null,UpdateAction:S},Symbol.toStringTag,{value:"Module"})),an=1e-15;function kt(s,t){const e=new Float32Array(16),n=t.matrix,o=T(n),i=t.shape,a=m(o,s);for(var r=0,u=0;u<3;u++){const y=a[u],v=y[2];var l;if(Math.abs(v)<an)l=[0,0,1111,-1111];else{const tt=i[u],$=-y[0]/v,bt=-y[1]/v;var c=(0-y[3])/v,h=(tt-y[3])/v;c>h&&([c,h]=[h,c]),l=[$,bt,c,h]}e.set(l,r),r+=4}const p=[0,0,0,1],f=T(a),d=L(f,p),g=E(-1,d);function w(y){const v=L(f,y),D=et(g,v);return Math.abs(D[2])}var k=Math.max(w([1,0,0,1]),w([0,0,1,1]),w([0,1,0,1]));return e[r]=k,e}class at extends S{constructor(t,e){super(),this.source=t,this.target=e}change_matrix(t){this.parameters.set_matrix(t),this.parameters.push_buffer()}getWorkgroupCounts(){return[Math.ceil(this.target.size/256),1,1]}}const rn=Object.freeze(Object.defineProperty({__proto__:null,Project:at,intersection_buffer:kt},Symbol.toStringTag,{value:"Module"})),ht=`
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
`,ie=`
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
`;class un extends b{constructor(t,e,n){super(),this.volume=e,this.depthBuffer=n,this.buffer_size=(4*4+4*3+4)*Int32Array.BYTES_PER_ELEMENT,this.set_matrix(t)}set_matrix(t){this.ijk2xyz=q(t),this.intersections=kt(t,this.volume)}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Float32Array(e);n.set(this.ijk2xyz,0),n.set(this.intersections,4*4)}}class Mt extends at{constructor(t,e,n){super(t,e),this.parameters=new un(n,t,e)}get_shader_module(t){const e=U+O+ht+ie;return t.device.createShaderModule({code:e})}}const _n=Object.freeze(Object.defineProperty({__proto__:null,MaxProject:Mt},Symbol.toStringTag,{value:"Module"}));class Bt extends V{constructor(t,e,n,o,i){super(),this.fromDataObject=t,this.toDataObject=n,this.from_offset=e,this.to_offset=o,this.length=i}add_pass(t){const e=Int32Array.BYTES_PER_ELEMENT;t.copyBufferToBuffer(this.fromDataObject.gpu_buffer,this.from_offset*e,this.toDataObject.gpu_buffer,this.to_offset*e,this.length*e)}}const ln=Object.freeze(Object.defineProperty({__proto__:null,CopyData:Bt},Symbol.toStringTag,{value:"Module"}));class I extends b{constructor(t,e,n,o,i,a){super(),[this.height,this.width]=t,this.default_depth=e,this.default_value=n,this.data_format=a||Uint32Array,this.data=null,this.depths=null,this.size=this.width*this.height,o&&this.set_data(o),i&&this.set_depths(i),this.content_offset=4,this.depth_offset=this.size+this.content_offset,this.entries=this.size*2+this.content_offset,this.buffer_size=this.entries*Int32Array.BYTES_PER_ELEMENT}clone_operation(){const t=new I([this.height,this.width],this.default_depth,this.default_value,null,null,this.data_format);t.attach_to_context(this.context);const e=new Bt(this,0,t,0,this.entries);return e.attach_to_context(this.context),{clone:t,clone_action:e}}flatten_action(t,e){e=e||this.content_offset;const[n,o]=[this.width,this.height],[i,a]=[t.width,t.height];if(n!=i||o!=a)throw new Error("w/h must match: "+[n,o,i,a]);return new Bt(this,e,t,0,this.size)}copy_depths_action(t){return this.flatten_action(t,this.depth_offset)}set_data(t){const e=t.length;if(this.size!=e)throw new Error(`Data size ${e} doesn't match ${this.size}`);this.data=t}set_depths(t){const e=t.length;if(this.size!=e)throw new Error(`Data size ${e} doesn't match ${this.size}`);this.depths=t}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Float32Array(e),o=[this.height,this.width,this.default_depth,this.default_value];n.set(o,0),this.data&&new this.data_format(e).set(this.data,this.content_offset),this.depths&&n.set(this.depths,this.depth_offset)}async pull_data(){const t=await this.pull_buffer(),e=new this.data_format(t);this.data=e.slice(this.content_offset,this.depth_offset);const n=new Float32Array(t),o=n.slice(0,4);return this.height=o[0],this.width=o[1],this.default_depth=o[2],this.default_value=o[3],this.depths=n.slice(this.depth_offset,this.depth_offset+this.size),this.data}location([t,e],n,o){const i={};if(e<0||e>=this.width||t<0||t>=this.height)return null;const a=e+t*this.width,r=this.data[a],u=this.depths[a];if(r==this.default_value&&u==this.default_depth)return null;if(i.data=r,i.depth=u,n){const l=[t,e,u],c=n.ijk2xyz_v(l);if(i.xyz=c,o){const h=o.space.xyz2ijk_v(c),p=h.map(d=>Math.floor(d));i.volume_ijk=p;const f=o.space.ijk2offset(h);i.volume_offset=f,f!=null&&(i.volume_data=o.data[f])}}return i}}const cn=Object.freeze(Object.defineProperty({__proto__:null,DepthBuffer:I},Symbol.toStringTag,{value:"Module"})),St=`
// Prefix for converting f32 to rgba gray values.
// Prefix for convert_buffer.wgsl

struct parameters {
    input_start: u32,
    output_start: u32,
    length: u32,
    min_value: f32,
    max_value: f32,
    qd_colorize: u32,  // quick and dirty colorize, 0 for gray
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
    var result: u32;
    if (parms.qd_colorize == 0) {
        result = gray_level + 256 * (gray_level + 256 * (gray_level + 256 * 255));
    } else {
        //let inv = 255 - gray_level;
        // yellow to blue
        //result = gray_level + 256 * (gray_level + 256 * (inv + 256 * 255));
        var red: u32;
        var green: u32;
        var blue: u32;
        
        // black green cyan magenta white
        if (gray_level < 64) {
            // black to green
            red = 0;
            green = gray_level * 4;
            blue = 0;
        } else if (gray_level < 128) {
            // green to cyan
            red = 0;
            green = 255;
            blue = 255 - (gray_level - 64) * 4;
        } else if (gray_level < 192) {
            // cyan to magenta
            red = (gray_level - 128) * 4;
            green = 255 - red;
            blue = 255;
        } else {
            // magenta to white
            green = (gray_level - 192) * 4;
            red = 255;
            blue = 255;
        }
        /*
        // Black -> B -> G -> Y -> W
        if (gray_level < 64) {
            // black to blue
            red = 0;
            green = 0;
            blue = gray_level * 4;
        } else if (gray_level < 128) {
            // blue to green
            green = (gray_level - 64) * 4;
            blue = 256 - green;
            red = 0;
        } else if (gray_level < 192) {
            // green to yellow
            red = (gray_level - 128) * 4;
            green = 255;
            blue = 0;
        } else {
            // yellow to white
            blue = (gray_level - 192) * 4;
            red = 255;
            green = 255;;
        }
        */
        result = red + 256 * (green + 256 * (blue + 256 * 255));
    }
    //let result = gray_level + 256 * (gray_level + 256 * (gray_level + 256 * 255));
    //let result = 255u + 256 * (gray_level + 256 * (gray_level + 256 * gray_level));
    return result;
}`,se=`
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
`,ae=`

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
}`;class re extends b{constructor(t,e,n,o,i,a){super(),this.input_start=t,this.output_start=e,this.length=n,this.min_value=o,this.max_value=i,a=a||0,this.qd_colorize=a,this.buffer_size=6*Int32Array.BYTES_PER_ELEMENT}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Uint32Array(e);n[0]=this.input_start,n[1]=this.output_start,n[2]=this.length;const o=new Float32Array(e);o[3]=this.min_value,o[4]=this.max_value,n[5]=this.qd_colorize}}class ue extends S{constructor(t,e,n,o,i,a,r,u){super(),this.from_start=n,this.to_start=o,this.length=i,this.min_value=a,this.max_value=r,this.qd_colorize=u||0,this.source=t,this.target=e}attach_to_context(t){this.parameters=new re(this.from_start,this.to_start,this.length,this.min_value,this.max_value,this.qd_colorize),super.attach_to_context(t)}get_shader_module(t){const e=St+se;return t.device.createShaderModule({code:e})}getWorkgroupCounts(){return[Math.ceil(this.length/256),1,1]}async change_colorize(t){this.qd_colorize=t,this.parameters.qd_colorize=t,await this.parameters.push_buffer()}}class Pt extends ue{constructor(t,e,n,o,i){const a=t.size;if(a!=e.size)throw new Error("panel sizes must match: "+[a,e.size]);super(t,e,0,0,a,n,o,i)}compute_extrema(){const t=this.source.buffer_content;if(t==null)throw new Error("compute_extrema requires pulled buffer content.");const e=new Float32Array(t);var n=e[0],o=n;for(var i of e)n=Math.min(n,i),o=Math.max(o,i);this.min_value=n,this.max_value=o}async pull_extrema(){await this.source.pull_buffer(),this.compute_extrema()}}class _e extends S{constructor(t,e,n,o){super(),this.source=t,this.target=e,this.min_value=n,this.max_value=o,this.parameters=new re(0,0,t.size,n,o)}get_shader_module(t){const e=O+St+ae;return t.device.createShaderModule({code:e})}getWorkgroupCounts(){return[Math.ceil(this.target.size/256),1,1]}}const hn=Object.freeze(Object.defineProperty({__proto__:null,PaintDepthBufferGray:_e,ToGrayPanel:Pt,UpdateGray:ue},Symbol.toStringTag,{value:"Module"}));function pn(){return new j}async function fn(){const s=new j;return await s.connect(),s}function dn(){if(!navigator.gpu||!navigator.gpu.requestAdapter)throw alert("Cannot get WebGPU context. This browser does not have WebGPU enabled."),new Error("Can't get WebGPU context.")}class j{constructor(){dn(),this.adapter=null,this.device=null,this.connected=!1}async connect(){try{if(this.connected)return;if(this.adapter=await navigator.gpu.requestAdapter(),this.adapter){const t=this.adapter.limits.maxStorageBufferBindingSize,e={};if(e.maxStorageBufferBindingSize=t,e.maxBufferSize=t,this.device=await this.adapter.requestDevice({requiredLimits:e}),this.device)this.device.addEventListener("uncapturederror",n=>{console.error("A WebGPU error was not captured:",n.error)}),this.connected=!0;else throw new Error("Could not get device from gpu adapter")}else throw new Error("Could not get gpu adapter")}finally{this.connected||alert("Failed to connect WebGPU. This browser does not have WebGPU enabled.")}}destroy(){this.connected&&(this.device.destroy(),this.connected=!1),this.device=null,this.adapter=null}onSubmittedWorkDone(){return this.must_be_connected(),this.device.queue.onSubmittedWorkDone()}connect_then_call(t){var e=this;async function n(){await e.connect(),t()}n()}must_be_connected(){if(!this.connected)throw new Error("context is not connected.")}volume(t,e,n,o){this.must_be_connected();const i=new ot(t,e,n,o);return i.attach_to_context(this),i}depth_buffer(t,e,n,o,i,a){this.must_be_connected();const r=new I(t,e,n,o,i,a);return r.attach_to_context(this),r}panel(t,e){this.must_be_connected();const n=new z(t,e);return n.attach_to_context(this),n}sample(t,e,n){this.must_be_connected();const o=new zt(t,e,n);return o.attach_to_context(this),o}paint(t,e){this.must_be_connected();const n=new st(t,e);return n.attach_to_context(this),n}to_gray_panel(t,e,n,o,i){this.must_be_connected();const a=new Pt(t,e,n,o,i);return a.attach_to_context(this),a}max_projection(t,e,n){this.must_be_connected();const o=new Mt(t,e,n);return o.attach_to_context(this),o}sequence(t){this.must_be_connected();const e=new Zt(t);return e.attach_to_context(this),e}}const mn=Object.freeze(Object.defineProperty({__proto__:null,Context:j,get_connected_context:fn,get_context:pn},Symbol.toStringTag,{value:"Module"}));function le(){console.log("computing sample asyncronously"),(async()=>await gn())()}async function gn(){debugger;const s=new j;await s.connect();const t=[[1,0,0,1],[0,1,0,2],[0,0,1,3],[0,0,0,1]],e=[2,3,2],n=[30,1,2,3,4,5,6,7,8,9,10,11],o=[[0,1,0,1],[0,0,1,2],[1,0,0,3],[0,0,0,1]],i=[2,2,3],a=[30,2,4,6,8,10,1,3,5,7,9,11],r=new ot(e,n,t);r.attach_to_context(s);const u=new zt(i,o,r);u.attach_to_context(s),u.run();const l=await u.pull();console.log("expected",a),console.log("got output",l)}const vn=Object.freeze(Object.defineProperty({__proto__:null,do_sample:le},Symbol.toStringTag,{value:"Module"}));var pt,ce,C;function he(s){C=new oe(pe,2,2,s)}function bn(s){console.log("painting panel asyncronously"),ce=s,pt=new j,pt.connect_then_call(xn)}function G(s,t,e,n){return s*255+256*(t*255+256*(e*255+256*n*255))}const pe=new Uint32Array([G(1,0,0,1),G(0,1,0,1),G(0,0,1,1),G(1,1,0,1)]),yn=new Uint32Array([G(0,1,0,1),G(0,0,1,1),G(1,1,0,1),G(1,0,0,1)]);var F=pe,ft=yn,X;function xn(){X=new z(2,2),C=new st(X,ce),X.attach_to_context(pt),C.attach_to_context(pt),X.push_buffer(F),C.run()}function wn(s){[F,ft]=[ft,F],X.push_buffer(F),C.reset(X),C.run()}function jn(s){[F,ft]=[ft,F],C.change_image(F)}const zn=Object.freeze(Object.defineProperty({__proto__:null,change_paint:jn,change_paint1:wn,do_paint:he,do_paint1:bn},Symbol.toStringTag,{value:"Module"})),fe=`
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
}`;class kn extends b{constructor(t,e){super(),this.offset_ij=t,this.sign=e,this.buffer_size=3*Int32Array.BYTES_PER_ELEMENT}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Int32Array(e);n.set(this.offset_ij),n[2]=this.sign}}class de extends V{constructor(t,e,n,o){super(),this.outputDB=t,this.inputDB=e,this.offset_ij=n||[0,0],this.sign=o||1,this.parameters=new kn(this.offset_ij,this.sign)}attach_to_context(t){const e=t.device,n=this.inputDB,o=this.outputDB,i=this.parameters;i.attach_to_context(t);const a=Ht(fe,t),r=o.bindGroupLayout("storage"),u=n.bindGroupLayout("read-only-storage"),l=i.bindGroupLayout("read-only-storage"),c=e.createPipelineLayout({bindGroupLayouts:[u,r,l]});this.pipeline=e.createComputePipeline({layout:c,compute:{module:a,entryPoint:"main"}}),this.sourceBindGroup=n.bindGroup(u,t),this.targetBindGroup=o.bindGroup(r,t),this.parmsBindGroup=i.bindGroup(l,t),this.attached=!0,this.context=t}add_pass(t){const e=t.beginComputePass(),n=this.pipeline;e.setPipeline(n),e.setBindGroup(0,this.sourceBindGroup),e.setBindGroup(1,this.targetBindGroup),e.setBindGroup(2,this.parmsBindGroup);const o=Math.ceil(this.outputDB.size/8);e.dispatchWorkgroups(o),e.end()}getWorkgroupCounts(){return[Math.ceil(this.target.size/256),1,1]}}const Mn=Object.freeze(Object.defineProperty({__proto__:null,CombineDepths:de},Symbol.toStringTag,{value:"Module"}));function me(){console.log("computing sample asyncronously"),(async()=>await Bn())()}async function Bn(){const s=new j;await s.connect();const t=[3,3],e=-666,n=-666,o=[1,2,n,4,5,6,7,8,9],i=[1,2,e,4,5,6,7,8,9],a=[9,8,7,6,5,4,n,2,1],r=[9,8,7,6,5,4,e,2,1],u=new I(t,e,n,o,i,Float32Array),l=new I(t,e,n,a,r,Float32Array);u.attach_to_context(s),l.attach_to_context(s);const c=new de(l,u);c.attach_to_context(s),c.run();const h=await l.pull_data();console.log("got result",h),console.log("outputDB",l)}const Sn=Object.freeze(Object.defineProperty({__proto__:null,do_combine:me},Symbol.toStringTag,{value:"Module"})),Q=`
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
`,ge=`
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
}`;class Pn extends b{constructor(t,e,n){super(),this.in_hw=t,this.out_hw=e,this.offset=n,this.buffer_size=6*Int32Array.BYTES_PER_ELEMENT}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Uint32Array(e);n.set(this.in_hw),n.set(this.out_hw,2),new Int32Array(e).set(this.offset,4)}}class dt extends S{constructor(t,e,n){super();const o=[t.height,t.width],i=[e.height,e.width];this.parameters=new Pn(o,i,n),this.from_hw=o,this.to_hw=i,this.offset=n,this.source=t,this.target=e}change_offset(t){this.offset=t,this.parameters.offset=t,this.parameters.push_buffer()}get_shader_module(t){const e=Q+ge;return t.device.createShaderModule({code:e})}getWorkgroupCounts(){return[Math.ceil(this.source.size/256),1,1]}}const Dn=Object.freeze(Object.defineProperty({__proto__:null,PastePanel:dt},Symbol.toStringTag,{value:"Module"}));function ve(){console.log("pasting asyncronously"),(async()=>await On())()}async function On(){debugger;const s=new j;await s.connect();const t=new z(2,2),e=new z(3,3);t.attach_to_context(s),e.attach_to_context(s);const n=new Uint32Array([10,20,30,40]);t.push_buffer(n);const o=new Uint32Array([1,2,3,4,5,6,7,8,9]);e.push_buffer(o);const i=new dt(t,e,[1,0]);i.attach_to_context(s),i.run();const a=await e.pull_buffer();console.log("got result",a)}const En=Object.freeze(Object.defineProperty({__proto__:null,do_paste:ve},Symbol.toStringTag,{value:"Module"}));function be(s){console.log("pasting asyncronously"),Vn(Gn(s))}function Vn(s){(async()=>await s)()}async function Gn(s){debugger;const t=new j;await t.connect();const e=100,n=1e3,o=new z(e,e),i=new z(n,n),a=new z(n,n);o.attach_to_context(t),i.attach_to_context(t),a.attach_to_context(t);const r=new Uint8Array(e*e),u=e/2;for(var l=0;l<e;l++)for(var c=0;c<e;c++){const $=l*e+c;r[$]=(Math.abs(u-l)+Math.abs(u-c))*10%255}const h=it(r);await o.push_buffer(h);const p=new Uint8Array(n*n),f=n/2;for(var l=0;l<n;l++)for(var c=0;c<n;c++){const K=l*n+c;p[K]=(255-2*(Math.abs(f-l)+Math.abs(f-c)))%255}const d=it(p);await i.push_buffer(d);const g=new dt(i,a,[0,0]);g.attach_to_context(t),g.run();const w=f-u,k=new dt(o,a,[w,w]);k.attach_to_context(t),k.run();const y=new st(a,s);y.attach_to_context(t),y.run();const v=s.getBoundingClientRect(),D=document.getElementById("info");D.textContent="initial paste done.";const tt=function($){const bt=$.pageX,K=$.pageY,_t=v.width/2+v.left,yt=v.height/2+v.top,xt=bt-_t,Gt=-(K-yt),At=xt*2/v.width,Lt=Gt*2/v.height,Tt=.5*(n*(Lt+1)),To=.5*(n*(At+1)),Ue=[Tt-u,To-u];D.textContent="offset: "+Ue,k.change_offset(Ue),g.run(),k.run(),y.run()};s.addEventListener("mousemove",tt)}const An=Object.freeze(Object.defineProperty({__proto__:null,do_mouse_paste:be},Symbol.toStringTag,{value:"Module"}));function ye(){console.log("computing sample asyncronously"),(async()=>await Ln())()}async function Ln(){const s=new j;await s.connect();const t=new z(3,3),e=new z(3,3);t.attach_to_context(s),e.attach_to_context(s);const n=new Float32Array([1,2,3,4,5,6,7,8,9]);t.push_buffer(n);const o=new Pt(t,e,0,10);o.attach_to_context(s),o.run();const i=await e.pull_buffer();console.log("got result",i)}const Tn=Object.freeze(Object.defineProperty({__proto__:null,do_gray:ye},Symbol.toStringTag,{value:"Module"}));function xe(){console.log("computing sample asyncronously"),(async()=>await qn())()}async function qn(){debugger;const s=new j;await s.connect();const t=[2,3],e=-100,n=-100,o=null,i=null,a=new I(t,e,n,o,i,Float32Array),r=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],u=[2,3,2],l=[30,1,2,3,4,5,6,7,8,9,10,11],c=new ot(u,l,r,Float32Array);c.attach_to_context(s),a.attach_to_context(s),console.log("inputVolume",c);const h=new Mt(c,a,r);h.attach_to_context(s),h.run();const p=await a.pull_data();console.log("got result",p),console.log("outputDB",a)}const Un=Object.freeze(Object.defineProperty({__proto__:null,do_max_projection:xe},Symbol.toStringTag,{value:"Module"}));class R{constructor(t,e,n,o){this.canvas=t,this.center=e,this.center?(this.minus_center=E(-1,this.center),this.center_to_originM=x(null,this.minus_center),this.origin_to_centerM=x(null,this.center)):(this.minus_center=null,this.center_to_originM=null,this.origin_to_centerM=null),this.initial_rotation=n||M(3),this.bounding_rect=t.getBoundingClientRect(),this.callbacks=[],o&&this.add_callback(o),this.attach_listeners_to(t),this.active=!1,this.current_rotation=m(M(3),this.initial_rotation),this.next_rotation=this.current_rotation,this.last_stats=null}attach_listeners_to(t){const e=this;t.addEventListener("pointerdown",function(n){e.pointerdown(n)}),t.addEventListener("pointermove",function(n){e.pointermove(n)}),t.addEventListener("pointerup",function(n){e.pointerup(n)}),t.addEventListener("pointercancel",function(n){e.pointerup(n)}),t.addEventListener("pointerout",function(n){e.pointerup(n)}),t.addEventListener("pointerleave",function(n){e.pointerup(n)})}pointerdown(t){this.active=!0,this.last_stats=this.event_stats(t)}pointermove(t){this.active&&this.do_rotation(t)}pointerup(t){this.active&&(this.do_rotation(t),this.active=!1,this.current_rotation=this.next_rotation)}do_rotation(t){const e=this.last_stats,n=this.event_stats(t);this.next_stats=n;const o=1,i=o*(n.dx-e.dx),a=o*(n.dy-e.dy),r=Math.PI/2,u=r*i,l=r*a,c=jt(u),h=wt(l),p=m(this.current_rotation,m(c,h));this.next_rotation=p;const f=x(p);var d=f;this.center&&(d=m(m(this.origin_to_centerM,f),this.center_to_originM));for(var g of this.callbacks)g(d)}event_stats(t){const e=this.bounding_rect,n=t.pageX,o=t.pageY,i=e.width/2+e.left,a=e.height/2+e.top,r=n-i,u=-(o-a),l=r*2/e.width,c=u*2/e.height;return{px:n,py:o,cx:i,cy:a,offsetx:r,offsety:u,dx:l,dy:c}}add_callback(t){this.callbacks.push(t)}}const In=Object.freeze(Object.defineProperty({__proto__:null,Orbiter:R},Symbol.toStringTag,{value:"Module"}));function we(s,t,e,n){console.log("computing sample asyncronously"),(async()=>await Fn(s,t,e,n))()}var rt,Dt,H,mt;function Cn(s){const[t,e,n]=H,o=Math.max(t,e,n),i=x(null,[-o,-o,-o]),a=m(s,i);rt.change_matrix(a),Dt.run()}async function Fn(s,t,e,n){debugger;t=t||"./mri.bin",mt=[[0,0,-1],[1,0,0],[0,-1,0]],new R(s,null,mt,Cn);const o=new j;await o.connect();const r=await(await(await fetch(t)).blob()).arrayBuffer();console.log("buffer",r);const u=new Float32Array(r);console.log("f32",u),H=u.slice(0,3),console.log("shape_in",H);const[l,c,h]=H;e&&(e.max=3*l,e.min=-3*l);const p=Math.max(l,c,h),f=u.slice(3);var d=m(x(mt),x(null,[-p,-p,-p]));const g=M(4);g[1][1]=-1;const w=x(null,[-l/2,-c/2,-h/2]);var k=m(g,w);const y=o.volume(H,f,k,Float32Array);console.log("inputVolume",y);const v=[p*2,p*2],[D,tt]=v,K=o.depth_buffer(v,-100,-100,null,null,Float32Array);console.log("outputDB",K),rt=o.max_projection(y,K,d),console.log("project_action",rt);const _t=new z(tt,D);_t.attach_to_context(o);const yt=K.flatten_action(_t);yt.attach_to_context(o);const xt=o.panel(tt,D),Gt=y.min_value,At=y.max_value,Lt=o.to_gray_panel(_t,xt,Gt,At),Tt=o.paint(xt,s);Dt=o.sequence([rt,yt,Lt,Tt]),je(0,0,0,e,n)}function je(s,t,e,n,o){const i=Yt(s),a=wt(t),r=jt(e),u=m(m(i,a),r),[l,c,h]=H,p=Math.max(l,c,h);var f=-p;n&&(f=n.value),o&&(o.textContent=f);const d=m(x(mt),x(null,[-p,-p,f])),g=x(u),w=m(g,d);rt.change_matrix(w),Dt.run()}const Rn=Object.freeze(Object.defineProperty({__proto__:null,do_pipeline:we,do_rotation:je},Symbol.toStringTag,{value:"Module"}));class Ot{constructor(t,e){const[n,o,i]=t;this.shape=t,this.size=i*o*n;const a=e.length;if(this.size!=a)throw new Error(`data length ${a} doesn't match shape ${t}`);this.data=new Float32Array(e)}gpu_volume(t,e,n,o){e=e||1,n=n||1,o=o||1;const[i,a,r]=this.shape,u=Math.max(r,a,i),l=Math.max(o*r,n*a,e*i),c=u/l,h=[[c*e,0,0,0],[0,c*n,0,0],[0,0,c*o,0],[0,0,0,1]],f=m([[0,-1,0,0],[0,0,1,0],[1,0,0,0],[0,0,0,1]],h),d=x(null,[-i/2,-a/2,-r/2]),g=m(f,d);return t.volume(this.shape,this.data,g,Float32Array)}}function Nn(s){const t=s.slice(0,3),e=s.slice(3);return new Ot(t,e)}async function Wn(s,t){t=t||Float32Array;const e=await ze(s),n=new t(e);return Nn(n)}async function Yn(s,t,e=Float32Array){const n=await ze(t),o=new e(n);return new Ot(s,o)}async function ze(s){return await(await(await fetch(s)).blob()).arrayBuffer()}const $n=Object.freeze(Object.defineProperty({__proto__:null,Volume:Ot,fetch_volume:Yn,fetch_volume_prefixed:Wn},Symbol.toStringTag,{value:"Module"})),ke=`
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
}`;class Kn extends b{constructor(t,e,n){super(),this.lower_bound=t,this.upper_bound=e,this.do_values=n,this.buffer_size=4*Int32Array.BYTES_PER_ELEMENT}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Uint32Array(e),o=new Float32Array(e);o[0]=this.lower_bound,o[1]=this.upper_bound,n[2]=this.do_values}}class ut extends S{constructor(t,e,n,o,i){super(),this.source=t,this.target=e,this.parameters=new Kn(n,o,i)}change_bounds(t,e){this.parameters.lower_bound=t,this.parameters.upper_bound=e,this.parameters.push_buffer()}change_lower_bound(t){this.change_bounds(t,this.parameters.upper_bound)}change_upper_bound(t){this.change_bounds(this.parameters.lower_bound,t)}get_shader_module(t){const e=O+ke;return t.device.createShaderModule({code:e})}getWorkgroupCounts(){return[Math.ceil(this.source.size/256),1,1]}}const Jn=Object.freeze(Object.defineProperty({__proto__:null,DepthRange:ut},Symbol.toStringTag,{value:"Module"})),Me=`
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
}`;class Xn extends b{constructor(t,e,n){super(),this.in_hw=t,this.out_hw=e,this.default_color=n,this.buffer_size=6*Int32Array.BYTES_PER_ELEMENT}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Uint32Array(e);n.set(this.in_hw),n.set(this.out_hw,2),n[4]=this.default_color}}class gt extends S{constructor(t,e,n){super();const o=t.width;if(o!=1)throw new Error("indexed colors should have width 1: "+o);const i=[t.height,o],a=[e.height,e.width];this.parameters=new Xn(i,a,n),this.from_hw=i,this.to_hw=a,this.default_color=n,this.source=t,this.target=e}get_shader_module(t){const e=Q+Me;return t.device.createShaderModule({code:e})}getWorkgroupCounts(){return[Math.ceil(this.target.size/256),1,1]}}const Qn=Object.freeze(Object.defineProperty({__proto__:null,IndexColorizePanel:gt},Symbol.toStringTag,{value:"Module"}));class P extends V{constructor(t){super(),this.ofVolume=t,this.set_geometry()}async paint_on(t,e){const n=this.ofVolume.context;if(!n)throw new Error("Volume is not attached to GPU context.");if(this.canvas_paint_sequence(n,t),e){const o=this.get_orbiter_callback(),i=M(3);this.orbiter=new R(t,null,i,o)}this.run()}pick_on(t,e,n){n=n||"click";const o=new Kt(t),[i,a]=this.output_shape;this.panel_space=new Jt(i,a);const r=this;t.addEventListener(n,async function(u){const l=await r.pick(u,o);e&&e(l)})}async pick(t,e){const n=e.normalize_event_coords(t),i=this.panel_space.normalized2ij(n);var a=null;return this.output_panel&&(await this.output_panel.pull_buffer(),a=this.output_panel.color_at(i)),{normalized_coords:n,panel_coords:i,panel_color:a}}set_geometry(){const[t,e,n]=this.ofVolume.shape;this.MaxS=Math.max(t,e,n)*Math.sqrt(2);const o=Math.ceil(this.MaxS);this.output_shape=[o,o],this.initial_rotation=M(3),this.affine_translation=x(null,[-o/2,-o/2,-o/2]),this.projection_matrix=m(x(this.initial_rotation),this.affine_translation),this.space=new ct(this.projection_matrix)}canvas_paint_sequence(t,e){this.attach_to_context(t);const n=this.panel_sequence(t);this.output_panel=n.output_panel;const o=t.paint(n.output_panel,e);return this.paint_sequence=t.sequence([n.sequence,o]),this.paint_sequence}async run(){(this.paint_sequence||this.project_to_panel).run()}panel_sequence(t){throw new Error("panel_sequence must be defined in subclass.")}_orbiter_callback(t){const e=m(t,this.projection_matrix);this.change_matrix(e),this.run()}change_matrix(t){this.space=new ct(t)}get_orbiter_callback(){const t=this;return function(e){return t._orbiter_callback(e)}}orbit2xyz_v(t){return this.space.ijk2xyz_v(t)}xyz2volume_v(t){return this.ofVolume.space.xyz2ijk_v(t)}orbit2volume_v(t){return this.xyz2volume_v(this.orbit2xyz_v(t))}orbit_sample(t){const e=this.orbit2xyz_v(t),n=this.xyz2volume_v(e);var o=this.ofVolume.space.ijk2offset(n),i=null;return this.data&&o!==null&&(i=this.ofVolume.data[o]),{xyz:e,volume_indices:n,volume_offset:o,volume_sample:i}}get_output_depth_buffer(t,e,n,o){return e=e||-1e10,n=n||0,o=o||Float32Array,t=t||this.context,t.depth_buffer(this.output_shape,e,n,null,null,o)}get_output_panel(t){t=t||this.context;const[e,n]=this.output_shape;return t.panel(n,e)}get_gray_panel_sequence(t,e,n){const o=this.context,i=this.get_output_panel(o),a=t.flatten_action(i),r=this.get_output_panel(o),u=o.to_gray_panel(i,r,e,n);return{sequence:o.sequence([a,u]),output_panel:r}}}const Hn=Object.freeze(Object.defineProperty({__proto__:null,View:P},Symbol.toStringTag,{value:"Module"}));let Be=class extends P{async pick(t,e){const n=await super.pick(t,e),o=n.panel_coords;return await this.max_depth_buffer.pull_data(),n.maximum=this.max_depth_buffer.location(o,this.space,this.ofVolume),n}panel_sequence(t){t=t||this.context;const e=this.ofVolume;return this.min_value=e.min_value,this.max_value=e.max_value,this.max_depth_buffer=this.get_output_depth_buffer(t),this.max_panel=this.get_output_panel(t),this.grey_panel=this.get_output_panel(t),this.project_action=t.max_projection(e,this.max_depth_buffer,this.projection_matrix),this.flatten_action=this.flatten_action=this.max_depth_buffer.flatten_action(this.max_panel),this.gray_action=t.to_gray_panel(this.max_panel,this.grey_panel,this.min_value,this.max_value),this.project_to_panel=t.sequence([this.project_action,this.flatten_action,this.gray_action]),{sequence:this.project_to_panel,output_panel:this.grey_panel}}change_matrix(t){super.change_matrix(t),this.project_action.change_matrix(t)}};const Zn=Object.freeze(Object.defineProperty({__proto__:null,Max:Be},Symbol.toStringTag,{value:"Module"})),Se=`
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
}`;let to=class extends b{constructor(t,e,n){super(),this.in_hw=t,this.out_hw=e,this.ratios=n,this.buffer_size=8*Int32Array.BYTES_PER_ELEMENT}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Uint32Array(e);new Float32Array(e).set(this.ratios,0),n.set(this.in_hw,4),n.set(this.out_hw,6)}};class vt extends S{constructor(t,e,n){super();const o=[t.height,t.width],i=[e.height,e.width];if(o[0]!=i[0]||o[0]!=i[0])throw new Error("Mixed panels to have same shape: "+o+" :: "+i);for(var a of n)if(a>1||a<0)throw new Error("Invalid ratio: "+a);this.parameters=new to(o,i,n),this.from_hw=o,this.to_hw=i,this.ratios=n,this.source=t,this.target=e}change_ratio(t){this.ratios=[t,t,t,t],this.parameters.ratios=this.ratios,this.parameters.push_buffer()}get_shader_module(t){const e=Q+Se;return t.device.createShaderModule({code:e})}getWorkgroupCounts(){return[Math.ceil(this.source.size/256),1,1]}}class Et extends vt{constructor(t,e,n){const o=[n,n,n,n];super(t,e,o)}}const eo=Object.freeze(Object.defineProperty({__proto__:null,MixPanels:Et,MixPanelsRatios:vt},Symbol.toStringTag,{value:"Module"})),Pe=`
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
}`;class no extends b{constructor(t){super(),this.ratios=t,this.buffer_size=4*Int32Array.BYTES_PER_ELEMENT}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange();new Float32Array(e).set(this.ratios,0)}}class Vt extends S{constructor(t,e,n){super(),this.source=t,this.target=e,this.ratios=n,this.parameters=new no(n)}change_ratio(t){this.ratios=[t,t,t,t],this.parameters.ratios=this.ratios,this.parameters.push_buffer()}get_shader_module(t){const e=Q+O+Pe;return t.device.createShaderModule({code:e})}getWorkgroupCounts(){return[Math.ceil(this.target.size/256),1,1]}}const oo=Object.freeze(Object.defineProperty({__proto__:null,MixDepthBuffers:Vt},Symbol.toStringTag,{value:"Module"})),De=`
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
`;class io extends b{constructor(t,e){super(),this.in_hw=t,this.n_dots=e,this.buffer_size=4*Int32Array.BYTES_PER_ELEMENT}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Uint32Array(e);n.set(this.in_hw,0),n.set([this.n_dots],2)}change_n_dots(t){this.n_dots=t,this.push_buffer()}}class Oe{constructor(t,e,n,o){this.position=t,this.radius=e,this.u32color=n,this.ratios=o}put_on_panel(t,e,n){const o=t*8;e.set(this.ratios,o),e.set(this.position,o+4),e.set([this.radius],o+6),n.set([this.u32color],o+7)}}class Ee extends z{constructor(t){super(8,t),this.dots=[],this.max_ndots=t}add_dot(t,e,n,o){const i=new Oe(t,e,n,o);if(this.dots.length>=this.max_ndots)throw new Error("Too many dots: "+this.dots.length);this.dots.push(i)}clear(){this.dots=[]}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Uint32Array(e),o=new Float32Array(e);for(var i=0;i<this.dots.length;i++)this.dots[i].put_on_panel(i,o,n)}}class Ve extends S{constructor(t,e){super(),this.on_panel=t,this.max_ndots=e,this.dots_panel=new Ee(e);const n=[t.height,t.width];this.parameters=new io(n,0),this.source=this.dots_panel,this.target=t}get_shader_module(t){const e=Q+De;return t.device.createShaderModule({code:e})}ndots(){return this.dots_panel.dots.length}push_dots(){this.parameters.change_n_dots(this.ndots()),this.dots_panel.push_buffer()}add_pass(t){this.ndots()<1||super.add_pass(t)}getWorkgroupCounts(){const t=this.ndots();return[Math.ceil(t/256),1,1]}clear(t=!1){this.dots_panel.clear(),t||this.push_dots()}add_dot(t,e,n,o){this.dots_panel.add_dot(t,e,n,o)}}const so=Object.freeze(Object.defineProperty({__proto__:null,ColoredDot:Oe,DotsPanel:Ee,MixDotsOnPanel:Ve},Symbol.toStringTag,{value:"Module"})),Ge=`
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
`;class ao extends b{constructor(t,e,n){super(),this.volume=e,this.threshold_value=n,this.buffer_size=(4*4+4*3+4)*Int32Array.BYTES_PER_ELEMENT,this.set_matrix(t)}set_matrix(t){this.ijk2xyz=q(t),this.intersections=kt(t,this.volume)}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Float32Array(e);n.set(this.ijk2xyz,0),n.set(this.intersections,4*4),n[4*4+3*4+1]=this.threshold_value}}class N extends at{constructor(t,e,n,o){super(t,e),this.threshold_value=o,this.parameters=new ao(n,t,o)}change_threshold(t){this.threshold_value=t,this.parameters.threshold_value=t,this.parameters.push_buffer()}get_shader_module(t){const e=U+O+ht+Ge;return t.device.createShaderModule({code:e})}}const ro=Object.freeze(Object.defineProperty({__proto__:null,ThresholdProject:N},Symbol.toStringTag,{value:"Module"})),Ae=`
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
}`;class uo extends b{constructor(t,e){super(),this.set_matrix(t),this.default_value=e,this.buffer_size=(4*4+4)*Int32Array.BYTES_PER_ELEMENT}set_matrix(t){this.ijk2xyz=q(t)}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Float32Array(e);n.set(this.ijk2xyz,0),n[4*4]=this.default_value}}class W extends at{constructor(t,e,n,o){super(t,e),this.default_value=o,this.parameters=new uo(n,o)}get_shader_module(t){const e=U+O+Ae;return t.device.createShaderModule({code:e})}}const _o=Object.freeze(Object.defineProperty({__proto__:null,NormalColorize:W},Symbol.toStringTag,{value:"Module"})),Le=`
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
}`,lo=new Float32Array([.43855053,.03654588,.0151378,.02006508]);class co extends b{constructor(t){super(),t=t||lo,this.offset_weights=t,this.buffer_size=4*Int32Array.BYTES_PER_ELEMENT}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange();new Float32Array(e).set(this.offset_weights,0)}}class Z extends S{constructor(t,e,n){super(),this.source=t,this.target=e,this.offset_weights=n,this.parameters=new co(this.offset_weights)}get_shader_module(t){const e=U+Le;return t.device.createShaderModule({code:e})}getWorkgroupCounts(){const t=this.target.shape[2];return[Math.ceil(this.target.size/t/256),1,1]}}const ho=Object.freeze(Object.defineProperty({__proto__:null,SoftenVolume:Z},Symbol.toStringTag,{value:"Module"}));class Te extends P{constructor(t,e,n){super(t),this.indexed_colors=e,this.ratio=n}async run(){await this.colors_promise,super.run()}panel_sequence(t){t=t||this.context;const e=this.ofVolume;this.soft_volume=e.same_geometry(t),this.depth_buffer=this.get_output_depth_buffer(t),this.index_panel=this.get_output_panel(t),this.output_panel=this.get_output_panel(t),this.threshold_value=.5;const n=this.indexed_colors.length;this.color_panel=t.panel(1,n),this.colors_promise=this.color_panel.push_buffer(this.indexed_colors),this.project_action=new N(e,this.depth_buffer,this.projection_matrix,this.threshold_value),this.project_action.attach_to_context(t),this.index_flatten=this.depth_buffer.flatten_action(this.index_panel),this.soften_action=new Z(e,this.soft_volume,null),this.soften_action.attach_to_context(t);const o=0;return this.normal_colorize_action=new W(this.soft_volume,this.depth_buffer,this.projection_matrix,o),this.normal_colorize_action.attach_to_context(t),this.flatten_normals=this.depth_buffer.flatten_action(this.output_panel),this.index_colorize=new gt(this.color_panel,this.index_panel,o),this.index_colorize.attach_to_context(t),this.mix_action=new Et(this.index_panel,this.output_panel,this.ratio),this.mix_action.attach_to_context(t),this.project_to_panel=t.sequence([this.project_action,this.index_flatten,this.soften_action,this.normal_colorize_action,this.index_colorize,this.flatten_normals,this.mix_action]),{sequence:this.project_to_panel,output_panel:this.output_panel}}change_matrix(t){this.project_action.change_matrix(t),this.normal_colorize_action.change_matrix(t)}change_ratio(t){this.mix_action.change_ratio(t),this.run()}}const po=Object.freeze(Object.defineProperty({__proto__:null,Mix:Te},Symbol.toStringTag,{value:"Module"})),qe=`

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
`;class fo extends b{constructor(t,e){super(),this.depth=e,this.buffer_size=(4*4+4)*Int32Array.BYTES_PER_ELEMENT,this.set_matrix(t)}set_matrix(t){this.ijk2xyz=q(t)}load_buffer(t){t=t||this.gpu_buffer;const e=t.getMappedRange(),n=new Float32Array(e);n.set(this.ijk2xyz,0),n.set([this.depth],4*4)}change_depth(t){this.depth=t,this.push_buffer()}}class Y extends at{constructor(t,e,n,o){super(t,e),this.parameters=new fo(n,o)}get_shader_module(t){const e=U+O+ht+qe;return t.device.createShaderModule({code:e})}change_depth(t){this.parameters.change_depth(t)}}const mo=Object.freeze(Object.defineProperty({__proto__:null,VolumeAtDepth:Y},Symbol.toStringTag,{value:"Module"}));class go extends P{constructor(t,e,n,o){super(t),this.segmentationVolume=t,this.intensityVolume=e,this.range_callback=o,this.indexed_colors=n}async paint_on(t,e){throw new Error("SegmentationQuad.paint_on not implemented.")}async paint_on_canvases(t,e,n,o,i){const a=this.ofVolume.context;if(!a)throw new Error("Volume is not attached to GPU context.");this.attach_to_context(a);const r=this.panel_sequence(a),u=a.paint(r.seg_slice_panel,t),l=a.paint(r.max_panel,e),c=a.paint(r.intensity_slice_panel,n),h=a.paint(r.shaded_panel,o);if(this.paint_sequence=a.sequence([r.sequence,u,l,c,h]),i){const p=this.get_orbiter_callback(),f=M(3);this.orbiter=new R(o,null,f,p),this.orbiter.attach_listeners_to(e),this.orbiter.attach_listeners_to(n),this.orbiter.attach_listeners_to(t)}this.run()}async change_volumes(t,e){this.segmentationVolume.set_data(t.data),this.segmentationVolume.push_buffer(),this.intensityVolume.set_data(e.data),this.intensityVolume.push_buffer(),this.run()}panel_sequence(t){t=t||this.context,this.min_value=this.intensityVolume.min_value,this.max_value=this.intensityVolume.max_value,this.change_range(this.projection_matrix),this.current_depth=(this.min_depth+this.max_depth)/2;const e=[],n=new Be(this.intensityVolume);this.maxView=n,n.attach_to_context(t);const o=n.panel_sequence(t);e.push(o.sequence),this.slice_depth_buffer=this.get_output_depth_buffer(t),this.slice_value_panel=this.get_output_panel(t),this.slice_gray_panel=this.get_output_panel(t),this.slice_project_action=new Y(this.intensityVolume,this.slice_depth_buffer,this.projection_matrix,this.current_depth),this.slice_project_action.attach_to_context(t),e.push(this.slice_project_action),this.slice_flatten_action=this.slice_depth_buffer.flatten_action(this.slice_value_panel),e.push(this.slice_flatten_action),this.slice_gray_action=t.to_gray_panel(this.slice_value_panel,this.slice_gray_panel,this.min_value,this.max_value),e.push(this.slice_gray_action);const i=.7,a=new Te(this.segmentationVolume,this.indexed_colors,i);a.attach_to_context(t),this.mixView=a;const r=a.panel_sequence(t);e.push(r.sequence),this.segmentation_depth_buffer=this.get_output_depth_buffer(t),this.segmentation_value_panel=this.get_output_panel(t),this.segmentation_color_panel=this.get_output_panel(t),this.segmentation_project_action=new Y(this.segmentationVolume,this.segmentation_depth_buffer,this.projection_matrix,this.current_depth),this.segmentation_project_action.attach_to_context(t),e.push(this.segmentation_project_action),this.segmentation_flatten_action=this.segmentation_depth_buffer.flatten_action(this.segmentation_value_panel),e.push(this.segmentation_flatten_action);const u=0;return this.indexed_colorize=new gt(a.color_panel,this.segmentation_value_panel,u),this.indexed_colorize.attach_to_context(t),e.push(this.indexed_colorize),this.project_to_panel=t.sequence(e),{sequence:this.project_to_panel,seg_slice_panel:this.segmentation_value_panel,max_panel:o.output_panel,intensity_slice_panel:this.slice_gray_panel,shaded_panel:r.output_panel}}async pick(t,e){const n=await super.pick(t,e),o=n.panel_coords;return await this.maxView.max_depth_buffer.pull_data(),n.maximum=this.maxView.max_depth_buffer.location(o,this.space,this.intensityVolume),await this.slice_depth_buffer.pull_data(),n.intensity_slice=this.slice_depth_buffer.location(o,this.space,this.intensityVolume),await this.mixView.depth_buffer.pull_data(),n.segmentation=this.mixView.depth_buffer.location(o,this.space,this.segmentationVolume),await this.segmentation_depth_buffer.pull_data(),n.segmentation_slice=this.segmentation_depth_buffer.location(o,this.space,this.segmentationVolume),n}change_depth(t){this.current_depth=t,this.slice_project_action.change_depth(t),this.segmentation_project_action.change_depth(t),this.run()}change_matrix(t){super.change_matrix(t),this.maxView.change_matrix(t),this.slice_project_action.change_matrix(t),this.segmentation_project_action.change_matrix(t),this.mixView.change_matrix(t),this.change_range(t)}change_range(t){const n=this.ofVolume.projected_range(t,!0);this.min_depth=n.min[2],this.max_depth=n.max[2],this.range_callback&&this.range_callback(this.min_depth,this.max_depth)}}const vo=Object.freeze(Object.defineProperty({__proto__:null,SegmentationQuad:go},Symbol.toStringTag,{value:"Module"}));class bo extends P{constructor(t,e,n,o){super(t),this.threshold_value=e,this.debugging=n,this.range_callback=o}change_threshold(t){this.project_action.change_threshold(t),this.run()}async run(){if(await this.soften_promise,super.run(),this.debugging){await this.context.onSubmittedWorkDone(),this.threshold_depth_buffer.pull_data(),this.level_depth_buffer.pull_data(),this.level_clone_depth_buffer.pull_data(),this.front_depth_buffer.pull_data(),this.back_depth_buffer.pull_data(),this.output_depth_buffer.pull_data(),await this.context.onSubmittedWorkDone();debugger}}panel_sequence(t){t=t||this.context;const e=this.ofVolume;this.min_value=e.min_value,this.max_value=e.max_value,this.change_range(this.projection_matrix),this.soft_volume=e.same_geometry(t),this.soften_action=new Z(e,this.soft_volume,null),this.soften_action.attach_to_context(t),this.soften_action.run(),this.soften_promise=t.onSubmittedWorkDone(),this.threshold_depth_buffer=this.get_output_depth_buffer(t),this.threshold_value=this.threshold_value||(e.min_value+e.max_value)/2,this.project_action=new N(e,this.threshold_depth_buffer,this.projection_matrix,this.threshold_value),this.project_action.attach_to_context(t);const n=0;this.normal_colorize_action=new W(this.soft_volume,this.threshold_depth_buffer,this.projection_matrix,n),this.normal_colorize_action.attach_to_context(t);const i=e.projected_range(this.projection_matrix,!0);this.current_depth=(i.max[2]+i.min[2])/2,this.level_depth_buffer=this.get_output_depth_buffer(t),this.level_project_action=new Y(e,this.level_depth_buffer,this.projection_matrix,this.current_depth),this.level_project_action.attach_to_context(t),this.level_clone_operation=this.level_depth_buffer.clone_operation(),this.clone_level_action=this.level_clone_operation.clone_action,this.level_clone_depth_buffer=this.level_clone_operation.clone,this.level_gray_action=new _e(this.level_depth_buffer,this.level_clone_depth_buffer,e.min_value,e.max_value),this.level_gray_action.attach_to_context(t),this.front_depth_buffer=this.get_output_depth_buffer(t);const a=-1e11;this.slice_front_action=new ut(this.threshold_depth_buffer,this.front_depth_buffer,a,this.current_depth,0),this.slice_front_action.attach_to_context(t),this.back_depth_buffer=this.get_output_depth_buffer(t);const r=1e11;return this.slice_back_action=new ut(this.threshold_depth_buffer,this.back_depth_buffer,this.current_depth,r,0),this.slice_back_action.attach_to_context(t),this.back_level_ratios=[.5,.5,.5,1],this.mix_back_level_action=new Vt(this.back_depth_buffer,this.level_clone_depth_buffer,this.back_level_ratios),this.mix_back_level_action.attach_to_context(t),this.output_clone_operation=this.front_depth_buffer.clone_operation(),this.output_clone_action=this.output_clone_operation.clone_action,this.output_depth_buffer=this.output_clone_operation.clone,this.combine_ratios=[.5,.5,.5,1],this.combine_action=new Vt(this.level_clone_depth_buffer,this.output_depth_buffer,this.combine_ratios),this.combine_action.attach_to_context(t),this.panel=this.get_output_panel(t),this.flatten_action=this.output_depth_buffer.flatten_action(this.panel),this.project_to_panel=t.sequence([this.project_action,this.normal_colorize_action,this.level_project_action,this.clone_level_action,this.level_gray_action,this.slice_front_action,this.slice_back_action,this.mix_back_level_action,this.output_clone_action,this.combine_action,this.flatten_action]),{sequence:this.project_to_panel,output_panel:this.panel}}change_matrix(t){super.change_matrix(t),this.project_action.change_matrix(t),this.normal_colorize_action.change_matrix(t),this.level_project_action.change_matrix(t),this.change_range(t),this.update_levels()}change_range(t){debugger;const n=this.ofVolume.projected_range(t,!0);this.min_depth=n.min[2],this.max_depth=n.max[2],this.range_callback&&this.range_callback(this.min_depth,this.max_depth)}change_depth(t){this.current_depth=t}update_levels(){this.level_project_action.change_depth(this.current_depth),this.slice_front_action.change_bounds(this.min_depth,this.current_depth),this.slice_back_action.change_bounds(this.current_depth,this.max_depth)}}const yo=Object.freeze(Object.defineProperty({__proto__:null,SlicedThreshold:bo},Symbol.toStringTag,{value:"Module"}));class xo extends P{constructor(t,e){super(t),this.soften=e}async run(){this.soften&&await this.soften_promise,super.run()}panel_sequence(t){t=t||this.context;const e=this.ofVolume;this.depth_buffer=this.get_output_depth_buffer(t),this.panel=this.get_output_panel(t),this.min_value=e.min_value,this.max_value=e.max_value,this.threshold_value=(e.min_value+e.max_value)/2;var n=e;this.soften&&(this.soft_volume=e.same_geometry(t),this.soften_action=new Z(e,this.soft_volume,null),this.soften_action.attach_to_context(t),this.soften_action.run(),this.soften_promise=t.onSubmittedWorkDone(),n=this.soft_volume),this.project_action=new N(n,this.depth_buffer,this.projection_matrix,this.threshold_value),this.project_action.attach_to_context(t);const o=0;return this.colorize_action=new W(e,this.depth_buffer,this.projection_matrix,o),this.colorize_action.attach_to_context(t),this.flatten_action=this.depth_buffer.flatten_action(this.panel),this.project_to_panel=t.sequence([this.project_action,this.colorize_action,this.flatten_action]),{sequence:this.project_to_panel,output_panel:this.panel}}change_matrix(t){super.change_matrix(t),this.project_action.change_matrix(t),this.colorize_action.change_matrix(t)}change_threshold(t){this.project_action.change_threshold(t),this.run()}}const wo=Object.freeze(Object.defineProperty({__proto__:null,Threshold:xo},Symbol.toStringTag,{value:"Module"}));class jo extends P{constructor(t,e){super(t),this.range_callback=e,this.colorize=0}async run(){await this.soften_promise,super.run()}async paint_on(t,e){throw new Error("Triptych.paint_on not implemented.")}async set_colorize(t){t?this.colorize=1:this.colorize=0,await this.max_gray_action.change_colorize(this.colorize),await this.slice_gray_action.change_colorize(this.colorize),this.run()}async paint_on_canvases(t,e,n,o){const i=this.ofVolume.context;if(!i)throw new Error("Volume is not attached to GPU context.");this.attach_to_context(i);const a=this.panel_sequence(i),r=i.paint(a.iso_output_panel,t),u=i.paint(a.max_output_panel,e),l=i.paint(a.slice_output_panel,n);if(this.paint_sequence=i.sequence([a.sequence,r,u,l]),o){const c=this.get_orbiter_callback(),h=M(3);this.orbiter=new R(n,null,h,c),this.orbiter.attach_listeners_to(t),this.orbiter.attach_listeners_to(e)}this.run()}async pick(t,e){const n=await super.pick(t,e),o=n.panel_coords;return await this.slice_depth_buffer.pull_data(),n.slice_depth=this.slice_depth_buffer.location(o,this.space,this.ofVolume),await this.max_depth_buffer.pull_data(),n.max_depth=this.max_depth_buffer.location(o,this.space,this.ofVolume),await this.threshold_depth_buffer.pull_data(),n.threshold_depth=this.threshold_depth_buffer.location(o,this.space,this.ofVolume),n}panel_sequence(t){debugger;t=t||this.context;const e=[],n=this.ofVolume;this.min_value=n.min_value,this.max_value=n.max_value,this.change_range(this.projection_matrix),this.current_depth=(this.min_depth+this.max_depth)/2,this.soft_volume=n.same_geometry(t),this.soften_action=new Z(n,this.soft_volume,null),this.soften_action.attach_to_context(t),this.soften_action.run(),this.soften_promise=t.onSubmittedWorkDone(),this.threshold_depth_buffer=this.get_output_depth_buffer(t),this.threshold_value=(n.min_value+n.max_value)/2,this.soft_volume,this.threshold_project_action=new N(n,this.threshold_depth_buffer,this.projection_matrix,this.threshold_value),this.threshold_project_action.attach_to_context(t),e.push(this.threshold_project_action);const o=0;this.colorize_action=new W(this.soft_volume,this.threshold_depth_buffer,this.projection_matrix,o),this.colorize_action.attach_to_context(t),e.push(this.colorize_action),this.iso_panel=this.get_output_panel(t),this.iso_flatten_action=this.threshold_depth_buffer.flatten_action(this.iso_panel),e.push(this.iso_flatten_action),this.max_depth_buffer=this.get_output_depth_buffer(t),this.max_value=n.max_value,this.max_project_action=t.max_projection(n,this.max_depth_buffer,this.projection_matrix),e.push(this.max_project_action),this.max_panel=this.get_output_panel(t),this.max_flatten_action=this.max_depth_buffer.flatten_action(this.max_panel),e.push(this.max_flatten_action),this.max_gray_panel=this.get_output_panel(t);let i=this.colorize;debugger;return this.max_gray_action=t.to_gray_panel(this.max_panel,this.max_gray_panel,this.min_value,this.max_value,i),e.push(this.max_gray_action),this.slice_depth_buffer=this.get_output_depth_buffer(t),this.slice_value_panel=this.get_output_panel(t),this.slice_gray_panel=this.get_output_panel(t),this.slice_project_action=new Y(n,this.slice_depth_buffer,this.projection_matrix,this.current_depth),this.slice_project_action.attach_to_context(t),e.push(this.slice_project_action),this.slice_flatten_action=this.slice_depth_buffer.flatten_action(this.slice_value_panel),e.push(this.slice_flatten_action),this.slice_gray_action=t.to_gray_panel(this.slice_value_panel,this.slice_gray_panel,this.min_value,this.max_value,i),e.push(this.slice_gray_action),this.slice_output_panel=this.slice_gray_panel,this.max_output_panel=this.max_gray_panel,this.iso_output_panel=this.iso_panel,this.project_to_panel=t.sequence(e),{sequence:this.project_to_panel,iso_output_panel:this.iso_panel,max_output_panel:this.max_gray_panel,slice_output_panel:this.slice_gray_panel}}change_threshold(t){this.threshold_value=t,this.threshold_project_action.change_threshold(t),this.run()}change_matrix(t){super.change_matrix(t),this.threshold_project_action.change_matrix(t),this.colorize_action.change_matrix(t),this.max_project_action.change_matrix(t),this.slice_project_action.change_matrix(t),this.change_range(t)}change_depth(t){this.slice_project_action.change_depth(t),this.current_depth=t,this.run()}change_range(t){const n=this.ofVolume.projected_range(t,!0);this.min_depth=n.min[2],this.max_depth=n.max[2],this.range_callback&&this.range_callback(this.min_depth,this.max_depth)}}const zo=Object.freeze(Object.defineProperty({__proto__:null,Triptych:jo},Symbol.toStringTag,{value:"Module"}));class ko extends P{async pick(t,e){const n=await super.pick(t,e),o=n.panel_coords;return await this.max_depth_buffer.pull_data(),n.maximum=this.max_depth_buffer.location(o,this.space,this.ofVolume),n}panel_sequence(t){t=t||this.context;const e=this.ofVolume;this.min_value=e.min_value,this.max_value=e.max_value,this.max_depth_buffer=this.get_output_depth_buffer(t),this.max_panel=this.get_output_panel(t),this.grey_panel=this.get_output_panel(t),this.project_action=t.max_projection(e,this.max_depth_buffer,this.projection_matrix),this.flatten_action=this.flatten_action=this.max_depth_buffer.flatten_action(this.max_panel),this.gray_action=t.to_gray_panel(this.max_panel,this.grey_panel,this.min_value,this.max_value);const n=1e3;return this.dots_action=new Ve(this.grey_panel,n),this.dots_action.attach_to_context(t),this.project_to_panel=t.sequence([this.project_action,this.flatten_action,this.gray_action,this.dots_action]),{sequence:this.project_to_panel,output_panel:this.grey_panel}}change_matrix(t){super.change_matrix(t),this.project_action.change_matrix(t)}}const Mo=Object.freeze(Object.defineProperty({__proto__:null,Max:ko},Symbol.toStringTag,{value:"Module"}));class Bo extends P{panel_sequence(t){t=t||this.context;const e=this.ofVolume;this.min_value=e.min_value,this.max_value=e.max_value;const n=[0,0,0,1],o=T(this.projection_matrix),i=L(o,n);return this.current_depth=i[2],this.max_depth_buffer=this.get_output_depth_buffer(t),this.max_project_action=t.max_projection(e,this.max_depth_buffer,this.projection_matrix),this.level_depth_buffer=this.get_output_depth_buffer(t),this.level_project_action=new Y(e,this.level_depth_buffer,this.projection_matrix,this.current_depth),this.level_project_action.attach_to_context(t),this.front_depth_buffer=this.get_output_depth_buffer(t),this.slice_front_action=new ut(this.max_depth_buffer,this.front_depth_buffer,this.min_value,this.current_depth,0),this.slice_front_action.attach_to_context(t),this.back_depth_buffer=this.get_output_depth_buffer(t),this.slice_back_action=new ut(this.max_depth_buffer,this.back_depth_buffer,this.current_depth,this.max_value,0),this.slice_back_action.attach_to_context(t),this.front_to_gray=this.get_gray_panel_sequence(this.front_depth_buffer,this.min_value,this.max_value),this.back_to_gray=this.get_gray_panel_sequence(this.back_depth_buffer,this.min_value,this.max_value),this.level_to_gray=this.get_gray_panel_sequence(this.level_depth_buffer,this.min_value,this.max_value),this.back_level_ratios=[.9,.9,.5,0],this.mix_back_and_level=new vt(this.level_to_gray.output_panel,this.back_to_gray.output_panel,this.back_level_ratios),this.mix_back_and_level.attach_to_context(t),this.back_front_ratios=[0,.5,0,0],this.back_front_ratios=[0,.3,0,0],this.mix_back_and_front=new vt(this.front_to_gray.output_panel,this.back_to_gray.output_panel,this.back_front_ratios),this.mix_back_and_front.attach_to_context(t),this.output_panel=this.back_to_gray.output_panel,this.project_to_panel=t.sequence([this.max_project_action,this.level_project_action,this.slice_front_action,this.slice_back_action,this.front_to_gray.sequence,this.back_to_gray.sequence,this.level_to_gray.sequence,this.mix_back_and_level,this.mix_back_and_front]),{sequence:this.project_to_panel,output_panel:this.output_panel}}change_matrix(t){this.max_project_action.change_matrix(t),this.level_project_action.change_matrix(t),this.change_range(t)}change_depth(t){this.level_project_action.change_depth(t),this.slice_front_action.change_upper_bound(t),this.slice_back_action.change_lower_bound(t),this.run()}on_range_change(t){this.range_change_callback=t,this.change_range(this.projection_matrix)}change_range(t){const e=this.range_change_callback;if(e){const o=this.ofVolume.projected_range(t,!0),i=o.min[2],a=o.max[2];console.log("new range min",i,"max",a),this.slice_back_action.change_upper_bound(a),this.slice_front_action.change_lower_bound(i),e(i,a)}}}const So=Object.freeze(Object.defineProperty({__proto__:null,TestRangeView:Bo},Symbol.toStringTag,{value:"Module"}));class Po{constructor(t,e,n,o){o=o||.7,this.ratio=o,this.indexed_colors=new Uint32Array(e),this.canvas=n,this.volume_url=t,this.connect_future=this.connect(),this.volume_future=this.load()}async connect(){this.context=new j,await this.context.connect()}async load(){const t=this.context,o=await(await(await fetch(this.volume_url)).blob()).arrayBuffer();console.log("buffer",o);const i=new Uint32Array(o),a=new Float32Array(i);console.log("f32",a),this.volume_shape=a.slice(0,3),this.volume_content=a.slice(3);const[r,u,l]=this.volume_shape,c=M(4);c[1][1]=-1;const h=x(null,[-r/2,-u/2,-l/2]);this.volume_matrix=m(c,h);debugger;await this.connect_future,this.volume=t.volume(this.volume_shape,this.volume_content,this.volume_matrix,Float32Array),this.soft_volume=t.volume(this.volume_shape,null,this.volume_matrix,Float32Array),this.soften_action=new Z(this.volume,this.soft_volume,null),this.soften_action.attach_to_context(t),console.log("input Volume",this.volume),this.volume.min_value,this.volume.max_value;const p=this.indexed_colors.length;this.color_panel=t.panel(1,p);debugger;await this.color_panel.push_buffer(this.indexed_colors);const f=Math.max(r,u,l),d=Math.ceil(Math.sqrt(2)*f);this.output_shape=[d,d];const g=0,w=0;this.depth_buffer=t.depth_buffer(this.output_shape,g,w,null,null,Float32Array),this.threshold_value=.5,this.initial_rotation=[[0,0,1],[1,0,0],[0,1,0]],this.affine_translation=x(null,[-d/2,-d/2,-d]),this.projection_matrix=m(x(this.initial_rotation),this.affine_translation),this.project_action=new N(this.volume,this.depth_buffer,this.projection_matrix,this.threshold_value),this.project_action.attach_to_context(t);const[k,y]=this.output_shape;this.index_panel=t.panel(y,k),this.index_flatten=this.depth_buffer.flatten_action(this.index_panel);const v=0;this.index_colorize=new gt(this.color_panel,this.index_panel,v),this.index_colorize.attach_to_context(t),this.colorize_action=new W(this.soft_volume,this.depth_buffer,this.projection_matrix,v),this.colorize_action.attach_to_context(t),this.orbiter=new R(this.canvas,null,this.initial_rotation,this.get_orbiter_callback()),this.panel=t.panel(y,k),this.flatten_action=this.depth_buffer.flatten_action(this.panel);const D=this.ratio;this.mix_action=new Et(this.index_panel,this.panel,D),this.mix_action.attach_to_context(t),this.painter=t.paint(this.panel,this.canvas),this.sequence=t.sequence([this.soften_action,this.project_action,this.index_flatten,this.index_colorize,this.colorize_action,this.flatten_action,this.mix_action,this.painter]),this.sequence.run()}async debug_button_callback(){debugger;await this.index_panel.pull_buffer(),await this.depth_buffer.pull_buffer(),console.log("pipeline",this)}async run(){await this.volume_future,this.sequence.run()}get_orbiter_callback(){const t=this;function e(n){t.change_parameters(n)}return e}change_parameters(t,e){if(t){const n=m(t,this.affine_translation);this.projection_matrix=n,this.project_action.change_matrix(n),this.colorize_action.change_matrix(n)}e&&this.mix_action.change_ratio(e),this.run()}}const Do=Object.freeze(Object.defineProperty({__proto__:null,MixPipeline:Po},Symbol.toStringTag,{value:"Module"}));class Oo{constructor(t,e,n){this.slider=n,this.canvas=e,this.volume_url=t,this.connect_future=this.connect(),this.volume_future=this.load()}async connect(){this.context=new j,await this.context.connect()}async load(){const t=this.context,o=await(await(await fetch(this.volume_url)).blob()).arrayBuffer();console.log("buffer",o);const i=new Float32Array(o);console.log("f32",i),this.volume_shape=i.slice(0,3),this.volume_content=i.slice(3);const[a,r,u]=this.volume_shape,l=M(4);l[1][1]=-1;const c=x(null,[-a/2,-r/2,-u/2]);this.volume_matrix=m(l,c);debugger;await this.connect_future,this.volume=t.volume(this.volume_shape,this.volume_content,this.volume_matrix,Float32Array),console.log("input Volume",this.volume);const h=this.volume.min_value,p=this.volume.max_value;this.slider.min=h,this.slider.max=p,this.slider.value=(h+p)/2,this.slider.step=(p-h)/100;const f=Math.max(a,r,u),d=Math.ceil(Math.sqrt(2)*f);this.output_shape=[d,d];const g=-1e4,w=-1e4;this.depth_buffer=t.depth_buffer(this.output_shape,g,w,null,null,Float32Array),this.threshold_value=33e3,this.initial_rotation=[[0,0,1],[1,0,0],[0,1,0]],this.affine_translation=x(null,[-d/2,-d/2,-d]),this.projection_matrix=m(x(this.initial_rotation),this.affine_translation),this.project_action=new N(this.volume,this.depth_buffer,this.projection_matrix,this.threshold_value),this.project_action.attach_to_context(t);const k=0;this.colorize_action=new W(this.volume,this.depth_buffer,this.projection_matrix,k),this.colorize_action.attach_to_context(t),this.orbiter=new R(this.canvas,null,this.initial_rotation,this.get_orbiter_callback());const[y,v]=this.output_shape;this.panel=t.panel(v,y),this.flatten_action=this.depth_buffer.flatten_action(this.panel),this.grey_panel=t.panel(v,y),this.painter=t.paint(this.panel,this.canvas),this.sequence=t.sequence([this.project_action,this.colorize_action,this.flatten_action,this.painter]),this.sequence.run()}async run(){await this.volume_future,this.sequence.run()}get_orbiter_callback(){const t=this;function e(n){t.change_parameters(n)}return e}change_parameters(t,e){if(t){const n=m(t,this.affine_translation);this.projection_matrix=n,this.project_action.change_matrix(n),this.colorize_action.change_matrix(n)}e&&this.project_action.change_threshold(e),this.run()}}const Eo=Object.freeze(Object.defineProperty({__proto__:null,ThresholdPipeline:Oo},Symbol.toStringTag,{value:"Module"}));class Vo extends P{panel_sequence(t){t=t||this.context;const e=this.ofVolume;this.min_value=e.min_value,this.max_value=e.max_value;const n=[0,0,0,1],o=T(this.projection_matrix),i=L(o,n);return this.current_depth=i[2],this.depth_buffer=this.get_output_depth_buffer(t),this.value_panel=this.get_output_panel(t),this.grey_panel=this.get_output_panel(t),this.project_action=new Y(this.ofVolume,this.depth_buffer,this.projection_matrix,this.current_depth),this.project_action.attach_to_context(t),this.flatten_action=this.depth_buffer.flatten_action(this.value_panel),this.gray_action=t.to_gray_panel(this.value_panel,this.grey_panel,this.min_value,this.max_value),this.project_to_panel=t.sequence([this.project_action,this.flatten_action,this.gray_action]),{sequence:this.project_to_panel,output_panel:this.grey_panel}}change_matrix(t){this.project_action.change_matrix(t),this.change_range(t)}change_depth(t){this.project_action.change_depth(t),this.run()}on_range_change(t){this.range_change_callback=t,this.change_range(this.projection_matrix)}change_range(t){const e=this.range_change_callback;if(e){const o=this.ofVolume.projected_range(t,!0),i=o.min[2],a=o.max[2];console.log("new range min",i,"max",a),e(i,a)}}}const Go=Object.freeze(Object.defineProperty({__proto__:null,TestDepthView:Vo},Symbol.toStringTag,{value:"Module"})),Ao="webgpu_volume";function Lo(){return new j}_.CPUVolume=$n,_.CombineDepths=Mn,_.CopyAction=ln,_.DepthBufferRange=Jn,_.GPUAction=tn,_.GPUColorPanel=nn,_.GPUContext=mn,_.GPUDataObject=Ce,_.GPUDepthBuffer=cn,_.GPUVolume=Ze,_.IndexColorizePanel=Qn,_.MaxDotView=Mo,_.MaxProjection=_n,_.MaxView=Zn,_.MixColorPanels=eo,_.MixDepthBuffers=oo,_.MixDotsOnPanel=so,_.MixView=po,_.NormalAction=_o,_.PaintPanel=on,_.Painter_wgsl=ee,_.PastePanel=Dn,_.Projection=rn,_.SampleVolume=en,_.SegmentationQuad=vo,_.SlicedThresholdView=yo,_.Soften=ho,_.ThresholdAction=ro,_.ThresholdView=wo,_.Triptych=zo,_.UpdateAction=sn,_.UpdateGray=hn,_.ViewVolume=Hn,_.VolumeAtDepth=mo,_.canvas_orbit=In,_.combine_depth_buffers_wgsl=fe,_.combine_test=Sn,_.context=Lo,_.convert_buffer_wgsl=se,_.convert_depth_buffer_wgsl=ae,_.convert_gray_prefix_wgsl=St,_.coordinates=Qe,_.depth_buffer_range_wgsl=ke,_.depth_buffer_wgsl=O,_.depth_range_view=So,_.do_combine=me,_.do_gray=ye,_.do_max_projection=xe,_.do_mouse_paste=be,_.do_paint=he,_.do_paste=ve,_.do_pipeline=we,_.do_sample=le,_.embed_volume_wgsl=te,_.gray_test=Tn,_.index_colorize_wgsl=Me,_.max_projection_test=Un,_.max_value_project_wgsl=ie,_.mix_color_panels_wgsl=Se,_.mix_depth_buffers_wgsl=Pe,_.mix_dots_on_panel_wgsl=De,_.mix_test=Do,_.mousepaste=An,_.name=Ao,_.normal_colors_wgsl=Ae,_.paint_test=zn,_.panel_buffer_wgsl=Q,_.paste_panel_wgsl=ge,_.paste_test=En,_.pipeline_test=Rn,_.sample_test=vn,_.soften_volume_wgsl=Le,_.threshold_test=Eo,_.threshold_wgsl=Ge,_.vol_depth_view=Go,_.volume_at_depth_wgsl=qe,_.volume_frame_wgsl=U,_.volume_intercepts_wgsl=ht,Object.defineProperty(_,Symbol.toStringTag,{value:"Module"})});
