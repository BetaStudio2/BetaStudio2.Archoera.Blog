<template>
  <!-- Embedded mode (desktop window) → wider layout -->
  <div v-if="embedded" class="perf-embedded">
    <div class="perf-grid">
      <!-- Row 1: FPS + sparkline -->
      <div class="perf-group">
        <div class="perf-row"><span class="perf-label">FPS</span><span class="perf-value" :class="fpsColor">{{ stats.fps }}</span></div>
        <div class="perf-sparkline" :title="$t('desktop.perf.sparklineTitle', { frames: stats.sparkline.length })">{{ sparkline }}</div>
      </div>
      <!-- Row 2: Frame time -->
      <div class="perf-row"><span class="perf-label">{{ $t('desktop.perf.frameTime') }}</span><span class="perf-value">{{ stats.frameTime }} ms</span></div>
      <!-- Row 3: Memory -->
      <template v-if="!!stats.memory">
        <div class="perf-row"><span class="perf-label">{{ $t('desktop.perf.heapMemory') }}</span><span class="perf-value">{{ formatBytes(stats.memory!.usedJSHeapSize) }} / {{ formatBytes(stats.memory!.totalJSHeapSize) }}</span></div>
        <div class="perf-bar-track"><div class="perf-bar" :style="{ width: stats.jsHeapFraction + '%' }"></div></div>
      </template>
      <!-- Row 4: DOM + Window -->
      <div class="perf-row"><span class="perf-label">{{ $t('desktop.perf.domNodes') }}</span><span class="perf-value">{{ stats.domNodes.toLocaleString() }}</span></div>
      <div class="perf-row"><span class="perf-label">{{ $t('desktop.perf.windowSize') }}</span><span class="perf-value">{{ stats.windowW }} × {{ stats.windowH }}</span></div>
      <!-- Row 5: GPU -->
      <div class="perf-row"><span class="perf-label">GPU</span><span class="perf-value perf-gpu">{{ stats.gpuBackend }} · {{ stats.gpuRenderer }}</span></div>
    </div>
  </div>

  <!-- Floating panel mode (blog pages) -->
  <Transition v-else name="perf-fade">
    <div v-if="visible" ref="panelRef" class="perf-panel" :style="panelStyle"
      @pointerdown="onDragStart" @pointermove="onDragMove" @pointerup="onDragEnd">
      <div class="perf-header">
        <span class="perf-title">{{ $t('desktop.app.perfcounter') }}</span>
        <button class="perf-close" @pointerdown.stop @click="toggle">×</button>
      </div>
      <div class="perf-group">
        <div class="perf-row"><span class="perf-label">FPS</span><span class="perf-value" :class="fpsColor">{{ stats.fps }}</span></div>
        <div class="perf-sparkline" :title="$t('desktop.perf.sparklineTitle', { frames: stats.sparkline.length })">{{ sparkline }}</div>
      </div>
      <div class="perf-row"><span class="perf-label">{{ $t('desktop.perf.frameTime') }}</span><span class="perf-value">{{ stats.frameTime }} ms</span></div>
      <template v-if="!!stats.memory">
        <div class="perf-row"><span class="perf-label">{{ $t('desktop.perf.heapMemory') }}</span><span class="perf-value">{{ formatBytes(stats.memory!.usedJSHeapSize) }} / {{ formatBytes(stats.memory!.totalJSHeapSize) }}</span></div>
        <div class="perf-bar-track"><div class="perf-bar" :style="{ width: stats.jsHeapFraction + '%' }"></div></div>
      </template>
      <div class="perf-row"><span class="perf-label">{{ $t('desktop.perf.domNodes') }}</span><span class="perf-value">{{ stats.domNodes.toLocaleString() }}</span></div>
      <div class="perf-row"><span class="perf-label">{{ $t('desktop.perf.windowSize') }}</span><span class="perf-value">{{ stats.windowW }} × {{ stats.windowH }}</span></div>
      <div class="perf-row"><span class="perf-label">GPU</span><span class="perf-value perf-gpu">{{ stats.gpuBackend }} · {{ stats.gpuRenderer }}</span></div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePerfStats, formatBytes, sparklineText } from './perf-stats'

