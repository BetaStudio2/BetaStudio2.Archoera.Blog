/**
 * GPU 能力检测工具
 * 优先检测 WebGPU，自动回退 WebGL
 */

// WebGPU 最小类型与常量（避免依赖 @webgpu/types）
const GPUTextureUsage = { RENDER_ATTACHMENT: 16 } as const
const GPUBufferUsage = { VERTEX: 512, COPY_DST: 8, INDEX: 32 } as const

interface GPUDeviceAdapter {
  readonly features: ReadonlySet<string>
  readonly limits: Record<string, number>
  readonly isFallbackAdapter: boolean
}

export interface GPUInfo {
  /** 首选渲染后端 */
  backend: 'webgpu' | 'webgl' | 'none'
  /** WebGPU API 是否可用（navigator.gpu 存在） */
  webgpuAvailable: boolean
  /** WebGL 上下文是否可用 */
  webglAvailable: boolean
  /** 是否优先使用 WebGL2 */
  webgl2Available: boolean
  /** GPU 渲染器名称 */
  renderer: string
  /** 最大纹理尺寸 */
  maxTextureSize: number
  /** 是否为软件渲染器（SwiftShader / llvmpipe / mesa） */
  isSoftwareRenderer: boolean
  /** 是否为移动设备 */
  isMobile: boolean
  /** 是否为慢速网络（2G / slow-2g） */
  isSlowNetwork: boolean
}

let cachedInfo: GPUInfo | null = null

/**
 * 同步检测 GPU 能力（结果会被缓存）
 * - WebGPU：检查 navigator.gpu 是否存在
 * - WebGL：检查 getContext('webgl2') / getContext('webgl')
 */
