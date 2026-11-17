<template>
  <!-- Splash Screen: Terminal-frame dmesg boot -->
  <Transition name="splash-fade">
    <div v-if="showSplash" class="boot-splash">
      <div class="decor-prompt">❯ _</div>
      <div class="decor-terminal">BetaStudio2 小栈
---
node v22.14.0
vue 3.4.0</div>
      <div class="splash-terminal">
        <div class="splash-header">
          <span class="splash-title">BetaStudio2 小栈 — Boot Sequence</span>
          <span class="splash-subtitle">{{ statusText }}</span>
        </div>
        <div class="splash-body" ref="viewportRef">
          <div v-for="(entry, i) in log" :key="i" class="boot-line" :class="entry.type">
            <span class="boot-msg">{{ entry.text }}</span>
          </div>
          <div v-if="!bootDone" class="boot-line typing">
            <span class="boot-msg">{{ typingText }}<span class="cursor">▊</span></span>
          </div>
        </div>
        <div class="boot-progress-track">
          <div class="boot-progress" :style="{ width: pct + '%' }"></div>
        </div>
      </div>
    </div>
  </Transition>

  <div class="blog-app">
    <header class="blog-header">
      <div class="header-inner">
        <router-link to="/blog/" class="header-brand">
          <span class="brand-icon">
            <svg viewBox="0 0 32 32" width="24" height="24">
              <rect width="32" height="32" rx="6" fill="#42b883"/>
              <path d="M8 7a1.5 1.5 0 00-1.5 1.5v18A1.5 1.5 0 008 28h16a1.5 1.5 0 001.5-1.5V12l-5-5H8z" fill="#fff" opacity=".95"/>
              <path d="M21 7v5h5" fill="none" stroke="#42b883" stroke-width="1.5" stroke-linejoin="round"/>
              <rect x="11" y="16" width="10" height="1.5" rx=".75" fill="#42b883" opacity=".4"/>
              <rect x="11" y="20" width="7" height="1.5" rx=".75" fill="#42b883" opacity=".4"/>
              <rect x="11" y="24" width="8.5" height="1.5" rx=".75" fill="#42b883" opacity=".4"/>
            </svg>
          </span>
          <span class="brand-text">BetaStudio2 小栈</span>
        </router-link>
        <nav class="header-nav">
          <router-link to="/blog/" class="nav-link" active-class="nav-active" :exact="true">{{ $t('blog.home') }}</router-link>
          <router-link to="#" class="nav-link" @click.prevent="scrollToCategories">{{ $t('blog.navCategories') }}</router-link>
          <a href="https://github.com/BetaStudio2" target="_blank" class="nav-link external" rel="noopener">
            GitHub
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
          </a>
        </nav>
      </div>
      <div class="header-progress"><div class="header-progress-bar" ref="progressBarRef"></div></div>
    </header>

    <main class="blog-main">
      <router-view v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>

    <footer class="blog-footer">
      <div class="footer-inner">
        <p>&copy; {{ new Date().getFullYear() }} BetaStudio2. Built with passion.</p>
      </div>
    </footer>
  </div>
  <PerfCounter ref="perfRef" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import PerfCounter from '@/perfcounter/PerfCounter.vue'
import { asset } from '@/utils/siteMode'

const route = useRoute()
const perfRef = ref<InstanceType<typeof PerfCounter> | null>(null)

// Keyboard shortcut: Ctrl+Shift+P toggle PerfCounter
function onKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault()
    perfRef.value?.toggle()
  }
}
function onTogglePerf() { perfRef.value?.toggle() }
onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('toggle-perfcounter', onTogglePerf)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('toggle-perfcounter', onTogglePerf)
})

const progressBarRef = ref<HTMLDivElement | null>(null)
let loadingTimer: ReturnType<typeof setTimeout> | null = null

function advanceBar(pct: number) {
  if (!progressBarRef.value) return
  progressBarRef.value.style.width = pct + '%'
}

function showBar() {
  if (!progressBarRef.value) return
  const bar = progressBarRef.value
  bar.style.opacity = '1'
  bar.style.transition = 'width .18s ease, opacity .25s ease'
  advanceBar(0)
  void bar.offsetWidth
  advanceBar(68)
}

function completeBar() {
  if (!progressBarRef.value) return
  progressBarRef.value.style.transition = 'width .1s ease, opacity .4s ease'
  advanceBar(100)
  if (loadingTimer) clearTimeout(loadingTimer)
  loadingTimer = setTimeout(() => {
    if (progressBarRef.value) progressBarRef.value.style.opacity = '0'
    loadingTimer = null
  }, 200)
}

// Initial page load
onMounted(() => {
  showBar()
  setTimeout(completeBar, 120)
})

// Route change loading
watch(() => route.path, (newPath, oldPath) => {
  if (oldPath && newPath !== oldPath) {
    showBar()
    setTimeout(completeBar, 80)
  }
})

