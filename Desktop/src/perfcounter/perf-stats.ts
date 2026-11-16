/**
 * 性能指标追踪工具
 * 实时追踪 FPS、帧耗时、内存占用、DOM 计数等
 */

import { ref, onUnmounted } from 'vue'
import { detectGPU } from '@/utils/gpu-detector'

export interface PerfStats {
  fps: number
  frameTime: number // ms
  memory: {
    usedJSHeapSize: number // bytes
    totalJSHeapSize: number // bytes
  } | null
  gpuRenderer: string
  gpuBackend: string
  jsHeapFraction: number // 0-100
  domNodes: number
  windowW: number
  windowH: number
  sparkline: number[] // 最近 60 个 FPS 值
}

const SAMPLE_SIZE = 60
const SPARKLINE_SIZE = 60

export function usePerfStats() {
  const stats = ref<PerfStats>({
    fps: 0,
    frameTime: 0,
    memory: null,
    gpuRenderer: '',
    gpuBackend: '',
    jsHeapFraction: 0,
    domNodes: 0,
    windowW: window.innerWidth,
    windowH: window.innerHeight,
    sparkline: [],
  })

  const visible = ref(false)

  let rafId = 0
  let frameTimes: number[] = []
  let lastTime = performance.now()
  let tickCount = 0

  // Detect GPU info once
  try {
    const gpu = detectGPU()
    stats.value.gpuRenderer = gpu.renderer || 'Unknown'
    stats.value.gpuBackend = gpu.backend
  } catch {
    stats.value.gpuRenderer = 'Unknown'
    stats.value.gpuBackend = 'none'
  }

  function tick(now: number) {
    const dt = now - lastTime
    lastTime = now
    tickCount++

    frameTimes.push(dt)
    if (frameTimes.length > SAMPLE_SIZE) frameTimes.shift()

    // Compute averages
    const sum = frameTimes.reduce((a, b) => a + b, 0)
    const avg = sum / frameTimes.length

    stats.value.frameTime = Math.round(avg * 10) / 10
    const fps = avg > 0 ? Math.round(1000 / avg) : 0
    stats.value.fps = fps

    // FPS sparkline (sample every frame, but store the last SPARKLINE_SIZE values)
    const spark = stats.value.sparkline
    spark.push(fps)
    if (spark.length > SPARKLINE_SIZE) spark.shift()

    // Memory (Chrome only)
    const mem = (performance as any).memory
    if (mem) {
      stats.value.memory = {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
      }
      stats.value.jsHeapFraction = mem.totalJSHeapSize > 0
        ? Math.round((mem.usedJSHeapSize / mem.totalJSHeapSize) * 100)
        : 0
    }

    // DOM & window (throttle to every 30 frames to reduce overhead)
    if (tickCount % 30 === 0) {
      stats.value.domNodes = document.querySelectorAll('*').length
      stats.value.windowW = window.innerWidth
      stats.value.windowH = window.innerHeight
    }

    rafId = requestAnimationFrame(tick)
  }

  function start() {
    if (rafId) return
    frameTimes = []
    tickCount = 0
    lastTime = performance.now()
    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    frameTimes = []
  }

  function toggle() {
    visible.value = !visible.value
    if (visible.value) {
      start()
    } else {
      stop()
    }
  }

  onUnmounted(() => stop())

  return { stats, visible, toggle, start, stop }
}

/**
 * 格式化字节为可读字符串
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * 从 FPS 值生成文本式 sparkline（基于 Unicode 块字符 ▁▂▃▄▅▆▇█）
 */
const BAR_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
export function sparklineText(values: number[]): string {
  if (!values.length) return ''
  const effectiveMax = Math.max(...values, 10)
  return values.map(v => {
    const idx = Math.min(BAR_CHARS.length - 1, Math.floor((v / effectiveMax) * (BAR_CHARS.length - 1)))
    return BAR_CHARS[Math.max(0, idx)]
  }).join('')
}
