<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/webword/stores/app'

const appStore = useAppStore()
const { t } = useI18n()

const tabs = computed(() => [
  { id: 'file',     label: t('ww.tabs.file') },
  { id: 'start',    label: t('ww.tabs.start') },
  { id: 'insert',   label: t('ww.tabs.insert') },
  { id: 'draw',     label: t('ww.tabs.draw') },
  { id: 'components', label: t('ww.tabs.components') },
  { id: 'view',     label: t('ww.tabs.view') },
  { id: 'help',     label: t('ww.tabs.help') },
])

const activeTab = computed(() => appStore.activeTab)

function setTab(tabId: string) {
  if (tabId === 'file') {
    appStore.showFileMenu()
    return
  }
  appStore.setActiveTab(tabId)
}

function toggleRibbon() {
  appStore.toggleRibbon()
}

// Ctrl+F1 global keybinding
function onGlobalKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'F1') {
    e.preventDefault()
    toggleRibbon()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <nav class="tabs">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      :id="`tab${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}`"
      class="tab"
      :class="{ active: activeTab === tab.id, clickable: true }"
      @click="setTab(tab.id)"
    >
      {{ tab.label }}
    </div>
    <button
      id="toggleRibbonBtn"
      class="ribbon-toggle-btn"
      :title="$t('ww.tabs.hideRibbon')"
      @click="toggleRibbon"
    >
      <svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
    </button>
  </nav>
</template>
