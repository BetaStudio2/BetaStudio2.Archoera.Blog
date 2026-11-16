<template>
  <div class="explorer" @click="clearSelection">
    <!-- 工具栏 -->
    <div class="ex-toolbar">
      <div class="ex-nav-btns">
        <button class="ex-btn" :disabled="!canBack" :title="t('desktop.explorer.back')" @click="goBack">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3l-5 5 5 5"/></svg>
        </button>
        <button class="ex-btn" :disabled="!canForward" :title="t('desktop.explorer.forward')" @click="goForward">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>
        </button>
        <button class="ex-btn" :disabled="!canUp" :title="t('desktop.explorer.up')" @click="goUp">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l5-5 5 5"/></svg>
        </button>
        <div class="ex-divider-v"></div>
        <button class="ex-btn" :title="t('desktop.explorer.refresh')" @click="refresh">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8a6 6 0 0111.5-2.5M14 8a6 6 0 01-11.5 2.5"/><path d="M14 2v4h-4M2 14v-4h4"/></svg>
        </button>
      </div>

      <!-- 地址栏 -->
      <div class="ex-addressbar">
        <div class="ex-crumb">
          <span class="ex-crumb-seg" @click="navigate(ROOT_PATH)">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><rect x="2" y="3" width="12" height="9" rx="1"/><rect x="3" y="4.5" width="10" height="6" rx=".5" fill="rgba(15,23,42,.5)"/></svg>
            {{ t('desktop.explorer.thisPc') }}
          </span>
          <template v-for="(seg, i) in crumbs" :key="'s' + i">
            <svg class="ex-crumb-arrow" viewBox="0 0 8 12" width="6" height="10"><path d="M2 1l4 5-4 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span class="ex-crumb-seg" @click="navigate(crumbPath(i))">{{ seg }}</span>
          </template>
        </div>
      </div>

      <div class="ex-toolbar-right">
        <!-- 排序 -->
        <button class="ex-btn" :title="t('desktop.explorer.sort')" @click="toggleSort">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 4h10M3 8h7M3 12h4"/></svg>
        </button>
        <!-- 视图切换 -->
        <div class="ex-view-switcher">
          <button class="ex-view-btn" :class="{ active: viewMode === 'grid' }" :title="t('desktop.explorer.viewGrid')" @click.stop="viewMode = 'grid'">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
          </button>
          <button class="ex-view-btn" :class="{ active: viewMode === 'list' }" :title="t('desktop.explorer.viewList')" @click.stop="viewMode = 'list'">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="2" y="3" width="2" height="2" rx=".5"/><rect x="6" y="3" width="8" height="2" rx=".5"/><rect x="2" y="7" width="2" height="2" rx=".5"/><rect x="6" y="7" width="8" height="2" rx=".5"/><rect x="2" y="11" width="2" height="2" rx=".5"/><rect x="6" y="11" width="8" height="2" rx=".5"/></svg>
          </button>
          <button class="ex-view-btn" :class="{ active: viewMode === 'detail' }" :title="t('desktop.explorer.viewDetail')" @click.stop="viewMode = 'detail'">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="2" y="2" width="12" height="2.5" rx=".5"/><rect x="2" y="6.5" width="12" height="2.5" rx=".5"/><rect x="2" y="11" width="12" height="2.5" rx=".5"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div class="ex-body">
      <!-- 侧边栏 -->
      <aside class="ex-side">
        <div class="ex-side-group">
          <div class="ex-side-title">{{ t('desktop.explorer.quickAccess') }}</div>
          <button
            v-for="q in quickLinks"
            :key="q.path"
            class="ex-side-item"
            :class="{ active: currentPath === q.path }"
            @click="navigate(q.path)"
          >
            <span class="ex-side-ico" v-html="q.icon"></span>
            <span class="ex-side-name">{{ q.name }}</span>
          </button>
        </div>
        <div class="ex-side-group">
          <div class="ex-side-title">{{ t('desktop.explorer.devices') }}</div>
          <button class="ex-side-item" :class="{ active: currentPath === ROOT_PATH }" @click="navigate(ROOT_PATH)">
            <span class="ex-side-ico" v-html="PC_ICON"></span>
            <span class="ex-side-name">{{ t('desktop.explorer.thisPc') }}</span>
          </button>
        </div>
      </aside>

      <!-- 主区域 -->
      <div class="ex-main" @click.self="clearSelection">
        <!-- 网格视图 -->
        <div v-if="viewMode === 'grid'" class="ex-grid">
          <div
            v-for="it in sortedItems"
            :key="it.id"
            class="ex-cell"
            :class="{ sel: selected === it.id }"
            :title="it.name"
            @click.stop="selected = it.id"
            @dblclick="activate(it)"
          >
            <div class="ex-cell-icon" v-html="cellIcon(it)"></div>
            <span class="ex-cell-name">{{ it.name }}</span>
            <span class="ex-cell-kind">{{ it.type === 'folder' ? t('desktop.explorer.folder') : it.kind }}</span>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else-if="viewMode === 'list'" class="ex-list">
          <div
            v-for="it in sortedItems"
            :key="it.id"
            class="ex-list-row"
            :class="{ sel: selected === it.id }"
            @click.stop="selected = it.id"
            @dblclick="activate(it)"
          >
            <span class="ex-list-icon" v-html="cellIconSmall(it)"></span>
            <span class="ex-list-name">{{ it.name }}</span>
            <span class="ex-list-kind">{{ it.type === 'folder' ? t('desktop.explorer.folder') : it.kind }}</span>
          </div>
        </div>

        <!-- 详细信息视图 -->
        <div v-else-if="viewMode === 'detail'" class="ex-detail">
          <div class="ex-detail-header">
            <span class="ex-detail-col-name">{{ t('desktop.explorer.colName') }}</span>
            <span class="ex-detail-col-kind">{{ t('desktop.explorer.colType') }}</span>
          </div>
          <div
            v-for="it in sortedItems"
            :key="it.id"
            class="ex-detail-row"
            :class="{ sel: selected === it.id }"
            @click.stop="selected = it.id"
            @dblclick="activate(it)"
          >
            <span class="ex-detail-col-name">
              <span class="ex-detail-icon" v-html="cellIconSmall(it)"></span>
              {{ it.name }}
            </span>
            <span class="ex-detail-col-kind">{{ it.type === 'folder' ? t('desktop.explorer.folder') : it.kind }}</span>
          </div>
        </div>

        <div v-if="!sortedItems.length" class="ex-empty">{{ t('desktop.explorer.empty') }}</div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="ex-statusbar">
      <span>{{ t('desktop.explorer.itemCount', { count: currentItems.length }) }}</span>
      <span v-if="selected">{{ t('desktop.explorer.selectedCount', { count: 1 }) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWindowsStore } from '@/stores/windows'
import { APP_ICONS } from '@/utils/icons'

const { t } = useI18n()
const windows = useWindowsStore()
const triggerEnter = inject<(id: string) => void>('triggerEnter')

interface ExEntry {
  id: string
  name: string
  type: 'folder' | 'app'
  kind?: string
  path?: string
  apps?: string[]
  target?: string
  iconKey?: string
}

const ROOT_PATH = '/'

const FOLDER_ICON = '<svg viewBox="0 0 32 32" width="34" height="34"><path d="M4 10a2 2 0 012-2h6l2.4 2.4a1 1 0 00.7.3H26a2 2 0 012 2V24a2 2 0 01-2 2H6a2 2 0 01-2-2V10z" fill="#fbbf24"/><path d="M4 13V10a2 2 0 012-2h6l2.4 2.4a1 1 0 00.7.3H26a2 2 0 012 2v1H4z" fill="#f59e0b" opacity=".55"/></svg>'
const FOLDER_ICON_SM = '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 5a1 1 0 011-1h3l1.2 1.2a.5.5 0 00.35.15H13a1 1 0 011 1V12a1 1 0 01-1 1H3a1 1 0 01-1-1V5z" fill="#fbbf24"/><path d="M2 6.5V5a1 1 0 011-1h3l1.2 1.2a.5.5 0 00.35.15H13a1 1 0 011 1v.5H2z" fill="#f59e0b" opacity=".55"/></svg>'
const PC_ICON = '<svg viewBox="0 0 32 32" width="15" height="15"><rect x="3" y="6" width="26" height="17" rx="2" fill="#94a3b8"/><rect x="5" y="8.5" width="22" height="12" rx="1" fill="#0f172a" opacity=".35"/><rect x="13" y="23" width="6" height="3" fill="#94a3b8"/><rect x="9" y="26" width="14" height="2" rx="1" fill="#64748b"/></svg>'

const appRegistry = computed<ExEntry[]>(() => [
  { id: 'webword', name: 'WebWord', type: 'app', kind: t('desktop.explorer.kind.app'), target: 'webword', iconKey: 'webword' },
  { id: 'blog', name: t('desktop.app.blog'), type: 'app', kind: t('desktop.explorer.kind.app'), target: 'blog', iconKey: 'blog' },
  { id: 'browser', name: t('desktop.app.browser'), type: 'app', kind: t('desktop.explorer.kind.app'), target: 'browser', iconKey: 'browser' },
  { id: 'settings', name: t('common.settings'), type: 'app', kind: t('desktop.explorer.kind.app'), target: 'settings', iconKey: 'settings' },
  { id: 'perfcounter', name: t('desktop.app.perfcounter'), type: 'app', kind: t('desktop.explorer.kind.app'), target: 'perfcounter', iconKey: 'perfcounter' },
  { id: 'explorer', name: t('desktop.app.explorer'), type: 'app', kind: t('desktop.explorer.kind.app'), target: 'explorer', iconKey: 'explorer' },
])

const folders = computed(() => [
  { id: 'desktop', name: t('desktop.explorer.desktop'), apps: ['blog', 'browser', 'settings', 'perfcounter', 'webword', 'explorer'] },
  { id: 'programs', name: t('desktop.explorer.programs'), apps: ['webword', 'blog', 'browser', 'settings', 'perfcounter'] },
])

// ── 视图模式 ──────────────────────────
type ViewMode = 'grid' | 'list' | 'detail'
const viewMode = ref<ViewMode>('grid')

// ── 排序 ──────────────────────────────
type SortOrder = 'name-asc' | 'name-desc' | 'type-asc'
const sortOrder = ref<SortOrder>('name-asc')

function toggleSort() {
  const orders: SortOrder[] = ['name-asc', 'name-desc', 'type-asc']
  const idx = orders.indexOf(sortOrder.value)
  sortOrder.value = orders[(idx + 1) % orders.length]
}

// ── 导航 ──────────────────────────────
const currentPath = ref(ROOT_PATH)
const history = ref<string[]>([ROOT_PATH])
const histPos = ref(0)
const selected = ref<string | null>(null)

const canBack = computed(() => histPos.value > 0)
const canForward = computed(() => histPos.value < history.value.length - 1)
const canUp = computed(() => currentPath.value !== ROOT_PATH)

const crumbs = computed(() => currentPath.value.split('/').filter(Boolean))

function crumbPath(i: number) {
  return '/' + crumbs.value.slice(0, i + 1).join('/')
}

function navigate(path: string) {
  if (path === currentPath.value) return
  currentPath.value = path
  history.value = history.value.slice(0, histPos.value + 1)
  history.value.push(path)
  histPos.value = history.value.length - 1
  selected.value = null
}

function goBack() {
  if (!canBack.value) return
  histPos.value--
  currentPath.value = history.value[histPos.value]
  selected.value = null
}

function goForward() {
  if (!canForward.value) return
  histPos.value++
  currentPath.value = history.value[histPos.value]
  selected.value = null
}

function goUp() {
  if (currentPath.value === ROOT_PATH) return
  const parts = currentPath.value.split('/').filter(Boolean)
  parts.pop()
  navigate(parts.length ? '/' + parts.join('/') : ROOT_PATH)
}

function refresh() {
  // 触发重新渲染
  const path = currentPath.value
  currentPath.value = ''
  requestAnimationFrame(() => { currentPath.value = path })
}

function clearSelection() {
  selected.value = null
}

// ── 当前目录内容 ─────────────────────
const currentItems = computed<ExEntry[]>(() => {
  if (currentPath.value === ROOT_PATH) {
    return folders.value.map((f) => ({ id: 'folder:' + f.id, name: f.name, type: 'folder' as const, path: '/' + f.id }))
  }
  const seg = currentPath.value.replace(/^\//, '')
  const folder = folders.value.find((f) => f.id === seg)
  if (!folder) return []
  return folder.apps
    .map((id) => appRegistry.value.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => !!a)
})

const sortedItems = computed(() => {
  const items = [...currentItems.value]
  switch (sortOrder.value) {
    case 'name-asc':
      return items.sort((a, b) => {
        // 文件夹始终在前
        if (a.type === 'folder' && b.type !== 'folder') return -1
        if (a.type !== 'folder' && b.type === 'folder') return 1
        return a.name.localeCompare(b.name)
      })
    case 'name-desc':
      return items.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1
        if (a.type !== 'folder' && b.type === 'folder') return 1
        return b.name.localeCompare(a.name)
      })
    case 'type-asc':
      return items.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1
        if (a.type !== 'folder' && b.type === 'folder') return 1
        const typeCmp = a.type.localeCompare(b.type)
        return typeCmp !== 0 ? typeCmp : a.name.localeCompare(b.name)
      })
    default:
      return items
  }
})

