<template>
  <!-- ── 对话框模式（遮罩层） ── -->
  <div v-if="!embedded" class="settings-overlay" @click.self="$emit('close')">
    <div class="settings-panel" @click.stop>
      <div class="settings-layout">
        <!-- 侧边栏 -->
        <aside class="settings-sidebar">
          <div class="sidebar-header">
            <span class="sidebar-logo">B²</span>
            <span class="sidebar-title">{{ $t('settings.title') }}</span>
          </div>
          <nav class="sidebar-nav">
            <button
              v-for="cat in visibleCategories"
              :key="cat.id"
              class="nav-item"
              :class="{ active: activeCategory === cat.id }"
              @click="activeCategory = cat.id"
            >
              <span class="nav-icon" v-html="cat.icon"></span>
              <span class="nav-label">{{ cat.label }}</span>
            </button>
          </nav>
          <div class="sidebar-footer">
            <button class="nav-item close-item" @click="$emit('close')">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </span>
              <span class="nav-label">{{ $t('common.close') }}</span>
            </button>
          </div>
        </aside>

        <!-- 内容区域 -->
        <main class="settings-content">
          <Transition name="page" mode="out-in">
            <div :key="activeCategory" class="content-page">
              <!-- ════════ 外观 ════════ -->
              <template v-if="activeCategory === 'appearance'">
              <div class="page-header">
                <h2>{{ $t('settings.appearance.category') }}</h2>
                <p class="page-desc">{{ $t('settings.appearance.desc') }}</p>
              </div>

              <div class="card">
                <div class="card-header">{{ $t('settings.appearance.live2dCard') }}</div>
                <div class="card-body">
                  <div class="toggle-row">
                    <div>
                      <div class="toggle-title">{{ $t('settings.appearance.live2dEnable') }}</div>
                      <div class="toggle-desc">{{ $t('settings.appearance.live2dDesc') }}</div>
                    </div>
                    <label class="switch">
                      <input type="checkbox" v-model="live2dEnabled" @change="onLive2DToggle" />
                      <span class="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-header">{{ $t('settings.appearance.language') }}</div>
                <div class="card-body">
                  <div class="toggle-row">
                    <div>
                      <div class="toggle-title">{{ $t('settings.appearance.language') }}</div>
                      <div class="toggle-desc">{{ $t('settings.appearance.languageDesc') }}</div>
                    </div>
                    <select class="lang-select" :value="currentLocale" @change="onLocaleChange">
                      <option value="zh-CN">{{ $t('common.zh') }}</option>
                      <option value="en-US">{{ $t('common.en') }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-header">{{ $t('settings.appearance.wallpaper') }}</div>
                <div class="card-body">
                  <div class="wallpaper-grid">
                    <div
                      v-for="bg in backgrounds"
                      :key="bg.id"
                      class="wp-card"
                      :class="{ active: activeWallpaperUrl === bg.url }"
                      @click="selectWallpaper(bg.url)"
                    >
                      <div class="wp-preview" :style="{ backgroundImage: `url(${bg.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }">
                      </div>
                      <span class="wp-name">{{ bgLabel(bg.id) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              </template>

              <!-- ════════ 关于 ════════ -->
              <template v-else-if="activeCategory === 'about'">
              <div class="page-header">
                <h2>{{ $t('settings.about.category') }}</h2>
                <p class="page-desc">{{ $t('settings.about.desc') }}</p>
              </div>

              <div class="about-card">
                <div class="about-cover">
                  <img :src="aboutCover" alt="BetaStudio2" />
                </div>
                <h3 class="about-name">BetaStudio2 Desktop</h3>
                <p class="about-ver">{{ $t('settings.about.version', { ver: '1.0.0' }) }}</p>
                <div class="about-divider"></div>
                <div class="about-grid">
                  <div class="about-item"><span class="about-key">{{ $t('settings.about.runtime') }}</span><span class="about-val">{{ runtimeInfo }}</span></div>
                  <div class="about-item"><span class="about-key">{{ $t('settings.about.techStack') }}</span><span class="about-val">Vue 3 + Pinia + Vite</span></div>
                  <div class="about-item"><span class="about-key">{{ $t('settings.about.backend') }}</span><span class="about-val">Node.js + Express + SQLite</span></div>
                  <div class="about-item"><span class="about-key">{{ $t('settings.about.storage') }}</span><span class="about-val">本地文件系统 + SQLite</span></div>
                </div>
                <div class="about-divider"></div>
                <p class="about-copyright">© 2026 BetaStudio2</p>
              </div>
              </template>
            </div>
          </Transition>
        </main>
    </div>
  </div>
  </div>

  <!-- ── 内嵌模式（窗口内，无遮罩） ── -->
  <div v-else class="settings-layout" style="height:100%">
    <!-- 侧边栏 -->
    <aside class="settings-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-logo">B²</span>
        <span class="sidebar-title">{{ $t('settings.title') }}</span>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="cat in visibleCategories"
          :key="cat.id"
          class="nav-item"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >
          <span class="nav-icon" v-html="cat.icon"></span>
          <span class="nav-label">{{ cat.label }}</span>
        </button>
      </nav>
      <!-- 内嵌模式下没有底部关闭按钮，靠窗口的关闭键 -->
    </aside>

    <!-- 内容区域 -->
    <main class="settings-content">
      <Transition name="page" mode="out-in">
        <div :key="activeCategory" class="content-page">
        <!-- ════════ 外观 ════════ -->
        <template v-if="activeCategory === 'appearance'">
          <div class="page-header">
            <h2>{{ $t('settings.appearance.category') }}</h2>
            <p class="page-desc">{{ $t('settings.appearance.desc') }}</p>
          </div>

          <div class="card">
            <div class="card-header">{{ $t('settings.appearance.live2dCard') }}</div>
            <div class="card-body">
              <div class="toggle-row">
                <div>
                  <div class="toggle-title">{{ $t('settings.appearance.live2dEnable') }}</div>
                  <div class="toggle-desc">{{ $t('settings.appearance.live2dDesc') }}</div>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="live2dEnabled" @change="onLive2DToggle" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">{{ $t('settings.appearance.language') }}</div>
            <div class="card-body">
              <div class="toggle-row">
                <div>
                  <div class="toggle-title">{{ $t('settings.appearance.language') }}</div>
                  <div class="toggle-desc">{{ $t('settings.appearance.languageDesc') }}</div>
                </div>
                <select class="lang-select" :value="currentLocale" @change="onLocaleChange">
                  <option value="zh-CN">{{ $t('common.zh') }}</option>
                  <option value="en-US">{{ $t('common.en') }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">{{ $t('settings.appearance.wallpaper') }}</div>
            <div class="card-body">
              <div class="wallpaper-grid">
                <div
                  v-for="bg in backgrounds"
                  :key="bg.id"
                  class="wp-card"
                  :class="{ active: activeWallpaperUrl === bg.url }"
                  @click="selectWallpaper(bg.url)"
                >
                  <div class="wp-preview" :style="{ backgroundImage: `url(${bg.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }">
                  </div>
                  <span class="wp-name">{{ bgLabel(bg.id) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ════════ 关于 ════════ -->
        <template v-else-if="activeCategory === 'about'">
          <div class="page-header">
            <h2>{{ $t('settings.about.category') }}</h2>
            <p class="page-desc">{{ $t('settings.about.desc') }}</p>
          </div>

          <div class="about-card">
            <div class="about-cover">
              <img :src="aboutCover" alt="BetaStudio2" />
            </div>
            <h3 class="about-name">BetaStudio2 Desktop</h3>
            <p class="about-ver">{{ $t('settings.about.version', { ver: '1.0.0' }) }}</p>
            <div class="about-divider"></div>
            <div class="about-grid">
              <div class="about-item"><span class="about-key">{{ $t('settings.about.runtime') }}</span><span class="about-val">{{ runtimeInfo }}</span></div>
              <div class="about-item"><span class="about-key">{{ $t('settings.about.techStack') }}</span><span class="about-val">Vue 3 + Pinia + Vite</span></div>
              <div class="about-item"><span class="about-key">{{ $t('settings.about.backend') }}</span><span class="about-val">Node.js + Express + SQLite</span></div>
              <div class="about-item"><span class="about-key">{{ $t('settings.about.storage') }}</span><span class="about-val">本地文件系统 + SQLite</span></div>
            </div>
            <div class="about-divider"></div>
            <p class="about-copyright">© 2026 BetaStudio2</p>
          </div>
        </template>
        </div>
      </Transition>
    </main>
  </div>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import { STATIC_MODE, asset } from '@/utils/siteMode'
import i18n, { setLocale } from '@/i18n'

withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false })
defineEmits<{ close: [] }>()


const { t } = useI18n()
const currentLocale = ref<string>(i18n.global.locale.value)

// 关于页封面
const aboutCover = asset('/images/about-cover.jpg')

function onLocaleChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  setLocale(v as 'zh-CN' | 'en-US')
  currentLocale.value = v
}

// ── SVG icons for sidebar ──
const icons = {
  appearance: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4M4.2 19.8l1.4-1.4m12.8-12.8l1.4-1.4"/></svg>',
  about: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
}

// 站点无账号体系：设置面板只剩外观与关于
const categories = computed(() => [
  { id: 'appearance', label: t('settings.appearance.category'), icon: icons.appearance, show: true },
  { id: 'about', label: t('settings.about.category'), icon: icons.about, show: true },
])

const visibleCategories = computed(() => categories.value.filter(c => c.show))

const activeCategory = ref('appearance')

// ── Runtime info ──
const runtimeInfo = computed(() => {
  const ua = navigator.userAgent
  const m = ua.match(/(Chrome|Firefox|Safari)\/(\d+)/)
  if (m) return `${m[1]} ${m[2]}`
  return ua.slice(0, 36)
})

// ── Wallpapers ──
const backgrounds = ref<{ id: string; filename: string; url: string }[]>([])
const activeWallpaperUrl = ref(localStorage.getItem('desktop_wallpaper_url') || '')
const defaultWallpaper = STATIC_MODE ? asset('background/4.png') : '/api/backgrounds/file/4.png'

// Fallback label mapping
function bgLabel(id: string) {
  const map: Record<string, string> = {
    '1': t('settings.appearance.wallpaperStarry'),
    '2': t('settings.appearance.wallpaperMountains'),
    '3': t('settings.appearance.wallpaperAurora'),
    '4': t('settings.appearance.wallpaperNebula'),
    '5': t('settings.appearance.wallpaperSunset'),
  }
  return map[id] || id
}

function selectWallpaper(url: string) {
  activeWallpaperUrl.value = url
  localStorage.setItem('desktop_wallpaper_url', url)
  window.dispatchEvent(new CustomEvent('wallpaper-changed', { detail: { url } }))
}

// Load backgrounds on mount
const backgroundsLoaded = ref(false)
onMounted(async () => {
  try {
    const res = await api.listBackgrounds()
    backgrounds.value = res.backgrounds || []
  } catch (_) { /* fallback empty */ }
  backgroundsLoaded.value = true
  // Default selection if none saved
  if (!activeWallpaperUrl.value && backgrounds.value.length) {
    activeWallpaperUrl.value = backgrounds.value[0]?.url || defaultWallpaper
  }
})

// ── Live2D ──
const live2dEnabled = ref(true)

onMounted(() => {
  try {
    const s = JSON.parse(localStorage.getItem('webword_settings') || '{}')
    live2dEnabled.value = !(s.live2dEnabled === false || s.live2dEnabled === 'false')
  } catch { /* ignore */ }
})

function onLive2DToggle() {
  try {
    const s = JSON.parse(localStorage.getItem('webword_settings') || '{}')
    s.live2dEnabled = String(live2dEnabled.value)
    localStorage.setItem('webword_settings', JSON.stringify(s))
  } catch { /* ignore */ }
  window.dispatchEvent(new Event('live2d-settings-changed'))
}

</script>

<style lang="scss" scoped>
// ── Layout ──
.settings-overlay {
  position: fixed; inset: 0; z-index: 700;
  background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center;
  animation: overlay-in .2s ease;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.settings-panel {
  width: 700px;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 48px rgba(0,0,0,.6);
  animation: panel-in .2s ease;
}

@keyframes panel-in {
  from { opacity: 0; transform: scale(.97) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

// ── Page Transition (Vue Transition) ──
.page-enter-active,
.page-leave-active { transition: all .22s ease; }
.page-enter-from { opacity: 0; transform: translateY(10px); }
.page-leave-to { opacity: 0; transform: translateY(-8px); }

// ── Card entrance animation (staggered) ──
.card {
  animation: card-in .3s ease backwards;
  &:nth-child(2) { animation-delay: .04s; }
  &:nth-child(3) { animation-delay: .08s; }
  &:nth-child(4) { animation-delay: .12s; }
  &:nth-child(5) { animation-delay: .16s; }
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

// ── User table row entrance ──
.user-table tbody tr {
  animation: row-in .25s ease backwards;
  &:nth-child(1) { animation-delay: .02s; }
  &:nth-child(2) { animation-delay: .04s; }
  &:nth-child(3) { animation-delay: .06s; }
  &:nth-child(4) { animation-delay: .08s; }
  &:nth-child(5) { animation-delay: .1s; }
  &:nth-child(6) { animation-delay: .12s; }
  &:nth-child(7) { animation-delay: .14s; }
  &:nth-child(8) { animation-delay: .16s; }
}
@keyframes row-in {
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
}

// ── Modal animations ──
.modal-overlay {
  animation: overlay-in .15s ease;
}
.modal-dialog {
  animation: panel-in .15s ease;
}

// ── Button press effect ──
.btn-primary, .btn-secondary, .btn-sm {
  &:active:not(:disabled) { transform: scale(.97); }
}

// ── Message animations ──
.field-success, .field-error:not(:empty) {
  animation: msg-in .25s ease;
}
@keyframes msg-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

// ── Scrollbar styling ──
.settings-content::-webkit-scrollbar { width: 5px; }
.settings-content::-webkit-scrollbar-track { background: transparent; }
.settings-content::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.08);
  border-radius: 3px;
  &:hover { background: rgba(255,255,255,.15); }
}

.settings-layout {
  display: flex;
  height: 100%;
}

// ── Sidebar (KDE Plasma style) ──
.settings-sidebar {
  width: 180px;
  background: rgba(12,12,30,.65);
  backdrop-filter: blur(36px) saturate(1.2);
  -webkit-backdrop-filter: blur(36px) saturate(1.2);
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255,255,255,.06);
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(255,255,255,.05);

  .sidebar-logo {
    width: 28px; height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea, #5568d3);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #fff;
  }
  .sidebar-title {
    font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,.7);
  }
}

.sidebar-nav {
  flex: 1;
  padding: 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: none;
  background: none;
  color: rgba(255,255,255,.5);
  font-size: 12.5px;
  border-radius: 6px;
  cursor: pointer;
  transition: all .15s;
  text-align: left;
  width: 100%;

  .nav-icon {
    display: flex;
    flex-shrink: 0;
    opacity: .7;
  }

  &:hover {
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.8);
    .nav-icon { opacity: 1; }
  }

  &.active {
    background: rgba(102,126,234,.18);
    color: #8899ee;
    .nav-icon { opacity: 1; color: #8899ee; }
  }
}

.sidebar-footer {
  padding: 6px 8px;
  border-top: 1px solid rgba(255,255,255,.05);

  .close-item {
    color: rgba(255,255,255,.35);
    &:hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.6); }
  }
}

// ── Content ──
.settings-content {
  flex: 1;
  background: rgba(12,12,30,.55);
  backdrop-filter: blur(32px) saturate(1.2);
  -webkit-backdrop-filter: blur(32px) saturate(1.2);
  overflow-y: auto;
  padding: 20px 24px;
}

.content-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.page-header {
  margin-bottom: 4px;
  h2 { font-size: 17px; font-weight: 600; margin: 0; color: rgba(255,255,255,.9); }
  .page-desc { font-size: 12px; color: rgba(255,255,255,.35); margin: 4px 0 0; }
}

// ── Cards ──
.card {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,.45);
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,.04);
  text-transform: uppercase;
  letter-spacing: .4px;
}

