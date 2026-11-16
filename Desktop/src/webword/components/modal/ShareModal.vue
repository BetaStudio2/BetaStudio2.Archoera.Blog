<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'export-pdf': []
  'export-png': []
  'export-html': []
  cancel: []
}>()

function onCancel() {
  emit('cancel')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    onCancel()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    class="modal-overlay"
    :class="{ show: visible }"
    @click.self="onCancel"
  >
    <div class="modal" style="width:440px;">
      <div class="modal-head">
        <span>{{ $t('ww.share.title') }}</span>
        <button class="modal-close" :title="$t('common.close')" @click="onCancel">✕</button>
      </div>
      <div class="modal-body" style="padding:20px 24px;">
        <div style="font-size:14px;color:#e8edf7;margin-bottom:18px;">{{ $t('ww.share.hint') }}</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div class="share-option-card" @click="emit('export-pdf')">
            <span class="share-option-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z" />
                <rect x="6" y="10" width="12" height="8" rx="1" />
                <line x1="8" y1="14" x2="16" y2="14" />
              </svg>
            </span>
            <div class="share-option-info">
              <b>{{ $t('ww.share.exportPdf') }}</b>
              <span>{{ $t('ww.share.exportPdfDesc') }}</span>
            </div>
            <span class="share-option-arrow">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
          <div class="share-option-card" @click="emit('export-png')">
            <span class="share-option-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="1" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </span>
            <div class="share-option-info">
              <b>{{ $t('ww.share.exportPng') }}</b>
              <span>{{ $t('ww.share.exportPngDesc') }}</span>
            </div>
            <span class="share-option-arrow">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
          <div class="share-option-card" @click="emit('export-html')">
            <span class="share-option-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="1" />
                <text x="12" y="15" text-anchor="middle" font-size="4" fill="currentColor" stroke="none">&lt;/&gt;</text>
              </svg>
            </span>
            <div class="share-option-info">
              <b>{{ $t('ww.share.exportHtml') }}</b>
              <span>{{ $t('ww.share.exportHtmlDesc') }}</span>
            </div>
            <span class="share-option-arrow">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
