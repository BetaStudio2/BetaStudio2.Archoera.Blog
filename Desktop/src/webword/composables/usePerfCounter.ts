import { ref, reactive } from 'vue'
import type { PerfData } from '@/webword/types'

export function usePerfCounter() {
  const data = reactive<PerfData>({
    fps: 60,
    fpsMin: 60,
    fps1Low: 60,
    cpu: 0,
    gpu: 0,
    domCount: 0,
    jsHeap: 0,
    navigation: { dns: 0, tcp: 0, ttfb: 0, load: 0 },
    paint: { fp: 0, fcp: 0, lcp: 0 },
    longTasks: 0
  })

  const monitoring = ref(false)
  let frameTimes: number[] = []
  let lastFrameTime = performance.now()
  let rafId: number | null = null
  let fps1LowHistory: number[] = []

  function init() {
    // collect navigation timing
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav) {
      data.navigation = {
        dns: nav.domainLookupEnd - nav.domainLookupStart,
        tcp: nav.connectEnd - nav.connectStart,
        ttfb: nav.responseStart - nav.requestStart,
        load: nav.loadEventEnd - nav.loadEventStart
      }
    }

    // collect paint timing
    const paintEntries = performance.getEntriesByType('paint')
    for (const entry of paintEntries) {
      if (entry.name === 'first-paint') data.paint.fp = entry.startTime
      if (entry.name === 'first-contentful-paint') data.paint.fcp = entry.startTime
    }

    // LCP observer
    try {
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          if (entries.length > 0) {
            data.paint.lcp = entries[entries.length - 1].startTime
          }
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

        // long task observer
        const ltObserver = new PerformanceObserver((list) => {
          data.longTasks += list.getEntries().length
        })
        ltObserver.observe({ type: 'longtask', buffered: true })
      }
    } catch {
      // observer not supported
    }
  }

  function startMonitoring() {
    if (monitoring.value) return
    monitoring.value = true
    lastFrameTime = performance.now()
    frameTimes = []
    fps1LowHistory = []
    tick()
  }

  function stopMonitoring() {
    monitoring.value = false
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function tick() {
    if (!monitoring.value) return

    const now = performance.now()
    const delta = now - lastFrameTime
    lastFrameTime = now

    frameTimes.push(delta)
    // keep last 120 frames
    if (frameTimes.length > 120) frameTimes.shift()

    if (frameTimes.length >= 2) {
      const avgDelta = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
      data.fps = Math.round(1000 / avgDelta)

      const minDelta = Math.max(...frameTimes.slice(-30))
      const fpsMin = Math.round(1000 / minDelta)
      data.fpsMin = fpsMin
      fps1LowHistory.push(fpsMin)
      if (fps1LowHistory.length > 60) fps1LowHistory.shift()
      data.fps1Low = fps1LowHistory.length > 0 ? Math.min(...fps1LowHistory) : fpsMin
    }

    // DOM count
    data.domCount = document.querySelectorAll('*').length

    // JS heap
    if ('memory' in performance) {
      const mem = (performance as any).memory
      data.jsHeap = mem?.usedJSHeapSize || 0
    }

    // CPU/GPU estimation
    if (frameTimes.length > 60) {
      const recent = frameTimes.slice(-60)
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length
      const targetFrameMs = 1000 / 60 // ~16.67ms
      data.cpu = Math.min(100, Math.round((avg / targetFrameMs) * 50))

      // GPU estimation based on frame time variance
      const variance = recent.reduce((sum, t) => sum + (t - avg) * (t - avg), 0) / recent.length
      data.gpu = Math.min(100, Math.round(Math.sqrt(variance) * 5))
    }

    rafId = requestAnimationFrame(tick)
  }

  function triggerGC() {
    try {
      if ('gc' in window) {
        (window as any).gc()
      }
    } catch {
      // gc not available
    }
  }

  return {
    data, monitoring,
    init, startMonitoring, stopMonitoring, triggerGC
  }
}