.card-body {
  padding: 14px;

  &.no-pad { padding: 0; }
}

.card-actions {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,.04);
  display: flex;
  justify-content: flex-end;
}

// ── Avatar ──
.avatar-card {
  display: flex;
  align-items: center;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
}

.avatar-wrap {
  position: relative;
  width: 60px; height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea, #764ba2);
  flex-shrink: 0;

  &:hover .avatar-overlay { opacity: 1; }
}

.avatar-img {
  width: 100%; height: 100%; object-fit: cover;
}

.avatar-ph {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%;
  font-size: 24px; font-weight: 600; color: #fff;
}

.avatar-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,.5);
  opacity: 0;
  transition: opacity .2s;
  color: #fff;
}

.avatar-info {
  display: flex;
  flex-direction: column;
  .avatar-name { font-size: 15px; font-weight: 500; color: rgba(255,255,255,.9); }
  .avatar-email { font-size: 12px; color: rgba(255,255,255,.4); }
}

// ── Fields ──
.field-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,.35);
  text-transform: uppercase;
  letter-spacing: .4px;
  margin-bottom: 4px;
}

.field-row {
  display: flex;
  gap: 8px;
}

.field-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 6px;
  background: rgba(0,0,0,.25);
  color: rgba(255,255,255,.85);
  font-size: 13px;
  outline: none;
  transition: border-color .15s;

  &::placeholder { color: rgba(255,255,255,.2); }
  &:focus { border-color: #667eea; }
}

