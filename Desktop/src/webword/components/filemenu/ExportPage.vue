<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '@/webword/stores/document'

const emit = defineEmits<{
  (e: 'hide-menu'): void
}>()

const { t } = useI18n()

const docStore = useDocumentStore()

const activeTab = ref<'pdf' | 'types'>('pdf')

const exportFormats = {
  doc: [
    { type: 'docx', label: t('wwf.expFormatDocx'), desc: t('wwf.expFormatDocxDesc'), color: '#2b579a', experimental: false },
    { type: 'doc', label: t('wwf.expFormatDoc'), desc: t('wwf.expFormatDocDesc'), color: '#1a73e8', experimental: true },
    { type: 'rtf', label: t('wwf.expFormatRtf'), desc: t('wwf.expFormatRtfDesc'), color: '#d83b01', experimental: true },
    { type: 'odt', label: t('wwf.expFormatOdt'), desc: t('wwf.expFormatOdtDesc'), color: '#107c41', experimental: false },
  ],
  other: [
    { type: 'txt', label: t('wwf.saveFormatTxt'), desc: t('wwf.expFormatTxtDesc'), color: '#8e8e8e', experimental: false },
    { type: 'md', label: t('wwf.expFormatMd'), desc: t('wwf.expFormatMdDesc'), color: '#6e5494', experimental: false },
    { type: 'html', label: t('wwf.expFormatHtml'), desc: t('wwf.expFormatHtmlDesc'), color: '#e34c26', experimental: false },
    { type: 'mhtml', label: t('wwf.expFormatMhtml'), desc: t('wwf.expFormatMhtmlDesc'), color: '#dd4b39', experimental: true },
  ],
  advanced: [
    { type: 'tex', label: t('wwf.expFormatTex'), desc: t('wwf.expFormatTexDesc'), color: '#008080', experimental: false },
    { type: 'epub', label: t('wwf.expFormatEpub'), desc: t('wwf.expFormatEpubDesc'), color: '#85b716', experimental: false },
    { type: 'json', label: t('wwf.expFormatJson'), desc: t('wwf.expFormatJsonDesc'), color: '#d4a017', experimental: false },
    { type: 'csv', label: t('wwf.expFormatCsv'), desc: t('wwf.expFormatCsvDesc'), color: '#2b7489', experimental: false },
  ],
}

const selectedType = ref('docx')

function selectExportType(type: string) {
  selectedType.value = type
}

function handleExportPdf() {
  window.print()
  emit('hide-menu')
}