function activate(it: ExEntry) {
  if (it.type === 'folder' && it.path) {
    navigate(it.path)
    return
  }
  if (it.target) {
    windows.open({ id: it.target, title: it.name, icon: it.iconKey || it.target, url: '' })
    triggerEnter?.(it.target)
  }
}

function cellIcon(it: ExEntry) {
  if (it.type === 'folder') return FOLDER_ICON
  return APP_ICONS[it.iconKey || ''] || ''
}

function cellIconSmall(it: ExEntry) {
  if (it.type === 'folder') return FOLDER_ICON_SM
  return APP_ICONS[it.iconKey || ''] || ''
}

const quickLinks = computed(() => [
  { path: '/desktop', name: t('desktop.explorer.desktop'), icon: FOLDER_ICON },
  { path: '/programs', name: t('desktop.explorer.programs'), icon: FOLDER_ICON },
])
</script>

<style scoped>
.explorer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(15, 15, 35, .35);
  color: #e2e8f0;
  font-size: 13px;
  user-select: none;
  overflow: hidden;
}

/* ── 工具栏 ────────────────────────── */
.ex-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(12, 12, 30, .45);
  border-bottom: 1px solid rgba(255, 255, 255, .06);
  flex-shrink: 0;
}

.ex-nav-btns {
  display: flex;
  align-items: center;
  gap: 2px;
}

