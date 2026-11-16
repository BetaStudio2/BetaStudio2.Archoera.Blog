<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAddonStore } from '@/webword/stores/addons'
import { useToast } from '@/webword/composables/useToast'
import {
  useKonamiEgg,
  isKonamiActivated,
  applyRandomWallpaper,
  wallpaperApplied,
} from '@/webword/composables/useKonamiEgg'

const addonStore = useAddonStore()
const { t } = useI18n()
const { info: toastInfo } = useToast()

const activeOption = ref('general')
const switching = ref(false)

function openAddonManager() {
  const ww = (window as any).WebWord
  if (ww?.addons?.activate) {
    ww.addons.activate('addon-manager')
  } else {
    console.warn('Addon manager not yet loaded')
  }
}

function readSettings(): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem('webword_settings') || '{}') || {}
  } catch {
    return {}
  }
}

function writeSettings(patch: Record<string, unknown>): void {
  try {
    const current = readSettings()
    const merged = { ...current, ...patch }
    localStorage.setItem('webword_settings', JSON.stringify(merged))
  } catch {}
}

// All settings with defaults
const defaults: Record<string, unknown> = {
  theme: 'dark',
  startup: 'start',
  recentCount: '10',
  spellCheck: true,
  fontSize: '12',
  autoSaveInterval: '5',
  showRuler: true,
  showGridlines: false,
  showWhitespace: true,
  zoomLevel: '100',
  defaultSaveFormat: 'html',
  keepRecentDocs: true,
  confirmBeforeSave: false,
  addonsEnabled: false,
  autoRecovery: true,
}

// Initialize from stored settings
const stored = readSettings()

const theme = ref(asString(stored.theme, defaults.theme))
const startup = ref(asString(stored.startup, defaults.startup))
const recentCount = ref(asString(stored.recentCount, defaults.recentCount))
const spellCheck = ref(asBool(stored.spellCheck, defaults.spellCheck))
const fontSize = ref(asString(stored.fontSize, defaults.fontSize))
const autoSaveInterval = ref(asString(stored.autoSaveInterval, defaults.autoSaveInterval))

const showRuler = ref(asBool(stored.showRuler, defaults.showRuler))
const showGridlines = ref(asBool(stored.showGridlines, defaults.showGridlines))
const showWhitespace = ref(asBool(stored.showWhitespace, defaults.showWhitespace))
const zoomLevel = ref(asString(stored.zoomLevel, defaults.zoomLevel))

const defaultSaveFormat = ref(asString(stored.defaultSaveFormat, defaults.defaultSaveFormat))
const keepRecentDocs = ref(asBool(stored.keepRecentDocs, defaults.keepRecentDocs))
const confirmBeforeSave = ref(asBool(stored.confirmBeforeSave, defaults.confirmBeforeSave))

const addonsEnabled = ref(asBool(stored.addonsEnabled, defaults.addonsEnabled))

const autoRecovery = ref(asBool(stored.autoRecovery, defaults.autoRecovery))

function asString(val: unknown, fallback: unknown): string {
  return val !== undefined && val !== null ? String(val) : String(fallback)
}
function asBool(val: unknown, fallback: unknown): boolean {
  if (val === undefined || val === null) return !!fallback
  if (typeof val === 'boolean') return val
  return val !== 'false'
}

// Persist all settings on any change
watch(
  () => ({
    theme: theme.value,
    startup: startup.value,
    recentCount: recentCount.value,
    spellCheck: spellCheck.value,
    fontSize: fontSize.value,
    autoSaveInterval: autoSaveInterval.value,
    showRuler: showRuler.value,
    showGridlines: showGridlines.value,
    showWhitespace: showWhitespace.value,
    zoomLevel: zoomLevel.value,
    defaultSaveFormat: defaultSaveFormat.value,
    keepRecentDocs: keepRecentDocs.value,
    confirmBeforeSave: confirmBeforeSave.value,
    addonsEnabled: addonsEnabled.value,
    autoRecovery: autoRecovery.value,
  }),
  (patch) => {
    writeSettings(patch)
  },
  { deep: true }
)