.field-error {
  font-size: 11px;
  color: #f5576c;
  margin: 6px 0 0;
}

.field-success {
  font-size: 11px;
  color: #42b883;
  margin: 6px 0 0;

  &.field-error { color: #f5576c; }
}

// ── Buttons ──
.btn-primary {
  width: 100%;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea, #5568d3);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: opacity .15s;

  &:hover { opacity: .9; }
  &:disabled { opacity: .5; cursor: not-allowed; }
}

.btn-secondary {
  padding: 7px 14px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 6px;
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.7);
  font-size: 12px;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;

  &:hover { background: rgba(255,255,255,.1); color: #fff; }
}

.btn-sm {
  padding: 3px 8px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.btn-primary-sm {
  background: rgba(102,126,234,.15);
  color: #667eea;
  &:hover { background: rgba(102,126,234,.25); }
}

.btn-danger-sm {
  background: rgba(245,87,108,.12);
  color: #f5576c;
  &:hover { background: rgba(245,87,108,.22); }
}

// ── Login section (within settings) ──
.login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 360px;
}

.login-header {
  text-align: center;
  margin-bottom: 24px;

  .login-logo {
    display: inline-flex;
    width: 52px; height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    align-items: center; justify-content: center;
    color: #fff;
    margin-bottom: 12px;
  }

  h2 { font-size: 18px; font-weight: 600; margin: 0 0 4px; color: rgba(255,255,255,.9); }
  .login-sub { font-size: 12px; color: rgba(255,255,255,.35); margin: 0; }
}

.login-form {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .btn-primary { margin-top: 4px; }
}

.auth-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;

  .auth-tab {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 7px 0;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 6px;
    background: rgba(255,255,255,.04);
    color: rgba(255,255,255,.4);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all .18s;

    svg { flex-shrink: 0; }

    &.active {
      background: rgba(102,126,234,.15);
      border-color: rgba(102,126,234,.35);
      color: #8899ee;
    }
    &:hover:not(.active) {
      background: rgba(255,255,255,.08);
      color: rgba(255,255,255,.7);
    }
  }
}

