<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '@/webword/stores/document'
import { useFileMenu } from '@/webword/composables/useFileMenu'
import { useRecentDocs, type RecentDoc } from '@/webword/composables/useRecentDocs'
import { domtHeaders } from '@/utils/domtToken'
import { STATIC_MODE } from '@/utils/siteMode'
import { fetchCategoryArticle, getCategoryTree } from '@/utils/staticData'

const emit = defineEmits<{
  (e: 'open-document', key: string): void
  (e: 'new-document'): void
  (e: 'open-template', key: string): void
  (e: 'hide-menu'): void
}>()

const { t } = useI18n()

const docStore = useDocumentStore()
const fm = useFileMenu()

const activeSource = ref<'recent' | 'shared' | 'thispc' | 'browse'>('recent')

interface SavedDoc {
  id: number
  title: string
  filename: string
  format: string
  size: number
  author: string | null
  category: string | null
  created_at: string
  updated_at: string
}

interface CategoryNode {
  name: string
  path: string
  type: 'folder' | 'document'
  children?: CategoryNode[]
  title?: string
  description?: string
  cover?: string | null
  category?: string
  tags?: string[]
  created?: string
  filename?: string | null
}

interface FlatNode {
  name: string
  path: string
  type: 'folder' | 'document'
  depth: number
  visible: boolean
  title: string
  node: CategoryNode
}

interface FlatDoc {
  id: string
  title: string
  filename: string
  format: string
  size: number
  source: 'db' | 'category'
  category?: string
  created_at: string
  updated_at: string
}

const savedDocs = ref<SavedDoc[]>([])
const docsLoading = ref(false)
const docsError = ref('')
const deleting = ref<string | null>(null)

const allDocs = ref<FlatDoc[]>([])

const { recentDocs, addRecentDoc } = useRecentDocs()

async function openRecentDoc(doc: RecentDoc) {
  if (doc.key === 'blank') {
    emit('new-document')
    return
  }
  if (doc.key === 'welcome') {
    emit('open-template', 'welcome')
    return
  }
  if (doc.key.startsWith('db:')) {
    const filename = doc.key.slice(3)
    const saved = savedDocs.value.find(d => d.filename === filename)
    if (saved) {
      await openSavedDoc(saved)
      return
    }
    // Document no longer exists, remove from recent
    recentDocs.value = recentDocs.value.filter(d => d.key !== doc.key)
    try { localStorage.setItem('webword_recent_docs', JSON.stringify(recentDocs.value)) } catch {}
    return
  }
  if (doc.key.startsWith('cat:')) {
    const path = doc.key.slice(4)
    browsingDoc.value = path
    try {
      const data = STATIC_MODE
        ? await fetchCategoryArticle(path)
        : await fetch(`/api/documents/category/${encodeURIComponent(path)}`, { headers: domtHeaders() }).then(async res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.json()
          })
      docStore.newDocument()
      docStore.docInfo.title = data.title || doc.name
      docStore.docInfo.author = data.author?.display_name || data.meta?.author || 'WebWord'
      docStore.docInfo.authorUuid = data.meta?.author_uuid || null
      docStore.docInfo.authorAvatar = data.author?.avatar || null
      docStore.setContent(data.content)
      nextTick(() => fm.refreshInfo())
      emit('hide-menu')
    } catch (e: any) {
      console.error('Failed to open recent category document:', e)
    } finally {
      browsingDoc.value = null
    }
  }
}

const categoryTree = ref<CategoryNode[]>([])
const categoriesLoading = ref(false)
const categoriesError = ref('')
const expandedFolders = ref<Set<string>>(new Set())
const browsingDoc = ref<string | null>(null)

