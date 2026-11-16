<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

export interface DropdownItem {
  label: string
  value: string | number
  active?: boolean
}

const props = defineProps<{
  visible: boolean
  items: DropdownItem[]
  position?: { top: string; left: string; width?: string }
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [value: string | number]
}>()

function select(item: DropdownItem) {
  emit('select', item.value)
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
    class="dropdown-popup show"
    :style="{
      top: position?.top || '0px',
      left: position?.left || '0px',
      width: position?.width || 'auto',
      opacity: 1,
      visibility: 'visible',
      transform: 'translateY(0) scale(1)',
    }"
    @click.stop="stopPropagation"
  >
    <div
      v-for="item in items"
      :key="String(item.value)"
      class="dropdown-item"
      :class="{ active: item.active }"
      @click="select(item)"
    >{{ item.label }}</div>
  </div>
</template>
