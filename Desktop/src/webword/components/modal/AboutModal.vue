<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

function close() {
  emit('update:visible', false)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    close()
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
    @click.self="close"
  >
    <div class="modal">
      <div class="modal-head">
        <span>{{ $t('common.about') }}</span>
        <button class="modal-close" :title="$t('common.close')" @click="close">✕</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom:12px">
          <span class="ver">WebWord</span>
          <span class="ver">2026 LTS</span>
        </div>

        <div class="modal-entry">
          <span class="entry-label">{{ $t('ww.about.project') }}</span>
          <span class="entry-value">{{ $t('ww.about.projectValue') }}</span>
        </div>
        <div class="modal-entry">
          <span class="entry-label">{{ $t('ww.about.version') }}</span>
          <span class="entry-value">{{ $t('ww.about.versionValue') }}</span>
        </div>
        <div class="modal-entry">
          <span class="entry-label">{{ $t('ww.about.position') }}</span>
          <span class="entry-value">{{ $t('ww.about.positionValue') }}</span>
        </div>
        <div class="modal-entry">
          <span class="entry-label">{{ $t('ww.about.techStack') }}</span>
          <span class="entry-value">
            <span class="tag">HTML5</span>
            <span class="tag">CSS3</span>
            <span class="tag">JavaScript</span>
            <span class="tag">SVG</span>
            <span class="tag">Canvas</span>
          </span>
        </div>
        <div class="modal-entry">
          <span class="entry-label">{{ $t('ww.about.coreCapabilities') }}</span>
          <span class="entry-value">
            <span class="tag">{{ $t('ww.about.capEdit') }}</span>
            <span class="tag">{{ $t('ww.about.capFormat') }}</span>
            <span class="tag">{{ $t('ww.about.capPdfExport') }}</span>
            <span class="tag">{{ $t('ww.about.capMultiSave') }}</span>
            <span class="tag">{{ $t('ww.about.capToc') }}</span>
            <span class="tag">{{ $t('ww.about.capMusic') }}</span>
          </span>
        </div>
        <div class="modal-entry">
          <span class="entry-label">{{ $t('ww.about.createdDate') }}</span>
          <span class="entry-value">{{ $t('ww.about.createdDateValue') }}</span>
        </div>
        <div style="margin-top:10px;font-size:12px;color:#7d8899">
          {{ $t('ww.about.footerNote') }}
        </div>
      </div>
      <div class="modal-foot">
        <button class="modal-ok" @click="close">{{ $t('common.approve') }}</button>
      </div>
    </div>
  </div>
</template>
