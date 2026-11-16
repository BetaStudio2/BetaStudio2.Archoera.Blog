<script setup lang="ts">
import { ref, computed, watch, inject, onMounted, onUnmounted } from 'vue'
import { useDocumentStore } from '@/webword/stores/document'

const documentStore = useDocumentStore()

interface WindowControl {
  windowId: string
  isBorderless: boolean
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
  bringToFront: () => void
  updatePosition: (x: number, y: number) => void
  setDragging: (v: boolean) => void
  getWindowState: () => { maximized: boolean; x: number; y: number; width: number; height: number }
}

const windowControl = inject<WindowControl | null>('windowControl', null)
const isBorderlessMode = computed(() => !!windowControl?.isBorderless)
const maximized = ref(false)

watch(() => windowControl?.getWindowState?.(), (state) => {
  if (state) maximized.value = state.maximized
}, { deep: true, immediate: true })

let fullscreenListener: (() => void) | null = null
onMounted(() => {
  if (typeof document !== 'undefined') {
    fullscreenListener = () => {
      if (!isBorderlessMode.value) {
        maximized.value = !!document.fullscreenElement
      }
    }
    document.addEventListener('fullscreenchange', fullscreenListener)
  }
})
onUnmounted(() => {
  if (fullscreenListener && typeof document !== 'undefined') {
    document.removeEventListener('fullscreenchange', fullscreenListener)
  }
  if (dragPointerId !== -1 && typeof document !== 'undefined') {
    document.removeEventListener('pointermove', onDragMove, true)
    document.removeEventListener('pointerup', onDragEnd, true)
    document.removeEventListener('pointercancel', onDragEnd, true)
  }
})

function handleMinimize() {
  if (windowControl) {
    windowControl.minimize()
  }
}

function handleToggleMaximize() {
  if (windowControl) {
    windowControl.toggleMaximize()
  } else if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      maximized.value = true
    }).catch(() => {})
  } else {
    document.exitFullscreen().then(() => {
      maximized.value = false
    }).catch(() => {})
  }
}

function handleClose() {
  if (windowControl) {
    windowControl.close()
  } else {
    documentStore.closeDocument()
    window.close()
  }
}

function handleTitleBarDblClick(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.no-drag')) return
  handleToggleMaximize()
}

let dragPointerId = -1
let dragStartX = 0
let dragStartY = 0
let dragStartWinX = 0
let dragStartWinY = 0
let dragTitleEl: HTMLElement | null = null
let dragMoved = false
const DRAG_THRESHOLD = 4

function startDrag(e: PointerEvent) {
  if (!windowControl) return
  if ((e.target as HTMLElement).closest('.no-drag')) return
  if (e.button !== 0) return
  const state = windowControl.getWindowState()
  if (state.maximized) return
  dragMoved = false
  windowControl.bringToFront()
  dragPointerId = e.pointerId
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragStartWinX = state.x
  dragStartWinY = state.y
  dragTitleEl = e.currentTarget as HTMLElement
  try {
    dragTitleEl.setPointerCapture(e.pointerId)
  } catch (_) { /* noop */ }
  document.addEventListener('pointermove', onDragMove, true)
  document.addEventListener('pointerup', onDragEnd, true)
  document.addEventListener('pointercancel', onDragEnd, true)
}

function onDragMove(ev: PointerEvent) {
  if (ev.pointerId !== dragPointerId) return
  const dx = ev.clientX - dragStartX
  const dy = ev.clientY - dragStartY
  if (!dragMoved) {
    if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
    dragMoved = true
    windowControl?.setDragging(true)
    ev.preventDefault()
  }
  windowControl?.updatePosition(dragStartWinX + dx, dragStartWinY + dy)
}

function onDragEnd(ev: PointerEvent) {
  if (ev.pointerId !== dragPointerId) return
  if (dragTitleEl) {
    try {
      dragTitleEl.releasePointerCapture(ev.pointerId)
    } catch (_) { /* noop */ }
    dragTitleEl = null
  }
  if (dragMoved) windowControl?.setDragging(false)
  dragPointerId = -1
  dragMoved = false
  document.removeEventListener('pointermove', onDragMove, true)
  document.removeEventListener('pointerup', onDragEnd, true)
  document.removeEventListener('pointercancel', onDragEnd, true)
}

