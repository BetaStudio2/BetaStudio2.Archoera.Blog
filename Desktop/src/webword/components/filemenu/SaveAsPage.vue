<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '@/webword/stores/document'
import { useExport } from '@/webword/composables/useExport'

const emit = defineEmits<{
  (e: 'hide-menu'): void
}>()

const { t } = useI18n()

const docStore = useDocumentStore()
const { exportAsPNG } = useExport()

const saveFormat = ref<'png' | 'html' | 'doc' | 'txt'>('png')

function selectFormat(fmt: 'png' | 'html' | 'doc' | 'txt') {
  saveFormat.value = fmt
}

async function handleSaveAs() {
  if (saveFormat.value === 'png') {
    try {
      await exportAsPNG()
    } catch {}
    emit('hide-menu')
    return
  }

  const content = docStore.content
  const title = docStore.docInfo.title || t('wwf.defaultDocumentName')
  let blob: Blob
  let ext: string
  let mimeType: string

  switch (saveFormat.value) {
    case 'html':
      ext = 'html'
      mimeType = 'text/html'
      const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:'Microsoft YaHei',sans-serif;padding:40px 60px;max-width:800px;margin:0 auto;line-height:1.6;color:#333;}</style>
</head><body>${content}</body></html>`
      blob = new Blob([htmlContent], { type: mimeType })
      break
    case 'doc':
      ext = 'doc'
      mimeType = 'application/msword'
      blob = new Blob([`<html><body>${content}</body></html>`], { type: mimeType })
      break
    case 'txt':
      ext = 'txt'
      mimeType = 'text/plain'
      const tmp = document.createElement('div')
      tmp.innerHTML = content
      blob = new Blob([tmp.textContent || ''], { type: mimeType })
      break
  }

  const url = URL.createObjectURL(blob!)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
  emit('hide-menu')
}
</script>

<template>
  <h1 class="file-menu-title">{{ $t('common.saveAs') }}</h1>
  <div class="file-save-layout">
    <div class="file-save-content">
      <div class="file-save-type-grid">
        <div class="file-save-type-card" :class="{ active: saveFormat === 'png' }" @click="selectFormat('png')">
          <div class="file-save-type-icon">
            <svg viewBox="0 0 32 32" width="32" height="32">
              <rect x="5" y="5" width="22" height="22" rx="2.5" fill="currentColor" opacity=".08"/>
              <rect x="5" y="5" width="22" height="22" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.4"/>
              <circle cx="12" cy="12" r="2" fill="currentColor" opacity=".35"/>
              <path d="M27 24l-5-6-8 8z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
              <path d="M14 19l2-2 3 3" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="file-save-type-info"><b>{{ $t('wwf.saveAsFormatPng') }}</b><span>{{ $t('wwf.saveAsFormatPngDesc') }}</span></div>
        </div>

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

      <div class="file-save-big-btn" @click="handleSaveAs">
        <span class="file-save-big-icon">
          <svg viewBox="0 0 32 32" width="36" height="36">
            <rect x="5" y="4" width="16" height="20" rx="2.5" fill="currentColor" opacity=".06"/>
            <rect x="5" y="4" width="16" height="20" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <rect x="8" y="4" width="16" height="20" rx="2.5" fill="currentColor" opacity=".1"/>
            <rect x="8" y="4" width="16" height="20" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="2.5 1.5"/>
            <path d="M12 10h6v8h-6z" fill="currentColor" opacity=".15"/>
            <rect x="12" y="10" width="6" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1"/>
            <path d="M14 14h2" fill="none" stroke="currentColor" stroke-width=".8"/>
          </svg>
        </span>
        <span>{{ $t('common.saveAs') }}</span>
      </div>
    </div>
  </div>
</template>
