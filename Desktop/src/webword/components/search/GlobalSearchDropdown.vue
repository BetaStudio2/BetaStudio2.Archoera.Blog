<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlobalSearch } from '@/webword/composables/useGlobalSearch'
import { useAppStore } from '@/webword/stores/app'
import { useAddonStore } from '@/webword/stores/addons'
import type { SearchItem } from '@/webword/types'

const appStore = useAppStore()
const addonStore = useAddonStore()
const search = useGlobalSearch()
const { results, dropdownVisible, selectedIndex, selectResult, navigateUp, navigateDown, cleanup } = search

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()

function onItemClick(item: SearchItem): void {
  const selected = selectResult(item)
  if (selected.action === 'switchTab' && item.id) {
    appStore.setActiveTab(item.id)
    emit('close')
  } else if (item.type === 'addon' && item.addonId) {
    addonStore.toggleAddon(item.addonId)
    emit('close')
  }
}

function getActionLabel(item: SearchItem): string {
  if (item.type === 'addon') {
    if (item.loaded && item.addonId && addonStore.activeAddon === item.addonId) return t('ww.globalSearch.opened')
    if (item.loaded) return t('common.open')
    return t('ww.globalSearch.load')
  }
  if (item.action === 'switchTab') return t('ww.globalSearch.switch')
  return t('ww.globalSearch.execute')
}

function getActionClass(item: SearchItem): string {
  if (item.type === 'addon') {
    if (item.loaded && item.addonId && addonStore.activeAddon === item.addonId) return 'active'
    if (item.loaded) return 'loaded'
    return 'load'
  }
  return 'default'
}

// Keyboard navigation
function onKeydown(e: KeyboardEvent): void {
  if (!dropdownVisible.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    navigateDown()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    navigateUp()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (selectedIndex.value >= 0 && selectedIndex.value < results.value.length) {
      onItemClick(results.value[selectedIndex.value])
    }
  } else if (e.key === 'Escape') {
    cleanup()
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div v-if="dropdownVisible" class="search-dropdown">
    <div class="search-dropdown-header">
      <span>{{ $t('ww.globalSearch.resultCount', { count: results.length }) }}</span>
      <span class="search-dropdown-hint">{{ $t('ww.globalSearch.hint') }}</span>
    </div>
    <div class="search-dropdown-list">
      <div
        v-for="(item, idx) in results"
        :key="item.id"
        class="search-result-item"
        :class="{ selected: idx === selectedIndex }"
        @click="onItemClick(item)"
        @mouseenter="selectedIndex = idx"
      >
        <div class="search-result-icon" :class="item.type">
          <template v-if="item.icon">{{ item.icon }}</template>
          <template v-else-if="item.type === 'addon'">📦</template>
          <template v-else-if="item.type === 'tool'">⚙</template>
          <template v-else-if="item.type === 'nav'">↗</template>
        </div>
        <div class="search-result-info">
          <div class="search-result-title">{{ item.title }}</div>
          <div class="search-result-desc">{{ item.desc }}</div>
        </div>
        <button
          class="search-result-action"
          :class="getActionClass(item)"
          @click.stop="onItemClick(item)"
        >
          {{ getActionLabel(item) }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  background: #141a24;
  border: 1px solid #232a34;
  border-radius: 10px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  z-index: 100;
  overflow: hidden;
  min-width: 340px;
}

.search-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  font-size: 11px;
  color: #5a6070;
  border-bottom: 1px solid #1a2230;
}
.search-dropdown-hint {
  color: #3a4252;
}

.search-dropdown-list {
  padding: 4px 0;
  max-height: 320px;
  overflow-y: auto;
}
.search-dropdown-list::-webkit-scrollbar { width: 4px; }
.search-dropdown-list::-webkit-scrollbar-thumb { background: #2a3240; border-radius: 2px; }
.search-dropdown-list::-webkit-scrollbar-track { background: transparent; }

.search-result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background .12s;
}
.search-result-item:hover,
.search-result-item.selected {
  background: #1a2230;
}

.search-result-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: #1a2230;
}
.search-result-icon.addon { background: #2d2440; }
.search-result-icon.tool  { background: #1a2a3a; }
.search-result-icon.nav   { background: #1a3020; }

.search-result-info {
  flex: 1;
  min-width: 0;
}
.search-result-title {
  font-size: 13px;
  font-weight: 500;
  color: #e8edf7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.search-result-desc {
  font-size: 11px;
  color: #6b7588;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-result-action {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: all .15s;
  background: #1a2230;
  color: #98a2b3;
}
.search-result-action:hover {
  background: #2a3240;
  color: #c8d0de;
}
.search-result-action.default { background: #1a2230; color: #98a2b3; }
.search-result-action.load   { background: #1a2e20; color: #4caf50; }
.search-result-action.load:hover { background: #243830; color: #66d46e; }
.search-result-action.loaded { background: #1e2840; color: #5ea8ff; }
.search-result-action.loaded:hover { background: #273348; color: #7cb8ff; }
.search-result-action.active { background: #2d3a20; color: #8bc34a; }
</style>