function switchOption(opt: string) {
  if (switching.value) return
  if (opt === activeOption.value) return
  switching.value = true
  activeOption.value = opt
  setTimeout(() => { switching.value = false }, 280)
}

function purgeMemory() {
  if (typeof window !== 'undefined' && (window as any).gc) {
    try { (window as any).gc() } catch {}
  }
  console.log('Memory cleanup requested')
}

function resetAllSettings() {
  const patch: Record<string, unknown> = {}
  for (const [key, fallback] of Object.entries(defaults)) {
    patch[key] = fallback
  }
  // Reset all reactive refs
  const allRefs: Record<string, any> = {
    theme, startup, recentCount, spellCheck, fontSize, autoSaveInterval,
    showRuler, showGridlines, showWhitespace, zoomLevel,
    defaultSaveFormat, keepRecentDocs, confirmBeforeSave,
    addonsEnabled, autoRecovery,
  }
  for (const [key, ref] of Object.entries(allRefs)) {
    if (defaults[key] !== undefined) {
      ref.value = defaults[key]
    }
  }
  writeSettings(patch)
}

// ── 彩蛋：Konami 秘技 ──
// 首次激活后，高级选项里出现「切换壁纸」按钮
const konamiUnlocked = ref(isKonamiActivated())
const wallpaperDone = computed(() => wallpaperApplied.value)
let konami: ReturnType<typeof useKonamiEgg> | null = null

function changeWallpaper() {
  applyRandomWallpaper(document.getElementById('fileMenuOverlay'))
}

onMounted(() => {
  konami = useKonamiEgg({
    onActivated: () => {
      konamiUnlocked.value = true
      toastInfo(t('wwf.options.konamiActivated'))
    },
  })
})

onUnmounted(() => {
  konami?.dispose()
  konami = null
})
</script>