export function detectGPU(): GPUInfo {
  if (cachedInfo) return cachedInfo

  // -- WebGPU 检测（优先） --
  const webgpuAvailable =
    typeof navigator !== 'undefined' && 'gpu' in navigator

  // -- WebGL 检测（回退） --
  let webglAvailable = false
  let webgl2Available = false
  let renderer = ''
  let maxTextureSize = 0
  let isSoftwareRenderer = false

  try {
    const canvas = document.createElement('canvas')
    const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null
    const gl = gl2 || (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null

    if (gl) {
      webglAvailable = true
      webgl2Available = !!gl2

      // 优先使用标准 RENDERER（Firefox/Zen 已弃用 WEBGL_debug_renderer_info）
      renderer = (gl.getParameter(gl.RENDERER) as string) || ''
      
      // 检测是否为 Chrome/Edge 浏览器（只有这些浏览器还支持 WEBGL_debug_renderer_info）
      // Firefox/Zen 已弃用此扩展，调用会触发警告
      const isChromeOrEdge = /Chrome|Edg/i.test(navigator.userAgent) && !/Firefox/i.test(navigator.userAgent)
      
      // 仅在 Chrome/Edge 中尝试获取更详细的渲染器信息
      if (isChromeOrEdge) {
        try {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
          if (debugInfo) {
            const unmasked = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string
            if (unmasked) renderer = unmasked
          }
        } catch {
          // 扩展获取失败，继续使用标准 RENDERER
        }
      }

      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
      isSoftwareRenderer = /swiftshader|llvmpipe|mesa offscreen/i.test(renderer)
    }
  } catch {
    // 检测失败，保持默认值
  }

  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isSlowNetwork =
    'connection' in navigator &&
    (navigator as any).connection?.effectiveType &&
    ['slow-2g', '2g'].includes((navigator as any).connection.effectiveType)

  const backend: GPUInfo['backend'] = webgpuAvailable
    ? 'webgpu'
    : webglAvailable
      ? 'webgl'
      : 'none'

  cachedInfo = {
    backend,
    webgpuAvailable,
    webglAvailable,
    webgl2Available,
    renderer,
    maxTextureSize,
    isSoftwareRenderer,
    isMobile,
    isSlowNetwork,
  }

  return cachedInfo
}

/**
 * 判断设备是否具备运行 Live2D 的条件
 * - WebGPU 可用 → 设备 GPU 能力强，直接允许
 * - WebGPU 不可用 → 用 WebGL 参数判断
 */
export function canRunLive2D(): boolean {
  const info = detectGPU()

  // 没有任何 GPU 能力
  if (!info.webglAvailable) return false

  // WebGPU API 可用 → 现代 GPU，肯定能跑
  if (info.webgpuAvailable) return true

  // 软件渲染器 → 性能太差
  if (info.isSoftwareRenderer) return false

  // 纹理尺寸不足
  if (info.maxTextureSize < 4096) return false

  // 慢速网络
  if (info.isSlowNetwork) return false

  // 移动设备需要更高的纹理支持
  if (info.isMobile && info.maxTextureSize < 8192) return false

  return true
}

/**
 * 异步请求 WebGPU 适配器（用于需要 WebGPU 渲染的场景）
 * 返回 null 表示 WebGPU 不可用，调用方应回退到 WebGL
 */

// ============================================================
// GPU Canvas Renderer — WebGPU > WebGL2 > Canvas2D
// ============================================================

export type GPURendererBackend = 'webgpu' | 'webgl2' | 'webgl1' | 'canvas2d' | 'none'

export interface StrokeConfig {
  color: [number, number, number, number]
  size: number
  compositeMode: 'source-over' | 'destination-out'
}

export interface GPUCavnasRenderer {
  readonly backend: GPURendererBackend
  init(canvas: HTMLCanvasElement): Promise<boolean>
  destroy(): void
  resize(w: number, h: number): void
  clear(): void
  beginStroke(config: StrokeConfig): void
  addPoint(x: number, y: number, pressure: number): void
  endStroke(): void
}

// ── WebGPU backend ──

class WebGPURenderer implements GPUCavnasRenderer {
  readonly backend = 'webgpu' as const
  private device: any = null
  private context: any = null
  private pipeline: any = null
  private vertexBuffer: any = null
  private canvas: HTMLCanvasElement | null = null
  private vertices: Float32Array = new Float32Array(0)
  private vcount = 0
  private color: [number, number, number, number] = [0, 0, 0, 0]
  private size = 3
  private depthTex: any = null
  private depthView: any = null

  async init(canvas: HTMLCanvasElement): Promise<boolean> {
    this.canvas = canvas
    const nav = navigator as any
    if (!nav.gpu) return false
    try {
      const adapter = await nav.gpu.requestAdapter({ powerPreference: 'high-performance' })
      if (!adapter) return false
      this.device = await adapter.requestDevice()
      this.context = canvas.getContext('webgpu')
      if (!this.context) return false
      const fmt = nav.gpu.getPreferredCanvasFormat?.() || 'bgra8unorm'
      this.context.configure({
        device: this.device,
        format: fmt,
        alphaMode: 'premultiplied',
      })
      this.pipeline = this.device.createRenderPipeline({
        vertex: {
          module: this.device.createShaderModule({
            code: VERT_WGSL
          }),
          buffers: [{
            arrayStride: 28,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },
              { shaderLocation: 1, offset: 8, format: 'float32x4' },
              { shaderLocation: 2, offset: 24, format: 'float32' },
            ]
          }]
        },
        fragment: {
          module: this.device.createShaderModule({ code: FRAG_WGSL }),
          targets: [{
            format: fmt,
            blend: {
              color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            }
          }]
        },
        primitive: { topology: 'triangle-strip' },
        depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'always' },
      })
      return true
    } catch {
      return false
    }
  }

  destroy() {
    this.device?.destroy?.()
    this.device = null
    this.context = null
    this.pipeline = null
    this.vertexBuffer?.destroy?.()
    this.vertexBuffer = null
    this.canvas = null
  }

  resize(w: number, h: number) {
    if (!this.canvas) return
    this.canvas.width = w
    this.canvas.height = h
    // Recreate depth texture
    const old = this.depthTex
    this.depthTex = this.device?.createTexture?.({
      size: [Math.max(1, w), Math.max(1, h)],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })
    this.depthView = this.depthTex?.createView?.()
    old?.destroy?.()
  }

  clear() {
    if (!this.context || !this.device) return
    this.vertices = new Float32Array(0)
    this.vcount = 0
    const encoder = this.device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
      }],
      depthStencilAttachment: {
        view: this.depthView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      }
    })
    pass.end()
    this.device.queue.submit([encoder.finish()])
  }

  beginStroke(config: StrokeConfig) {
    this.color = config.color
    this.size = config.size
  }

  addPoint(x: number, y: number, _pressure: number) {
    const prevLen = this.vertices.length
    const newLen = prevLen + 28 * 4 // 4 vertices per point
    const buf = new Float32Array(newLen)
    buf.set(this.vertices)
    this.vertices = buf
    this.vcount += 4

    const hs = this.size / 2
    const [r, g, b, a] = this.color
    const idx = prevLen
    // quad: two triangles forming a quad around (x,y)
    // tl, tr, bl, br (triangle-strip order)
    const pts = [
      [x - hs, y - hs], [x + hs, y - hs],
      [x - hs, y + hs], [x + hs, y + hs]
    ]
    for (let i = 0; i < 4; i++) {
      const off = idx + i * 28
      buf[off] = pts[i][0]
      buf[off + 1] = pts[i][1]
      buf[off + 2] = r
      buf[off + 3] = g
      buf[off + 4] = b
      buf[off + 5] = a
      buf[off + 6] = hs
    }
  }

  endStroke() {
    if (!this.context || !this.device || this.vcount === 0) return
    this.flush()
  }

  private flush() {
    if (!this.context || !this.device || this.vcount === 0) return
    // Upload vertex buffer
    const size = this.vertices.byteLength
    const usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    const buf = this.device.createBuffer({ size, usage })
    buf.setSubData?.(0, this.vertices) ?? (this.device.queue.writeBuffer(buf, 0, this.vertices.buffer))
    this.vertexBuffer?.destroy?.()
    this.vertexBuffer = buf

    const tex = this.context.getCurrentTexture()
    const texView = tex.createView()

    const encoder = this.device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: texView,
        loadOp: 'load',
        storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: this.depthView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      }
    })
    pass.setPipeline(this.pipeline)
    pass.setVertexBuffer(0, buf)
    pass.draw(this.vcount)
    pass.end()
    this.device.queue.submit([encoder.finish()])
  }
}

