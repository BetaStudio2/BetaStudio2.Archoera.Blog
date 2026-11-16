<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  visible: boolean
  initialColor?: string
  position?: { top: string; left: string }
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [color: string]
}>()

// Color state
const hue = ref(0)
const saturation = ref(100)
const brightness = ref(100)
const red = ref(255)
const green = ref(0)
const blue = ref(0)
const hex = ref('#FF0000')

// UI refs
const spectrumRef = ref<HTMLDivElement | null>(null)
const hueRef = ref<HTMLDivElement | null>(null)

// Preset colors matching original
const presetColors = [
  '#1a1a1a', '#333333', '#666666', '#999999', '#cccccc', '#e2e8f2', '#ffffff', '#f44336',
  '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688',
  '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548',
  '#607d8b', '#34495e', '#2c3e50', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#1abc9c', '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
  '#f39c12', '#d35400', '#c0392b', '#bdc3c7', '#95a5a6', '#7f8c8d', '#ff0000', '#ffff00',
  '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#000000', '#ffff00', '#00ff00', '#ff6600',
  '#996633', '#cc99ff', '#99ccff', '#99ff99', '#ffcc00'
]

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(100, s)) / 100
  v = Math.max(0, Math.min(100, v)) / 100

  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c

  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    else if (max === g) h = ((b - r) / d + 2) * 60
    else h = ((r - g) / d + 4) * 60
  }

  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) }
}

// RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hx = Math.max(0, Math.min(255, n)).toString(16)
    return hx.length === 1 ? '0' + hx : hx
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

// Hex to RGB
function hexToRgb(hexStr: string): { r: number; g: number; b: number } | null {
  const h = hexStr.replace('#', '')
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    }
  }
  if (h.length === 6) {
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    }
  }
  return null
}

// Update from RGB
function updateFromRgb() {
  const hsv = rgbToHsv(red.value, green.value, blue.value)
  hue.value = hsv.h
  saturation.value = hsv.s
  brightness.value = hsv.v
  hex.value = rgbToHex(red.value, green.value, blue.value)
}

// Update from HSV
function updateFromHsv() {
  const rgb = hsvToRgb(hue.value, saturation.value, brightness.value)
  red.value = rgb.r
  green.value = rgb.g
  blue.value = rgb.b
  hex.value = rgbToHex(rgb.r, rgb.g, rgb.b)
}

// Initialize color
function setColor(color: string) {
  const rgb = hexToRgb(color)
  if (rgb) {
    red.value = rgb.r
    green.value = rgb.g
    blue.value = rgb.b
    updateFromRgb()
  }
}

// Spectrum interaction
const isDraggingSpectrum = ref(false)

function spectrumFromEvent(e: MouseEvent | TouchEvent) {
  if (!spectrumRef.value) return
  const rect = spectrumRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
  saturation.value = Math.round(x * 100)
  brightness.value = Math.round((1 - y) * 100)
  updateFromHsv()
}

function onSpectrumDown(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  isDraggingSpectrum.value = true
  spectrumFromEvent(e)
}

function onSpectrumMove(e: MouseEvent | TouchEvent) {
  if (!isDraggingSpectrum.value) return
  spectrumFromEvent(e)
}

function onSpectrumUp() {
  isDraggingSpectrum.value = false
}

// Hue slider interaction
const isDraggingHue = ref(false)

function hueFromEvent(e: MouseEvent | TouchEvent) {
  if (!hueRef.value) return
  const rect = hueRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  hue.value = Math.round(x * 360)
  updateFromHsv()
}

function onHueDown(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  isDraggingHue.value = true
  hueFromEvent(e)
}

function onHueMove(e: MouseEvent | TouchEvent) {
  if (!isDraggingHue.value) return
  hueFromEvent(e)
}

function onHueUp() {
  isDraggingHue.value = false
}

// Computed positions
const spectrumDotStyle = computed(() => ({
  left: `${saturation.value}%`,
  top: `${100 - brightness.value}%`,
  background: hex.value,
}))

const hueDotStyle = computed(() => ({
  left: `${(hue.value / 360) * 100}%`,
}))

const spectrumBackground = computed(() => {
  const rgb = hsvToRgb(hue.value, 100, 100)
  return `rgb(${rgb.r},${rgb.g},${rgb.b})`
})