const props = withDefaults(defineProps<{
  embedded?: boolean
}>(), {
  embedded: false,
})

const { stats, visible, toggle, start } = usePerfStats()

// Sparkline text (computed from stats.sparkline array)
const sparkline = computed(() => sparklineText(stats.value.sparkline))

// Start tracking immediately when in embedded mode
onMounted(() => {
  if (props.embedded) start()
})

defineExpose({ toggle })

// Drag state (floating mode only)
let dragging = false
let dragOffX = 0
let dragOffY = 0
const panelStyle = computed(() => ({
  top: '80px',
  left: '12px',
}))

function onDragStart(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('.perf-close')) return
  dragging = true
  const panel = (e.currentTarget as HTMLElement)
  panel.setPointerCapture(e.pointerId)
  const rect = panel.getBoundingClientRect()
  dragOffX = e.clientX - rect.left
  dragOffY = e.clientY - rect.top
}
function onDragMove(e: PointerEvent) {
  if (!dragging) return
  const panel = (e.currentTarget as HTMLElement)
  panel.style.left = (e.clientX - dragOffX) + 'px'
  panel.style.top = (e.clientY - dragOffY) + 'px'
}
function onDragEnd() { dragging = false }

// FPS color coding
const fpsColor = computed(() => {
  if (stats.value.fps >= 55) return 'perf-green'
  if (stats.value.fps >= 30) return 'perf-yellow'
  return 'perf-red'
})
</script>

<style scoped>
/* ── Embedded window mode ── */
.perf-embedded {
  padding: 14px 18px;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  color: rgba(255, 255, 255, .8);
  user-select: none;
}
.perf-embedded .perf-grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* ── Floating panel mode ── */
.perf-panel {
  position: fixed;
  z-index: 9999;
  width: 240px;
  padding: 8px 12px 10px;
  border-radius: 10px;
  background: rgba(24, 28, 36, .85);
  backdrop-filter: blur(16px) saturate(1.3);
  border: 1px solid rgba(255, 255, 255, .08);
  box-shadow: 0 4px 24px rgba(0, 0, 0, .4);
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, .78);
  user-select: none;
  cursor: grab;
  touch-action: none;
}
.perf-panel:active { cursor: grabbing; }

.perf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, .08);
}
.perf-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: rgba(255, 255, 255, .5);
}
.perf-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, .4);
  font-size: 14px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}
.perf-close:hover { color: #f87171; }

/* ── Shared rows ── */
.perf-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}
.perf-label { color: rgba(255, 255, 255, .45); font-size: 12px; }
.perf-value { font-variant-numeric: tabular-nums; }

.perf-gpu {
  font-size: 11px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
  color: rgba(255, 255, 255, .55);
}

/* FPS color classes */
.perf-green { color: #a78bfa; }
.perf-yellow { color: #fbbf24; }
.perf-red { color: #f87171; }

/* JS heap bar */
.perf-bar-track {
  height: 4px;
  background: rgba(255, 255, 255, .08);
  border-radius: 2px;
  margin: 3px 0 5px;
  overflow: hidden;
}
.perf-bar {
  height: 100%;
  background: linear-gradient(90deg, #a78bfa, #6366f1);
  border-radius: 2px;
  transition: width .3s ease;
}

/* FPS sparkline */
.perf-sparkline {
  font-size: 13px;
  line-height: 1.2;
  letter-spacing: .5px;
  color: rgba(255, 255, 255, .35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}

/* Floating panel transition */
.perf-fade-enter-active,
.perf-fade-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}
.perf-fade-enter-from,
.perf-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(.96);
}
</style>
