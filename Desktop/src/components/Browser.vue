<template>
  <div class="browser-app">
    <!-- 工具栏 -->
    <div class="browser-toolbar">
      <div class="nav-group">
        <button class="nav-btn" :disabled="!canGoBack" :title="t('desktop.browser.back')" @click="goBack">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3L5 8l5 5"/></svg>
        </button>
        <button class="nav-btn" :disabled="!canGoForward" :title="t('desktop.browser.forward')" @click="goForward">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>
        </button>
        <button class="nav-btn" :class="{ spinning: loading }" :title="t('desktop.browser.reload')" @click="reload">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.65 8a5.65 5.65 0 1 1-1.65-4"/><path d="M13.5 2.2v3h-3"/></svg>
        </button>
        <button class="nav-btn" :title="t('desktop.browser.home')" @click="goHome">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7.5L8 3l5.5 4.5"/><path d="M4 7v6h8V7"/></svg>
        </button>
      </div>

      <form class="address-form" @submit.prevent="navigate(addressInput)">
        <div class="address-box">
          <svg v-if="isHome" class="addr-icon" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4">
            <circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5c1.6 1.5 2.4 3.4 2.4 5.5S9.6 12 8 13.5C6.4 12 5.6 10.1 5.6 8S6.4 4 8 2.5z"/>
          </svg>
          <svg v-else-if="isSecure" class="addr-icon secure" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3.5" y="7" width="9" height="6" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>
          </svg>
          <input
            v-model="addressInput"
            class="address-input"
            :placeholder="t('desktop.browser.addressPlaceholder')"
            spellcheck="false"
            autocomplete="off"
          />
          <span v-if="loading" class="load-spinner" aria-hidden="true"></span>
        </div>
        <button class="tool-btn go-btn" type="submit" :title="t('desktop.browser.go')">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h9M9 4.5L12.5 8 9 11.5"/></svg>
        </button>
        <!-- 代理依赖后端 /api/proxy，静态站点下隐藏 -->
        <button v-if="!STATIC_MODE" class="tool-btn" :class="{ 'proxy-on': proxyMode }" type="button" :title="t('desktop.browser.proxy')" @click="toggleProxy">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.8l5 1.8v4c0 2.9-2.1 5.3-5 6.2-2.9-.9-5-3.3-5-6.2v-4L8 1.8z"/><path d="M5.9 8l1.5 1.5 2.7-2.8"/></svg>
        </button>
        <button class="tool-btn" type="button" :disabled="isHome" :title="t('desktop.browser.openExternal')" @click="openExternal">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 3.5h-3v9h9v-3M9 3.5h3.5V7"/><path d="M12.5 3.5L7 9"/></svg>
        </button>
      </form>
    </div>

    <!-- 内容区 -->
    <div class="browser-body">
      <!-- 起始页 -->
      <div v-show="isHome" class="browser-start">
        <div class="start-inner">
          <div class="start-globe">
            <span class="globe-glow"></span>
            <svg viewBox="0 0 48 48" width="46" height="46" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="24" cy="24" r="18"/><path d="M24 6c6 5.5 9 11.5 9 18s-3 12.5-9 18c-6-5.5-9-11.5-9-18s3-12.5 9-18z"/><path d="M6 24h36"/>
            </svg>
          </div>

          <form class="start-search" @submit.prevent="navigate(addressInput)">
            <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            <input
              v-model="addressInput"
              class="search-input"
              :placeholder="t('desktop.browser.addressPlaceholder')"
              spellcheck="false"
              autocomplete="off"
            />
            <button class="search-go" type="submit" :title="t('desktop.browser.go')">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h9M9 4.5L12.5 8 9 11.5"/></svg>
            </button>
          </form>

          <h2 class="start-title">{{ t('desktop.browser.startTitle') }}</h2>
          <div class="quick-grid">
            <button
              v-for="link in quickLinks"
              :key="link.url"
              class="quick-card"
              @click="navigate(link.url)"
            >
              <span class="quick-icon" :style="`background: linear-gradient(135deg, ${link.color}, ${link.color2})`">
                <span class="quick-letter">{{ link.label[0] }}</span>
              </span>
              <span class="quick-label">{{ link.label }}</span>
            </button>
          </div>
          <p class="start-hint">{{ t('desktop.browser.startHint') }}</p>
        </div>
      </div>

      <!-- 网页内容 -->
      <iframe
        v-show="!isHome"
        ref="frameRef"
        :key="frameKey"
        class="browser-frame"
        :src="frameSrc"
        referrerpolicy="no-referrer"
        allow="fullscreen"
        @load="onFrameLoad"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { STATIC_MODE } from '@/utils/siteMode'

const { t } = useI18n()

/** 起始页虚拟地址 */
const HOME_URL = 'browser:home'

const currentUrl = ref(HOME_URL)
const addressInput = ref('')
const loading = ref(false)
const proxyMode = ref(false)
const frameKey = ref(0)

