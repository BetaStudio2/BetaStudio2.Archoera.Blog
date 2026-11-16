<template>
  <Transition
    name="win"
    @before-leave="onBeforeLeave"
    @after-leave="onAfterLeave"
  >
    <div
      v-if="win && !win.closing"
      ref="winRef"
      class="desktop-window"
      :class="{
        maximized: win.maximized,
        'anim-new': animEnter,
        'is-hidden': minimizedState === 'hidden',
        'is-hiding': minimizedState === 'hiding',
        'is-restoring': minimizedState === 'restoring',
        'borderless': isBorderless,
        'is-firefox': isFirefox
      }"
      :style="windowStyle"
      @mousedown="windows.bringToFront(win.id)"
    >
      <!-- 标题栏（无边框窗口隐藏外层标题栏） -->
      <div
        v-if="!isBorderless"
        class="title-bar"
        @pointerdown.prevent="startDrag"
        @dblclick="windows.toggleMaximize(win.id)"
      >
        <div class="title-left">
          <span class="title-icon" v-html="iconSvg"></span>
          <span class="title-text">{{ win.title }}</span>
        </div>
        <div class="title-controls">
          <button class="ctrl-btn minimize" @click="windows.minimize(win.id)" :title="$t('desktop.window.minimize')">
            <svg viewBox="0 0 12 12" width="10" height="10"><rect y="5" width="12" height="2" fill="currentColor"/></svg>
          </button>
          <button class="ctrl-btn" @click="windows.toggleMaximize(win.id)" :title="win.maximized ? $t('desktop.window.restore') : $t('desktop.window.maximize')">
            <span class="btn-icon" :class="win.maximized ? 'icon-restore' : 'icon-maximize'"></span>
          </button>
          <button class="ctrl-btn close" @click="handleClose" :title="$t('common.close')">
            <svg viewBox="0 0 12 12" width="10" height="10"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
          </button>
        </div>
      </div>

      <!-- 窗口内容 -->
      <div class="window-body" ref="bodyRef">
        <div v-if="props.win.id === 'blog'" class="window-inner">
          <!-- 由独立内存路由的 RouterView 渲染 BlogLayout 及其子视图 -->
          <router-view />
        </div>
        <div v-else-if="props.win.id === 'webword'" class="window-inner">
          <WebWordWrapper />
        </div>
        <div v-else-if="props.win.id === 'settings'" class="window-inner">
          <SettingsDialog embedded />
        </div>
        <div v-else-if="props.win.id === 'perfcounter'" class="window-inner">
          <PerfCounter embedded />
        </div>
        <div v-else-if="props.win.id === 'browser'" class="window-inner">
          <Browser />
        </div>
        <div v-else-if="props.win.id === 'explorer'" class="window-inner">
          <Explorer />
        </div>
        <div v-else class="window-placeholder">
          <p>{{ win.title }}</p>
        </div>
      </div>

      <!-- 边缘缩放区（捕获窗口四边与四角，替代固定右下角手柄） -->
      <template v-if="!win.maximized">
        <div class="resize-edge edge-n" @pointerdown.prevent="startResize($event, 'n')"></div>
        <div class="resize-edge edge-s" @pointerdown.prevent="startResize($event, 's')"></div>
        <div class="resize-edge edge-e" @pointerdown.prevent="startResize($event, 'e')"></div>
        <div class="resize-edge edge-w" @pointerdown.prevent="startResize($event, 'w')"></div>
        <div class="resize-edge edge-ne" @pointerdown.prevent="startResize($event, 'ne')"></div>
        <div class="resize-edge edge-nw" @pointerdown.prevent="startResize($event, 'nw')"></div>
        <div class="resize-edge edge-se" @pointerdown.prevent="startResize($event, 'se')"></div>
        <div class="resize-edge edge-sw" @pointerdown.prevent="startResize($event, 'sw')"></div>
      </template>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, inject, provide, shallowReactive, markRaw } from 'vue'
