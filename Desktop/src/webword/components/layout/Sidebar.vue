<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAppStore } from '@/webword/stores/app'
import { useDocumentStore } from '@/webword/stores/document'

const appStore = useAppStore()
const docStore = useDocumentStore()

const collapsed = computed({
  get: () => appStore.collapsed,
  set: (val: boolean) => appStore.setCollapsed(val),
})

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

// Keyboard shortcut: Ctrl+\
function onKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === '\\') {
    e.preventDefault()
    toggleCollapse()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

// ── TOC building ──
// Follows the proven pattern from /new/modules/framework/js/modules/cssassets/sidebar.js

const showPlaceholder = ref(true)
let scrollHandler: (() => void) | null = null

function buildToc() {
  const doc = document.getElementById('doc')
  const tocEl = document.getElementById('toc')
  if (!tocEl) return

  tocEl.innerHTML = ''

  if (!doc) {
    showPlaceholder.value = true
    return
  }

  const hs = doc.querySelectorAll('h1, h2, h3')
  if (hs.length === 0) {
    showPlaceholder.value = true
    return
  }
  showPlaceholder.value = false

  const root = document.createElement('ul')
  root.style.listStyle = 'none'
  root.style.margin = '0'
  root.style.padding = '0'

  let curH1: HTMLElement | null = null
  let curH2: HTMLElement | null = null
  let idx = 0

  hs.forEach((h) => {
    if (!h.id) h.id = 'h-' + (++idx)

    const tag = h.tagName
    const a = document.createElement('a')
    a.href = '#' + h.id
    a.textContent = h.textContent?.trim() || ''
    a.dataset.target = h.id
    a.addEventListener('click', (e) => {
      e.preventDefault()
      document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    if (tag === 'H1') {
      const li = document.createElement('li')
      li.className = 'lv1'

      const item = document.createElement('div')
      item.className = 'toc-item'
      item.appendChild(a)
      li.appendChild(item)

      const sub = document.createElement('ul')
      sub.className = 'toc-sub'
      li.appendChild(sub)

      root.appendChild(li)
      curH1 = li
      curH2 = null
    } else if (tag === 'H2') {
      const parentUl = curH1 ? curH1.querySelector('.toc-sub') : root
      const li = document.createElement('li')
      li.className = 'lv2'

      const item = document.createElement('div')
      item.className = 'toc-item'
      item.appendChild(a)
      li.appendChild(item)

      const sub = document.createElement('ul')
      sub.className = 'toc-sub'
      li.appendChild(sub)

      parentUl!.appendChild(li)
      curH2 = li
    } else {
      // H3
      const parentUl = curH2
        ? curH2.querySelector('.toc-sub')
        : curH1
          ? curH1.querySelector('.toc-sub')
          : root
      const li = document.createElement('li')
      li.className = 'lv3'
      li.appendChild(a)
      parentUl!.appendChild(li)
    }
  })

  // Add toggle arrows for items that have children
  const allItems = root.querySelectorAll('.toc-item')
  allItems.forEach((item) => {
    const li = item.parentNode as HTMLElement
    const sub = li?.querySelector('.toc-sub')
    if (sub && sub.children.length > 0) {
      const toggle = document.createElement('span')
      toggle.className = 'toc-toggle'
      toggle.textContent = '\u25BE'
      toggle.addEventListener('click', (e) => {
        e.stopPropagation()
        const el = e.currentTarget as HTMLElement
        const subUl = el.parentElement?.parentElement?.querySelector('.toc-sub')
        if (subUl) {
          const isCollapsed = subUl.classList.toggle('collapsed')
          el.classList.toggle('collapsed', isCollapsed)
        }
      })
      item.appendChild(toggle)
    }
  })

  tocEl.appendChild(root)
}

function highlightCurrent() {
  const doc = document.getElementById('doc')
  const tocEl = document.getElementById('toc')
  const workspace = document.getElementById('workspace')
  if (!doc || !tocEl || !workspace) return

  const hs = Array.from(doc.querySelectorAll('h1, h2, h3'))
  const links = Array.from(tocEl.querySelectorAll('a'))
  if (!hs.length || !links.length) return

  const workspaceTop = workspace.scrollTop
  const anchorTop = 100
  let currentId = (hs[0] as HTMLElement).id

  for (let i = 0; i < hs.length; i++) {
    const h = hs[i] as HTMLElement
    if (h.offsetTop <= workspaceTop + anchorTop) currentId = h.id
    else break
  }

  links.forEach((a) => {
    const el = a as HTMLElement
    el.classList.toggle('active', el.dataset.target === currentId)
  })
}

function setupScrollListener() {
  const workspace = document.getElementById('workspace')
  if (!workspace) return

  if (scrollHandler) {
    workspace.removeEventListener('scroll', scrollHandler)
  }
  scrollHandler = highlightCurrent
  workspace.addEventListener('scroll', scrollHandler, { passive: true })
}

function cleanup() {
  const tocEl = document.getElementById('toc')
  if (tocEl) tocEl.innerHTML = ''
  showPlaceholder.value = true

  if (scrollHandler) {
    const workspace = document.getElementById('workspace')
    workspace?.removeEventListener('scroll', scrollHandler)
    scrollHandler = null
  }
}

function triggerRebuild() {
  nextTick(() => {
    buildToc()
    setupScrollListener()
    highlightCurrent()
  })
}

// ── Watchers ──

watch(() => docStore.content, () => {
  if (!docStore.docClosed) {
    triggerRebuild()
  }
})

watch(() => docStore.docClosed, (closed) => {
  if (closed) cleanup()
})

// Initial build on mount
onMounted(() => {
  if (!docStore.docClosed) {
    triggerRebuild()
  }
})
</script>

<template>
  <aside class="sidebar">
    <div class="nav-head">
      <span>{{ $t('ww.sidebar.navigation') }}</span>
      <button
        id="collapseBtn"
        class="collapse-btn"
        :title="$t('ww.sidebar.closeNavigation')"
        @click="toggleCollapse"
      >✕</button>
    </div>

    <div
      id="tocPlaceholder"
      class="toc-placeholder"
      :class="{ show: showPlaceholder }"
    >
      <span class="toc-placeholder-text">{{ $t('ww.sidebar.tocPlaceholder') }}</span>
    </div>

    <ul id="toc" class="toc"></ul>
  </aside>
</template>
