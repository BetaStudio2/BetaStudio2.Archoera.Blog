import { ref } from 'vue'
import { useDocumentStore } from '@/webword/stores/document'
import i18n from '@/i18n'

const t = (key: string): string => (i18n.global as any).t(key)

export function useFileMenu() {
  const visible = ref(false)
  const currentPage = ref<'main' | 'new' | 'open' | 'info' | 'template'>('main')
  const store = useDocumentStore()

  function show() { visible.value = true; currentPage.value = 'main' }
  function hide() { visible.value = false }
  function showPage(page: typeof currentPage.value) { currentPage.value = page }
  function loadPageModule(page: typeof currentPage.value) {
    currentPage.value = page
  }

  function closeDocument() {
    store.closeDocument()
    hide()
  }

  function newDocument() {
    store.newDocument()
    hide()
  }

  function openTemplate(_path: string) {
    // templates are loaded by the calling component
    hide()
  }

  function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 6) return t('wwl.greetingLateNight')
    if (hour < 9) return t('wwl.greetingEarlyMorning')
    if (hour < 12) return t('wwl.greetingMorning')
    if (hour < 14) return t('wwl.greetingNoon')
    if (hour < 18) return t('wwl.greetingAfternoon')
    return t('wwl.greetingEvening')
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  function getDocByteSize(): number {
    return new TextEncoder().encode(store.content).length
  }

  function refreshInfo() {
    const content = store.content
    const byteSize = new TextEncoder().encode(content).length
    // Strip HTML tags and decode entities to get plain text for word counting
    const plainText = content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/gi, '')
      .trim()
    // Count Chinese characters + English words
    const chineseChars = (plainText.match(/[\u4e00-\u9fff]/g) || []).length
    const englishWords = (plainText.replace(/[\u4e00-\u9fff]/g, ' ').trim().match(/[a-zA-Z0-9]+/g) || []).length
    const words = chineseChars + englishWords
    const textLen = plainText.length
    const pages = Math.max(1, Math.ceil(textLen / 3000))
    store.updateStatus({ size: byteSize, words, pages })
  }

  return {
    visible, currentPage,
    show, hide, showPage, loadPageModule,
    closeDocument, newDocument, openTemplate,
    getGreeting, formatSize, getDocByteSize, refreshInfo
  }
}