// Validate RGB inputs
function onRgbInput() {
  red.value = Math.max(0, Math.min(255, red.value || 0))
  green.value = Math.max(0, Math.min(255, green.value || 0))
  blue.value = Math.max(0, Math.min(255, blue.value || 0))
  updateFromRgb()
}

// Validate hex input
function onHexInput() {
  const val = hex.value.replace(/[^0-9a-fA-F#]/g, '')
  if (val.startsWith('#')) {
    hex.value = val.substring(0, 7).toUpperCase()
  } else {
    hex.value = '#' + val.substring(0, 6).toUpperCase()
  }
}

function onHexBlur() {
  const rgb = hexToRgb(hex.value)
  if (rgb) {
    setColor(hex.value)
  } else {
    hex.value = rgbToHex(red.value, green.value, blue.value)
  }
}

// Pick preset
function pickPreset(color: string) {
  setColor(color)
  emit('select', color)
}

// Close
function close() {
  emit('update:visible', false)
}

function stopPropagation(e: Event) {
  e.stopPropagation()
}

// Global mouse/touch handlers
function onGlobalMove(e: MouseEvent | TouchEvent) {
  onSpectrumMove(e)
  onHueMove(e)
}

function onGlobalUp() {
  onSpectrumUp()
  onHueUp()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    close()
  }
}

// Init
watch(() => props.visible, async (val) => {
  if (val && props.initialColor) {
    await nextTick()
    setColor(props.initialColor)
  }
})

onMounted(() => {
  document.addEventListener('mousemove', onGlobalMove)
  document.addEventListener('mouseup', onGlobalUp)
  document.addEventListener('touchmove', onGlobalMove, { passive: false })
  document.addEventListener('touchend', onGlobalUp)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onGlobalMove)
  document.removeEventListener('mouseup', onGlobalUp)
  document.removeEventListener('touchmove', onGlobalMove)
  document.removeEventListener('touchend', onGlobalUp)
  document.removeEventListener('keydown', onKeydown)
})

// Apply color - emits when preset is clicked or via hex input enter
</script>

<template>
  <div
    v-if="visible"
    class="color-picker-popup show"
    :style="{
      top: position?.top || '0px',
      left: position?.left || '0px',
      opacity: 1,
      visibility: 'visible',
      transform: 'translateY(0) scale(1)',
    }"
    @click.stop="stopPropagation"
  >
    <!-- Spectrum area -->
    <div
      ref="spectrumRef"
      class="color-picker-spectrum"
      :style="{ background: spectrumBackground }"
      @mousedown="onSpectrumDown"
      @touchstart.prevent="onSpectrumDown"
    >
      <div class="color-picker-spectrum-sat"></div>
      <div class="color-picker-spectrum-val"></div>
      <div class="color-picker-spectrum-dot" :style="spectrumDotStyle"></div>
    </div>

    <!-- Hue slider -->
    <div
      ref="hueRef"
      class="color-picker-hue"
      @mousedown="onHueDown"
      @touchstart.prevent="onHueDown"
    >
      <div class="color-picker-hue-dot" :style="hueDotStyle"></div>
    </div>

    <!-- RGB inputs -->
    <div class="color-picker-rgb">
      <label>R</label>
      <input
        type="number"
        :value="red"
        min="0"
        max="255"
        @input="(e) => { red = Number((e.target as HTMLInputElement).value); onRgbInput() }"
      />
      <label>G</label>
      <input
        type="number"
        :value="green"
        min="0"
        max="255"
        @input="(e) => { green = Number((e.target as HTMLInputElement).value); onRgbInput() }"
      />
      <label>B</label>
      <input
        type="number"
        :value="blue"
        min="0"
        max="255"
        @input="(e) => { blue = Number((e.target as HTMLInputElement).value); onRgbInput() }"
      />
    </div>

    <!-- HEX input -->
    <div class="color-picker-hex">
      <input
        type="text"
        :value="hex"
        @input="(e) => { hex = (e.target as HTMLInputElement).value; onHexInput() }"
        @blur="onHexBlur"
        @keyup.enter="onHexBlur"
      />
    </div>

    <!-- Preset color grid -->
    <div class="color-picker-grid">
      <button
        v-for="color in presetColors"
        :key="color"
        class="color-picker-cell"
        :class="{ active: hex.toUpperCase() === color.toUpperCase() }"
        :style="{ background: color }"
        @click="pickPreset(color)"
      ></button>
    </div>
  </div>
</template>