function handleExportType() {
  const content = docStore.content
  const title = docStore.docInfo.title || t('wwf.defaultDocumentName')
  const type = selectedType.value

  let blob: Blob
  let ext = type
  let mimeType = 'text/plain'

  switch (type) {
    case 'docx':
    case 'doc': ext = type; mimeType = 'application/msword'; break
    case 'odt': ext = 'odt'; mimeType = 'application/vnd.oasis.opendocument.text'; break
    case 'rtf': ext = 'rtf'; mimeType = 'application/rtf'; break
    case 'txt': ext = 'txt'; mimeType = 'text/plain'; break
    case 'md': ext = 'md'; mimeType = 'text/markdown'; break
    case 'html': ext = 'html'; mimeType = 'text/html'; break
    case 'mhtml': ext = 'mht'; mimeType = 'multipart/related'; break
    case 'tex': ext = 'tex'; mimeType = 'application/x-latex'; break
    case 'epub': ext = 'epub'; mimeType = 'application/epub+zip'; break
    case 'json': ext = 'json'; mimeType = 'application/json'; break
    case 'csv': ext = 'csv'; mimeType = 'text/csv'; break
  }

  const tmpDiv = document.createElement('div')
  tmpDiv.innerHTML = content
  const textContent = tmpDiv.textContent || ''

  let output = ''
  switch (type) {
    case 'docx':
    case 'doc':
    case 'odt':
    case 'rtf':
      output = content
      break
    case 'txt':
      output = textContent
      break
    case 'md':
      output = textContent
      break
    case 'html':
      output = `<!DOCTYPE html>\n<html lang="zh-CN">\n<head><meta charset="UTF-8"><title>${title}</title></head>\n<body>\n${content}\n</body>\n</html>`
      break
    case 'mhtml':
      output = content
      break
    case 'tex':
      output = textContent
      break
    case 'epub':
      output = content
      break
    case 'json':
      output = JSON.stringify({ title, content: textContent }, null, 2)
      break
    case 'csv':
      output = textContent.split('\n').map(l => l.trim()).filter(Boolean).join(',')
      break
  }

  blob = new Blob([output], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
  emit('hide-menu')
}

function switchTab(tab: 'pdf' | 'types') {
  activeTab.value = tab
}
</script>

<template>
  <h1 class="file-menu-title">{{ $t('common.export') }}</h1>
  <div class="file-export-layout">
    <div class="file-export-sidebar">
      <div class="file-export-tab" :class="{ active: activeTab === 'pdf' }" @click="switchTab('pdf')">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <rect x="4" y="2" width="14" height="16" rx="1.5" fill="currentColor" opacity=".12"/>
          <rect x="4" y="2" width="14" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/>
          <path d="M14 2v4h4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
          <text x="9" y="10" text-anchor="middle" font-size="3.8" font-weight="800" fill="currentColor">PDF</text>
        </svg>
        <span>{{ $t('wwf.exportCreatePdfXps') }}</span>
      </div>
      <div class="file-export-tab" :class="{ active: activeTab === 'types' }" @click="switchTab('types')">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <rect x="5" y="3" width="14" height="18" rx="1.5" fill="currentColor" opacity=".12"/>
          <rect x="5" y="3" width="14" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/>
          <path d="M8 8h8M8 12h8M8 16h5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          <circle cx="17" cy="6" r="3" fill="currentColor" opacity=".15"/>
          <path d="M16 6h2M17 5v2" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
        </svg>
        <span>{{ $t('wwf.exportChangeType') }}</span>
      </div>
    </div>

    <div class="file-export-content">
      <!-- PDF/XPS Panel -->
      <div class="file-export-panel" :class="{ active: activeTab === 'pdf' }">
        <h2>{{ $t('wwf.exportCreatePdfXps') }}</h2>
        <ul class="file-export-features">
          <li><span class="file-export-bullet"></span>{{ $t('wwf.exportFeatureLayout') }}</li>
          <li><span class="file-export-bullet"></span>{{ $t('wwf.exportFeatureSecure') }}</li>
          <li><span class="file-export-bullet"></span>{{ $t('wwf.exportFeatureViewer') }}</li>
        </ul>
        <div class="file-export-big-btn" @click="handleExportPdf">
          <span class="file-export-big-icon">
            <svg viewBox="0 0 32 32" width="36" height="36">
              <rect x="6" y="10" width="20" height="18" rx="2" fill="currentColor" opacity=".1"/>
              <path d="M6 12h20a3 3 0 013 3v9H3v-9a3 3 0 013-3z" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 28v-4h12v4" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 5h8v5h-8z" fill="currentColor" opacity=".15"/>
              <path d="M12 5h8v5h-8z" fill="none" stroke="currentColor" stroke-width="1.3"/>
              <circle cx="21" cy="16" r="1.2" fill="currentColor"/>
            </svg>
          </span>
          <span>{{ $t('wwf.exportCreatePdfXpsBtn') }}</span>
        </div>
      </div>

      <!-- Change File Type Panel -->
      <div class="file-export-panel" :class="{ active: activeTab === 'types' }">
        <h2>{{ $t('wwf.exportChangeType') }}</h2>

        <div class="file-export-type-group">
          <div class="file-export-group-title">{{ $t('wwf.exportGroupDoc') }}</div>
          <div class="file-export-type-grid">
            <div
              v-for="fmt in exportFormats.doc"
              :key="fmt.type"
              class="file-export-type-card"
              :class="{ selected: selectedType === fmt.type }"
              :style="{ borderColor: selectedType === fmt.type ? fmt.color : '' }"
              @click="selectExportType(fmt.type)"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" :style="{ color: selectedType === fmt.type ? fmt.color : '' }">
                <path d="M5 3h9l5 5v13a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="currentColor" opacity=".13"/>
                <path d="M5 3h9l5 5v13a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="none" stroke="currentColor" stroke-width="1.3"/>
                <path d="M14 3v5h5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                <rect x="7.5" y="12" width="8" height="6" rx=".8" fill="currentColor" opacity=".25"/>
                <text x="11.5" y="16.5" text-anchor="middle" font-size="4.5" font-weight="800" fill="currentColor">W</text>
              </svg>
              <div class="file-export-type-info"><b>{{ fmt.label }}</b><span>{{ fmt.desc }}</span></div>
              <span v-if="fmt.experimental" class="file-export-experimental-badge">{{ $t('wwf.experimental') }}</span>
            </div>
          </div>
        </div>

        <div class="file-export-type-group">
          <div class="file-export-group-title">{{ $t('wwf.exportGroupOther') }}</div>
          <div class="file-export-type-grid">
            <div
              v-for="fmt in exportFormats.other"
              :key="fmt.type"
              class="file-export-type-card"
              :class="{ selected: selectedType === fmt.type }"
              :style="{ borderColor: selectedType === fmt.type ? fmt.color : '' }"
              @click="selectExportType(fmt.type)"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" :style="{ color: selectedType === fmt.type ? fmt.color : '' }">
                <path d="M5 3h9l5 5v13a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="currentColor" opacity=".13"/>
                <path d="M5 3h9l5 5v13a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="none" stroke="currentColor" stroke-width="1.3"/>
                <path d="M14 3v5h5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
              </svg>
              <div class="file-export-type-info"><b>{{ fmt.label }}</b><span>{{ fmt.desc }}</span></div>
              <span v-if="fmt.experimental" class="file-export-experimental-badge">{{ $t('wwf.experimental') }}</span>
            </div>
          </div>
        </div>

        <div class="file-export-type-group">
          <div class="file-export-group-title">{{ $t('wwf.exportGroupAdvanced') }}</div>
          <div class="file-export-type-grid">
            <div
              v-for="fmt in exportFormats.advanced"
              :key="fmt.type"
              class="file-export-type-card"
              :class="{ selected: selectedType === fmt.type }"
              :style="{ borderColor: selectedType === fmt.type ? fmt.color : '' }"
              @click="selectExportType(fmt.type)"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" :style="{ color: selectedType === fmt.type ? fmt.color : '' }">
                <path d="M5 3h9l5 5v13a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="currentColor" opacity=".13"/>
                <path d="M5 3h9l5 5v13a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="none" stroke="currentColor" stroke-width="1.3"/>
                <path d="M14 3v5h5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
              </svg>
              <div class="file-export-type-info"><b>{{ fmt.label }}</b><span>{{ fmt.desc }}</span></div>
            </div>
          </div>
        </div>

        <div class="file-export-big-btn" @click="handleExportType">
          <span class="file-export-big-icon">
            <svg viewBox="0 0 32 32" width="36" height="36">
              <rect x="5" y="3" width="18" height="22" rx="2" fill="currentColor" opacity=".1"/>
              <path d="M5 5h13l5 5v15a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <path d="M18 5v5h5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M8 17h8v6H8zM8 23h8" fill="none" stroke="currentColor" stroke-width="1.2"/>
              <path d="M8 17h8v6H8z" fill="currentColor" opacity=".15"/>
            </svg>
          </span>
          <span>{{ $t('common.saveAs') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