import { useWindowsStore, type WindowState } from '@/stores/windows'
import { TASK_ICONS } from '@/utils/icons'
import SettingsDialog from '@/components/SettingsDialog.vue'
import PerfCounter from '@/perfcounter/PerfCounter.vue'
import Browser from '@/components/Browser.vue'
import Explorer from '@/components/Explorer.vue'
import BlogLayout from '@/components/BlogLayout.vue'
import WebWordWrapper from '@/components/WebWordWrapper.vue'
import { disposeWebWord } from '@/webword/dispose'
import { createRouter, createMemoryHistory, routerKey, routeLocationKey, routerViewLocationKey, viewDepthKey, START_LOCATION } from 'vue-router'

const props = defineProps<{ win: WindowState }>()
const windows = useWindowsStore()

const isFirefox = /Firefox|Zen|Mozilla\/5\.0.*Gecko/i.test(navigator.userAgent) &&
  !/Chrome|Edg|Safari/i.test(navigator.userAgent.replace(/Mozilla|Gecko|Firefox|Zen/g, ''))

const isBorderless = computed(() => props.win.id === 'webword')
// 缓存局部变量，切断 provide 对象中的闭包对响应式 props.win 的引用链
// （避免 vite:vue deepEqual 递归遍历 props → reactive getter → 无限栈溢出）
const _winId = props.win.id
const _borderless = isBorderless.value

function setDragging(isDragging: boolean) {
  const el = winRef.value
  if (el) {
    if (isDragging) el.classList.add('is-dragging')
    else el.classList.remove('is-dragging')
  }
}

function getViewport() {
  return {
    w: document.documentElement.clientWidth,
    h: document.documentElement.clientHeight
  }
}

// 使用 markRaw 标记 provide 对象：
//  - vite:vue 的 HMR deepEqual 遇到 __v_skip 对象会停止递归
//  - 同时对象里的函数闭包不再访问 props，而是访问已缓存的普通变量
provide('windowControl', markRaw({
  windowId: _winId,
  isBorderless: _borderless,
  minimize: () => windows.minimize(_winId),
  toggleMaximize: () => windows.toggleMaximize(_winId),
  close: () => handleClose(),
  bringToFront: () => windows.bringToFront(_winId),
  updatePosition: (x: number, y: number) => {
    const vp = getViewport()
    const taskbarH = 48
    const w = props.win
    const minX = -w.width + 120
    const maxX = vp.w - 120
    const minY = 0
    const maxY = vp.h - taskbarH - 60
    const clampedX = Math.max(minX, Math.min(maxX, x))
    const clampedY = Math.max(minY, Math.min(maxY, y))
    windows.updatePosition(_winId, clampedX, clampedY)
  },
  setDragging,
  getWindowState: () => {
    const w = props.win
    return {
      maximized: w.maximized,
      x: w.x,
      y: w.y,
      width: w.width,
      height: w.height,
    }
  }
}))

