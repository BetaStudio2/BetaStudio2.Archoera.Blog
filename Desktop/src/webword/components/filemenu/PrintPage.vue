<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '@/webword/stores/document'

const { t } = useI18n()

const docStore = useDocumentStore()

const zoomScale = ref(3) // 1-6, default 3 (fit)
const currentPageNum = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(docStore.content.length / 3000)))

const copies = ref(1)
const pageRange = ref('')
const showPageInput = ref(false)
const showCollateInput = ref(false)
const collateOrder = ref('')

// Print settings
const range = ref<'all' | 'current' | 'custom'>('all')
const rangeTitle = computed(() => {
  switch (range.value) {
    case 'all': return t('wwf.print.rangeAll')
    case 'current': return t('wwf.print.rangeCurrent')
    case 'custom': return t('wwf.print.rangeCustom')
  }
})
const rangeSub = computed(() => {
  switch (range.value) {
    case 'all': return t('wwf.print.rangeAllSub')
    case 'current': return t('wwf.print.rangeCurrentSub')
    case 'custom': return t('wwf.print.rangeCustomSub')
  }
})

const sides = ref<'simplex' | 'duplex-long' | 'duplex-short'>('simplex')
const sidesTitle = computed(() => {
  switch (sides.value) {
    case 'simplex': return t('wwf.print.simplex')
    case 'duplex-long': return t('wwf.print.duplexLong')
    case 'duplex-short': return t('wwf.print.duplexShort')
  }
})
const sidesSub = computed(() => {
  switch (sides.value) {
    case 'simplex': return t('wwf.print.simplexSub')
    case 'duplex-long': return t('wwf.print.duplexLongSub')
    case 'duplex-short': return t('wwf.print.duplexShortSub')
  }
})

const collate = ref<'true' | 'false' | 'reverse' | 'custom'>('true')
const collateTitle = computed(() => {
  switch (collate.value) {
    case 'true': return t('wwf.print.collateTrue')
    case 'false': return t('wwf.print.collateFalse')
    case 'reverse': return t('wwf.print.collateReverse')
    case 'custom': return t('wwf.print.collateCustom')
  }
})
const collateSub = computed(() => {
  switch (collate.value) {
    case 'true': return '1,2,3  1,2,3  1,2,3'
    case 'false': return '1,1,1  2,2,2  3,3,3'
    case 'reverse': return '3,2,1  3,2,1  3,2,1'
    case 'custom': return t('wwf.print.collateCustomSub')
  }
})

const orientation = ref<'portrait' | 'landscape'>('portrait')
const orientTitle = computed(() => orientation.value === 'portrait' ? t('wwf.print.portrait') : t('wwf.print.landscape'))

const paperSize = ref<'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'B5' | 'Tabloid'>('A4')
const paperTitle = computed(() => paperSize.value)
const paperSub = computed(() => {
  const map: Record<string, string> = {
    A4: t('wwf.print.paperA4Sub'),
    A3: '29.7 × 42.0 cm',
    A5: '14.8 × 21.0 cm',
    Letter: '21.59 × 27.94 cm',
    Legal: '21.59 × 35.56 cm',
    'B5': '18.2 × 25.7 cm',
    Tabloid: '27.94 × 43.18 cm',
  }
  return map[paperSize.value] || ''
})

const margin = ref<'normal' | 'narrow' | 'moderate' | 'wide' | 'mirrored'>('normal')
const marginTitle = computed(() => {
  const map: Record<string, string> = {
    normal: t('wwf.print.marginNormal'), narrow: t('wwf.print.marginNarrow'), moderate: t('wwf.print.marginModerate'), wide: t('wwf.print.marginWide'), mirrored: t('wwf.print.marginMirrored'),
  }
  return map[margin.value]
})
const marginSub = computed(() => {
  const map: Record<string, string> = {
    normal: t('wwf.print.marginNormalSub'),
    narrow: t('wwf.print.marginNarrowSub'),
    moderate: t('wwf.print.marginModerateSub'),
    wide: t('wwf.print.marginWideSub'),
    mirrored: t('wwf.print.marginMirroredSub'),
  }
  return map[margin.value]
})

