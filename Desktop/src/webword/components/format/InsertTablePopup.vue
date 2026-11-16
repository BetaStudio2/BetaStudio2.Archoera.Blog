<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  visible: boolean
  position?: { top: string; left: string }
}>()

const { t } = useI18n()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'insert': [payload: { rows: number; cols: number }]
}>()

const maxRows = 8
const maxCols = 8
const hoverRow = ref(0)
const hoverCol = ref(0)
const selectedRows = ref(0)
const selectedCols = ref(0)
const customRows = ref(3)
const customCols = ref(3)

function onCellEnter(r: number, c: number) {
  hoverRow.value = r
  hoverCol.value = c
  selectedRows.value = r + 1
  selectedCols.value = c + 1
}

function onCellClick(r: number, c: number) {
  selectedRows.value = r + 1
  selectedCols.value = c + 1
  hoverRow.value = r
  hoverCol.value = c
}

function insertTable() {
  const rows = selectedRows.value || customRows.value
  const cols = selectedCols.value || customCols.value
  if (rows < 1 || cols < 1) return
  emit('insert', { rows, cols })
  close()
}

function applyPreset(rows: number, cols: number) {
  selectedRows.value = rows
  selectedCols.value = cols
  hoverRow.value = rows - 1
  hoverCol.value = cols - 1
}

function applyCustom() {
  const r = Math.max(1, Math.min(20, customRows.value || 1))
  const c = Math.max(1, Math.min(20, customCols.value || 1))
  emit('insert', { rows: r, cols: c })
  close()
}

function close() {
  emit('update:visible', false)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    close()
  }
}

function stopPropagation(e: Event) {
  e.stopPropagation()
}

watch(() => props.visible, (val) => {
  if (val) {
    hoverRow.value = 2
    hoverCol.value = 2
    selectedRows.value = 0
    selectedCols.value = 0
    customRows.value = 3
    customCols.value = 3
  }
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

const infoText = computed(() => {
  const r = selectedRows.value || customRows.value
  const c = selectedCols.value || customCols.value
  return t('ww.insertTable.info', { r, c })
})
</script>

<template>
  <div
    v-if="visible"
    class="table-picker-popup show"
    :style="{
      top: position?.top || '0px',
      left: position?.left || '0px',
      opacity: 1,
      visibility: 'visible',
      transform: 'translateY(0) scale(1)',
    }"
    @click.stop="stopPropagation"
  >
    <!-- Preset buttons -->
    <div class="table-picker-presets">
      <button class="table-picker-preset-btn" @click="applyPreset(3, 3)">
        <svg viewBox="0 0 24 24" fill="none" stroke="#c2cad8" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
        </svg>
        3×3
      </button>
      <button class="table-picker-preset-btn" @click="applyPreset(4, 4)">
        <svg viewBox="0 0 24 24" fill="none" stroke="#c2cad8" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="7.5" x2="21" y2="7.5"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="16.5" x2="21" y2="16.5"/>
          <line x1="7.5" y1="3" x2="7.5" y2="21"/>
          <line x1="12" y1="3" x2="12" y2="21"/>
          <line x1="16.5" y1="3" x2="16.5" y2="21"/>
        </svg>
        4×4
      </button>
      <button class="table-picker-preset-btn" @click="applyPreset(5, 5)">
        <svg viewBox="0 0 24 24" fill="none" stroke="#c2cad8" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="6.6" x2="21" y2="6.6"/>
          <line x1="3" y1="10.2" x2="21" y2="10.2"/>
          <line x1="3" y1="13.8" x2="21" y2="13.8"/>
          <line x1="3" y1="17.4" x2="21" y2="17.4"/>
          <line x1="6.6" y1="3" x2="6.6" y2="21"/>
          <line x1="10.2" y1="3" x2="10.2" y2="21"/>
          <line x1="13.8" y1="3" x2="13.8" y2="21"/>
          <line x1="17.4" y1="3" x2="17.4" y2="21"/>
        </svg>
        5×5
      </button>
    </div>

    <!-- Grid selector -->
    <div class="table-picker-grid">
      <template v-for="r in maxRows" :key="'r' + r">
        <div
          v-for="c in maxCols"
          :key="'c' + c"
          class="table-picker-cell"
          :class="{ active: (r - 1) <= hoverRow && (c - 1) <= hoverCol }"
          @mouseenter="onCellEnter(r - 1, c - 1)"
          @click="onCellClick(r - 1, c - 1)"
        ></div>
      </template>
    </div>

    <!-- Custom row/col inputs -->
    <div class="table-picker-custom">
      <label>{{ $t('ww.insertTable.rows') }}</label>
      <input v-model.number="customRows" type="number" min="1" max="20" />
      <label>{{ $t('ww.insertTable.cols') }}</label>
      <input v-model.number="customCols" type="number" min="1" max="20" />
      <button @click="applyCustom">{{ $t('common.approve') }}</button>
    </div>

    <!-- Info text -->
    <div class="table-picker-info">{{ infoText }}</div>

    <!-- Actions -->
    <div class="table-picker-actions">
      <button @click="close">{{ $t('common.cancel') }}</button>
      <button class="primary" @click="insertTable">{{ $t('ww.insertTable.insert') }}</button>
    </div>
  </div>
</template>