const searchQuery = ref('')
const searchResults = ref<{ offset: number; length: number; element: HTMLElement }[]>([])
const currentResultIndex = ref(-1)
const searchMatchCount = ref(0)
const searchCurrent = ref(0)

function clearDocHighlights() {
  const doc = document.getElementById('doc')
  if (!doc) return
  const marks = doc.querySelectorAll('.doc-search-highlight')
  marks.forEach(m => {
    const parent = m.parentNode
    if (parent) {
      parent.replaceChild(document.createTextNode(m.textContent || ''), m)
      parent.normalize()
    }
  })
  searchResults.value = []
  currentResultIndex.value = -1
  searchMatchCount.value = 0
  searchCurrent.value = 0
}

function searchInDocument(kw: string) {
  clearDocHighlights()
  const docEl = document.getElementById('doc')
  if (!kw || !docEl) return

  const lowerKw = kw.toLowerCase()
  const walker = document.createTreeWalker(
    docEl,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = (node as Text).parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        const tag = parent.tagName.toLowerCase()
        if (['script', 'style', 'noscript'].includes(tag)) {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      }
    },
  )

  const nodes: Text[] = []
  while (walker.nextNode()) {
    const n = walker.currentNode as Text
    if (n.textContent && n.textContent.toLowerCase().includes(lowerKw)) {
      nodes.push(n)
    }
  }

  const results: { offset: number; length: number; element: HTMLElement }[] = []
  nodes.forEach(node => {
    const text = node.textContent!
    const lowerText = text.toLowerCase()
    let idx = 0

    const nodeMatches: { offset: number; length: number }[] = []
    while ((idx = lowerText.indexOf(lowerKw, idx)) !== -1) {
      nodeMatches.push({ offset: idx, length: kw.length })
      idx += kw.length
      if (nodeMatches.length > 500) break
    }

    if (nodeMatches.length === 0) return
    if (results.length > 500) return

    const parent = node.parentNode
    if (!parent) return

    let lastEnd = 0
    nodeMatches.forEach(m => {
      if (m.offset > lastEnd) {
        parent.insertBefore(document.createTextNode(text.substring(lastEnd, m.offset)), node)
      }

      const mark = document.createElement('mark')
      mark.className = 'doc-search-highlight'
      mark.setAttribute('data-index', String(results.length))
      mark.textContent = text.substring(m.offset, m.offset + m.length)
      parent.insertBefore(mark, node)

      results.push({
        offset: m.offset,
        length: m.length,
        element: mark
      })

      lastEnd = m.offset + m.length
    })

    if (lastEnd < text.length) {
      parent.insertBefore(document.createTextNode(text.substring(lastEnd)), node)
    }
    parent.removeChild(node)
  })

  searchResults.value = results
  searchMatchCount.value = results.length
  if (results.length > 0) {
    currentResultIndex.value = 0
    searchCurrent.value = 1
    highlightCurrentResult()
  }
}