async function fetchSavedDocs() {
  docsLoading.value = true
  docsError.value = ''
  try {
    // 静态站点：只有分类文章，没有“保存到服务器”的文档
    if (STATIC_MODE) {
      const tree = await getCategoryTree()
      categoryTree.value = tree as any
      savedDocs.value = []
      allDocs.value = []
      return
    }
    const [docsRes, catsRes] = await Promise.all([
      fetch('/api/documents', { headers: domtHeaders() }),
      fetch('/api/documents/categories', { headers: domtHeaders() })
    ])
    if (!docsRes.ok) throw new Error(`HTTP ${docsRes.status}`)
    const docsData = await docsRes.json()
    savedDocs.value = docsData.documents || []

    // Merge DB docs and category docs (category docs now indexed in DB with cat: prefix)
    const merged: FlatDoc[] = (docsData.documents || []).map((d: SavedDoc) => ({
      id: d.filename?.startsWith('cat:') ? d.filename : `db:${d.id}`,
      title: d.title,
      filename: d.filename,
      format: d.format,
      size: d.size,
      source: d.filename?.startsWith('cat:') ? 'category' as const : 'db' as const,
      category: d.category || undefined,
      created_at: d.created_at,
      updated_at: d.updated_at
    }))

    // Category tree for browse tab (no longer merged here since DB already has them)
    if (catsRes.ok) {
      const catsData = await catsRes.json()
      categoryTree.value = catsData.tree || []
    } else {
      categoryTree.value = []
    }

    // Sort by updated_at descending
    merged.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    allDocs.value = merged
  } catch (e: any) {
    docsError.value = t('wwf.loadLocalFilesError')
    savedDocs.value = []
    allDocs.value = []
  } finally {
    docsLoading.value = false
  }
}

async function openSavedDoc(doc: SavedDoc) {
  try {
    const res = await fetch(`/api/documents/${encodeURIComponent(doc.filename)}`, { headers: domtHeaders() })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    docStore.newDocument()
    docStore.docInfo.title = doc.title
    docStore.setContent(data.content)
    nextTick(() => fm.refreshInfo())
    addRecentDoc(doc.title, 'db:' + doc.filename)
    emit('hide-menu')
  } catch (e: any) {
    console.error('Failed to open document:', e)
  }
}

async function openFlatDoc(doc: FlatDoc) {
  if (doc.source === 'db') {
    // Reuse openSavedDoc logic
    const saved = savedDocs.value.find(d => `db:${d.id}` === doc.id)
    if (saved) await openSavedDoc(saved)
  } else {
    // Open category document
    browsingDoc.value = doc.id
    try {
      const data = STATIC_MODE
        ? await fetchCategoryArticle(doc.category!)
        : await fetch(`/api/documents/category/${encodeURIComponent(doc.category!)}`, { headers: domtHeaders() }).then(async res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.json()
          })
      docStore.newDocument()
      docStore.docInfo.title = data.title || doc.title
      docStore.docInfo.author = data.author?.display_name || data.meta?.author || 'WebWord'
      docStore.docInfo.authorUuid = data.meta?.author_uuid || null
      docStore.docInfo.authorAvatar = data.author?.avatar || null
      docStore.setContent(data.content)
      nextTick(() => fm.refreshInfo())
      addRecentDoc(data.title || doc.title, 'cat:' + doc.category!)
      emit('hide-menu')
    } catch (e: any) {
      console.error('Failed to open category document:', e)
    } finally {
      browsingDoc.value = null
    }
  }
}

async function deleteSavedDoc(doc: SavedDoc) {
  deleting.value = doc.filename
  try {
    await fetch(`/api/documents/${encodeURIComponent(doc.filename)}`, { method: 'DELETE', headers: domtHeaders() })
    savedDocs.value = savedDocs.value.filter(d => d.filename !== doc.filename)
    allDocs.value = allDocs.value.filter(d => d.id !== `db:${doc.id}`)
  } catch (e: any) {
    console.error('Failed to delete document:', e)
  } finally {
    deleting.value = null
  }
}

// ── Category Browse ──

async function fetchCategories() {
  categoriesLoading.value = true
  categoriesError.value = ''
  try {
    if (STATIC_MODE) {
      categoryTree.value = await getCategoryTree() as any
      return
    }
    const res = await fetch('/api/documents/categories', { headers: domtHeaders() })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    categoryTree.value = data.tree || []
  } catch (e: any) {
    categoriesError.value = t('wwf.loadCategoriesError')
    categoryTree.value = []
  } finally {
    categoriesLoading.value = false
  }
}

