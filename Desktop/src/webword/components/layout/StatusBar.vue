<script setup lang="ts">
import { computed, watch, ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '@/webword/stores/document'
import { useAddonStore } from '@/webword/stores/addons'
import { useAppStore } from '@/webword/stores/app'

const documentStore = useDocumentStore()
const addonStore = useAddonStore()
const appStore = useAppStore()
const { t } = useI18n()

const zoom = computed({
  get: () => documentStore.zoom,
  set: (val: number) => documentStore.setZoom(val),
})

const zoomLabel = computed(() => `${zoom.value}%`)

const statusLeftText = ref(t('ww.statusbar.ready'))

// Update left status text
watch(() => documentStore.docInfo, (info) => {
  if (info.pages > 0 || info.words > 0) {
    statusLeftText.value = t('ww.statusbar.docInfo', { pages: info.pages, words: info.words })
  }
}, { deep: true })

// ── "正在打开" 进度条动画 ──
const openingShow = ref(false)
const openingFill = ref(0)        // 0-100%
const openingDone = ref(false)    // 填充完成，准备隐藏

let _openingTimer: ReturnType<typeof setTimeout> | null = null
let _openingDoneTimer: ReturnType<typeof setTimeout> | null = null

function clearOpeningTimers() {
  if (_openingTimer) { clearTimeout(_openingTimer); _openingTimer = null }
  if (_openingDoneTimer) { clearTimeout(_openingDoneTimer); _openingDoneTimer = null }
}

function onOpeningProgress(val: boolean) {
  clearOpeningTimers()
  if (val) {
    // Show
    openingDone.value = false
    openingShow.value = true
    // Blur the paperWrap (original: paperWrap opacity=0)
    const paperWrap = document.getElementById('paperWrap')
    if (paperWrap) {
      paperWrap.style.transition = 'none'
      paperWrap.style.opacity = '0'
    }
    // Start fill animation
    nextTick(() => {
      openingFill.value = 99
    })
  } else {
    // Hide: fill to 100%, then after 200ms clean up
    openingDone.value = true
    openingFill.value = 100
    _openingDoneTimer = setTimeout(() => {
      openingShow.value = false
      openingFill.value = 0
      openingDone.value = false
      // Restore paperWrap
      const paperWrap = document.getElementById('paperWrap')
      if (paperWrap) {
        paperWrap.style.transition = ''
        paperWrap.style.opacity = ''
      }
      statusLeftText.value = t('ww.statusbar.ready')
      document.dispatchEvent(new Event('doc-opened'))
    }, 200)
  }
}

watch(() => documentStore.openingProgress, onOpeningProgress)

const statusText = computed(() => statusLeftText.value)

const trayButtons = computed(() => addonStore.trayButtons)

function handleAddonClick(btn: { id: string; onClick: () => void }) {
  addonStore.toggleAddon(btn.id)
}

const activeAddonId = computed(() => addonStore.activeAddon)
</script>

<template>
  <footer class="statusbar">
    <div class="statusbar-left">
      <div id="statusLeft">{{ statusText }}</div>
      <button
        id="taskviewBtn"
        class="taskview-btn"
        :title="$t('ww.taskView.titleWithShortcut')"
        @click="appStore.toggleTaskView()"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </button>
      <div id="addonTray" class="addon-tray" :class="{ 'has-loaded': trayButtons.length > 0 }">
        <button
          v-for="btn in trayButtons"
          :key="btn.id"
          class="addon-tray-btn"
          :class="{ active: activeAddonId === btn.id }"
          :title="btn.label"
          @click="handleAddonClick(btn)"
          v-html="btn.icon"
        ></button>
      </div>
    </div>
    <div class="status-right">
      <div id="statusOpening" class="status-opening" :class="{ show: openingShow }">
        <span class="status-opening-text">{{ $t('ww.statusbar.opening') }}</span>
        <div class="status-opening-bar"><div class="status-opening-fill" :style="{ width: openingFill + '%' }"></div></div>
      </div>
      <input
        id="zoom"
        class="zoom-slider"
        type="range"
        min="50"
        max="150"
        v-model.number="zoom"
        step="5"
      >
      <span id="zoomLabel" class="zoom-label">{{ zoomLabel }}</span>
    </div>
  </footer>
</template>