<template>
  <h1 class="file-menu-title">{{ $t('wwf.options.title') }}</h1>
  <div class="file-options-layout">
    <div class="file-options-sidebar">
      <div class="file-options-tab" :class="{ active: activeOption === 'general' }" @click="switchOption('general')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
        <span>{{ $t('wwf.options.general') }}</span>
      </div>
      <div class="file-options-tab" :class="{ active: activeOption === 'editor' }" @click="switchOption('editor')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <span>{{ $t('wwf.options.editor') }}</span>
      </div>
      <div class="file-options-tab" :class="{ active: activeOption === 'display' }" @click="switchOption('display')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 3h6v18h-6M10 17l4 4-4 4M10 3l4-4-4 4"/></svg>
        <span>{{ $t('wwf.options.display') }}</span>
      </div>
      <div class="file-options-tab" :class="{ active: activeOption === 'save' }" @click="switchOption('save')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h11l5 5v11c0 1.1-.9 2-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        <span>{{ $t('common.save') }}</span>
      </div>
      <div class="file-options-tab" :class="{ active: activeOption === 'addons' }" @click="switchOption('addons')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
        <span>{{ $t('wwf.options.addons') }}</span>
      </div>
      <div class="file-options-tab" :class="{ active: activeOption === 'advanced' }" @click="switchOption('advanced')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.364-6.364l-4.243 4.243m-4.242 0L3.636 5.636m0 12.728l4.243-4.243m4.242 0L19.364 18.364"/></svg>
        <span>{{ $t('wwf.options.advanced') }}</span>
      </div>
    </div>

    <div class="file-options-content">
      <!-- General -->
      <div class="file-options-panel" :class="{ active: activeOption === 'general' }">
        <h2>{{ $t('wwf.options.generalTitle') }}</h2>
        <div class="file-option-section">
          <div class="file-option-group">
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.themeTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.themeDesc') }}</span>
              </div>
              <select class="file-option-select" v-model="theme">
                <option value="dark">{{ $t('wwf.options.themeDark') }}</option>
                <option value="light">{{ $t('wwf.options.themeLight') }}</option>
                <option value="system">{{ $t('wwf.options.themeSystem') }}</option>
              </select>
            </div>
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.startupTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.startupDesc') }}</span>
              </div>
              <select class="file-option-select" v-model="startup">
                <option value="start">{{ $t('wwf.options.startupStart') }}</option>
                <option value="new">{{ $t('wwf.options.startupNew') }}</option>
                <option value="last">{{ $t('wwf.options.startupLast') }}</option>
              </select>
            </div>
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.recentCountTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.recentCountDesc') }}</span>
              </div>
              <select class="file-option-select" v-model="recentCount">
                <option value="5">{{ $t('wwf.options.recentCountN', { count: 5 }) }}</option>
                <option value="10">{{ $t('wwf.options.recentCountN', { count: 10 }) }}</option>
                <option value="15">{{ $t('wwf.options.recentCountN', { count: 15 }) }}</option>
                <option value="20">{{ $t('wwf.options.recentCountN', { count: 20 }) }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Editor -->
      <div class="file-options-panel" :class="{ active: activeOption === 'editor' }">
        <h2>{{ $t('wwf.options.editorTitle') }}</h2>
        <div class="file-option-section">
          <div class="file-option-group">
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.fontSizeTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.fontSizeDesc') }}</span>
              </div>
              <select class="file-option-select" v-model="fontSize">
                <option value="10">{{ $t('wwf.options.font10') }}</option>
                <option value="10.5">{{ $t('wwf.options.font105') }}</option>
                <option value="12">{{ $t('wwf.options.font12') }}</option>
                <option value="14">{{ $t('wwf.options.font14') }}</option>
                <option value="16">{{ $t('wwf.options.font16') }}</option>
              </select>
            </div>
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.autoSaveTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.autoSaveDesc') }}</span>
              </div>
              <select class="file-option-select" v-model="autoSaveInterval">
                <option value="1">{{ $t('wwf.options.minutes', { count: 1 }) }}</option>
                <option value="5">{{ $t('wwf.options.minutes', { count: 5 }) }}</option>
                <option value="10">{{ $t('wwf.options.minutes', { count: 10 }) }}</option>
                <option value="15">{{ $t('wwf.options.minutes', { count: 15 }) }}</option>
              </select>
            </div>
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.spellCheckTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.spellCheckDesc') }}</span>
              </div>
              <label class="file-option-toggle">
                <input type="checkbox" v-model="spellCheck">
                <span class="file-option-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Display -->
      <div class="file-options-panel" :class="{ active: activeOption === 'display' }">
        <h2>{{ $t('wwf.options.displayTitle') }}</h2>
        <div class="file-option-section">
          <div class="file-option-group">
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.rulerTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.rulerDesc') }}</span>
              </div>
              <label class="file-option-toggle">
                <input type="checkbox" v-model="showRuler">
                <span class="file-option-toggle-slider"></span>
              </label>
            </div>
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.gridlinesTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.gridlinesDesc') }}</span>
              </div>
              <label class="file-option-toggle">
                <input type="checkbox" v-model="showGridlines">
                <span class="file-option-toggle-slider"></span>
              </label>
            </div>
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.whitespaceTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.whitespaceDesc') }}</span>
              </div>
              <label class="file-option-toggle">
                <input type="checkbox" v-model="showWhitespace">
                <span class="file-option-toggle-slider"></span>
              </label>
            </div>
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.zoomTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.zoomDesc') }}</span>
              </div>
              <select class="file-option-select" v-model="zoomLevel">
                <option value="50">50%</option>
                <option value="75">75%</option>
                <option value="100">100%</option>
                <option value="125">125%</option>
                <option value="150">150%</option>
                <option value="auto">{{ $t('wwf.options.fitWidth') }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Save -->
      <div class="file-options-panel" :class="{ active: activeOption === 'save' }">
        <h2>{{ $t('wwf.options.saveTitle') }}</h2>
        <div class="file-option-section">
          <div class="file-option-group">
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.saveFormatTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.saveFormatDesc') }}</span>
              </div>
              <select class="file-option-select" v-model="defaultSaveFormat">
                <option value="html">{{ $t('wwf.options.fmtHtml') }}</option>
                <option value="png">{{ $t('wwf.options.fmtPng') }}</option>
                <option value="doc">{{ $t('wwf.options.fmtDoc') }}</option>
                <option value="txt">{{ $t('wwf.options.fmtTxt') }}</option>
              </select>
            </div>
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.keepRecentTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.keepRecentDesc') }}</span>
              </div>
              <label class="file-option-toggle">
                <input type="checkbox" v-model="keepRecentDocs">
                <span class="file-option-toggle-slider"></span>
              </label>
            </div>
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.confirmSaveTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.confirmSaveDesc') }}</span>
              </div>
              <label class="file-option-toggle">
                <input type="checkbox" v-model="confirmBeforeSave">
                <span class="file-option-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Addons -->
      <div class="file-options-panel" :class="{ active: activeOption === 'addons' }">
        <h2>{{ $t('wwf.options.addons') }}</h2>
        <div class="file-option-section">
          <div class="file-option-group">
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.enableAddonsTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.enableAddonsDesc') }}</span>
              </div>
              <label class="file-option-toggle addons-warning-toggle">
                <input type="checkbox" v-model="addonsEnabled">
                <span class="file-option-toggle-slider"></span>
              </label>
            </div>
            <div class="file-option-item" v-if="addonsEnabled">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.installedTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.installedDesc', { count: addonStore.addonList.length }) }}</span>
              </div>
              <button class="file-option-btn" @click="openAddonManager">{{ $t('wwf.options.manage') }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced -->
      <div class="file-options-panel" :class="{ active: activeOption === 'advanced' }">
        <h2>{{ $t('wwf.options.advancedTitle') }}</h2>
        <div class="file-option-section">
          <div class="file-option-group">
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.autoRecoveryTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.autoRecoveryDesc') }}</span>
              </div>
              <label class="file-option-toggle">
                <input type="checkbox" v-model="autoRecovery">
                <span class="file-option-toggle-slider"></span>
              </label>
            </div>
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.memoryTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.memoryDesc') }}</span>
              </div>
              <button class="file-option-reset-btn" @click="purgeMemory">{{ $t('wwf.options.cleanup') }}</button>
            </div>
            <div class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.resetTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.resetDesc') }}</span>
              </div>
              <button class="file-option-reset-btn" @click="resetAllSettings">{{ $t('wwf.options.reset') }}</button>
            </div>
            <!-- 彩蛋解锁：Konami 秘技激活后出现 -->
            <div v-if="konamiUnlocked" class="file-option-item">
              <div class="file-option-label">
                <span class="file-option-title">{{ $t('wwf.options.wallpaperTitle') }}</span>
                <span class="file-option-desc">{{ $t('wwf.options.wallpaperDesc') }}</span>
              </div>
              <button
                class="file-option-btn"
                :disabled="wallpaperDone"
                :style="wallpaperDone ? { opacity: '0.5', cursor: 'default' } : undefined"
                @click="changeWallpaper"
              >{{ wallpaperDone ? $t('wwf.options.wallpaperDone') : $t('wwf.options.wallpaperChange') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>
.file-option-danger-btn {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: 4px;
  color: #f87171;
  font-size: 12px;
  cursor: pointer;
  transition: background .2s, color .2s;
}
.file-option-danger-btn:hover {
  background: #ef4444;
  color: #fff;
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 10002;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.confirm-dialog {
  background: #141820;
  border: 1px solid #2a303b;
  border-radius: 10px;
  padding: 20px 24px;
  min-width: 360px;
  max-width: 420px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}
.confirm-title {
  font-size: 16px;
  font-weight: 500;
  color: #e8ecf2;
  margin-bottom: 12px;
}
.confirm-content {
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.6;
  margin-bottom: 16px;
}
.confirm-content p {
  margin: 0;
}
.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.confirm-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background .2s, opacity .2s;
}
.confirm-btn.cancel {
  background: transparent;
  color: #9ca3af;
  border-color: #2a303b;
}
.confirm-btn.cancel:hover {
  background: #1a2230;
  color: #e8ecf2;
}
.confirm-btn.danger {
  background: #ef4444;
  color: #fff;
}
.confirm-btn.danger:hover {
  background: #dc2626;
}
.confirm-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
