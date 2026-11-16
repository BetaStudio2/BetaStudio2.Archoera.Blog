import { ref, reactive } from 'vue'
import { createGPUCavnasRenderer, type GPUCavnasRenderer } from '@/utils/gpu-detector'

export type DrawTool = 'pen' | 'gelpen' | 'pencil' | 'brush' | 'marker' | 'highlighter' | 'laser' | 'eraser'

interface DrawConfig {
  tool: DrawTool
  color: string
  size: number
  opacity: number
}

interface DrawPoint {
  x: number
  y: number
  pressure: number
}

// 每种笔刷的尺寸乘数和透明度乘数
const TOOL_PRESETS: Record<DrawTool, { sizeMul: number; alphaMul: number }> = {
  pen:         { sizeMul: 1,   alphaMul: 1    },
  gelpen:      { sizeMul: 0.8, alphaMul: 0.9  },
  pencil:      { sizeMul: 1.2, alphaMul: 0.6  },
  brush:       { sizeMul: 2.5, alphaMul: 0.4  },
  marker:      { sizeMul: 1.8, alphaMul: 0.35 },
  highlighter: { sizeMul: 4,   alphaMul: 0.25 },
  laser:       { sizeMul: 2,   alphaMul: 0.8  },
  eraser:      { sizeMul: 3,   alphaMul: 1    },
}

/** Hex 颜色字符串 → [r, g, b, a] 浮点数组 */
function hexToRGBA(hex: string, alpha: number): [number, number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255
  return [r, g, b, Math.min(1, Math.max(0, alpha))]
}

export function useDraw() {
  const active = ref(false)
  const config = reactive<DrawConfig>({
    tool: 'pen',
    color: '#000000',
    size: 3,
    opacity: 1
  })

  let canvas: HTMLCanvasElement | null = null
  let renderer: GPUCavnasRenderer | null = null
  let drawing = false
  let points: DrawPoint[] = []

  async function activate(canvasEl: HTMLCanvasElement) {
    canvas = canvasEl

    try {
      renderer = await createGPUCavnasRenderer()
      const ok = await renderer.init(canvasEl)
      if (!ok) { renderer = null; return }
    } catch {
      renderer = null
      console.warn('[useDraw] fallback all failed — drawing disabled')
      return
    }

    active.value = true
    canvas.style.pointerEvents = 'auto'
    canvas.style.cursor = 'crosshair'

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerUp)
  }

  function deactivate() {
    if (canvas) {
      canvas.style.pointerEvents = 'none'
      canvas.style.cursor = 'default'
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerUp)
    }
    renderer?.destroy()
    renderer = null
    active.value = false
    drawing = false
    points = []
  }

  function onPointerDown(e: PointerEvent) {
    if (!canvas || !renderer) return
    drawing = true
    const rect = canvas.getBoundingClientRect()
    const pt: DrawPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5
    }
    points = [pt]
    beginStroke()
  }

  function onPointerMove(e: PointerEvent) {
    if (!canvas || !renderer || !drawing) return
    const rect = canvas.getBoundingClientRect()
    const pt: DrawPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5
    }
    points.push(pt)
    continueStroke(pt)
  }

  function onPointerUp(_e: PointerEvent) {
    if (!canvas || !renderer) return
    drawing = false
    endStroke()
    points = []
  }

  /** 根据配置和压力更新绘制参数 */
  function applyPreset(pt: DrawPoint) {
    if (!renderer) return
    const preset = TOOL_PRESETS[config.tool]
    const pressure = pt.pressure || 0.5
    const adjustedSize = config.size * preset.sizeMul * (0.5 + pressure * 0.5)
    const alpha = config.opacity * preset.alphaMul
    const compositeMode = config.tool === 'eraser' ? 'destination-out' as const : 'source-over' as const
    const color = hexToRGBA(config.color, alpha)
    renderer.beginStroke({ color, size: adjustedSize, compositeMode })
  }

  function beginStroke() {
    if (!renderer || points.length === 0) return
    applyPreset(points[0])
    renderer.addPoint(points[0].x, points[0].y, points[0].pressure || 0.5)
  }

  function continueStroke(pt: DrawPoint) {
    if (!renderer || points.length < 2) return
    applyPreset(pt)
    renderer.addPoint(pt.x, pt.y, pt.pressure || 0.5)
  }

  function endStroke() {
    if (!renderer) return
    renderer.endStroke()
  }

  function setTool(tool: DrawTool) { config.tool = tool }
  function setColor(color: string) { config.color = color }
  function setSize(size: number) { config.size = size }
  function setOpacity(opacity: number) { config.opacity = Math.min(1, Math.max(0, opacity)) }

  function clearCanvas() {
    renderer?.clear()
  }

  function resizeCanvas() {
    if (!canvas) return
    const parent = canvas.parentElement
    if (parent) {
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }
    renderer?.resize(canvas.width, canvas.height)
  }

  return {
    active, config,
    activate, deactivate,
    setTool, setColor, setSize, setOpacity,
    clearCanvas, resizeCanvas
  }
}