.ex-btn {
  width: 30px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: rgba(255, 255, 255, .7);
  border-radius: 6px;
  cursor: pointer;
  transition: all .15s;
  flex-shrink: 0;

  &:hover:not(:disabled) { background: rgba(255, 255, 255, .1); color: #fff; }
  &:disabled { opacity: .3; cursor: default; }
}

.ex-divider-v {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, .1);
  margin: 0 4px;
}

/* ── 地址栏 ────────────────────────── */
.ex-addressbar {
  flex: 1;
  min-width: 0;
}

.ex-crumb {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  background: rgba(255, 255, 255, .06);
  border-radius: 6px;
  overflow: hidden;
  white-space: nowrap;
}

.ex-crumb-seg {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, .85);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12.5px;

  &:hover { background: rgba(255, 255, 255, .12); color: #fff; }
}

.ex-crumb-arrow {
  color: rgba(255, 255, 255, .3);
  flex-shrink: 0;
}

/* ── 工具栏右侧 ────────────────────── */
.ex-toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ex-view-switcher {
  display: flex;
  background: rgba(255, 255, 255, .06);
  border-radius: 6px;
  padding: 2px;
}

.ex-view-btn {
  width: 28px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: rgba(255, 255, 255, .5);
  border-radius: 4px;
  cursor: pointer;
  transition: all .15s;

  &:hover { color: rgba(255, 255, 255, .8); }
  &.active { background: rgba(255, 255, 255, .12); color: #fff; }
}

/* ── 主体 ──────────────────────────── */
.ex-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ── 侧边栏 ────────────────────────── */
.ex-side {
  width: 180px;
  flex-shrink: 0;
  padding: 8px;
  background: rgba(12, 12, 30, .3);
  border-right: 1px solid rgba(255, 255, 255, .06);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ex-side-group {
  display: flex;
  flex-direction: column;
}

.ex-side-title {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, .45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 6px 10px 4px;
}

.ex-side-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: none;
  background: none;
  color: rgba(255, 255, 255, .75);
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: all .15s;

  &:hover { background: rgba(255, 255, 255, .08); }
  &.active { background: rgba(139, 92, 246, .2); color: #fff; }

  .ex-side-ico { 
    display: flex; 
    align-items: center;
    flex-shrink: 0; 
    width: 16px;
    height: 16px;
  }
  .ex-side-name { 
    font-size: 12.5px; 
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* ── 主内容 ────────────────────────── */
.ex-main {
  flex: 1;
  overflow: auto;
  padding: 12px;
  position: relative;
}

/* ── 网格视图 ──────────────────────── */
.ex-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 4px;
}

.ex-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .15s;
  text-align: center;

  &:hover { background: rgba(255, 255, 255, .07); }
  &.sel { background: rgba(139, 92, 246, .2); }
}

.ex-cell-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  transition: transform .15s;
}

.ex-cell:hover .ex-cell-icon { transform: scale(1.08); }

.ex-cell-name {
  font-size: 12px;
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ex-cell-kind {
  font-size: 10.5px;
  color: rgba(255, 255, 255, .35);
}

/* ── 列表视图 ──────────────────────── */
.ex-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ex-list-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s;

  &:hover { background: rgba(255, 255, 255, .06); }
  &.sel { background: rgba(139, 92, 246, .2); }
}

.ex-list-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.ex-list-name {
  flex: 1;
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ex-list-kind {
  font-size: 11.5px;
  color: rgba(255, 255, 255, .45);
  flex-shrink: 0;
}

/* ── 详细信息视图 ──────────────────── */
.ex-detail {
  display: flex;
  flex-direction: column;
}

.ex-detail-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, .5);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.ex-detail-row {
  display: flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background .15s;

  &:hover { background: rgba(255, 255, 255, .05); }
  &.sel { background: rgba(139, 92, 246, .18); }
}

.ex-detail-col-name {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  overflow: hidden;
}

.ex-detail-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.ex-detail-col-kind {
  width: 100px;
  flex-shrink: 0;
  font-size: 11.5px;
  color: rgba(255, 255, 255, .45);
}

/* ── 空状态 ────────────────────────── */
.ex-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, .3);
  font-size: 13px;
}

/* ── 状态栏 ────────────────────────── */
.ex-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: rgba(12, 12, 30, .35);
  border-top: 1px solid rgba(255, 255, 255, .06);
  font-size: 11px;
  color: rgba(255, 255, 255, .5);
  flex-shrink: 0;
}
</style>