// ── Info Grid ──
.info-grid {
  display: flex;
  flex-direction: column;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(255,255,255,.04);

  &:last-child { border-bottom: none; }
}

.info-key {
  font-size: 12px;
  color: rgba(255,255,255,.3);
  min-width: 48px;
  flex-shrink: 0;
}

.info-val {
  font-size: 12px;
  color: rgba(255,255,255,.7);

  &.mono { font-family: monospace; font-size: 11px; }
}

.role-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 11px;

  &.super_admin { background: rgba(255,193,7,.15); color: #ffc107; }
  &.admin { background: rgba(102,126,234,.15); color: #667eea; }
  &.user { background: rgba(66,184,131,.12); color: #42b883; }
}

.role-label {
  font-size: 11px;
  color: rgba(255,255,255,.55);
}

// ── Toggle ──
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-title { font-size: 13px; font-weight: 500; color: rgba(255,255,255,.8); }
.toggle-desc { font-size: 11px; color: rgba(255,255,255,.35); margin-top: 3px; }

.switch {
  position: relative;
  width: 38px;
  height: 20px;
  flex-shrink: 0;

  input { opacity: 0; width: 0; height: 0; }

  .slider {
    position: absolute; cursor: pointer; inset: 0;
    background: rgba(255,255,255,.12);
    border-radius: 20px;
    transition: background .25s;

    &::before {
      content: '';
      position: absolute;
      width: 14px; height: 14px;
      left: 3px; bottom: 3px;
      background: #fff;
      border-radius: 50%;
      transition: transform .25s;
    }
  }

  input:checked + .slider { background: #667eea; }
  input:checked + .slider::before { transform: translateX(18px); }
}

// ── Wallpaper ──
.wallpaper-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.wp-card {
  width: 100px;
  cursor: pointer;
  text-align: center;
  transition: transform .15s;

  &:hover { transform: scale(1.04); }

  &.active .wp-preview {
    outline: 2px solid #667eea;
    outline-offset: 2px;
    transition: outline-offset .15s, outline-color .15s;
  }
  .wp-preview {
    transition: border-color .15s;
  }
}

.wp-preview {
  width: 100px;
  height: 60px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.06);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  svg { opacity: .4; }
}

.wp-name {
  display: block;
  font-size: 11px;
  margin-top: 5px;
  color: rgba(255,255,255,.5);
}

// ── User Table ──
.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th, td { padding: 8px 14px; text-align: left; border-bottom: 1px solid rgba(255,255,255,.04); }
  th {
    font-weight: 600;
    color: rgba(255,255,255,.25);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .3px;
  }
  td { color: rgba(255,255,255,.65); }
}

.cell-email { font-family: monospace; font-size: 11px; }

.role-select {
  padding: 3px 6px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 4px;
  background: rgba(0,0,0,.2);
  color: rgba(255,255,255,.7);
  font-size: 11px;
  outline: none;
  color-scheme: dark;
}

.lang-select {
  padding: 5px 8px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 6px;
  background: rgba(0,0,0,.25);
  color: rgba(255,255,255,.8);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  transition: border-color .15s;
  color-scheme: dark;

  &:hover { border-color: rgba(102,126,234,.4); }
  &:focus { border-color: #667eea; }
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  background: rgba(66,184,131,.12);
  color: #42b883;

  &.locked { background: rgba(245,87,108,.12); color: #f5576c; }
}

.btn-more {
  width: 28px; height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none; border-radius: 4px;
  background: transparent;
  color: rgba(255,255,255,.35);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: all .12s;
  &:hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.6); }
}

.empty-state {
  padding: 28px;
  text-align: center;
  font-size: 13px;
  color: rgba(255,255,255,.2);
}

// ── Logout ──
.danger-header {
  color: #f5576c !important;
}
.logout-desc {
  font-size: 12px;
  color: rgba(255,255,255,.4);
  margin: 0 0 10px;
}
.btn-logout {
  width: 100%;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: rgba(245,87,108,.15);
  color: #f5576c;
  font-size: 13px;
  cursor: pointer;
  transition: all .15s;

  &:hover {
    background: rgba(245,87,108,.25);
  }
  &:active { transform: scale(.97); }
}

// ── Context Menu ──
.ctx-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
}
.ctx-menu {
  position: fixed;
  min-width: 150px;
  background: rgba(14, 18, 30, .96);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 8px;
  padding: 4px;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 8px 40px rgba(0,0,0,.5);
}
.ctx-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255,255,255,.65);
  white-space: nowrap;
  transition: background .1s;
  &:hover { background: rgba(255,255,255,.07); color: #fff; }
  &.ctx-checked {
    color: #f5576c;
    background: rgba(245, 87, 108, .08);
  }
  &.ctx-danger { color: #f5576c; &:hover { background: rgba(245,87,108,.1); } }
}
.ctx-divider {
  height: 1px;
  margin: 4px 8px;
  background: rgba(255,255,255,.05);
}

// ── About ──
.about-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 3px;
  animation: card-in .3s ease backwards;
}

