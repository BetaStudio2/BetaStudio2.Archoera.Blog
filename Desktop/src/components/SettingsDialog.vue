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
                      <div class="wp-preview" :style="{ '--wp-preview': `url(${bg.url})` }">
                      </div>
                      <span class="wp-name">{{ bg.id }}</span>
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
                  <div class="wp-preview" :style="{ '--wp-preview': `url(${bg.url})` }">
                  </div>
                  <span class="wp-name">{{ bg.id }}</span>
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
import type { BackgroundPreset } from '@/services/api'
import { STATIC_MODE, asset, withBase } from '@/utils/siteMode'
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
const backgrounds = ref<BackgroundPreset[]>([])
const activeWallpaperUrl = ref(withBase(localStorage.getItem('desktop_wallpaper_url') || ''))
const defaultWallpaper = STATIC_MODE ? asset('background/4.png') : '/api/backgrounds/file/4.png'

// 壁纸只按序号标识（展示文件名去掉扩展名，即 1 / 2 / 3…），不再维护名称

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
  background-image: var(--wp-preview);
  background-size: cover;
  background-position: center;

  svg { opacity: .4; }
}

.wp-name {
  display: block;
  font-size: 11px;
  margin-top: 5px;
  color: rgba(255,255,255,.5);
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
</style>
