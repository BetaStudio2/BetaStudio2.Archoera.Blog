<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
  position?: { top: string; left: string }
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'insert': [payload: { url: string; text: string }]
}>()

const url = ref('')
const displayText = ref('')

function insert() {
  if (!url.value) return
  emit('insert', {
    url: url.value,
    text: displayText.value || url.value,
  })
  url.value = ''
  displayText.value = ''
  close()
}

function close() {
  emit('update:visible', false)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    close()
  }
  if (e.key === 'Enter' && props.visible) {
    insert()
  }
}

function stopPropagation(e: Event) {
  e.stopPropagation()
}

watch(() => props.visible, (val) => {
  if (val) {
    url.value = ''
    displayText.value = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    v-if="visible"
    class="link-input-popup show"
    :style="{
      top: position?.top || '0px',
      left: position?.left || '0px',
      opacity: 1,
      visibility: 'visible',
      transform: 'translateY(0) scale(1)',
    }"
    @click.stop="stopPropagation"
  >
    <div class="link-input-row">
      <label>{{ $t('ww.insertLink.url') }}</label>
      <input
        v-model="url"
        type="text"
        placeholder="https://..."
      />
    </div>
    <div class="link-input-row">
      <label>{{ $t('ww.insertLink.displayText') }}</label>
      <input
        v-model="displayText"
        type="text"
        :placeholder="$t('ww.insertLink.displayTextPlaceholder')"
      />
    </div>
    <div class="link-input-actions">
      <button @click="close">{{ $t('common.cancel') }}</button>
      <button class="primary" @click="insert">{{ $t('ww.insertLink.insert') }}</button>
    </div>
  </div>
</template>
