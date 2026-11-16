import { ref } from 'vue'

interface TocItem {
  id: string
  level: number
  text: string
  el: HTMLElement
}

interface SearchMatch {
  el: HTMLElement
  text: string
  index: number
}

export function useSidebar() {
  const tocItems = ref<TocItem[]>([])
  const currentHeadingId = ref('')
  const searchQuery = ref('')
  const searchResults = ref<SearchMatch[]>([])
  const currentResultIndex = ref(0)
  const collapsed = ref<Set<string>>(new Set())
  const searchVisible = ref(false)

  function buildToc(container: HTMLElement | null) {
    if (!container) {
      tocItems.value = []
      return
    }
    const headings = container.querySelectorAll('h1, h2, h3')
    const items: TocItem[] = []
    headings.forEach((h, idx) => {
      const id = h.id || `toc-${idx}`
      if (!h.id) h.id = id
      items.push({
        id,
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent || '',
        el: h as HTMLElement
      })
    })
    tocItems.value = items
  }

  function highlightCurrent(container: HTMLElement | null) {
    if (!container) return
    const headings = container.querySelectorAll('h1, h2, h3')
    let currentId = ''
    const scrollY = container.scrollTop
    headings.forEach(h => {
      const el = h as HTMLElement
      if (el.offsetTop <= scrollY + 100) {
        currentId = el.id || ''
      }
    })
    currentHeadingId.value = currentId
  }

  function scrollToHeading(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      currentHeadingId.value = id
    }
  }

  function searchInDocument(container: HTMLElement | null, query: string) {
    searchQuery.value = query
    searchResults.value = []
    currentResultIndex.value = 0

    if (!query || !container) return

    const cleaned = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    let regex: RegExp
    try {
      regex = new RegExp(cleaned, 'gi')
    } catch {
      return
    }

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null)
    const results: SearchMatch[] = []
    let node: Text | null
    while ((node = walker.nextNode() as Text | null)) {
      if (!node.nodeValue) continue
      const parent = node.parentElement
      if (!parent) continue
      if (parent.closest('script,style,noscript')) continue

      let match: RegExpExecArray | null
      regex.lastIndex = 0
      while ((match = regex.exec(node.nodeValue)) !== null) {
        results.push({
          el: parent,
          text: match[0],
          index: match.index
        })
      }
    }
    searchResults.value = results
  }

  function clearDocHighlights() {
    const marks = document.querySelectorAll('mark[data-search-highlight]')
    marks.forEach(m => {
      const parent = m.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(m.textContent || ''), m)
        parent.normalize()
      }
    })
  }

  function highlightResults() {
    clearDocHighlights()
    searchResults.value.forEach((result: SearchMatch, idx: number) => {
      const walker = document.createTreeWalker(result.el, NodeFilter.SHOW_TEXT, null)
      let node: Text | null
      while ((node = walker.nextNode() as Text | null)) {
        if (!node.nodeValue) continue
        const i = node.nodeValue.indexOf(result.text)
        if (i === -1) continue
        const before = node.nodeValue.slice(0, i)
        const after = node.nodeValue.slice(i + result.text.length)
        const mark = document.createElement('mark')
        mark.setAttribute('data-search-highlight', '')
        mark.setAttribute('data-result-index', String(idx))
        mark.textContent = result.text
        const afterNode = document.createTextNode(after)
        const parent = node.parentNode
        if (parent) {
          parent.insertBefore(document.createTextNode(before), node)
          parent.insertBefore(mark, node)
          parent.insertBefore(afterNode, node)
          parent.removeChild(node)
        }
        break
      }
    })
  }

  function navigateResults(direction: 'next' | 'prev') {
    if (searchResults.value.length === 0) return
    if (direction === 'next') {
      currentResultIndex.value = (currentResultIndex.value + 1) % searchResults.value.length
    } else {
      currentResultIndex.value = (currentResultIndex.value - 1 + searchResults.value.length) % searchResults.value.length
    }
    const idx = currentResultIndex.value
    const mark = document.querySelector(`mark[data-result-index="${idx}"]`)
    if (mark) {
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // briefly flash
      const prev = document.querySelector('mark[data-current]')
      prev?.removeAttribute('data-current')
      mark.setAttribute('data-current', '')
    }
  }

  function toggleTocItem(id: string) {
    if (collapsed.value.has(id)) {
      collapsed.value.delete(id)
    } else {
      collapsed.value.add(id)
    }
  }

  return {
    tocItems, currentHeadingId, searchQuery, searchResults,
    currentResultIndex, collapsed, searchVisible,
    buildToc, highlightCurrent, scrollToHeading,
    searchInDocument, clearDocHighlights, highlightResults,
    navigateResults, toggleTocItem
  }
}
