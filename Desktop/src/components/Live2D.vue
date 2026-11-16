<template>
  <div
    v-if="widgetVisible"
    ref="hostRef"
    class="live2d-widget"
    :class="{ 'is-exiting': isExiting, 'is-fallback': useFallback }"
  >
    <canvas></canvas>
    <!-- 回退头像 -->
    <img
      v-if="useFallback"
      class="live2d-fallback"
      alt="Live2D"
      :src="fallbackAvatar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { canRunLive2D } from '@/utils/gpu-detector'
import { asset } from '@/utils/siteMode'

// 预置资源位于 public/live2d 下，路径需带部署 base
const fallbackAvatar = asset('live2d/model/雪熊少女头像.png')

const hostRef = ref<HTMLElement | null>(null)
const useFallback = ref(false)
const widgetVisible = ref(false)
const isExiting = ref(false)

const SCRIPT_PATHS = {
  core: asset('live2d/Core/live2dcubismcore.js'),
  modelBundle: asset('live2d/model/model-bundle.js'),
  viewer: asset('live2d/viewer.bundle.js'),
}

async function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load: ${src}`))
    document.head.appendChild(script)
  })
}

function loadSettings(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem('webword_settings') || '{}')
  } catch {
    return {}
  }
}

function isLive2DDisabled(settings: Record<string, any>): boolean {
  return settings.live2dEnabled === false || settings.live2dEnabled === 'false'
}

let live2dMounted = false

async function startLive2D() {
  if (live2dMounted) return
  live2dMounted = true
  useFallback.value = false

  if (!canRunLive2D()) {
    useFallback.value = true
    return
  }

  try {
    await loadScript(SCRIPT_PATHS.core)
    await loadScript(SCRIPT_PATHS.modelBundle)
    await loadScript(SCRIPT_PATHS.viewer)

    const host = hostRef.value
    if (host && (window as any).WebWordLive2D) {
      ;(window as any).WebWordLive2D.mount(host, {
        pointerTarget: document.body
      })
    }
  } catch {
    useFallback.value = true
  }
}

function stopLive2D() {
  live2dMounted = false
  useFallback.value = false
  const host = hostRef.value
  if (host && (host as any).__live2dWidget) {
    try {
      ;(host as any).__live2dWidget.destroy()
    } catch { /* ignore */ }
  }
}

// React to visibility changes — handles both initial mount and toggle
watch(widgetVisible, (visible) => {
  // Wait a tick for the DOM to render (v-if creates the element)
  if (visible) {
    useFallback.value = false
    isExiting.value = false
    requestAnimationFrame(() => startLive2D())
  } else {
    stopLive2D()
  }
})

// 欢迎动画是否完成：完成后才允许显示 Live2D，避免“突兀弹出”
const welcomeReady = ref(false)

function showWidgetIfAllowed() {
  const s = loadSettings()
  if (isLive2DDisabled(s)) {
    isExiting.value = true
    setTimeout(() => { widgetVisible.value = false }, 350)
  } else {
    widgetVisible.value = true
  }
}

// Handle settings toggle events
function onSettingsChanged() {
  if (welcomeReady.value) {
    showWidgetIfAllowed()
  }
  // 欢迎动画期间设置项被关闭：记录即可，等动画结束会重新判定；若是被开启，也等结束后再显示
}

function onWelcomeDone() {
  if (welcomeReady.value) return
  welcomeReady.value = true
  window.removeEventListener('desktop-welcome-done', onWelcomeDone)
  showWidgetIfAllowed()
}

window.addEventListener('live2d-settings-changed', onSettingsChanged)
window.addEventListener('desktop-welcome-done', onWelcomeDone)

// 兜底：若 Home 组件未渲染（例如路由直接跳其他页），3s 后强制视为欢迎完成
const fallbackTimer = window.setTimeout(onWelcomeDone, 3500)

onUnmounted(() => {
  clearTimeout(fallbackTimer)
  window.removeEventListener('live2d-settings-changed', onSettingsChanged)
  window.removeEventListener('desktop-welcome-done', onWelcomeDone)
  stopLive2D()
})
</script>

<style lang="scss" scoped>
.live2d-widget {
  position: fixed;
  bottom: 56px;
  right: 8px;
  z-index: 490;
  width: 200px;
  height: 300px;
  pointer-events: none;
  transition: opacity .35s ease, transform .4s cubic-bezier(.34,1.56,.64,1);
  transform: translateY(0);
  animation: live2d-enter .5s cubic-bezier(.34,1.56,.64,1) backwards;

  &.hidden {
    opacity: 0;
    transform: translateY(20px);
    pointer-events: none;
    animation: none;
  }

  &.is-fallback {
    pointer-events: auto;
  }

  @keyframes live2d-enter {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
  }

  :deep(canvas) {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain;
  }
}

.live2d-fallback {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  opacity: 0.6;
  position: absolute;
  bottom: 0;
  right: 0;
}
</style>
