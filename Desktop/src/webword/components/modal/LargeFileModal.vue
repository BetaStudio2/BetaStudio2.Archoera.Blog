<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
  sizeMB: number
}>()

const emit = defineEmits<{
  continue: []
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
    <div class="modal" style="width:420px;">
      <div class="modal-head">
        <span>
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            style="vertical-align:-3px;margin-right:6px;"
            fill="none"
            stroke="#f39c12"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>{{ $t('ww.largeFile.warning') }}
        </span>
        <button class="modal-close" :title="$t('common.close')" @click="onCancel">✕</button>
      </div>
      <div class="modal-body" style="padding:24px 20px;text-align:center;">
        <div style="font-size:15px;margin-bottom:12px;">{{ $t('ww.largeFile.message', { size: sizeMB }) }}</div>
        <div style="font-size:12px;color:#98a2b3;">{{ $t('ww.largeFile.body') }}</div>
      </div>
      <div class="modal-foot" style="justify-content:center;gap:12px;">
        <button
          style="padding:6px 18px;font-size:13px;background:#c0392b;color:#fff;border:none;border-radius:6px;cursor:pointer;"
          @click="emit('continue')"
        >{{ $t('ww.largeFile.continue') }}</button>
        <button
          style="padding:6px 18px;font-size:13px;background:transparent;color:#cfd5df;border:1px solid #2f3440;border-radius:6px;cursor:pointer;"
          @click="onCancel"
        >{{ $t('common.cancel') }}</button>
      </div>
    </div>
  </div>
</template>