const history = ref<string[]>([])
const historyIndex = ref(-1)

const isHome = computed(() => currentUrl.value === HOME_URL)
const isSecure = computed(() => currentUrl.value.startsWith('https://'))
const canGoBack = computed(() => historyIndex.value > 0)
const canGoForward = computed(() => historyIndex.value < history.value.length - 1)

/** 代理模式下，外站页面经后端代理抓取，可绕过 iframe 嵌入限制 */
const frameSrc = computed(() => {
  if (isHome.value) return ''
  if (proxyMode.value && /^https?:/i.test(currentUrl.value)) {
    return '/api/proxy?url=' + encodeURIComponent(currentUrl.value)
  }
  return currentUrl.value
})

const quickLinks = [
  { label: 'Bing', url: 'https://www.bing.com', color: '#38bdf8', color2: '#0284c7' },
  { label: 'Wikipedia', url: 'https://www.wikipedia.org', color: '#cbd5e1', color2: '#64748b' },
  { label: 'GitHub', url: 'https://github.com', color: '#a78bfa', color2: '#7c3aed' },
  { label: '百度', url: 'https://www.baidu.com', color: '#fb923c', color2: '#c2410c' },
  { label: '哔哩哔哩', url: 'https://www.bilibili.com', color: '#fb7185', color2: '#e11d48' },
  { label: '掘金', url: 'https://juejin.cn', color: '#fbbf24', color2: '#d97706' },
]

/** 规范化输入：站内路径 / 网址原样保留，缺协议补 https，其余当作搜索词 */
function normalize(raw: string): string {
  const input = raw.trim()
  if (!input) return ''
  if (input === 'home') return HOME_URL
  if (input.startsWith('/')) return input
  if (/^(https?|data):/i.test(input)) return input
  if (
    /^localhost(:\d+)?$/i.test(input) ||
    /^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/.*)?$/.test(input) ||
    /^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(input)
  ) {
    return 'https://' + input
  }
  return 'https://www.bing.com/search?q=' + encodeURIComponent(input)
}

function syncAddress() {
  addressInput.value = isHome.value ? '' : currentUrl.value
}

function navigate(raw: string) {
  const url = normalize(raw)
  if (!url) return
  if (url === HOME_URL) {
    goHome()
    return
  }
  if (url === currentUrl.value && !isHome.value) {
    reload()
    return
  }
  currentUrl.value = url
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(url)
  historyIndex.value = history.value.length - 1
  syncAddress()
  frameKey.value++
  loading.value = true
}

function goHome() {
  currentUrl.value = HOME_URL
  syncAddress()
}

function goBack() {
  if (!canGoBack.value) return
  historyIndex.value--
  currentUrl.value = history.value[historyIndex.value]
  syncAddress()
  if (!isHome.value) {
    frameKey.value++
    loading.value = true
  }
}

function goForward() {
  if (!canGoForward.value) return
  historyIndex.value++
  currentUrl.value = history.value[historyIndex.value]
  syncAddress()
  frameKey.value++
  loading.value = true
}

function reload() {
  if (isHome.value) return
  frameKey.value++
  loading.value = true
}

function toggleProxy() {
  proxyMode.value = !proxyMode.value
  // 已打开页面即时切换加载方式
  if (!isHome.value) {
    frameKey.value++
    loading.value = true
  }
}

function onFrameLoad() {
  loading.value = false
}

function openExternal() {
  if (isHome.value) return
  window.open(currentUrl.value, '_blank', 'noopener')
}

// ── iframe 内 SPA 导航同步（经代理注入脚本 postMessage 上报）──
const frameRef = ref<HTMLIFrameElement | null>(null)

function onFrameMessage(e: MessageEvent) {
  const d = e.data
  if (!d || d.type !== 'browser-nav') return
  if (e.source !== frameRef.value?.contentWindow) return
  const url = typeof d.url === 'string' ? d.url : ''
  if (!/^https?:/i.test(url)) return
  // 页面内部（history API / JS）导航：同步地址栏与历史，但不重载 iframe
  addressInput.value = url
  if (history.value[historyIndex.value] !== url) {
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(url)
    historyIndex.value = history.value.length - 1
  }
}

onMounted(() => window.addEventListener('message', onFrameMessage))
onUnmounted(() => window.removeEventListener('message', onFrameMessage))
</script>

<style lang="scss" scoped>
.browser-app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #0d0d20;
  color: #fff;
  font-family: 'Segoe UI', -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  user-select: none;
}

// ── 工具栏 ────────────────────────────
.browser-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  flex-shrink: 0;
  background: rgba(12, 12, 30, .6);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border-bottom: 1px solid rgba(255, 255, 255, .06);
}

.nav-group {
  display: flex;
  gap: 2px;
}