/* ── Real Boot Sequence with API Checks ── */

interface BootEntry {
  type: string
  text: string
}

const showSplash = ref(true)
const viewportRef = ref<HTMLElement | null>(null)
const log = ref<BootEntry[]>([])
const typingText = ref('')
const bootDone = ref(false)
const pct = ref(0)
const statusText = ref('')

function commitLine(type: string, text: string) {
  log.value.push({ type, text })
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function bootStep(step: { type: string; label: string; action?: () => Promise<void> }, pctStart: number, pctEnd: number, total: number) {
  pct.value = pctStart
  statusText.value = '[' + (log.value.length + 1) + '/' + total + ']'

  if (log.value.length === 0) {
    // First line: type "boot" char by char
    for (let i = 1; i <= 4; i++) {
      typingText.value = step.label.slice(0, i)
      await delay(25 + Math.random() * 30)
    }
    commitLine(step.type, step.label)
    typingText.value = ''
    pct.value = pctStart + (pctEnd - pctStart) * 0.3
    await delay(80)
  } else {
    commitLine(step.type, step.label)
    await delay(10)
    pct.value = pctStart + (pctEnd - pctStart) * 0.4
  }

  if (step.action) {
    try {
      await step.action()
      const last = log.value[log.value.length - 1]
      last.type = 'ok'
    } catch (e: any) {
      const last = log.value[log.value.length - 1]
      last.type = 'warn'
    }
  }

  pct.value = pctEnd
  scrollBottom()
  await delay(10)
}

async function startBoot() {
  const steps = [
    { type: 'info', label: 'boot' },
    { type: 'info', label: 'Booting BetaStudio2 小栈 ...' },
    { type: 'info', label: 'Initializing Vue application' },
    { type: 'info', label: 'Mounting Pinia store modules' },
    { type: 'info', label: 'Configuring route table, 8 entries' },
    {
      type: 'info', label: 'Connecting to API server',
      // 原为真实网络请求；开发期 Vite HMR / 预览重载会在请求在途时取消并产生 ERR_ABORTED 噪音，
      // 连通性由实际视图自行加载并反馈，此处仅保留视觉仪式感。
      action: async () => { await delay(90) }
    },
    {
      type: 'info', label: 'Fetching document index',
      action: async () => { await delay(120) }
    },
    {
      type: 'info', label: 'Pre-loading Live2D assets',
      action: async () => {
        // Check if Live2D is enabled — handle both string "false" and boolean false
        try {
          const s = JSON.parse(localStorage.getItem('webword_settings') || '{}')
          if (s.live2dEnabled === false || s.live2dEnabled === 'false') return
        } catch { /* ignore */ }

        // GPU capability check (same as Live2D.vue's canRunLive2D)
        const { canRunLive2D } = await import('@/utils/gpu-detector')
        if (!canRunLive2D()) return

        // Preload Live2D scripts
        const scripts = [
          asset('live2d/Core/live2dcubismcore.js'),
          asset('live2d/model/model-bundle.js'),
          asset('live2d/viewer.bundle.js'),
        ]
        for (const src of scripts) {
          await new Promise<void>((resolve, reject) => {
            const el = document.createElement('script')
            el.src = src
            el.async = true
            el.onload = () => resolve()
            el.onerror = () => reject(new Error(`Failed to load: ${src}`))
            document.head.appendChild(el)
          })
        }
      }
    },
    { type: 'info', label: 'Applying styles and assets' },
    { type: 'info', label: 'Rendering application viewport' },
    { type: 'ok', label: 'All systems operational.  Welcome, BetaStudio2.' },
  ]

  const total = steps.length
  for (let i = 0; i < total; i++) {
    const pctStart = (i / total) * 100
    const pctEnd = ((i + 1) / total) * 100
    await bootStep(steps[i], pctStart, pctEnd, total)
  }

  bootDone.value = true
  statusText.value = 'Ready.'
  await delay(700)
  showSplash.value = false
}

function scrollBottom() {
  setTimeout(() => {
    viewportRef.value?.scrollTo({ top: viewportRef.value.scrollHeight, behavior: 'smooth' })
  }, 20)
}

function scrollToCategories() {
  const el = document.querySelector('.category-section')
  if (el) {
    const container = document.querySelector('.blog-app')
    if (container) {
      const top = el.getBoundingClientRect().top + container.scrollTop - 70
      container.scrollTo({ top, behavior: 'smooth' })
    }
  }
}

onMounted(() => {
  startBoot()
})
</script>

<style lang="scss">
/* ── Terminal-frame dmesg Boot Splash ── */
.boot-splash {
  position: absolute;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    /* Dot grid */
    radial-gradient(circle, rgba(66, 184, 131, .07) 1px, transparent 1px),
    /* Center glow */
    radial-gradient(ellipse at 50% 50%, rgba(66, 184, 131, .08) 0%, transparent 60%),
    /* Top-left highlight */
    radial-gradient(ellipse 500px 400px at 15% 20%, rgba(66, 184, 131, .06) 0%, transparent 60%),
    /* Bottom-right accent */
    radial-gradient(ellipse 400px 300px at 85% 80%, rgba(34, 211, 238, .05) 0%, transparent 60%),
    #0b0b14;
  background-size: 28px 28px, 100% 100%, 100% 100%, 100% 100%, auto;
  background-repeat: repeat, no-repeat, no-repeat, no-repeat, no-repeat;

  &::before {
    content: '';
    position: absolute;
    pointer-events: none;
    z-index: 0;
    inset: 0;
    border: 1px solid rgba(66, 184, 131, .04);
    border-radius: 0;
  }

  /* Top-left bracket */
  &::after {
    content: '{  }';
    position: absolute;
    top: 50px;
    left: 50px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 56px;
    color: rgba(66, 184, 131, .12);
    letter-spacing: 6px;
    pointer-events: none;
    line-height: 1;
    font-weight: 200;
  }
}

/* Bottom-right decor */
.boot-splash .decor-terminal {
  position: absolute;
  bottom: 60px;
  right: 60px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: rgba(66, 184, 131, .12);
  pointer-events: none;
  text-align: right;
  line-height: 1.8;
  white-space: pre;
  letter-spacing: .02em;
}

/* Mid-left prompt */
.boot-splash .decor-prompt {
  position: absolute;
  top: 50%;
  left: 40px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 36px;
  color: rgba(66, 184, 131, .08);
  pointer-events: none;
  transform: translateY(-50%);
  line-height: 1.4;
}

.splash-terminal {
  width: 660px;
  max-width: 92vw;
  border: 1px solid rgba(66, 184, 131, .2);
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  box-shadow:
    0 0 4px rgba(66, 184, 131, .08),
    0 0 20px rgba(66, 184, 131, .06),
    0 0 80px rgba(66, 184, 131, .03),
    inset 0 0 30px rgba(0, 0, 0, .5);
  position: relative;
}

/* CRT scanline overlay */
.splash-terminal::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, .03) 2px,
    rgba(0, 0, 0, .03) 4px
  );
}

