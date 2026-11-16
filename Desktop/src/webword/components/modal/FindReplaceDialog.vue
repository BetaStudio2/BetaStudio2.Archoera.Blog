<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  visible: boolean
}>()

const { t } = useI18n()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const findText = ref('')
const replaceText = ref('')
const caseSensitive = ref(false)
const wholeWord = ref(false)
const matchCount = ref(0)
const currentIndex = ref(0)
const totalReplaced = ref(0)

// Collect all text nodes in the editor
function getTextNodes(): Text[] {
  const editor = document.querySelector('[contenteditable="true"]')
  if (!editor) return []
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null)
  const textNodes: Text[] = []
  let node: Text | null
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node)
  }
  return textNodes
}

// Get all match ranges
function findAllMatches(): { node: Text; start: number; end: number }[] {
  const results: { node: Text; start: number; end: number }[] = []
  const searchTerm = findText.value
  if (!searchTerm) return results

  const textNodes = getTextNodes()
  const flags = caseSensitive.value ? 'g' : 'gi'

  for (const tn of textNodes) {
    if (!tn.nodeValue) continue
    const re = new RegExp(escapeRegex(searchTerm), flags)
    let match: RegExpExecArray | null
    while ((match = re.exec(tn.nodeValue)) !== null) {
      if (wholeWord.value) {
        const before = tn.nodeValue.charAt(match.index - 1)
        const after = tn.nodeValue.charAt(match.index + searchTerm.length)
        if (/\w/.test(before) || /\w/.test(after)) continue
      }
      results.push({
        node: tn,
        start: match.index,
        end: match.index + searchTerm.length,
      })
    }
  }
  return results
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Navigate through matches
const allMatches = ref<{ node: Text; start: number; end: number }[]>([])

function updateMatches() {
  allMatches.value = findAllMatches()
  matchCount.value = allMatches.value.length
  currentIndex.value = 0
}

function findNext() {
  if (!findText.value) return
  if (allMatches.value.length === 0) {
    allMatches.value = findAllMatches()
    matchCount.value = allMatches.value.length
  }
  if (allMatches.value.length === 0) return

  currentIndex.value = (currentIndex.value + 1) % allMatches.value.length
  highlightMatch(currentIndex.value)
}

function findPrev() {
  if (!findText.value) return
  if (allMatches.value.length === 0) {
    allMatches.value = findAllMatches()
    matchCount.value = allMatches.value.length
  }
  if (allMatches.value.length === 0) return

  currentIndex.value = (currentIndex.value - 1 + allMatches.value.length) % allMatches.value.length
  highlightMatch(currentIndex.value)
}

function highlightMatch(index: number) {
  if (index < 0 || index >= allMatches.value.length) return
  const match = allMatches.value[index]
  const range = document.createRange()
  range.setStart(match.node, match.start)
  range.setEnd(match.node, match.end)
  const sel = window.getSelection()
  if (sel) {
    sel.removeAllRanges()
    sel.addRange(range)
  }
}

function replaceOne() {
  if (allMatches.value.length === 0 || currentIndex.value >= allMatches.value.length) return
  const match = allMatches.value[currentIndex.value]
  if (match.node.nodeValue) {
    match.node.nodeValue =
      match.node.nodeValue.substring(0, match.start) +
      replaceText.value +
      match.node.nodeValue.substring(match.end)
  }
  totalReplaced.value++
  allMatches.value = findAllMatches()
  matchCount.value = allMatches.value.length
  if (currentIndex.value >= allMatches.value.length && allMatches.value.length > 0) {
    currentIndex.value = 0
  }
}

function replaceAll() {
  if (!findText.value) return
  const textNodes = getTextNodes()
  const flags = caseSensitive.value ? 'g' : 'gi'
  let count = 0

  for (const tn of textNodes) {
    if (!tn.nodeValue) continue
    if (wholeWord.value) {
      const re = new RegExp(`\\b${escapeRegex(findText.value)}\\b`, flags)
      const newVal = tn.nodeValue.replace(re, () => { count++; return replaceText.value })
      tn.nodeValue = newVal
    } else {
      const re = new RegExp(escapeRegex(findText.value), flags)
      const newVal = tn.nodeValue.replace(re, () => { count++; return replaceText.value })
      tn.nodeValue = newVal
    }
  }
  totalReplaced.value += count
  allMatches.value = findAllMatches()
  matchCount.value = allMatches.value.length
  currentIndex.value = 0
}

function close() {
  emit('update:visible', false)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    close()
  }
}

watch(() => findText.value, () => {
  updateMatches()
})

watch(() => caseSensitive.value, () => {
  updateMatches()
})

watch(() => wholeWord.value, () => {
  updateMatches()
})

watch(() => props.visible, (val) => {
  if (val) {
    updateMatches()
    totalReplaced.value = 0
  }
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

const resultText = computed(() => {
  if (!findText.value) return ''
  if (allMatches.value.length === 0) return t('ww.findReplace.noResults')
  return `${currentIndex.value + 1}/${allMatches.value.length}`
})
</script>

<template>
  <div
    class="modal-overlay fr-dialog"
    :class="{ show: visible }"
    @click.self="close"
  >
    <div class="modal" style="width:480px;">
      <div class="modal-head">
        <span>{{ $t('ww.findReplace.title') }}</span>
        <button class="modal-close" :title="$t('common.close')" @click="close">✕</button>
      </div>
      <div class="modal-body">
        <div class="fr-row">
          <span class="fr-label">{{ $t('ww.findReplace.find') }}</span>
          <div class="fr-input-group">
            <input
              v-model="findText"
              class="fr-input"
              type="text"
              :placeholder="$t('ww.findReplace.findPlaceholder')"
            />
            <div class="fr-nav">
              <button class="fr-nav-btn" :title="$t('ww.findReplace.prev')" @click="findPrev">▲</button>
              <button class="fr-nav-btn" :title="$t('ww.findReplace.next')" @click="findNext">▼</button>
            </div>
            <span class="fr-count">{{ resultText }}</span>
          </div>
        </div>
        <div class="fr-row">
          <span class="fr-label">{{ $t('ww.findReplace.replace') }}</span>
          <div class="fr-input-group">
            <input
              v-model="replaceText"
              class="fr-input"
              type="text"
              :placeholder="$t('ww.findReplace.replacePlaceholder')"
            />
          </div>
        </div>
        <div class="fr-row fr-options">
          <div class="fr-check-group">
            <label class="fr-check">
              <input v-model="caseSensitive" type="checkbox" />
              {{ $t('ww.findReplace.caseSensitive') }}
            </label>
            <label class="fr-check">
              <input v-model="wholeWord" type="checkbox" />
              {{ $t('ww.findReplace.wholeWord') }}
            </label>
          </div>
        </div>
        <div v-if="totalReplaced > 0" class="fr-stats">
          {{ $t('ww.findReplace.replacedCount', { count: totalReplaced }) }}
        </div>
      </div>
      <div class="fr-foot">
        <button class="fr-btn" @click="findNext">{{ $t('ww.findReplace.findNext') }}</button>
        <button class="fr-btn" @click="replaceOne">{{ $t('ww.findReplace.replace') }}</button>
        <button class="fr-btn fr-btn-primary" @click="replaceAll">{{ $t('ww.findReplace.replaceAll') }}</button>
      </div>
    </div>
  </div>
</template>
