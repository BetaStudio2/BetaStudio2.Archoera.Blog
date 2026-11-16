import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { DocumentInfo } from '@/webword/types'
import i18n from '@/i18n'

const t = (key: string): string => (i18n.global as any).t(key)
const DEFAULT_TITLE: string = t('wwl.untitledDocument')

export const useDocumentStore = defineStore('document', () => {
  const docClosed = ref(true)
  const docDirty = ref(false)
  const content = ref('')

  const docInfo = reactive<DocumentInfo>({
    size: 0,
    words: 0,
    pages: 1,
    created: '',
    title: DEFAULT_TITLE,
    author: 'WebWord',
    authorUuid: null,
    authorAvatar: null
  })

  const zoom = ref(100)
  const openingProgress = ref(false)

  function closeDocument() {
    docClosed.value = true
    docDirty.value = false
    content.value = ''
    docInfo.size = 0
    docInfo.words = 0
    docInfo.pages = 1
    docInfo.created = ''
    docInfo.title = DEFAULT_TITLE
    docInfo.author = 'WebWord'
    docInfo.authorUuid = null
    docInfo.authorAvatar = null
    zoom.value = 100
  }

  function newDocument() {
    docClosed.value = false
    docDirty.value = false
    content.value = ''
    docInfo.size = 0
    docInfo.words = 0
    docInfo.pages = 1
    docInfo.created = new Date().toISOString()
    docInfo.title = DEFAULT_TITLE
    docInfo.author = 'WebWord'
    docInfo.authorUuid = null
    docInfo.authorAvatar = null
    zoom.value = 100
  }

  function setContent(val: string) {
    content.value = val
    docDirty.value = true
  }

  function updateStatus(info: Partial<DocumentInfo>) {
    Object.assign(docInfo, info)
  }

  function setZoom(val: number) {
    zoom.value = Math.min(150, Math.max(50, val))
  }

  function showOpeningProgress() { openingProgress.value = true }
  function hideOpeningProgress() { openingProgress.value = false }

  /** 释放文档相关内存：恢复到初始状态（窗口关闭时调用） */
  function dispose() {
    closeDocument()
    openingProgress.value = false
  }

  return {
    docClosed, docDirty, content, docInfo, zoom, openingProgress,
    closeDocument, newDocument, setContent, updateStatus, setZoom,
    showOpeningProgress, hideOpeningProgress, dispose
  }
})
