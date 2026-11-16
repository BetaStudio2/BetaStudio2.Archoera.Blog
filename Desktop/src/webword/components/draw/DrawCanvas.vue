<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAppStore } from '@/webword/stores/app'
import { useDraw } from '@/webword/composables/useDraw'

const appStore = useAppStore()
const { activate, deactivate, setTool, setColor, setSize, clearCanvas, resizeCanvas } = useDraw()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const show = ref(false)

function setupCanvas(): void {
  if (!canvasRef.value) return
  resizeCanvas()
  activate(canvasRef.value)
}

function teardownCanvas(): void {
  deactivate()
}

// Listen for ribbon draw tool events
function onRibbonDrawToolClick(e: Event): void {
  const target = e.target as HTMLElement
  const btn = target.closest('.draw-tool') as HTMLElement | null
  if (!btn) return
  const tool = btn.dataset.tool
  if (tool && tool !== 'select') {
    setTool(tool as any)
    // Update ribbon active state
    document.querySelectorAll('.draw-tool').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
  }
}

function onRibbonDrawColorClick(e: Event): void {
  const target = e.target as HTMLElement
  const swatch = target.closest('.color-swatch') as HTMLElement | null
  if (!swatch) return
  const color = swatch.dataset.color
  if (color) {
    setColor(color)
    const fill = swatch.querySelector('.color-swatch-fill') as HTMLElement | null
    if (fill) fill.style.background = color
  }
}

function onRibbonDrawSizeClick(e: Event): void {
  const target = e.target as HTMLElement
  const btn = target.closest('[data-dropdown="drawSize"]') as HTMLElement | null
  if (!btn) return
  const val = parseInt(btn.dataset.value || '3')
  if (val) setSize(val)
}

function onRibbonDrawUndo(): void {
  clearCanvas()
}

function onRibbonDrawClear(): void {
  clearCanvas()
}

let ribbonEventsBound = false

// Watch active tab
watch(() => appStore.activeTab, (tab) => {
  if (tab === 'draw') {
    show.value = true
    nextTick(() => setupCanvas())
    bindRibbonEvents()
  } else {
    show.value = false
    teardownCanvas()
    unbindRibbonEvents()
  }
}, { immediate: true })

function bindRibbonEvents(): void {
  if (ribbonEventsBound) return
  ribbonEventsBound = true
  const ribbon = document.getElementById('ribbonDraw')
  if (!ribbon) return
  ribbon.addEventListener('click', onRibbonDrawToolClick)
  ribbon.addEventListener('click', onRibbonDrawColorClick)

  const drawSize = document.getElementById('drawSize')
  if (drawSize) drawSize.addEventListener('click', onRibbonDrawSizeClick)

  const drawUndo = document.getElementById('drawUndo')
  if (drawUndo) drawUndo.addEventListener('click', onRibbonDrawUndo)

  const drawClear = document.getElementById('drawClear')
  if (drawClear) drawClear.addEventListener('click', onRibbonDrawClear)
}

function unbindRibbonEvents(): void {
  ribbonEventsBound = false
  const ribbon = document.getElementById('ribbonDraw')
  if (ribbon) {
    ribbon.removeEventListener('click', onRibbonDrawToolClick)
    ribbon.removeEventListener('click', onRibbonDrawColorClick)
  }
  const drawSize = document.getElementById('drawSize')
  if (drawSize) drawSize.removeEventListener('click', onRibbonDrawSizeClick)
  const drawUndo = document.getElementById('drawUndo')
  if (drawUndo) drawUndo.removeEventListener('click', onRibbonDrawUndo)
  const drawClear = document.getElementById('drawClear')
  if (drawClear) drawClear.removeEventListener('click', onRibbonDrawClear)
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  teardownCanvas()
  unbindRibbonEvents()
})

function onResize(): void {
  if (show.value) resizeCanvas()
}
</script>

<template>
  <canvas
    v-show="show"
    ref="canvasRef"
    class="draw-canvas"
    @pointerdown.prevent
    @pointermove.prevent
    @pointerup.prevent
    @pointerleave.prevent
  />
</template>

<style scoped>
.draw-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  cursor: crosshair;
  touch-action: none;
  z-index: 10;
}
</style>