// Background/image/grayscale/draft toggles
const printBackground = ref(true)
const printImages = ref(true)
const printGrayscale = ref(false)
const printDraft = ref(false)

// Dropdown open states
const openDropdown = ref<string | null>(null)

function toggleDropdown(name: string) {
  openDropdown.value = openDropdown.value === name ? null : name
}

function closeAllDropdowns() {
  openDropdown.value = null
}

function selectRange(val: 'all' | 'current' | 'custom') {
  range.value = val
  showPageInput.value = val === 'custom'
  closeAllDropdowns()
}

function selectSides(val: 'simplex' | 'duplex-long' | 'duplex-short') {
  sides.value = val
  closeAllDropdowns()
}

function selectCollate(val: 'true' | 'false' | 'reverse' | 'custom') {
  collate.value = val
  showCollateInput.value = val === 'custom'
  closeAllDropdowns()
}

function selectOrientation(val: 'portrait' | 'landscape') {
  orientation.value = val
  closeAllDropdowns()
}

function selectPaper(val: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'B5' | 'Tabloid') {
  paperSize.value = val
  closeAllDropdowns()
}

function selectMargin(val: 'normal' | 'narrow' | 'moderate' | 'wide' | 'mirrored') {
  margin.value = val
  closeAllDropdowns()
}

function handlePrint() {
  window.print()
}

function prevPage() {
  if (currentPageNum.value > 1) currentPageNum.value--
}

function nextPage() {
  if (currentPageNum.value < totalPages.value) currentPageNum.value++
}

function zoomIn() {
  if (zoomScale.value < 6) zoomScale.value++
}

function zoomOut() {
  if (zoomScale.value > 1) zoomScale.value--
}

const zoomLabel = computed(() => {
  if (zoomScale.value === 3) return t('wwf.print.fit')
  const vals = ['', '50%', '75%', '100%', '125%', '150%', '200%']
  return vals[zoomScale.value] || '100%'
})

const previewStyles = computed(() => {
  const w = 200 + (zoomScale.value - 3) * 50
  const h = 280 + (zoomScale.value - 3) * 70
  return { width: w + 'px', height: h + 'px' }
})

// Close dropdowns on outside click
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.file-print-dropdown')) {
    openDropdown.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})

const previewContent = computed(() => {
  return docStore.content || `<p style="color:#999;">${t('wwf.print.previewFallback')}</p>`
})
</script>