.about-cover {
  width: 100%;
  height: 190px;
  border-radius: 14px;
  overflow: hidden;
  margin: 4px 0 14px;
  background: rgba(255,255,255,.04);
  animation: card-in .3s ease backwards;
  animation-delay: .04s;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 46%;
  }
}

.about-name { font-size: 16px; font-weight: 600; margin: 0; color: rgba(255,255,255,.85); }
.about-ver { font-size: 12px; color: rgba(255,255,255,.3); margin: 0; }

.about-divider {
  width: 100%;
  height: 1px;
  background: rgba(255,255,255,.05);
  margin: 10px 0;
}

.about-grid {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.about-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255,255,255,.03);

  &:last-child { border-bottom: none; }
}

.about-key {
  font-size: 12px;
  color: rgba(255,255,255,.25);
  min-width: 56px;
  flex-shrink: 0;
}

.about-val {
  font-size: 12px;
  color: rgba(255,255,255,.55);
}

.about-copyright {
  font-size: 11px;
  color: rgba(255,255,255,.2);
  margin: 0;
}

// ── Dialogs ──
.modal-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(0,0,0,.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-dialog {
  background: #1e1e30;
  border-radius: 10px;
  padding: 18px 20px;
  width: 380px;
  border: 1px solid rgba(255,255,255,.06);
  box-shadow: 0 8px 32px rgba(0,0,0,.4);
}

.modal-header {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: rgba(255,255,255,.85);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 14px;

  .btn-primary, .btn-secondary {
    width: auto;
    padding: 6px 16px;
  }
}

.hidden-input { display: none; }

// ── Register agreement row ──
.reg-agree-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0,0,0,.25);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color .2s, background .2s;
  margin: 8px 0;

  &:hover {
    border-color: #667eea;
    background: rgba(102,126,234,.08);
  }
}