// WGSL shaders (inline to avoid build tooling)
const VERT_WGSL = `
struct VertexIn {
  @location(0) pos: vec2<f32>,
  @location(1) col: vec4<f32>,
  @location(2) hs: f32,
}
struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) uv: vec2<f32>,
}
@vertex
fn main(in: VertexIn) -> VertexOut {
  var out: VertexOut;
  out.position = vec4<f32>(in.pos / vec2<f32>(640.0, 360.0), 0.0, 1.0);
  out.color = in.col;
  out.uv = (in.pos - floor(in.pos / (in.hs * 2.0)) * (in.hs * 2.0)) / in.hs - 1.0;
  return out;
}
`

const FRAG_WGSL = `
@fragment
fn main(@location(0) color: vec4<f32>, @location(1) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let d = length(uv);
  if (d > 1.0) { discard; }
  let aa = smoothstep(1.0, 0.85, d);
  return color * aa;
}
`

// ── WebGL2 backend ──

class WebGL2Renderer implements GPUCavnasRenderer {
  readonly backend = 'webgl2' as const
  private gl: WebGL2RenderingContext | null = null
  private canvas: HTMLCanvasElement | null = null
  private points: number[] = []
  private color: [number, number, number, number] = [0, 0, 0, 0]
  private pointSize = 3
  private blend: 'source-over' | 'destination-out' = 'source-over'

  async init(canvas: HTMLCanvasElement): Promise<boolean> {
    this.canvas = canvas
    const gl = canvas.getContext('webgl2', {
      alpha: true, premultipliedAlpha: true, antialias: true,
    })
    if (!gl) return false
    this.gl = gl
    return true
  }

  destroy() {
    this.gl = null
    this.canvas = null
  }

  resize(w: number, h: number) {
    if (!this.canvas) return
    this.canvas.width = w
    this.canvas.height = h
  }