function highlightCurrentResult() {
  const doc = document.getElementById('doc')
  if (!doc) return
  const marks = doc.querySelectorAll('.doc-search-highlight')
  marks.forEach(m => m.classList.remove('current'))

  if (currentResultIndex.value >= 0 && currentResultIndex.value < searchResults.value.length) {
    const r = searchResults.value[currentResultIndex.value]
    if (r && r.element) {
      r.element.classList.add('current')
      r.element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
}

function navigateResult(direction: 1 | -1) {
  if (searchResults.value.length === 0) return
  currentResultIndex.value += direction
  if (currentResultIndex.value < 0) currentResultIndex.value = searchResults.value.length - 1
  if (currentResultIndex.value >= searchResults.value.length) currentResultIndex.value = 0
  searchCurrent.value = currentResultIndex.value + 1
  highlightCurrentResult()
}

function applySearch() {
  const kw = searchQuery.value.trim()

  const tocEl = document.getElementById('toc')
  if (tocEl) {
    const links = tocEl.querySelectorAll('a')
    links.forEach(a => {
      const el = a as HTMLElement
      const t = el.textContent?.toLowerCase() || ''
      if (!kw) {
        el.style.opacity = ''
        el.innerHTML = el.textContent || ''
      } else if (t.includes(kw.toLowerCase())) {
        el.style.opacity = '1'
        const text = el.textContent || ''
        const idx = text.toLowerCase().indexOf(kw.toLowerCase())
        el.innerHTML = htmlEscape(text.substring(0, idx)) +
          '<mark class="search-mark">' + htmlEscape(text.substring(idx, idx + kw.length)) + '</mark>' +
          htmlEscape(text.substring(idx + kw.length))
      } else {
        el.style.opacity = '.45'
        el.innerHTML = el.textContent || ''
      }
    })
  }

  if (kw.length >= 1) {
    searchInDocument(kw)
  } else {
    clearDocHighlights()
  }
}

function htmlEscape(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function onSearchInput() {
  applySearch()
}

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (e.shiftKey) {
      navigateResult(-1)
    } else {
      navigateResult(1)
    }
  }
  if (e.key === 'Escape') {
    const input = document.getElementById('searchInput') as HTMLInputElement
    if (input) {
      input.value = ''
      searchQuery.value = ''
      applySearch()
      input.blur()
    }
  }
}

watch(() => documentStore.docClosed, (closed) => {
  if (closed) {
    clearDocHighlights()
    searchQuery.value = ''
    const input = document.getElementById('searchInput') as HTMLInputElement
    if (input) input.value = ''
  }
})
</script>

<template>
  <header
    class="titlebar"
    :class="{ 'borderless-titlebar': isBorderlessMode }"
    @pointerdown="startDrag"
    @dblclick="handleTitleBarDblClick"
  >
    <div class="title-left no-drag">
      <div class="logo">W</div>
      <div class="doc-title">WebWord 2026 LTS</div>
    </div>
    <div class="search-wrap no-drag" :class="{ 'has-results': searchMatchCount > 0 }">
      <input
        id="searchInput"
        v-model="searchQuery"
        class="search"
        :placeholder="$t('ww.titlebar.searchPlaceholder')"
        @input="onSearchInput"
        @keydown="onSearchKeydown"
        @focus="onSearchInput"
      />
      <div v-if="searchMatchCount > 0" class="search-result-count">
        <button
          class="search-prev"
          :title="$t('ww.titlebar.prevResult')"
          @click="navigateResult(-1)"
        >
          <span class="nav-box">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#8ab4f8" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
          </span>
        </button>
        <span class="search-count">{{ searchCurrent }}/{{ searchMatchCount }}</span>
        <button
          class="search-next"
          :title="$t('ww.titlebar.nextResult')"
          @click="navigateResult(1)"
        >
          <span class="nav-box">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#8ab4f8" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </span>
        </button>
      </div>
    </div>
    <div v-if="isBorderlessMode" class="window-controls no-drag">
      <button class="window-btn minimize-btn" :title="$t('desktop.window.minimize')" @click="handleMinimize">
        <svg viewBox="0 0 12 12" width="10" height="10"><rect y="5" width="12" height="2" fill="currentColor"/></svg>
      </button>
      <button class="window-btn maximize-btn" :title="maximized ? $t('desktop.window.restore') : $t('desktop.window.maximize')" @click="handleToggleMaximize">
        <span class="btn-icon" :class="maximized ? 'icon-restore' : 'icon-maximize'"></span>
      </button>
      <button class="window-btn close-btn" :title="$t('common.close')" @click="handleClose">
        <svg viewBox="0 0 12 12" width="10" height="10"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.search-result-count {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #6a7a8a;
  pointer-events: none;
  user-select: none;
  font-variant-numeric: tabular-nums;
  z-index: 1;
}
.search-result-count button {
  pointer-events: auto;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: 2px;
  opacity: 1;
  transition: opacity .15s;
}
.nav-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #2a3a4a;
  border: 1px solid #3a4a5a;
  border-radius: 3px;
}
.search-result-count button:hover:not(:disabled) .nav-box {
  background: #3a4a5a;
  border-color: #4a5a6a;
}
.search-result-count button:disabled .nav-box {
  opacity: .3;
}
.search-result-count button:disabled {
  cursor: not-allowed;
}
.search-result-count .search-count {
  min-width: 36px;
  text-align: center;
  font-size: 10px;
}
.search-wrap.has-results .search {
  padding-right: 80px;
}

.titlebar.borderless-titlebar {
  cursor: default;
  touch-action: none;
}
</style>
