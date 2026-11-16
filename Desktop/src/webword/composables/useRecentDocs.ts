import { ref } from 'vue'

export interface RecentDoc {
  name: string
  desc: string
  date: string
  key: string
  cls: string
}

const STORAGE_KEY = 'webword_recent_docs'

const recentDocs = ref<RecentDoc[]>([])

function loadRecentDocs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) recentDocs.value = JSON.parse(raw)
    pruneRecentDocs()
  } catch {}
}

function pruneRecentDocs() {
  const now = Date.now()
  const cutoff = now - 14 * 24 * 60 * 60 * 1000
  recentDocs.value = recentDocs.value
    .filter(d => {
      const ts = new Date(d.date).getTime()
      return !isNaN(ts) && ts >= cutoff
    })
    .slice(0, 15)
}

function addRecentDoc(name: string, key: string) {
  const now = new Date()
  const date = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
  const entry: RecentDoc = { name, desc: date, date, key, cls: 'file-row-recent' }
  const filtered = recentDocs.value.filter(d => d.key !== key)
  filtered.unshift(entry)
  recentDocs.value = filtered.slice(0, 15)
  pruneRecentDocs()
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recentDocs.value)) } catch {}
}

// Load on first access
loadRecentDocs()

export function useRecentDocs() {
  return { recentDocs, addRecentDoc, loadRecentDocs }
}
