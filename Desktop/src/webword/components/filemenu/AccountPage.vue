<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fireFireworks } from '@/webword/composables/useFireworks'

const { t } = useI18n()

// 站点没有账号体系：统一显示「默认账户」，数据全部取自本地运行时信息
const accountName = computed(() => t('wwf.defaultAccount'))

const kernelVersion = computed(() => {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Edge ' + (ua.match(/Edg\/(\d+)/)?.[1] || '?')
  if (ua.includes('Firefox/')) return 'Firefox ' + (ua.match(/Firefox\/(\d+)/)?.[1] || '?')
  const opera = ua.match(/OPR\/(\d+)/)
  if (opera) return 'Chromium ' + opera[1]
  if (ua.includes('Chrome/')) return 'Chromium ' + (ua.match(/Chrome\/(\d+)/)?.[1] || '?')
  if (ua.includes('Safari/')) return 'WebKit ' + (ua.match(/Version\/(\d+)/)?.[1] || '?')
  return 'Unknown -'
})

// 在线状态跟随浏览器 network 事件
const online = ref(navigator.onLine)
function updateOnline() { online.value = navigator.onLine }

onMounted(() => {
  window.addEventListener('online', updateOnline)
  window.addEventListener('offline', updateOnline)
})
onUnmounted(() => {
  window.removeEventListener('online', updateOnline)
  window.removeEventListener('offline', updateOnline)
})

// ── 彩蛋：连点 10 次「不可用」放烟花（第 9 次文案变「别点了」）──
const eggClickCount = ref(0)
const eggFired = ref(false)
const unavailableLabel = computed(() => (eggClickCount.value === 9 ? t('wwf.accountStopClicking') : t('wwf.accountUnavailable')))

function onUnavailableClick() {
  if (eggFired.value) return
  eggClickCount.value++
  if (eggClickCount.value >= 10) {
    eggFired.value = true
    eggClickCount.value = 0
    fireFireworks({ onDone: () => { eggFired.value = false } })
  }
}
</script>

<template>
  <h1 class="file-menu-title">{{ $t('wwf.navAccount') }}</h1>
  <div class="file-account-layout">
    <div class="file-account-sidebar">
      <div class="file-account-avatar">
        <svg viewBox="0 0 24 24" width="48" height="48">
          <circle cx="12" cy="7" r="4" fill="currentColor" opacity=".15"/>
          <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <path d="M5 21v-2a7 7 0 0114 0v2" fill="currentColor" opacity=".1"/>
          <path d="M5 21v-2a7 7 0 0114 0v2" fill="none" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      </div>
      <div class="file-account-name">{{ accountName }}</div>
      <div class="file-account-status" :class="{ 'file-account-online': online }">
        {{ online ? $t('wwf.accountOnline') : $t('wwf.accountOffline') }}
      </div>
    </div>

    <div class="file-account-divider"></div>

    <div class="file-account-content">
      <h2>{{ $t('wwf.accountProductInfo') }}</h2>
      <div class="file-account-product-card">
        <div class="file-product-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
            <path d="M5 3h9l5 5v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="currentColor" opacity=".15"/>
            <path d="M5 3h9l5 5v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="none" stroke="currentColor" stroke-width="1.3"/>
            <path d="M14 3v5h5" fill="none" stroke="currentColor" stroke-width="1.3"/>
            <text x="12" y="16.5" text-anchor="middle" font-size="6" font-weight="800" fill="currentColor">W</text>
          </svg>
        </div>
        <div class="file-product-details">
          <div class="file-product-name">WebWord 2026 LTS</div>
          <div class="file-product-sub">{{ $t('wwf.accountLocalDocEditor') }}</div>
        </div>
      </div>

      <div class="file-account-about-card">
        <h3>{{ $t('wwf.accountAbout') }}</h3>
        <div class="file-about-rows">
          <div class="file-about-row">
            <span class="file-about-label">{{ $t('wwf.accountVersion') }}</span>
            <span class="file-about-value">WebWord 26H2 (Build 15310)</span>
          </div>
          <div class="file-about-row">
            <span class="file-about-label">{{ $t('wwf.accountKernelVersion') }}</span>
            <span class="file-about-value">{{ kernelVersion }}</span>
          </div>
          <div class="file-about-row">
            <span class="file-about-label">{{ $t('wwf.accountLicense') }}</span>
            <span
              class="file-about-value file-about-unavailable"
              @click="onUnavailableClick"
            >{{ unavailableLabel }}</span>
          </div>
          <div class="file-about-row">
            <span class="file-about-label">{{ $t('wwf.accountTechStack') }}</span>
            <span class="file-about-value">Html + Css + Js</span>
          </div>
          <div class="file-about-row">
            <span class="file-about-label">{{ $t('wwf.accountStorage') }}</span>
            <span class="file-about-value">{{ $t('wwf.accountStorageValue') }}</span>
          </div>
          <div class="file-about-row">
            <span class="file-about-label">{{ $t('wwf.accountBuildCode') }}</span>
            <span class="file-about-value">26H2-15310</span>
          </div>
          <div class="file-about-row">
            <span class="file-about-label">{{ $t('wwf.accountPlatform') }}</span>
            <span class="file-about-value">{{ $t('wwf.accountPlatformValue') }}</span>
          </div>
        </div>
      </div>

      <div class="file-product-features">
        <span class="file-feature-tag">{{ $t('wwf.featureDocEdit') }}</span>
        <span class="file-feature-tag">{{ $t('wwf.featureTemplateMgmt') }}</span>
        <span class="file-feature-tag">{{ $t('wwf.featureFileExport') }}</span>
        <span class="file-feature-tag">{{ $t('wwf.featureMultiFormat') }}</span>
        <span class="file-feature-tag">{{ $t('wwf.featurePdfPrint') }}</span>
        <span class="file-feature-tag">{{ $t('wwf.featureMusic') }}</span>
      </div>
    </div>
  </div>
</template>
