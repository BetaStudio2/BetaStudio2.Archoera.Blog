<template>
  <div class="blog-app" :class="{ embedded: isEmbedded }">
    <header class="blog-header">
      <div class="header-inner">
        <router-link to="/" class="header-brand">
          <span class="brand-icon">
            <svg viewBox="0 0 32 32" width="24" height="24">
              <rect width="32" height="32" rx="6" fill="#8b5cf6"/>
              <path d="M8 7a1.5 1.5 0 00-1.5 1.5v18A1.5 1.5 0 008 28h16a1.5 1.5 0 001.5-1.5V12l-5-5H8z" fill="#fff" opacity=".95"/>
              <path d="M21 7v5h5" fill="none" stroke="#8b5cf6" stroke-width="1.5" stroke-linejoin="round"/>
              <rect x="11" y="16" width="10" height="1.5" rx=".75" fill="#8b5cf6" opacity=".4"/>
              <rect x="11" y="20" width="7" height="1.5" rx=".75" fill="#8b5cf6" opacity=".4"/>
              <rect x="11" y="24" width="8.5" height="1.5" rx=".75" fill="#8b5cf6" opacity=".4"/>
            </svg>
          </span>
          <span class="brand-text">BetaStudio2 小栈</span>
        </router-link>
        <nav class="header-nav">
          <router-link to="/" class="nav-link" active-class="nav-active" :exact="true">首页</router-link>
          <router-link to="#" class="nav-link" @click.prevent="scrollToCategories">分类</router-link>
          <a href="https://github.com/BetaStudio2" target="_blank" class="nav-link external" rel="noopener">
            GitHub
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
          </a>
        </nav>
      </div>
      <div class="header-progress"><div class="header-progress-bar" ref="progressBarRef"></div></div>
    </header>

    <main class="blog-main">
      <router-view />
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import PerfCounter from '@/perfcounter/PerfCounter.vue'

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
    // Finish on next tick once the view is rendering
    setTimeout(completeBar, 80)
  }
})

const isEmbedded = computed(() => {
  return route.query.embedded === '1' || window.name.includes('embedded')
})

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
</script>

<style lang="scss">
/* ── Reset & Base ── */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #0b0b14;
  color: #e1e4ea;
  line-height: 1.6;
  overflow: hidden;
}

html {
  overflow: hidden;
  height: 100%;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
  cursor: pointer;
}

img {
  max-width: 100%;
  height: auto;
}

/* ── Custom Scrollbar ── */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, .08);
  border-radius: 3px;
  transition: background .2s;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, .15);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, .08) transparent;
}

/* ── App Layout ── */
.blog-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  &.embedded {
    .blog-header {
      padding-top: env(safe-area-inset-top, 0px);
    }
  }
}

/* ── Header ── */
.blog-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(112deg, rgba(28, 34, 48, .72), rgba(18, 22, 34, .74) 48%, rgba(8, 10, 18, .78));
  border-bottom: 1px solid rgba(139, 92, 246, .30);
  box-shadow: 0 22px 64px rgba(0, 0, 0, .30), 0 0 34px rgba(139, 92, 246, .05), inset 0 1px 0 rgba(255, 255, 255, .14), inset 0 -24px 58px rgba(0, 0, 0, .16);
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
  background: linear-gradient(90deg, #8b5cf6, #6366f1);
  box-shadow: 0 0 6px rgba(139, 92, 246, .4);
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
    color: #8b5cf6;
    background: rgba(139, 92, 246, .1);
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

/* ── Responsive (portrait / narrow window) ── */
@media (max-width: 768px) {
  .header-inner,
  .container {
    padding: 0 16px;
  }

  .header-inner {
    height: 52px;
  }

  .header-brand {
    font-size: 15px;
    gap: 8px;
  }

  .brand-text {
    /* 在很窄的屏幕上保留品牌但稍小 */
    font-size: 14px;
  }

  .header-nav {
    gap: 2px;
  }

  .nav-link {
    padding: 6px 10px;
    font-size: 13px;
  }

  .blog-footer {
    padding: 16px;
    margin-top: 48px;
  }

  .footer-inner {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .header-inner,
  .container {
    padding: 0 12px;
  }

  .header-brand .brand-text {
    /* 极窄屏：仅保留图标，隐藏文字避免与导航挤压 */
    display: none;
  }

  .nav-link {
    padding: 6px 8px;
    font-size: 12.5px;
  }

  /* "分类" 按钮在很窄的屏幕可以隐藏，依靠首页内联的分类区块 */
  .nav-link:nth-child(2) {
    display: none;
  }
}
</style>