function toggleFolder(path: string) {
  const s = new Set(expandedFolders.value)
  if (s.has(path)) s.delete(path)
  else s.add(path)
  expandedFolders.value = s
}

function flattenTree(nodes: CategoryNode[], depth = 0, parentVisible = true): FlatNode[] {
  const result: FlatNode[] = []
  for (const node of nodes) {
    const visible = parentVisible
    result.push({
      name: node.name,
      path: node.path,
      type: node.type,
      depth,
      visible,
      title: node.title || node.name,
      node
    })
    if (node.type === 'folder' && node.children) {
      const childVisible = visible && expandedFolders.value.has(node.path)
      result.push(...flattenTree(node.children, depth + 1, childVisible))
    }
  }
  return result
}

async function openCategoryDoc(node: CategoryNode) {
  if (node.type !== 'document') return
  browsingDoc.value = node.path
  try {
    const data = STATIC_MODE
      ? await fetchCategoryArticle(node.path)
      : await fetch(`/api/documents/category/${encodeURIComponent(node.path)}`, { headers: domtHeaders() }).then(async res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
    docStore.newDocument()
    docStore.docInfo.title = data.title || node.title || node.name
    docStore.docInfo.author = data.author?.display_name || data.meta?.author || 'WebWord'
    docStore.docInfo.authorUuid = data.meta?.author_uuid || null
    docStore.docInfo.authorAvatar = data.author?.avatar || null
    docStore.setContent(data.content)
    nextTick(() => fm.refreshInfo())
    addRecentDoc(data.title || node.title || node.name, 'cat:' + node.path)
    emit('hide-menu')
  } catch (e: any) {
    console.error('Failed to open category document:', e)
  } finally {
    browsingDoc.value = null
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return dateStr
  }
}

function handleSourceChange(source: 'recent' | 'shared' | 'thispc' | 'browse') {
  activeSource.value = source
  if (source === 'thispc' && savedDocs.value.length === 0 && !docsLoading.value) {
    fetchSavedDocs()
  }
  if (source === 'browse' && categoryTree.value.length === 0 && !categoriesLoading.value) {
    fetchCategories()
  }
}

const openingSource = ref('')
const closingSource = ref('')

function fileListClass(source: string) {
  return {
    'file-open-filelist': true,
    active: activeSource.value === source,
    'open-entering': openingSource.value === source,
    'open-leaving': closingSource.value === source,
  }
}

function browseFileListClass(source: string) {
  return {
    'file-open-filelist': true,
    'file-browse-filelist': true,
    active: activeSource.value === source,
    'open-entering': openingSource.value === source,
    'open-leaving': closingSource.value === source,
  }
}
</script>

<template>
  <h1 class="file-menu-title">{{ $t('common.open') }}</h1>
  <div class="file-open-layout">
    <div class="file-open-sources">
      <div
        class="file-source-item"
        :class="{ active: activeSource === 'recent' }"
        data-source="recent"
        @click="handleSourceChange('recent')"
      >{{ $t('wwf.sourceRecent') }}</div>
      <div
        class="file-source-item"
        :class="{ active: activeSource === 'shared' }"
        data-source="shared"
        @click="handleSourceChange('shared')"
      >{{ $t('wwf.sourceShared') }}</div>
      <div
        class="file-source-item"
        :class="{ active: activeSource === 'thispc' }"
        data-source="thispc"
        @click="handleSourceChange('thispc')"
      >{{ $t('wwf.sourceThisPc') }}</div>
      <div
        class="file-source-item"
        :class="{ active: activeSource === 'browse' }"
        data-source="browse"
        @click="handleSourceChange('browse')"
      >{{ $t('wwf.sourceBrowse') }}</div>
    </div>
    <div class="file-open-files">
      <!-- Recent -->
      <div id="fileOpenRecent" :class="fileListClass('recent')">
        <input type="text" class="file-search-bar" :placeholder="$t('wwf.searchRecentFiles')">
        <div v-if="recentDocs.length === 0" class="file-thispc-label" style="margin-top:16px;text-align:center;">{{ $t('wwf.noRecentFiles') }}</div>
        <div v-else class="file-saved-list" style="margin-top:8px;">
          <div
            v-for="doc in recentDocs"
            :key="doc.key"
            class="file-saved-item"
            @click="openRecentDoc(doc)"
          >
            <div class="file-saved-icon">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="currentColor" opacity=".12"/>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                <path d="M14 2v6h6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="file-saved-body">
              <div class="file-saved-title">{{ doc.name }}</div>
              <div class="file-saved-meta">
                <span>{{ $t('wwf.recentlyOpened', { desc: doc.desc }) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Shared -->
      <div id="fileOpenShared" :class="fileListClass('shared')">
        <input type="text" class="file-search-bar" :placeholder="$t('wwf.searchSharedFiles')">
        <div class="file-thispc-label" style="margin-top:16px;text-align:center;">{{ $t('wwf.noSharedFiles') }}</div>
      </div>

      <!-- This PC -->
      <div id="fileOpenThisPc" :class="fileListClass('thispc')">
        <div class="file-thispc-label">{{ $t('wwf.localFiles') }}</div>

        <div v-if="docsLoading" class="file-thispc-hint">{{ $t('wwf.loadingDots') }}</div>
        <div v-else-if="docsError" class="file-thispc-hint">{{ docsError }}</div>
        <div v-else-if="allDocs.length === 0" class="file-thispc-hint">{{ $t('wwf.noLocalFiles') }}</div>

        <div v-else class="file-saved-list">
          <div
            v-for="doc in allDocs"
            :key="doc.id"
            class="file-saved-item"
            :class="{ 'file-saved-category': doc.source === 'category' }"
            @click="openFlatDoc(doc)"
          >
            <div class="file-saved-icon">
              <!-- DB document icon -->
              <svg v-if="doc.source === 'db'" viewBox="0 0 24 24" width="18" height="18">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="currentColor" opacity=".12"/>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                <path d="M14 2v6h6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              </svg>
              <!-- Category document icon -->
              <svg v-else viewBox="0 0 24 24" width="18" height="18">
                <path d="M4 5h7l2 2h7v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" fill="currentColor" opacity=".12"/>
                <path d="M4 5h7l2 2h7v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="file-saved-body">
              <div class="file-saved-title">{{ doc.title }}</div>
              <div class="file-saved-meta">
                <span v-if="doc.source === 'db'">{{ formatSize(doc.size) }} · {{ formatDate(doc.updated_at) }}</span>
                <span v-else>{{ doc.category || $t('wwf.categoryDoc') }} · {{ formatDate(doc.updated_at) }}</span>
                <span class="file-saved-format">{{ doc.format.toUpperCase() }}</span>
                <span v-if="doc.source === 'category'" class="file-saved-badge">{{ $t('wwf.categoryBadge') }}</span>
              </div>
            </div>
            <button
              v-if="doc.source === 'db'"
              class="file-saved-delete"
              :disabled="deleting === doc.filename"
              @click.stop="deleteSavedDoc(savedDocs.find(d => `db:${d.id}` === doc.id)!)"
              :title="$t('common.delete')"
            >
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

      </div>

      <!-- Browse -->
      <div id="fileOpenBrowse" :class="browseFileListClass('browse')">
        <div class="file-thispc-label">{{ $t('wwf.categoryBrowse') }}</div>

        <div v-if="categoriesLoading" class="file-thispc-hint">{{ $t('wwf.loadingDots') }}</div>
        <div v-else-if="categoriesError" class="file-thispc-hint">{{ categoriesError }}</div>
        <div v-else-if="categoryTree.length === 0" class="file-thispc-hint">{{ $t('wwf.noCategoryDocs') }}</div>

        <div v-else class="file-browse-tree">
          <template v-for="flat in flattenTree(categoryTree)" :key="flat.path">
            <div
              v-if="flat.visible"
              class="file-browse-node"
              :class="{
                'file-browse-folder': flat.type === 'folder',
                'file-browse-doc': flat.type === 'document',
                'file-browse-loading': browsingDoc === flat.path
              }"
              :style="{ paddingLeft: (12 + flat.depth * 18) + 'px' }"
              @click="flat.type === 'folder' ? toggleFolder(flat.path) : openCategoryDoc(flat.node)"
            >
              <span class="file-browse-arrow" v-if="flat.type === 'folder'">
                <svg viewBox="0 0 16 16" width="12" height="12" :class="{ rotated: expandedFolders.has(flat.path) }">
                  <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="file-browse-icon">
                <svg v-if="flat.type === 'folder'" viewBox="0 0 20 20" width="16" height="16">
                  <path d="M2 4.5A1.5 1.5 0 013.5 3h4.63a1.5 1.5 0 011.06.44L10.5 4.5H16.5A1.5 1.5 0 0118 6v9.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 15.5V4.5z" fill="currentColor" opacity=".15"/>
                  <path d="M2 4.5A1.5 1.5 0 013.5 3h4.63a1.5 1.5 0 011.06.44L10.5 4.5H16.5A1.5 1.5 0 0118 6v9.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 15.5V4.5z" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
                </svg>
                <svg v-else viewBox="0 0 20 20" width="16" height="16">
                  <path d="M4 3h7l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" fill="currentColor" opacity=".12"/>
                  <path d="M4 3h7l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
                  <path d="M11 3v4h4" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="file-browse-label">{{ flat.title }}</span>
            </div>
          </template>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.file-thispc-hint {
  text-align: center;
  margin-top: 16px;
  color: #6b7280;
  font-size: 13px;
}
.file-saved-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.file-saved-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s;
}
.file-saved-item:hover {
  background: rgba(255,255,255,.04);
}
.file-saved-icon {
  color: #4da3ff;
  flex-shrink: 0;
}
.file-saved-body {
  flex: 1;
  min-width: 0;
}
.file-saved-title {
  font-size: 13px;
  color: #e8ecf2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-saved-meta {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.file-saved-format {
  background: rgba(77,163,255,.12);
  color: #4da3ff;
  padding: 0 5px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}
.file-saved-delete {
  background: none;
  border: none;
  color: #4a5568;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color .15s, background .15s;
  flex-shrink: 0;
  opacity: 0;
}
.file-saved-item:hover .file-saved-delete {
  opacity: 1;
}
.file-saved-delete:hover {
  color: #f87171;
  background: rgba(248,113,113,.1);
}
.file-saved-delete:disabled {
  opacity: .4;
}

/* ── Browse tree ── */
.file-browse-filelist {
  overflow-y: auto;
}
.file-browse-tree {
  margin-top: 8px;
}
.file-browse-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 5px;
  cursor: pointer;
  transition: background .12s;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-browse-node:hover {
  background: rgba(255,255,255,.06);
}
.file-browse-folder {
  color: #e8ecf2;
}
.file-browse-doc {
  color: #c8d0da;
}
.file-browse-doc:hover {
  color: #e8ecf2;
}
.file-browse-arrow {
  width: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}
.file-browse-arrow svg {
  transition: transform .15s;
}
.file-browse-arrow svg.rotated {
  transform: rotate(90deg);
}
.file-browse-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: #6b7280;
}
.file-browse-folder > .file-browse-icon {
  color: #eab308;
}
.file-browse-doc > .file-browse-icon {
  color: #4da3ff;
}
.file-browse-label {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-browse-loading {
  opacity: .5;
  pointer-events: none;
}
.file-saved-category {
  opacity: .85;
}
.file-saved-category .file-saved-icon {
  color: #22c55e;
}
.file-saved-badge {
  background: rgba(34,197,94,.12);
  color: #22c55e;
  padding: 0 5px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}
</style>
