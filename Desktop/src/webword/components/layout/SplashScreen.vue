<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAppStore } from '@/webword/stores/app'

const appStore = useAppStore()

const windowMaximized = ref(false)
const flash = ref(false)
const hidden = ref(false)

// Watch for progress to reach 100% → trigger splash exit animation
watch(() => appStore.splashProgress, (val) => {
  if (val < 100) return

  // Flash the bar
  flash.value = true

  // Maximize the splash window
  setTimeout(() => { windowMaximized.value = true }, 200)

  // Hide splash AND show app simultaneously
  setTimeout(() => {
    hidden.value = true
    appStore.setReady(true)
  }, 500)

  // Remove splash from DOM after fade completes
  setTimeout(() => {
    appStore.hideSplash()
  }, 1300)
})
</script>

<template>
  <div id="splash-screen" :class="{ hidden }">
    <div class="splash-window" :class="{ maximized: windowMaximized }">
      <div class="splash-window-titlebar">
        <span class="splash-window-title">WebWord 2026 LTS</span>
        <button class="splash-window-close" :title="$t('common.close')" @click="hidden = true">✕</button>
      </div>
      <div class="splash-logo">
        <div class="splash-word">
          <div class="splash-shimmer"></div>
        </div>
      </div>
      <div class="splash-info">
        <div class="splash-bar">
          <div
            class="splash-bar-fill"
            :class="{ flash }"
            :style="{ width: appStore.splashProgress + '%' }"
          ></div>
        </div>
        <div class="splash-loading-text">{{ appStore.splashText }}</div>
      </div>
      <div class="splash-brand">WebWord 2026 LTS</div>
    </div>
  </div>
</template>