.nav-btn, .tool-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: rgba(255, 255, 255, .75);
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s, color .15s, opacity .15s, transform .15s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, .1);
    color: #fff;
    transform: translateY(-1px);
  }
  &:active:not(:disabled) {
    transform: translateY(0) scale(.94);
  }
  &:disabled {
    opacity: .3;
    cursor: default;
  }
  &.spinning svg { animation: nav-spin .8s linear infinite; }
  &.proxy-on {
    color: #fb923c;
    background: rgba(249, 115, 22, .15);
  }
}

@keyframes nav-spin {
  to { transform: rotate(360deg); }
}

.address-form {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.address-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border-radius: 15px;
  background: rgba(255, 255, 255, .07);
  border: 1px solid rgba(255, 255, 255, .08);
  transition: background .15s, border-color .15s, box-shadow .15s;
  min-width: 0;

  &:focus-within {
    background: rgba(255, 255, 255, .1);
    border-color: rgba(102, 126, 234, .5);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, .12);
  }
}

.addr-icon {
  color: rgba(255, 255, 255, .4);
  flex-shrink: 0;

  &.secure { color: #34d399; }
}

.address-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: none;
  color: #fff;
  font-size: 12.5px;

  &::placeholder { color: rgba(255, 255, 255, .3); }
}

.load-spinner {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, .15);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: nav-spin .7s linear infinite;
}

// ── 内容区 ────────────────────────────
.browser-body {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.browser-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

// ── 起始页 ────────────────────────────
.browser-start {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 7vh 24px 40px;
  background:
    radial-gradient(ellipse 60% 45% at 18% 8%, rgba(102, 126, 234, .16) 0%, transparent 60%),
    radial-gradient(ellipse 55% 45% at 85% 85%, rgba(249, 115, 22, .12) 0%, transparent 60%),
    radial-gradient(ellipse 40% 35% at 65% 25%, rgba(168, 85, 247, .08) 0%, transparent 55%),
    linear-gradient(180deg, #101026 0%, #0d0d20 70%);
}

.start-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 560px;
  animation: start-in .45s cubic-bezier(.22, 1, .36, 1);
}

@keyframes start-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

// 地球 Logo
.start-globe {
  position: relative;
  width: 76px;
  height: 76px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
  box-shadow:
    0 12px 36px rgba(249, 115, 22, .35),
    inset 0 1px 0 rgba(255, 255, 255, .25);
  margin-bottom: 22px;
}

.globe-glow {
  position: absolute;
  inset: -18px;
  border-radius: 40px;
  background: radial-gradient(circle, rgba(249, 115, 22, .22) 0%, transparent 70%);
  animation: globe-pulse 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes globe-pulse {
  0%, 100% { opacity: .6; transform: scale(.92); }
  50% { opacity: 1; transform: scale(1.08); }
}

// 大搜索框
.start-search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 46px;
  padding: 0 6px 0 18px;
  border-radius: 23px;
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, .25);
  transition: background .2s, border-color .2s, box-shadow .2s;

  &:focus-within {
    background: rgba(255, 255, 255, .09);
    border-color: rgba(102, 126, 234, .55);
    box-shadow:
      0 0 0 3px rgba(102, 126, 234, .16),
      0 6px 28px rgba(0, 0, 0, .3);
  }
}

.search-icon {
  color: rgba(255, 255, 255, .4);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: none;
  color: #fff;
  font-size: 14px;

  &::placeholder { color: rgba(255, 255, 255, .35); }
}

.search-go {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
  color: #fff;
  cursor: pointer;
  transition: transform .15s, box-shadow .15s, filter .15s;

  &:hover {
    filter: brightness(1.08);
    box-shadow: 0 4px 14px rgba(249, 115, 22, .4);
  }
  &:active { transform: scale(.92); }
}

.start-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: .5px;
  margin: 26px 0 14px;
  color: rgba(255, 255, 255, .85);
}

// 快捷访问卡片
.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 8px 14px;
  border: 1px solid rgba(255, 255, 255, .07);
  border-radius: 16px;
  background: rgba(255, 255, 255, .04);
  cursor: pointer;
  color: #fff;
  transition: transform .18s cubic-bezier(.34, 1.56, .64, 1), background .18s, border-color .18s, box-shadow .18s;

  &:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, .07);
    border-color: rgba(255, 255, 255, .14);
    box-shadow: 0 10px 28px rgba(0, 0, 0, .35);

    .quick-icon {
      transform: translateY(-2px) scale(1.06);
      box-shadow: 0 8px 20px rgba(0, 0, 0, .35);
    }
  }
  &:active {
    transform: translateY(-2px) scale(.97);
  }
}

.quick-icon {
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .3), inset 0 1px 0 rgba(255, 255, 255, .28);
  transition: transform .18s cubic-bezier(.34, 1.56, .64, 1), box-shadow .18s;
}

.quick-letter {
  font-size: 19px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, .3);
}

.quick-label {
  font-size: 12px;
  color: rgba(255, 255, 255, .75);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.start-hint {
  margin-top: 24px;
  font-size: 11px;
  color: rgba(255, 255, 255, .3);
  text-align: center;
  max-width: 460px;
  line-height: 1.6;
}
</style>