.splash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(180deg, rgba(66, 184, 131, .07), rgba(66, 184, 131, .03));
  border-bottom: 1px solid rgba(66, 184, 131, .1);
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  position: relative;
  z-index: 3;

  /* Traffic-light dots */
  &::before {
    content: '';
    display: flex;
    gap: 6px;
    width: 44px;
    height: 10px;
    background:
      radial-gradient(circle 4px at 4px 50%, rgba(255, 95, 87, .7) 100%, transparent),
      radial-gradient(circle 4px at 16px 50%, rgba(255, 189, 46, .7) 100%, transparent),
      radial-gradient(circle 4px at 28px 50%, rgba(39, 201, 63, .7) 100%, transparent);
    background-size: 12px 8px;
    background-repeat: no-repeat;
    background-position: 0 50%, 12px 50%, 24px 50%;
    order: -1;
    opacity: .6;
  }
}

.splash-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, .45);
  letter-spacing: .02em;
  margin-left: 8px;
}

.splash-subtitle {
  font-size: 11px;
  color: rgba(66, 184, 131, .5);
}

.splash-body {
  height: 320px;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.7;
  color: #c0c0c0;
  position: relative;
  z-index: 1;

  /* Subtle vignette */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0, 0, 0, .25) 100%);
    z-index: 1;
  }
}

.splash-body::-webkit-scrollbar { width: 4px; }
.splash-body::-webkit-scrollbar-track { background: transparent; }
.splash-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, .04); border-radius: 2px; }

.boot-line {
  white-space: pre-wrap;
  word-break: break-all;
  min-height: 1.7em;
  position: relative;
  z-index: 2;
}

.boot-line.info .boot-msg { color: #c0c0c0; }
.boot-line.ok   .boot-msg {
  color: #4ade80;
  text-shadow: 0 0 6px rgba(74, 222, 128, .15);
}
.boot-line.warn .boot-msg {
  color: #fbbf24;
  text-shadow: 0 0 6px rgba(251, 191, 36, .1);
}

/* Typing line gets a subtle glow */
.typing {
  .boot-msg {
    text-shadow: 0 0 4px rgba(74, 222, 128, .08);
  }
}

.cursor {
  color: #4ade80;
  text-shadow: 0 0 8px rgba(74, 222, 128, .4);
  animation: blink .6s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.boot-progress-track {
  height: 3px;
  background: rgba(255, 255, 255, .03);
  position: relative;
  z-index: 3;
}

.boot-progress {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22d3ee);
  transition: width .2s ease;
  box-shadow: 0 0 8px rgba(74, 222, 128, .2);
}

.splash-fade-enter-active { transition: opacity .4s ease; }
.splash-fade-leave-active { transition: opacity .5s ease; }
.splash-fade-enter-from,
.splash-fade-leave-to { opacity: 0; }

/* ── Blog Reset & Base ── */
.blog-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
  background: #0b0b14;
}