  clear() {
    if (!this.gl) return
    this.points = []
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  beginStroke(config: StrokeConfig) {
    this.color = config.color
    this.pointSize = config.size
    this.blend = config.compositeMode
  }

  addPoint(x: number, y: number, _pressure: number) {
    this.points.push(x, y)
    this.flush()
  }

  endStroke() { /* flushed per-point */ }

  private flush() {
    const { gl } = this
    if (!gl || this.points.length < 2) return

    gl.enable(gl.BLEND)
    if (this.blend === 'destination-out') {
      gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA)
    } else {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    }

    const vsSrc = `#version 300 es
      in vec2 aPos; uniform vec2 uRes; uniform float uSize;
      void main() {
        gl_PointSize = uSize;
        gl_Position = vec4(aPos / uRes * 2.0 - 1.0, 0.0, 1.0);
      }`
    const fsSrc = `#version 300 es
      precision highp float;
      uniform vec4 uColor;
      out vec4 fragColor;
      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float d = length(uv);
        if (d > 1.0) discard;
        float aa = 1.0 - smoothstep(0.7, 1.0, d);
        fragColor = uColor * aa;
      }`

    const vs = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vs, vsSrc); gl.compileShader(vs)
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fs, fsSrc); gl.compileShader(fs)
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs); gl.attachShader(prog, fs)
    gl.linkProgram(prog); gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.points), gl.STREAM_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'uRes')
    gl.uniform2f(uRes, this.canvas!.width, this.canvas!.height)
    const uSize = gl.getUniformLocation(prog, 'uSize')
    gl.uniform1f(uSize, this.pointSize)
    const uColor = gl.getUniformLocation(prog, 'uColor')
    gl.uniform4fv(uColor, this.color)

    gl.drawArrays(gl.POINTS, 0, this.points.length / 2)

    gl.deleteProgram(prog)
    gl.deleteShader(vs); gl.deleteShader(fs)
    gl.deleteBuffer(buf)
    gl.disable(gl.BLEND)
  }
}

// ── WebGL1 fallback (for Firefox/Zen without WebGL2) ──

class WebGL1Renderer implements GPUCavnasRenderer {
  readonly backend = 'webgl1' as const
  private gl: WebGLRenderingContext | null = null
  private canvas: HTMLCanvasElement | null = null
  private points: number[] = []
  private color: [number, number, number, number] = [0, 0, 0, 0]
  private pointSize = 3
  private blend: 'source-over' | 'destination-out' = 'source-over'

  async init(canvas: HTMLCanvasElement): Promise<boolean> {
    this.canvas = canvas
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    this.gl = gl
    return true
  }

  destroy() {
    this.gl = null
    this.canvas = null
  }

  resize(w: number, h: number) {
    if (!this.canvas) return
    this.canvas.width = w
    this.canvas.height = h
  }

  clear() {
    if (!this.gl) return
    this.points = []
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  beginStroke(config: StrokeConfig) {
    this.color = config.color
    this.pointSize = config.size
    this.blend = config.compositeMode
  }

  addPoint(x: number, y: number, _pressure: number) {
    this.points.push(x, y)
    this.flush()
  }

  endStroke() { /* flushed per-point */ }

  private flush() {
    const { gl } = this
    if (!gl || this.points.length < 2) return

    gl.enable(gl.BLEND)
    if (this.blend === 'destination-out') {
      gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA)
    } else {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    }

    // WebGL1 uses GLSL ES 1.00 (no #version directive needed)
    const vsSrc = `
      attribute vec2 aPos;
      uniform vec2 uRes;
      uniform float uSize;
      void main() {
        gl_PointSize = uSize;
        gl_Position = vec4(aPos / uRes * 2.0 - 1.0, 0.0, 1.0);
      }`
    const fsSrc = `
      precision highp float;
      uniform vec4 uColor;
      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float d = length(uv);
        if (d > 1.0) discard;
        float aa = 1.0 - smoothstep(0.7, 1.0, d);
        gl_FragColor = vec4(uColor.rgb * aa, uColor.a * aa);
      }`

    const vs = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vs, vsSrc); gl.compileShader(vs)
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fs, fsSrc); gl.compileShader(fs)
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs); gl.attachShader(prog, fs)
    gl.linkProgram(prog); gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.points), gl.STREAM_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'uRes')
    gl.uniform2f(uRes, this.canvas!.width, this.canvas!.height)
    const uSize = gl.getUniformLocation(prog, 'uSize')
    gl.uniform1f(uSize, this.pointSize)
    const uColor = gl.getUniformLocation(prog, 'uColor')
    gl.uniform4fv(uColor, this.color)

    gl.drawArrays(gl.POINTS, 0, this.points.length / 2)

    gl.deleteProgram(prog)
    gl.deleteShader(vs); gl.deleteShader(fs)
    gl.deleteBuffer(buf)
    gl.disable(gl.BLEND)
  }
}

