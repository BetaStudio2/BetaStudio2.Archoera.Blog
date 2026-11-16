import { ref } from 'vue'
import type { SearchItem } from '@/webword/types'

declare const pinyinlite: ((str: string) => string[][]) | undefined

export function useGlobalSearch() {
  const query = ref('')
  const results = ref<SearchItem[]>([])
  const dropdownVisible = ref(false)
  const loading = ref(false)
  const selectedIndex = ref(-1)

  const allItems: SearchItem[] = []

  function init(items: SearchItem[]) {
    allItems.length = 0
    allItems.push(...items)
  }

  function search(q: string) {
    query.value = q
    selectedIndex.value = -1
    if (!q.trim()) {
      results.value = []
      dropdownVisible.value = false
      return
    }

    const normalized = q.toLowerCase().trim()
    loading.value = true

    const filtered: SearchItem[] = []

    for (const item of allItems) {
      // direct match on title/desc
      const titleMatch = item.title.toLowerCase().includes(normalized)
      const descMatch = item.desc.toLowerCase().includes(normalized)
      if (titleMatch || descMatch) {
        filtered.push(item)
        continue
      }

      // pinyin match
      if (item._pinyin && typeof pinyinlite !== 'undefined') {
        const py = item._pinyin
        if (py.full.includes(normalized) || py.initials.includes(normalized)) {
          filtered.push(item)
        }
      }
    }

    results.value = filtered
    dropdownVisible.value = filtered.length > 0
    loading.value = false
  }

  function selectResult(item: SearchItem) {
    query.value = item.title
    dropdownVisible.value = false
    results.value = []

    if (item.action === 'switchTab') {
      // handled by the caller
    }
    return item
  }

  function cleanup() {
    query.value = ''
    results.value = []
    dropdownVisible.value = false
    selectedIndex.value = -1
  }

  function navigateUp() {
    if (results.value.length === 0) return
    selectedIndex.value = selectedIndex.value <= 0
      ? results.value.length - 1
      : selectedIndex.value - 1
  }

  function navigateDown() {
    if (results.value.length === 0) return
    selectedIndex.value = selectedIndex.value >= results.value.length - 1
      ? 0
      : selectedIndex.value + 1
  }

  return {
    query, results, dropdownVisible, loading, selectedIndex,
    init, search, selectResult, cleanup, navigateUp, navigateDown
  }
}