// 博客窗口使用独立的内存路由实例，不占用桌面根路由；provide 使窗口内的
// BlogLayout 及其子视图（router-link / router-view / useRoute）均使用该实例。
if (props.win.id === 'blog') {
  const blogRouter = markRaw(createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/blog',
        component: BlogLayout,
        children: [
          { path: '', redirect: '/blog/' },
          { path: '/blog/', name: 'blog-home', component: () => import('@/blog/views/Home.vue') },
          { path: '/blog/category/:path(.*)', name: 'blog-category', component: () => import('@/blog/views/Category.vue') },
          { path: '/blog/article/:path(.*)', name: 'blog-article', component: () => import('@/blog/views/Article.vue') },
        ],
      },
    ],
  }))
  void blogRouter.push('/blog/')
  provide(routerKey, blogRouter)
  // 模仿 vue-router 的注入方式：routeLocationKey 是带属性 getter 的响应式对象（而非 Ref），
  // 供 useLink / useRoute 直接访问 .matched / .params 等属性；
  // routerViewLocationKey 才是 Ref，供 RouterView 渲染。
  const reactiveRoute: Record<string, unknown> = {}
  for (const key in START_LOCATION) {
    Object.defineProperty(reactiveRoute, key, {
      get: () => (blogRouter.currentRoute.value as any)[key],
      enumerable: true,
    })
  }
  // 使用 markRaw 防止 Vite HMR 的 deepEqual 递归遍历导致栈溢出
  markRaw(reactiveRoute)
  provide(routeLocationKey, shallowReactive(reactiveRoute) as any)
  provide(routerViewLocationKey, blogRouter.currentRoute)
  // 窗口内的 RouterView 会继承桌面根路由的嵌套深度（depth=1），导致跳过
  // matched[0]（BlogLayout）而直接渲染 matched[1]（子视图）。这里强制从 depth 0
  // 开始，使 BlogLayout（.blog-app 滚动容器等）正确挂载。
  provide(viewDepthKey, 0)
}

const triggerExit = inject<(id: string) => void>('triggerExit')

function handleClose() {
  triggerExit?.(props.win.id)
  windows.close(props.win.id)
}

// 首次挂载时播放打开动效，后续 v-if 重建（还原）不再播放
const animEnter = ref(true)

onMounted(() => {
  setTimeout(() => {
    animEnter.value = false
  }, 260)
})

const minimizedState = ref<'hiding' | 'hidden' | 'restoring' | null>(null)
const winRef = ref<HTMLElement | null>(null)

if (props.win.minimized) {
  minimizedState.value = 'hidden'
}

watch(() => props.win.minimized, (val) => {
  const el = winRef.value
  if (!el) return
  const t = props.win.minimizeTarget
  if (val) {
    // 最小化：设置收缩到任务栏的 transform 目标值
    if (t) {
      el.style.setProperty('--m-dx', `${t.dx}px`)
      el.style.setProperty('--m-dy', `${t.dy}px`)
      el.style.setProperty('--m-scale', t.scale.toString())
    }
    minimizedState.value = 'hiding'
    setTimeout(() => {
      minimizedState.value = 'hidden'
    }, 260)
  } else if (minimizedState.value === 'hidden') {
    // 还原：从任务栏位置弹回
    if (t) {
      el.style.setProperty('--m-dx', `${t.dx}px`)
      el.style.setProperty('--m-dy', `${t.dy}px`)
      el.style.setProperty('--m-scale', t.scale.toString())
    }
    minimizedState.value = 'restoring'
    setTimeout(() => {
      minimizedState.value = null
      el.style.removeProperty('--m-dx')
      el.style.removeProperty('--m-dy')
      el.style.removeProperty('--m-scale')
      props.win.minimizeTarget = undefined
    }, 260)
  }
})

const bodyRef = ref<HTMLElement | null>(null)
// 使用 documentElement 获取真实视口尺寸，避免被游戏组件覆盖的 window.innerWidth/innerHeight 影响
const viewportW = ref(document.documentElement.clientWidth)
const viewportH = ref(document.documentElement.clientHeight)