<template>
  <h1 class="file-menu-title">{{ $t('common.print') }}</h1>
  <div class="file-print-layout">
    <div class="file-print-settings">
      <div class="file-print-btn-group">
        <div class="file-print-big-btn" @click="handlePrint">
          <span class="file-print-icon">🖨</span>
          <span>{{ $t('common.print') }}</span>
        </div>
        <div class="file-print-copies">
          <span>{{ $t('wwf.print.copies') }}</span>
          <input type="number" v-model="copies" class="file-print-copies-input" min="1" max="99">
        </div>
      </div>

      <div class="file-print-section-label">{{ $t('wwf.print.printer') }}</div>
      <div class="file-print-block file-print-dropdown">
        <span class="file-print-block-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#a1a1a1" stroke-width="1.5">
            <rect x="5" y="10" width="14" height="10" rx="1"/>
            <rect x="7" y="4" width="10" height="6" rx="1"/>
            <line x1="8" y1="14" x2="16" y2="14"/>
            <line x1="8" y1="17" x2="12" y2="17"/>
            <rect x="3" y="10" width="18" height="10" rx="1" fill="none"/>
          </svg>
        </span>
        <div class="file-print-block-info">
          <div class="file-print-block-title">Microsoft Print to PDF</div>
          <div class="file-print-block-sub">{{ $t('wwf.print.ready') }}</div>
        </div>
      </div>
      <div style="text-align:right;"><span class="file-info-link">{{ $t('wwf.print.printerProps') }}</span></div>

      <div class="file-print-section-label">{{ $t('wwf.print.settings') }}</div>

      <!-- Print Range -->
      <div class="file-print-block file-print-dropdown" :class="{ open: openDropdown === 'range' }" @click.stop="toggleDropdown('range')">
        <span class="file-print-block-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#a1a1a1" stroke-width="1.5"><rect x="3" y="3" width="12" height="17" rx="1"/><rect x="5" y="2" width="12" height="17" rx="1"/><rect x="7" y="1" width="12" height="17" rx="1"/></svg>
        </span>
        <div class="file-print-block-info">
          <div class="file-print-block-title">{{ rangeTitle }}</div>
          <div class="file-print-block-sub">{{ rangeSub }}</div>
        </div>
        <svg class="file-print-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        <div class="file-print-dropdown-menu">
          <div class="file-print-dropdown-item" :class="{ active: range === 'all' }" @click.stop="selectRange('all')">
            <div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="12" height="17" rx="1"/><rect x="5" y="2" width="12" height="17" rx="1"/><rect x="7" y="1" width="12" height="17" rx="1"/></svg></div>
            <div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.rangeAll') }}</span><span class="fpdi-desc">{{ $t('wwf.print.rangeAllSub') }}</span></div>
          </div>
          <div class="file-print-dropdown-item" :class="{ active: range === 'current' }" @click.stop="selectRange('current')">
            <div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="2" width="16" height="20" rx="1"/><rect x="6" y="6" width="10" height="6" stroke-width="1.2" stroke-dasharray="2,1"/></svg></div>
            <div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.rangeCurrent') }}</span><span class="fpdi-desc">{{ $t('wwf.print.rangeCurrentSub') }}</span></div>
          </div>
          <div class="file-print-dropdown-item" :class="{ active: range === 'custom' }" @click.stop="selectRange('custom')">
            <div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="2" width="16" height="20" rx="1"/><line x1="8" y1="7" x2="16" y2="7" stroke-width="1.2"/><line x1="8" y1="10" x2="14" y2="10" stroke-width="1.2"/><line x1="8" y1="13" x2="16" y2="13" stroke-width="1.2"/><line x1="8" y1="16" x2="12" y2="16" stroke-width="1.2"/></svg></div>
            <div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.rangeCustom') }}</span><span class="fpdi-desc">{{ $t('wwf.print.rangeCustomSub') }}</span></div>
          </div>
        </div>
      </div>
      <div v-if="showPageInput" style="margin:10px 0;font-size:13px;">
        {{ $t('wwf.print.pagesLabel') }} <input type="text" v-model="pageRange" class="file-print-copies-input" style="width:150px;margin-left:10px;" :placeholder="$t('wwf.print.rangePlaceholder')">
      </div>

      <!-- Sides -->
      <div class="file-print-block file-print-dropdown" :class="{ open: openDropdown === 'sides' }" @click.stop="toggleDropdown('sides')">
        <span class="file-print-block-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#a1a1a1" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="1"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>
        </span>
        <div class="file-print-block-info">
          <div class="file-print-block-title">{{ sidesTitle }}</div>
          <div class="file-print-block-sub">{{ sidesSub }}</div>
        </div>
        <svg class="file-print-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        <div class="file-print-dropdown-menu">
          <div class="file-print-dropdown-item" :class="{ active: sides === 'simplex' }" @click.stop="selectSides('simplex')">
            <div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="1"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg></div>
            <div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.simplex') }}</span><span class="fpdi-desc">{{ $t('wwf.print.simplexSub') }}</span></div>
          </div>
          <div class="file-print-dropdown-item" :class="{ active: sides === 'duplex-long' }" @click.stop="selectSides('duplex-long')">
            <div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="16" height="15" rx="1"/><rect x="6" y="5" width="16" height="15" rx="1"/><path d="M18 10l3 2-3 2" stroke-width="1.2"/></svg></div>
            <div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.duplexLong') }}</span><span class="fpdi-desc">{{ $t('wwf.print.duplexLongSub') }}</span></div>
          </div>
          <div class="file-print-dropdown-item" :class="{ active: sides === 'duplex-short' }" @click.stop="selectSides('duplex-short')">
            <div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="15" height="16" rx="1"/><rect x="5" y="6" width="15" height="16" rx="1"/><path d="M10 18l-2 3 2 3" stroke-width="1.2"/></svg></div>
            <div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.duplexShort') }}</span><span class="fpdi-desc">{{ $t('wwf.print.duplexShortSub') }}</span></div>
          </div>
        </div>
      </div>

      <!-- Collated -->
      <div class="file-print-block file-print-dropdown" :class="{ open: openDropdown === 'collate' }" @click.stop="toggleDropdown('collate')">
        <span class="file-print-block-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#a1a1a1" stroke-width="1.5"><rect x="3" y="2" width="6" height="8" rx=".5"/><rect x="5" y="3" width="6" height="8" rx=".5"/><rect x="7" y="4" width="6" height="8" rx=".5"/><line x1="16" y1="7" x2="18" y2="7"/><rect x="3" y="13" width="6" height="8" rx=".5"/><rect x="5" y="14" width="6" height="8" rx=".5"/><rect x="7" y="15" width="6" height="8" rx=".5"/><line x1="16" y1="18" x2="18" y2="18"/></svg>
        </span>
        <div class="file-print-block-info">
          <div class="file-print-block-title">{{ collateTitle }}</div>
          <div class="file-print-block-sub">{{ collateSub }}</div>
        </div>
        <svg class="file-print-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        <div class="file-print-dropdown-menu">
          <div class="file-print-dropdown-item" :class="{ active: collate === 'true' }" @click.stop="selectCollate('true')">
            <div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="2" width="5" height="7" rx=".5"/><rect x="5" y="3" width="5" height="7" rx=".5"/><rect x="7" y="4" width="5" height="7" rx=".5"/><rect x="15" y="2" width="5" height="7" rx=".5"/><rect x="17" y="3" width="5" height="7" rx=".5"/><rect x="19" y="4" width="5" height="7" rx=".5"/></svg></div>
            <div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.collateTrue') }}</span><span class="fpdi-desc">{{ $t('wwf.print.collateTrueSub') }}</span></div>
          </div>
          <div class="file-print-dropdown-item" :class="{ active: collate === 'false' }" @click.stop="selectCollate('false')">
            <div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="5" rx=".5"/><rect x="3" y="9" width="18" height="5" rx=".5"/><rect x="3" y="15" width="18" height="5" rx=".5"/></svg></div>
            <div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.collateFalse') }}</span><span class="fpdi-desc">{{ $t('wwf.print.collateFalseSub') }}</span></div>
          </div>
          <div class="file-print-dropdown-item" :class="{ active: collate === 'reverse' }" @click.stop="selectCollate('reverse')">
            <div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="2" width="5" height="7" rx=".5"/><rect x="5" y="3" width="5" height="7" rx=".5"/><rect x="7" y="4" width="5" height="7" rx=".5"/><rect x="15" y="2" width="5" height="7" rx=".5"/><rect x="17" y="3" width="5" height="7" rx=".5"/><rect x="19" y="4" width="5" height="7" rx=".5"/><line x1="4" y1="1" x2="21" y2="1" stroke-width="1.2"/></svg></div>
            <div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.collateReverse') }}</span><span class="fpdi-desc">{{ $t('wwf.print.collateReverseSub') }}</span></div>
          </div>
          <div class="file-print-dropdown-item" :class="{ active: collate === 'custom' }" @click.stop="selectCollate('custom')">
            <div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="2" width="16" height="20" rx="1"/><line x1="8" y1="7" x2="16" y2="7" stroke-width="1.2"/><line x1="8" y1="10" x2="14" y2="10" stroke-width="1.2"/><line x1="8" y1="13" x2="16" y2="13" stroke-width="1.2"/><line x1="8" y1="16" x2="12" y2="16" stroke-width="1.2"/></svg></div>
            <div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.collateCustom') }}</span><span class="fpdi-desc">{{ $t('wwf.print.collateCustomSub') }}</span></div>
          </div>
        </div>
      </div>
      <div v-if="showCollateInput" style="margin:10px 0;font-size:13px;">
        {{ $t('wwf.print.order') }} <input type="text" v-model="collateOrder" class="file-print-copies-input" style="width:150px;margin-left:10px;" :placeholder="$t('wwf.print.orderPlaceholder')">
      </div>

      <!-- Orientation -->
      <div class="file-print-block file-print-dropdown" :class="{ open: openDropdown === 'orientation' }" @click.stop="toggleDropdown('orientation')">
        <span class="file-print-block-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#a1a1a1" stroke-width="1.5"><rect x="6" y="3" width="12" height="18" rx="1"/></svg>
        </span>
        <div class="file-print-block-info">
          <div class="file-print-block-title">{{ orientTitle }}</div>
        </div>
        <svg class="file-print-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        <div class="file-print-dropdown-menu">
          <div class="file-print-dropdown-item" :class="{ active: orientation === 'portrait' }" @click.stop="selectOrientation('portrait')">
            <div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="3" width="12" height="18" rx="1"/></svg></div>
            <div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.portrait') }}</span><span class="fpdi-desc">{{ $t('wwf.print.portraitSub') }}</span></div>
          </div>
          <div class="file-print-dropdown-item" :class="{ active: orientation === 'landscape' }" @click.stop="selectOrientation('landscape')">
            <div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6" width="18" height="12" rx="1"/></svg></div>
            <div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.landscape') }}</span><span class="fpdi-desc">{{ $t('wwf.print.landscapeSub') }}</span></div>
          </div>
        </div>
      </div>

      <!-- Paper Size -->
      <div class="file-print-block file-print-dropdown" :class="{ open: openDropdown === 'paper' }" @click.stop="toggleDropdown('paper')">
        <span class="file-print-block-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#a1a1a1" stroke-width="1.5"><rect x="4" y="3" width="16" height="18" rx="1"/><text x="12" y="15" text-anchor="middle" font-size="7" fill="#a1a1a1" stroke="none">A4</text></svg>
        </span>
        <div class="file-print-block-info">
          <div class="file-print-block-title">{{ paperTitle }}</div>
          <div class="file-print-block-sub">{{ paperSub }}</div>
        </div>
        <svg class="file-print-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        <div class="file-print-dropdown-menu">
          <div class="file-print-dropdown-item" :class="{ active: paperSize === 'A4' }" @click.stop="selectPaper('A4')"><div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="3" width="16" height="18" rx="1"/></svg></div><div class="fpdi-content"><span class="fpdi-title">A4</span><span class="fpdi-desc">21.0 × 29.7 cm</span></div></div>
          <div class="file-print-dropdown-item" :class="{ active: paperSize === 'A3' }" @click.stop="selectPaper('A3')"><div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="1" width="20" height="22" rx="1"/></svg></div><div class="fpdi-content"><span class="fpdi-title">A3</span><span class="fpdi-desc">29.7 × 42.0 cm</span></div></div>
          <div class="file-print-dropdown-item" :class="{ active: paperSize === 'A5' }" @click.stop="selectPaper('A5')"><div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="5" width="12" height="14" rx="1"/></svg></div><div class="fpdi-content"><span class="fpdi-title">A5</span><span class="fpdi-desc">14.8 × 21.0 cm</span></div></div>
          <div class="file-print-dropdown-item" :class="{ active: paperSize === 'Letter' }" @click.stop="selectPaper('Letter')"><div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="3" width="16" height="18" rx="1"/></svg></div><div class="fpdi-content"><span class="fpdi-title">Letter</span><span class="fpdi-desc">21.59 × 27.94 cm</span></div></div>
          <div class="file-print-dropdown-item" :class="{ active: paperSize === 'Legal' }" @click.stop="selectPaper('Legal')"><div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="1" width="16" height="22" rx="1"/></svg></div><div class="fpdi-content"><span class="fpdi-title">Legal</span><span class="fpdi-desc">21.59 × 35.56 cm</span></div></div>
          <div class="file-print-dropdown-item" :class="{ active: paperSize === 'B5' }" @click.stop="selectPaper('B5')"><div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="4" width="14" height="16" rx="1"/></svg></div><div class="fpdi-content"><span class="fpdi-title">B5 (JIS)</span><span class="fpdi-desc">18.2 × 25.7 cm</span></div></div>
          <div class="file-print-dropdown-item" :class="{ active: paperSize === 'Tabloid' }" @click.stop="selectPaper('Tabloid')"><div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="14" rx="1"/></svg></div><div class="fpdi-content"><span class="fpdi-title">Tabloid</span><span class="fpdi-desc">27.94 × 43.18 cm</span></div></div>
        </div>
      </div>

      <!-- Margins -->
      <div class="file-print-block file-print-dropdown" :class="{ open: openDropdown === 'margin' }" @click.stop="toggleDropdown('margin')">
        <span class="file-print-block-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#a1a1a1" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="6" y="6" width="12" height="12" stroke-width="1"/></svg>
        </span>
        <div class="file-print-block-info">
          <div class="file-print-block-title">{{ marginTitle }}</div>
          <div class="file-print-block-sub">{{ marginSub }}</div>
        </div>
        <svg class="file-print-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        <div class="file-print-dropdown-menu">
          <div class="file-print-dropdown-item" :class="{ active: margin === 'normal' }" @click.stop="selectMargin('normal')"><div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="6" y="6" width="12" height="12" stroke-width="1"/></svg></div><div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.marginNormal') }}</span><span class="fpdi-desc">{{ $t('wwf.print.marginNormalDesc') }}</span></div></div>
          <div class="file-print-dropdown-item" :class="{ active: margin === 'narrow' }" @click.stop="selectMargin('narrow')"><div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="5" y="5" width="14" height="14" stroke-width=".8"/></svg></div><div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.marginNarrow') }}</span><span class="fpdi-desc">{{ $t('wwf.print.marginNarrowSub') }}</span></div></div>
          <div class="file-print-dropdown-item" :class="{ active: margin === 'moderate' }" @click.stop="selectMargin('moderate')"><div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="5.5" y="6" width="13" height="12" stroke-width="1"/></svg></div><div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.marginModerate') }}</span><span class="fpdi-desc">{{ $t('wwf.print.marginModerateSub') }}</span></div></div>
          <div class="file-print-dropdown-item" :class="{ active: margin === 'wide' }" @click.stop="selectMargin('wide')"><div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="8" y="6" width="8" height="12" stroke-width="1"/></svg></div><div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.marginWide') }}</span><span class="fpdi-desc">{{ $t('wwf.print.marginWideSub') }}</span></div></div>
          <div class="file-print-dropdown-item" :class="{ active: margin === 'mirrored' }" @click.stop="selectMargin('mirrored')"><div class="fpdi-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="6" y="6" width="13" height="12" stroke-width="1"/><line x1="16" y1="3" x2="16" y2="21" stroke-width=".5" stroke-dasharray="1,1"/></svg></div><div class="fpdi-content"><span class="fpdi-title">{{ $t('wwf.print.marginMirrored') }}</span><span class="fpdi-desc">{{ $t('wwf.print.marginMirroredSub') }}</span></div></div>
        </div>
      </div>

      <div style="text-align:right;margin-top:10px;"><span class="file-info-link">{{ $t('wwf.print.pageSetup') }}</span></div>

      <div class="file-print-check-group">
        <label class="file-print-check-label">
          <input type="checkbox" v-model="printBackground" checked> {{ $t('wwf.print.background') }}
        </label>
        <label class="file-print-check-label">
          <input type="checkbox" v-model="printImages" checked> {{ $t('wwf.print.images') }}
        </label>
        <label class="file-print-check-label">
          <input type="checkbox" v-model="printGrayscale"> {{ $t('wwf.print.grayscale') }}
        </label>
        <label class="file-print-check-label">
          <input type="checkbox" v-model="printDraft"> {{ $t('wwf.print.draft') }}
        </label>
      </div>
    </div>

    <div class="file-print-preview">
      <div class="file-print-canvas">
        <div class="file-print-sheet" :style="previewStyles">
          <div class="file-print-preview-text" v-html="previewContent"></div>
        </div>
      </div>
      <div class="file-print-footer">
        <div class="file-print-page-nav">
          <button class="file-print-nav-btn" :disabled="currentPageNum <= 1" @click="prevPage">◀</button>
          <span>{{ $t('wwf.print.pageInfo', { current: currentPageNum, total: totalPages }) }}</span>
          <button class="file-print-nav-btn" :disabled="currentPageNum >= totalPages" @click="nextPage">▶</button>
        </div>
        <div class="file-print-zoom">
          <button class="file-print-zoom-btn" @click="zoomOut">−</button>
          <input type="range" class="file-print-zoom-slider" v-model.number="zoomScale" min="1" max="6" step="1">
          <button class="file-print-zoom-btn" @click="zoomIn">+</button>
          <span class="file-print-zoom-label">{{ zoomLabel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