/* 独立访问 /blog（不在桌面窗口内）时，父级 .desktop-app 没有确定高度，
   百分比高度会退化为 auto，导致内容无法滚动。这里直接给满屏高度。
   （全局 webword 样式把 body 设为 overflow:hidden，必须由 .blog-app 自行滚动） */
.desktop-app > .blog-app {
  height: 100vh;
  height: 100dvh;
}

/* ── Background Decorations ── */
.blog-app::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    /* Dot grid */
    radial-gradient(circle, rgba(255, 255, 255, .04) 1px, transparent 1px),
    /* Green glow top-left */
    radial-gradient(ellipse 800px 500px at 0% 0%, rgba(66, 184, 131, .08) 0%, transparent 70%),
    /* Small glow top-right */
    radial-gradient(ellipse 400px 300px at 80% 10%, rgba(66, 184, 131, .05) 0%, transparent 70%);
  background-size: 32px 32px, 100% 100%, 100% 100%;
  background-repeat: repeat, no-repeat, no-repeat;
}

.blog-main {
  position: relative;
  z-index: 1;
}

.blog-header,
.blog-footer {
  position: relative;
  z-index: 2;
}

.blog-app * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.blog-app body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #0b0b14;
  color: #e1e4ea;
  line-height: 1.6;
  overflow: hidden;
}

.blog-app a {
  color: inherit;
  text-decoration: none;
}

.blog-app button {
  font-family: inherit;
  cursor: pointer;
}

.blog-app img {
  max-width: 100%;
  height: auto;
}

/* ── Custom Scrollbar ── */
.blog-app ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.blog-app ::-webkit-scrollbar-track {
  background: transparent;
}

.blog-app ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, .08);
  border-radius: 3px;
  transition: background .2s;
}

.blog-app ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, .15);
}

.blog-app * {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, .08) transparent;
}

// ── Page Transition ──
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Glass Variables ── */
.blog-app {
  --glass-border: rgba(66, 184, 131, .30);
  --glass-shadow: 0 24px 72px rgba(0, 0, 0, .38), 0 0 42px rgba(66, 184, 131, .06), inset 0 1px 0 rgba(255, 255, 255, .14), inset 0 -28px 64px rgba(0, 0, 0, .14);
}

/* ── Header *with high-contrast glass effect ── */
.blog-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(112deg, rgba(28, 34, 48, .72), rgba(18, 22, 34, .74) 48%, rgba(8, 10, 18, .78));
  border-bottom: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(16px) saturate(1.3);
  -webkit-backdrop-filter: blur(16px) saturate(1.3);
}

/* ── Header scroll-progress bar ── */
.header-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  pointer-events: none;
  overflow: hidden;
}
.header-progress-bar {
  height: 100%;
  width: 0%;
  opacity: 0;
  background: linear-gradient(90deg, #42b883, #22d3ee);
  box-shadow: 0 0 6px rgba(66, 184, 131, .4);
}

.header-inner {
  /* 页头不设最大宽度：品牌贴最左，导航贴最右 */
  padding: 0 clamp(20px, 3vw, 56px);
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  transition: opacity .15s;

  &:hover { opacity: .85; }
}

.brand-icon {
  display: flex;
  align-items: center;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, .6);
  transition: all .15s;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, .06);
  }

  &.nav-active {
    color: #42b883;
    background: rgba(66, 184, 131, .1);
  }

  &.external svg {
    display: inline;
    vertical-align: middle;
    margin-left: 2px;
  }
}

/* ── Main ── */
.blog-main {
  flex: 1;
}

/* ── Footer ── */
.blog-footer {
  border-top: 1px solid rgba(255, 255, 255, .04);
  padding: 24px;
  margin-top: 80px;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, .3);
}

/* ── Utility ── */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .header-inner {
    padding: 0 16px;
    height: 52px;
  }

  .header-nav {
    gap: 2px;
  }

  .nav-link {
    padding: 6px 10px;
    font-size: 13px;
    white-space: nowrap;
  }

  .container {
    padding: 0 16px;
  }
}

@media (max-width: 480px) {
  .header-inner {
    padding: 0 12px;
  }

  .brand-text {
    /* 极窄屏只保留图标，避免与导航挤压换行 */
    display: none;
  }

  .nav-link {
    padding: 6px 8px;
    font-size: 12.5px;
  }

  .container {
    padding: 0 12px;
  }
}
</style>