function onResize() {
  viewportW.value = document.documentElement.clientWidth
  viewportH.value = document.documentElement.clientHeight
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const windowStyle = computed(() => {
  const w = props.win
  if (w.maximized) {
    return {
      top: '0px',
      left: '0px',
      width: `${viewportW.value}px`,
      height: `${viewportH.value - 48}px`,
      '--win-tx': '0px',
      '--win-ty': '0px',
      '--win-w': `${viewportW.value}px`,
      '--win-h': `${viewportH.value - 48}px`,
      '--win-scale': '1',
      zIndex: w.zIndex,
      willChange: 'auto',
      contain: isFirefox ? 'layout style' : 'layout style paint',
    }
  }
  return {
    top: '0px',
    left: '0px',
    width: `${w.width}px`,
    height: `${w.height}px`,
    '--win-tx': `${w.x}px`,
    '--win-ty': `${w.y}px`,
    '--win-w': `${w.width}px`,
    '--win-h': `${w.height}px`,
    '--win-scale': '1',
    zIndex: w.zIndex,
    willChange: isFirefox ? 'auto' : 'transform',
    contain: isFirefox ? 'layout style' : 'layout style paint',
  }
})


const iconSvg = computed(() => TASK_ICONS[props.win.icon] || '')

// ── Drag ──────────────────────────────
let dragWinEl: HTMLElement | null = null
let dragPointerId = -1

function startDrag(e: PointerEvent) {
  // 点击窗口控制按钮时不启动拖拽，避免 setPointerCapture 吞掉按钮的 click 事件
  if ((e.target as HTMLElement).closest('.ctrl-btn')) return
  if (props.win.maximized) return
  windows.bringToFront(props.win.id)

  const titleEl = e.currentTarget as HTMLElement
  dragWinEl = bodyRef.value?.parentElement ?? null
  if (!titleEl || !dragWinEl) return

  dragWinEl.classList.add('is-dragging')

  const startX = e.clientX
  const startY = e.clientY
  const startWx = props.win.x
  const startWy = props.win.y
  dragPointerId = e.pointerId

  // 使用 Pointer Capture 确保事件不被 iframe 截获
  titleEl.setPointerCapture(e.pointerId)

  function onMove(ev: PointerEvent) {
    // 只处理同一个指针的事件，防止多指干扰
    if (ev.pointerId !== dragPointerId) return
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY
    windows.updatePosition(props.win.id, startWx + dx, startWy + dy)
  }
  function onUp(ev: PointerEvent) {
    if (ev.pointerId !== dragPointerId) return
    dragPointerId = -1
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    dragWinEl?.classList.remove('is-dragging')
    dragWinEl = null
  }
  // 在 document 上监听，确保任何位置的事件都不会丢失
  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

// ── Resize（边缘缩放）────────────────────
let resizePointerId = -1

function startResize(e: PointerEvent, edge: string) {
  if (props.win.maximized) return

  const handleEl = e.currentTarget as HTMLElement
  const winEl = bodyRef.value?.parentElement ?? null
  if (!handleEl || !winEl) return
  winEl.classList.add('is-dragging')

  handleEl.setPointerCapture(e.pointerId)

  const startX = e.clientX
  const startY = e.clientY
  const startWx = props.win.x
  const startWy = props.win.y
  const startW = props.win.width
  const startH = props.win.height
  resizePointerId = e.pointerId

  const MIN_W = 400
  const MIN_H = 300
  const hasE = edge.includes('e')
  const hasW = edge.includes('w')
  const hasN = edge.includes('n')
  const hasS = edge.includes('s')

  function onMove(ev: PointerEvent) {
    if (ev.pointerId !== resizePointerId) return
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY

    let nx = startWx
    let ny = startWy
    let nw = startW
    let nh = startH

    // 右/左边缘调整宽度
    if (hasE) nw = startW + dx
    if (hasW) {
      nw = startW - dx
      nx = startWx + dx
      // 左边缘缩放触及最小宽度时，保持右边缘固定
      if (nw < MIN_W) {
        nx = startWx + (startW - MIN_W)
        nw = MIN_W
      }
    }
    // 下/上边缘调整高度
    if (hasS) nh = startH + dy
    if (hasN) {
      nh = startH - dy
      ny = startWy + dy
      // 上边缘缩放触及最小高度时，保持下边缘固定
      if (nh < MIN_H) {
        ny = startWy + (startH - MIN_H)
        nh = MIN_H
      }
    }

    windows.resizeWindow(props.win.id, { x: nx, y: ny, width: nw, height: nh })
  }
  function onUp(ev: PointerEvent) {
    if (ev.pointerId !== resizePointerId) return
    resizePointerId = -1
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    winEl?.classList.remove('is-dragging')
  }
  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

// ── Transition hooks (close only; minimize uses own animation) ──
function onBeforeLeave(el: Element) {
  const e = el as HTMLElement
  // 关闭：原地缩小淡出
  e.style.removeProperty('--m-dx')
  e.style.removeProperty('--m-dy')
  e.style.removeProperty('--m-scale')
}

function onAfterLeave(el: Element) {
  const e = el as HTMLElement
  if (props.win.closing) {
    windows.removeClosing(props.win.id)
    // WebWord 窗口真正关闭（组件树卸载）后，释放其运行态内存：
    // 文档内容、加载项全局状态、注入的脚本/DOM、Toast 等
    if (props.win.id === 'webword') {
      setTimeout(() => disposeWebWord(), 0)
    }
  }
  e.style.removeProperty('--m-dx')
  e.style.removeProperty('--m-dy')
  e.style.removeProperty('--m-scale')
}
</script>

<style lang="scss" scoped>
.desktop-window {
  position: absolute;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  transform: translate3d(var(--win-tx, 0px), var(--win-ty, 0px), 0) scale(var(--win-scale, 1));
  transform-origin: 50% 50%;
  background: rgba(15,15,35,.6);
  backdrop-filter: blur(28px) saturate(1.15);
  -webkit-backdrop-filter: blur(28px) saturate(1.15);
  border: 1px solid rgba(255,255,255,.06);
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
  min-width: 400px;
  min-height: 300px;

  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;

  &.anim-new {
    animation: win-appear .22s ease backwards;
  }

  transition:
    transform .22s cubic-bezier(.4,0,.2,1),
    width .22s cubic-bezier(.4,0,.2,1),
    height .22s cubic-bezier(.4,0,.2,1),
    border-radius .22s ease,
    border .22s ease,
    opacity .18s ease;

  &.maximized {
    border-radius: 0;
    border: none;
  }

  &.borderless {
    border: none;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow: 0 8px 32px rgba(0,0,0,.4);
  }

  &.no-blur {
    background: #050510;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  &.is-dragging {
    transition: none !important;
  }

  &.is-firefox {
    image-rendering: auto;

    .window-body,
    .window-inner,
    .title-bar {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      -webkit-font-smoothing: subpixel-antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }

    &:not(.is-dragging):not(.anim-new):not(.is-hiding):not(.is-restoring):not(.maximized) {
      transform: translate(var(--win-tx, 0px), var(--win-ty, 0px)) scale(var(--win-scale, 1));
    }
  }
}

// ── Transition: leave (close only) ────────
.win-leave-active {
  transition: opacity .25s cubic-bezier(.4,0,.2,1), transform .25s cubic-bezier(.4,0,.2,1);
}
.win-leave-to {
  opacity: 0;
  transform: translate3d(var(--win-tx, 0px), var(--win-ty, 0px), 0) scale(.85);
}

// ── Minimize animations ────────────────────
.desktop-window.is-hiding {
  animation: minimize-out .26s cubic-bezier(.4,0,.2,1) forwards;
}

.desktop-window.is-hidden {
  opacity: 0;
  pointer-events: none;
  // 隐藏状态也要保留基准位置，再叠加向任务栏偏移的收缩量
  transform: translate3d(
    calc(var(--win-tx, 0px) + var(--m-dx, 0px)),
    calc(var(--win-ty, 0px) + var(--m-dy, 0px)),
    0
  ) scale(var(--m-scale, .85));
}

.desktop-window.is-restoring {
  animation: minimize-in .26s cubic-bezier(.4,0,.2,1) backwards;
}

@keyframes minimize-out {
  from {
    opacity: 1;
    transform: translate3d(var(--win-tx, 0px), var(--win-ty, 0px), 0) scale(1);
  }
  to {
    opacity: 0;
    transform: translate3d(
      calc(var(--win-tx, 0px) + var(--m-dx, 0px)),
      calc(var(--win-ty, 0px) + var(--m-dy, 0px)),
      0
    ) scale(var(--m-scale, .85));
  }
}

@keyframes minimize-in {
  from {
    opacity: 0;
    transform: translate3d(
      calc(var(--win-tx, 0px) + var(--m-dx, 0px)),
      calc(var(--win-ty, 0px) + var(--m-dy, 0px)),
      0
    ) scale(var(--m-scale, .85));
  }
  to {
    opacity: 1;
    transform: translate3d(var(--win-tx, 0px), var(--win-ty, 0px), 0) scale(1);
  }
}

// ── Open animation: new window (not via Transition enter) ─────
@keyframes win-appear {
  from {
    opacity: 0;
    transform: translate3d(var(--win-tx, 0px), calc(var(--win-ty, 0px) + 16px), 0) scale(.92);
  }
  to {
    opacity: 1;
    transform: translate3d(var(--win-tx, 0px), var(--win-ty, 0px), 0) scale(1);
  }
}

// ── Title Bar ──────────────────────────
.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 8px;
  background: rgba(12,12,30,.55);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  cursor: default;
  flex-shrink: 0;
  touch-action: none;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;

  :deep(span) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  :deep(svg),
  :deep(img) {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain;
  }
}

.title-text {
  font-size: 12px;
  color: rgba(255,255,255,.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-controls {
  display: flex;
  gap: 2px;

  .ctrl-btn {
    width: 34px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    color: rgba(255,255,255,.6);
    border-radius: 4px;
    cursor: pointer;
    transition: all .15s;

    &:hover { background: rgba(255,255,255,.1); color: #fff; }

    &.close:hover {
      background: #e81123;
      color: #fff;
    }
  }

  // Maximize / Restore icons
  .btn-icon { display: block; position: relative; width: 10px; height: 10px; }

  .icon-maximize {
    border: 1.5px solid currentColor;
    border-radius: 1.5px;
    width: 10px;
    height: 10px;
  }

  .icon-restore {
    width: 10px;
    height: 10px;
    &::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 8px;
      height: 8px;
      border: 1.5px solid currentColor;
      border-radius: 1.5px;
      background: rgba(15,15,35,.6);
      z-index: 1;
    }
    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 8px;
      height: 8px;
      border: 1.5px solid currentColor;
      border-radius: 1.5px;
    }
  }
}

// ── Body ───────────────────────────────
.window-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.window-inner {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.window-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255,255,255,.3);
  font-size: 14px;
}

// ── 边缘缩放区 ─────────────────────────
// 窗口四边 + 四角：拖动任意边缘即可缩放（替代固定右下角手柄），
// z-index 高于游戏内容层，确保不被游戏盖住。
.resize-edge {
  position: absolute;
  z-index: 100;
  touch-action: none;
}

.edge-n { top: 0; left: 6px; right: 6px; height: 6px; cursor: ns-resize; }
.edge-s { bottom: 0; left: 6px; right: 6px; height: 6px; cursor: ns-resize; }
.edge-e { top: 6px; right: 0; bottom: 6px; width: 6px; cursor: ew-resize; }
.edge-w { top: 6px; left: 0; bottom: 6px; width: 6px; cursor: ew-resize; }
.edge-ne { top: 0; right: 0; width: 14px; height: 14px; cursor: nesw-resize; }
.edge-nw { top: 0; left: 0; width: 14px; height: 14px; cursor: nwse-resize; }
.edge-se { bottom: 0; right: 0; width: 14px; height: 14px; cursor: nwse-resize; }
.edge-sw { bottom: 0; left: 0; width: 14px; height: 14px; cursor: nesw-resize; }
</style>