.reg-checkbox {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 4px;
  background: rgba(0,0,0,.35);
  border: 1px solid rgba(255,255,255,.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .2s, border-color .2s;

  &.checked {
    background: rgba(102,126,234,.2);
    border-color: #667eea;
  }
}

.reg-agree-label {
  flex: 1;
  font-size: 12px;
  color: rgba(255,255,255,.7);
  line-height: 1.5;

  strong { color: #667eea; }
}

.reg-arrow {
  color: rgba(255,255,255,.3);
  transition: transform .2s;
}

.reg-agree-row:hover .reg-arrow {
  transform: translateX(3px);
}

// ── Agreement modal ──
.agree-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.agree-modal {
  background: #1a1a2e;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;
  width: 600px;
  max-width: 92vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
}

.agree-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255,255,255,.06);

  h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: rgba(255,255,255,.9);
  }
}

.agree-close {
  background: none;
  border: none;
  color: rgba(255,255,255,.4);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  transition: background .15s, color .15s;

  &:hover {
    background: rgba(255,255,255,.08);
    color: rgba(255,255,255,.7);
  }
}

.agree-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.08) transparent;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,.08);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track { background: transparent; }
}

.agree-body {
  font-size: 12px;
  color: rgba(255,255,255,.65);
  line-height: 1.7;

  :deep(h2) {
    font-size: 15px;
    font-weight: 600;
    color: rgba(255,255,255,.85);
    margin: 20px 0 10px;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  :deep(h3) {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,.75);
    margin: 14px 0 6px;
  }
  :deep(p) { margin: 0 0 8px; }
  :deep(ul), :deep(ol) { padding-left: 18px; margin-bottom: 8px; }
  :deep(li) { margin-bottom: 4px; }
  :deep(.rule-highlight),
  :deep(.rule-warn),
  :deep(.rule-danger) {
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    margin: 10px 0;
    font-size: 12px;
  }
  :deep(.rule-highlight) {
    background: rgba(66,184,131,.04);
    border-left: 3px solid #42b883;
    color: rgba(255,255,255,.5);
  }
  :deep(.rule-warn) {
    background: rgba(255,193,7,.04);
    border-left: 3px solid #ffc107;
    color: rgba(255,255,255,.5);
  }
  :deep(.rule-danger) {
    background: rgba(239,68,68,.04);
    border-left: 3px solid #ef4444;
    color: rgba(255,255,255,.55);
  }
  :deep(.rule-footer) {
    margin-top: 20px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,.04);
    font-size: 11px;
    color: rgba(255,255,255,.25);
    text-align: center;
  }
}

