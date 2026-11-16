<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '@/webword/stores/document'
import { domtHeaders } from '@/utils/domtToken'
import { STATIC_MODE } from '@/utils/siteMode'

const emit = defineEmits<{
  (e: 'hide-menu'): void
}>()

const { t } = useI18n()

const docStore = useDocumentStore()

const saveFormat = ref<'html' | 'doc' | 'txt'>('html')

function selectFormat(fmt: 'html' | 'doc' | 'txt') {
  saveFormat.value = fmt
}

function buildBlob(fmt: string, title: string, content: string): { blob: Blob; ext: string } {
  switch (fmt) {
    case 'html':
      const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>body{font-family:'Microsoft YaHei',sans-serif;padding:40px 60px;max-width:800px;margin:0 auto;line-height:1.6;color:#333;}</style>
</head>
<body>${content}</body>
</html>`
      return { blob: new Blob([htmlContent], { type: 'text/html' }), ext: 'html' }
    case 'doc':
      const docContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body>${content}</body></html>`
      return { blob: new Blob([docContent], { type: 'application/msword' }), ext: 'doc' }
    case 'txt':
      const tmp = document.createElement('div')
      tmp.innerHTML = content
      return { blob: new Blob([tmp.textContent || ''], { type: 'text/plain' }), ext: 'txt' }
    default:
      return { blob: new Blob([content], { type: 'text/html' }), ext: 'html' }
  }
}

function handleSave() {
  const content = docStore.content
  const title = docStore.docInfo.title || t('wwf.defaultDocumentName')
  const { blob, ext } = buildBlob(saveFormat.value, title, content)

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
  emit('hide-menu')
}

const serverSaving = ref(false)
const serverSaveMessage = ref('')
const serverSaveError = ref(false)

async function handleServerSave() {
  const content = docStore.content
  const title = docStore.docInfo.title || t('wwf.defaultDocumentName')
  serverSaving.value = true
  serverSaveMessage.value = ''
  serverSaveError.value = false
  try {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...domtHeaders() },
      body: JSON.stringify({ title, content, format: saveFormat.value })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    serverSaveMessage.value = t('wwf.savedToServer')
    setTimeout(() => {
      emit('hide-menu')
    }, 800)
  } catch (e: any) {
    serverSaveError.value = true
    serverSaveMessage.value = t('wwf.saveFailed', { msg: e.message || t('wwf.unknownError') })
  } finally {
    serverSaving.value = false
  }
}
</script>

