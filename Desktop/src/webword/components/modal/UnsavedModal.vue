<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  save: []
  'dont-save': []
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
    <div class="modal" style="width:400px;">
      <div class="modal-head">
        <span>WebWord</span>
        <button class="modal-close" :title="$t('common.close')" @click="onCancel">✕</button>
      </div>
      <div class="modal-body" style="padding:24px 20px;text-align:center;">
        <div style="font-size:15px;margin-bottom:12px;">{{ $t('ww.unsaved.title', { name: '文档1' }) }}</div>
        <div style="font-size:12px;color:#98a2b3;">{{ $t('ww.unsaved.body') }}</div>
      </div>
      <div class="modal-foot" style="justify-content:center;gap:12px;">
        <button class="modal-ok" @click="emit('save')">{{ $t('common.save') }}</button>
        <button
          style="padding:6px 18px;font-size:13px;background:transparent;color:#cfd5df;border:1px solid #2f3440;border-radius:6px;cursor:pointer;"
          @click="emit('dont-save')"
        >{{ $t('ww.unsaved.dontSave') }}</button>
        <button
          style="padding:6px 18px;font-size:13px;background:transparent;color:#cfd5df;border:1px solid #2f3440;border-radius:6px;cursor:pointer;"
          @click="onCancel"
        >{{ $t('common.cancel') }}</button>
      </div>
    </div>
  </div>
</template>