.agree-status {
  text-align: center;
  padding: 36px 0;
  color: rgba(255,255,255,.35);
  font-size: 13px;

  &.agree-status-error { color: #f5576c; }
}

.agree-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-top: 1px solid rgba(255,255,255,.06);
}

.agree-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #f59e0b;
  animation: agreePulse 2s ease-in-out infinite;

  svg { animation: agreeBounce 1.5s ease-in-out infinite; }
}

@keyframes agreePulse {
  0%, 100% { opacity: .5; }
  50% { opacity: 1; }
}
@keyframes agreeBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(2px); }
}

// ── Agreement modal transitions ──
.agree-enter-active { transition: opacity .2s ease; }
.agree-leave-active { transition: opacity .15s ease; }
.agree-enter-from, .agree-leave-to { opacity: 0; }
.agree-enter-active .agree-modal { animation: agreeIn .2s ease; }
.agree-leave-active .agree-modal { animation: agreeOut .15s ease; }

@keyframes agreeIn {
  from { transform: scale(.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes agreeOut {
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(.95); opacity: 0; }
}

// ── Ban Duration Dialog ──
.ban-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(0,0,0,.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ban-dialog {
  background: #1a1a2e;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;
  padding: 22px 24px;
  width: 320px;
  box-shadow: 0 8px 40px rgba(0,0,0,.5);
}
.ban-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255,255,255,.9);
  margin-bottom: 6px;
}
.ban-desc {
  font-size: 12px;
  color: rgba(255,255,255,.35);
  margin: 0 0 16px;
  line-height: 1.5;
}
.ban-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ban-opt {
  flex: 1 0 calc(50% - 4px);
  padding: 8px 0;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 6px;
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.7);
  font-size: 12px;
  cursor: pointer;
  transition: all .15s;
  text-align: center;
  &:hover {
    background: rgba(102,126,234,.15);
    border-color: rgba(102,126,234,.35);
    color: #8899ee;
  }
}
.ban-cancel {
  flex: 1 0 100%;
  background: transparent;
  border-color: transparent;
  color: rgba(255,255,255,.3);
  &:hover {
    background: rgba(255,255,255,.04);
    border-color: transparent;
    color: rgba(255,255,255,.5);
  }
}
</style>