// ── Canvas 2D fallback ──

class Canvas2DRenderer implements GPUCavnasRenderer {
  readonly backend = 'canvas2d' as const
  private ctx: CanvasRenderingContext2D | null = null
  private canvas: HTMLCanvasElement | null = null
  private drawing = false
  private color = ''
  private size = 3
  private blend: 'source-over' | 'destination-out' = 'source-over'
  private lastX = 0
  private lastY = 0

  async init(canvas: HTMLCanvasElement): Promise<boolean> {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    this.ctx = ctx
    return true
  }

  destroy() { this.ctx = null; this.canvas = null }

  resize(w: number, h: number) {
    if (!this.canvas) return
    this.canvas.width = w
    this.canvas.height = h
  }

  clear() {
    if (!this.ctx || !this.canvas) return
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  beginStroke(config: StrokeConfig) {
    this.color = `rgba(${config.color.slice(0, 3).map((c, i) => i < 3 ? Math.round(c * 255) : c).join(',')})`
    this.size = config.size
    this.blend = config.compositeMode
    if (!this.ctx) return
    this.ctx.save()
    this.ctx.globalAlpha = config.color[3]
    this.ctx.globalCompositeOperation = this.blend === 'destination-out' ? 'destination-out' : 'source-over'
    this.ctx.strokeStyle = this.color
    this.ctx.lineWidth = this.size
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.drawing = true
  }

  addPoint(x: number, y: number, _pressure: number) {
    if (!this.ctx || !this.drawing) return
    if (this.lastX === 0 && this.lastY === 0) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, y)
    } else {
      this.ctx.lineTo(x, y)
      this.ctx.stroke()
      this.ctx.beginPath()
      this.ctx.moveTo(x, y)
    }
    this.lastX = x
    this.lastY = y
  }

  endStroke() {
    if (!this.ctx) return
    this.ctx?.restore()
    this.drawing = false
    this.lastX = 0
    this.lastY = 0
  }
}

/**
 * 创建 GPU Canvas 渲染器（WebGPU > WebGL2 > WebGL1 > Canvas2D）
 * 提供统一的画布绘制接口，自动选择最佳后端
 */
export async function createGPUCavnasRenderer(): Promise<GPUCavnasRenderer> {
  // 先尝试 WebGPU
  const wgpu = new WebGPURenderer()
  const dummy = document.createElement('canvas')
  if (await wgpu.init(dummy)) return wgpu

  // 回退到 WebGL2
  const wgl2 = new WebGL2Renderer()
  if (await wgl2.init(dummy)) return wgl2

  // 回退到 WebGL1（Firefox/Zen 等浏览器）
  const wgl1 = new WebGL1Renderer()
  if (await wgl1.init(dummy)) return wgl1

  // 最后回退到 Canvas 2D
  const c2d = new Canvas2DRenderer()
  if (await c2d.init(dummy)) return c2d

  throw new Error('No GPU or Canvas 2D support available')
}
export async function requestWebGPUAdapter(
  powerPreference: 'low-power' | 'high-performance' = 'high-performance',
): Promise<GPUDeviceAdapter | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any
  if (!detectGPU().webgpuAvailable || !nav.gpu) return null

  try {
    const adapter: GPUDeviceAdapter = await nav.gpu.requestAdapter({ powerPreference })
    return adapter
  } catch {
    return null
  }
}