<template>
  <h1 class="file-menu-title">{{ $t('wwf.saveDocument') }}</h1>
  <div class="file-save-layout">
    <div class="file-save-content">
      <div class="file-save-type-grid">
        <div class="file-save-type-card" :class="{ active: saveFormat === 'html' }" @click="selectFormat('html')">
          <div class="file-save-type-icon">
            <svg viewBox="0 0 32 32" width="32" height="32">
              <path d="M7 5h10l7 7v17H7V5z" fill="currentColor" opacity=".12"/>
              <path d="M7 5h10l7 7v17H7V5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
              <path d="M17.5 5v6.5h6.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              <text x="16" y="21" text-anchor="middle" font-size="5" font-weight="800" font-family="monospace" fill="currentColor">&lt;/&gt;</text>
            </svg>
          </div>
          <div class="file-save-type-info"><b>{{ $t('wwf.saveFormatHtml') }}</b><span>{{ $t('wwf.saveFormatHtmlDesc') }}</span></div>
        </div>

        <div class="file-save-type-card" :class="{ active: saveFormat === 'doc' }" @click="selectFormat('doc')">
          <div class="file-save-type-icon">
            <svg viewBox="0 0 32 32" width="32" height="32">
              <path d="M7 5h10l7 7v17H7V5z" fill="currentColor" opacity=".12"/>
              <path d="M7 5h10l7 7v17H7V5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
              <path d="M17.5 5v6.5h6.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              <rect x="10" y="15.5" width="11" height="8" rx="1" fill="currentColor" opacity=".25"/>
              <text x="15.5" y="21.5" text-anchor="middle" font-size="6" font-weight="800" fill="currentColor">W</text>
            </svg>
          </div>
          <div class="file-save-type-info"><b>{{ $t('wwf.saveFormatDoc') }}</b><span>{{ $t('wwf.saveFormatDocDesc') }}</span></div>
          <span class="file-export-experimental-badge">{{ $t('wwf.experimental') }}</span>
        </div>

        <div class="file-save-type-card" :class="{ active: saveFormat === 'txt' }" @click="selectFormat('txt')">
          <div class="file-save-type-icon">
            <svg viewBox="0 0 32 32" width="32" height="32">
              <path d="M7 5h10l7 7v17H7V5z" fill="currentColor" opacity=".12"/>
              <path d="M7 5h10l7 7v17H7V5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
              <path d="M17.5 5v6.5h6.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              <rect x="10" y="14.5" width="10" height="1.2" rx=".6" fill="currentColor" opacity=".6"/>
              <rect x="10" y="17.5" width="10" height="1.2" rx=".6" fill="currentColor" opacity=".6"/>
              <rect x="10" y="20.5" width="7" height="1.2" rx=".6" fill="currentColor" opacity=".6"/>
            </svg>
          </div>
          <div class="file-save-type-info"><b>{{ $t('wwf.saveFormatTxt') }}</b><span>{{ $t('wwf.saveFormatTxtDesc') }}</span></div>
        </div>
      </div>

      <div class="file-save-big-btn" @click="handleSave">
        <span class="file-save-big-icon">
          <svg viewBox="0 0 32 32" width="36" height="36">
            <rect x="7" y="4" width="16" height="20" rx="2.5" fill="currentColor" opacity=".1"/>
            <rect x="7" y="4" width="16" height="20" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 4v5.5h6V4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
            <path d="M10 14h10v8H10z" fill="currentColor" opacity=".18"/>
            <rect x="10" y="14" width="10" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/>
            <path d="M12 18h6" fill="none" stroke="currentColor" stroke-width=".9"/>
          </svg>
        </span>
        <span>{{ $t('wwf.download') }}</span>
      </div>

      <!-- 静态站点没有后端，隐藏“保存到服务器” -->
      <div v-if="!STATIC_MODE" class="file-save-big-btn file-save-server-btn" :class="{ saving: serverSaving }" @click="handleServerSave">
        <span class="file-save-big-icon">
          <svg viewBox="0 0 32 32" width="36" height="36">
            <path d="M5 8a3 3 0 013-3h16a3 3 0 013 3v4a3 3 0 01-3 3H8a3 3 0 01-3-3V8z" fill="currentColor" opacity=".08"/>
            <rect x="5" y="8" width="22" height="4" rx="1" fill="currentColor" opacity=".15"/>
            <path d="M5 8a3 3 0 013-3h16a3 3 0 013 3v4a3 3 0 01-3 3H8a3 3 0 01-3-3V8z" fill="none" stroke="currentColor" stroke-width="1.3"/>
            <path d="M5 18a3 3 0 013-3h16a3 3 0 013 3v4a3 3 0 01-3 3H8a3 3 0 01-3-3v-4z" fill="currentColor" opacity=".06"/>
            <path d="M5 18a3 3 0 013-3h16a3 3 0 013 3v4a3 3 0 01-3 3H8a3 3 0 01-3-3v-4z" fill="none" stroke="currentColor" stroke-width="1.3"/>
            <circle cx="9" cy="10" r="1.2" fill="currentColor" opacity=".4"/>
            <circle cx="9" cy="20" r="1.2" fill="currentColor" opacity=".4"/>
          </svg>
        </span>
        <span>{{ serverSaving ? $t('wwf.savingDots') : $t('wwf.saveToServer') }}</span>
      </div>
      <div v-if="serverSaveMessage" class="file-save-server-msg" :class="{ error: serverSaveError }">
        {{ serverSaveMessage }}
      </div>
    </div>
  </div>
</template>
