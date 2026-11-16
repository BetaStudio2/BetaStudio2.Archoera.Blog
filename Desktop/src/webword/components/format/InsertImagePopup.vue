<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  'insert': [payload: { src: string; alt?: string }]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  fileInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const base64 = reader.result as string
    emit('insert', { src: base64, alt: file.name })
    // Reset so the same file can be re-selected
    input.value = ''
  }
  reader.readAsDataURL(file)
}

defineExpose({ openFilePicker })
</script>

<template>
  <input
    ref="fileInputRef"
    type="file"
    accept="image/*"
    style="display:none;"
    @change="handleFileChange"
  />
</template>
