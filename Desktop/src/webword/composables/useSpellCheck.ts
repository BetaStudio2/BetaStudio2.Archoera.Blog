import { ref } from 'vue'

export function useSpellCheck() {
  const enabled = ref(false)
  const scanning = ref(false)
  const misspelledWords = ref<string[]>([])
  const suggestions = ref<Map<string, string[]>>(new Map())

  function init() {
    // dictionary loaded via preload in index.html
    // accessible as window.SPELL_DICT / window.SPELL_DICT_ZH
    enabled.value = !!window.SPELL_DICT || !!window.SPELL_DICT_ZH
  }

  function enable() { enabled.value = true }
  function disable() { enabled.value = false }

  function scanDocument(container: HTMLElement | null) {
    if (!container || !enabled.value) return
    scanning.value = true
    misspelledWords.value = []

    const dict = window.SPELL_DICT

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null)
    const textNodes: { node: Text; parent: HTMLElement }[] = []
    let node: Text | null
    while ((node = walker.nextNode() as Text | null)) {
      if (!node.nodeValue) continue
      const parent = node.parentElement
      if (!parent) continue
      if (parent.closest('script,style,noscript,code,pre')) continue
      textNodes.push({ node, parent })
    }

    const wordRegex = /\b[a-zA-Z]+(?:[''][a-zA-Z]+)?\b/g

    for (const { node } of textNodes) {
      const text = node.nodeValue || ''
      let match: RegExpExecArray | null
      while ((match = wordRegex.exec(text)) !== null) {
        const word = match[0].toLowerCase()
        if (word.length <= 1) continue
        if (dict) {
          if (!(word in dict)) {
            misspelledWords.value.push(word)
          }
        }
      }
    }

    scanning.value = false
  }

  function getSuggestions(word: string): string[] {
    if (suggestions.value.has(word)) {
      return suggestions.value.get(word)!
    }

    const dict = window.SPELL_DICT
    if (!dict) return []

    const wordLower = word.toLowerCase()
    const candidates: string[] = []

    // collect dictionary keys within reasonable edit distance
    let count = 0
    for (const candidate of Object.keys(dict)) {
      if (count > 50000) break // limit search
      count++
      const dist = editDistance(wordLower, candidate)
      if (dist <= 2 && dist > 0) {
        candidates.push(candidate)
      }
    }

    // sort by edit distance, take top 10
    candidates.sort((a, b) => {
      const da = editDistance(wordLower, a)
      const db = editDistance(wordLower, b)
      if (da !== db) return da - db
      return a.length - b.length
    })

    const result = candidates.slice(0, 10)
    suggestions.value.set(word, result)
    return result
  }

  function clearMisspellings() {
    misspelledWords.value = []
  }

  return {
    enabled, scanning, misspelledWords, suggestions,
    init, enable, disable, scanDocument, getSuggestions, clearMisspellings
  }
}

function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length

  if (m === 0) return n
  if (n === 0) return m

  // use two-row optimization
  let prev = new Array(n + 1).fill(0)
  let curr = new Array(n + 1).fill(0)

  for (let j = 0; j <= n; j++) prev[j] = j

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1,       // delete
        curr[j - 1] + 1,   // insert
        prev[j - 1] + cost // substitute
      )
    }
    const temp = prev
    prev = curr
    curr = temp
  }

  return prev[n]
}
