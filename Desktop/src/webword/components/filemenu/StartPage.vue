<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRecentDocs, type RecentDoc } from '@/webword/composables/useRecentDocs'

const { t } = useI18n()

const props = defineProps<{
  greeting: string
}>()

const emit = defineEmits<{
  (e: 'new-document'): void
  (e: 'open-template', key: string): void
}>()

const { recentDocs, addRecentDoc } = useRecentDocs()

function handleBlankDoc() {
  addRecentDoc(t('wwf.start.blankDoc'), 'blank')
  emit('new-document')
}

function handleWelcome() {
  addRecentDoc(t('wwf.start.welcomeDoc'), 'welcome')
  emit('open-template', 'welcome')
}

function handleRecentClick(doc: RecentDoc) {
  emit('open-template', doc.key)
}
</script>

<template>
  <div class="file-menu-start-layout">
    <div class="file-menu-start-main">
      <h1 class="file-menu-title">{{ greeting }}</h1>
      <div class="file-template-grid">
        <div class="file-template-card" @click="handleBlankDoc">
          <div class="file-template-thumb"></div>
          <div class="file-template-name">{{ $t('wwf.start.blankDoc') }}</div>
        </div>
        <div class="file-template-card" @click="handleWelcome">
          <div class="file-template-thumb file-template-welcome"></div>
          <div class="file-template-name">{{ $t('wwf.start.welcomeDoc') }}</div>
        </div>
      </div>
      <div class="file-section-label">{{ $t('wwf.start.recent') }}</div>
      <table class="file-list">
        <tr
          v-for="doc in recentDocs"
          :key="doc.key"
          :class="['file-row', doc.cls]"
          @click="handleRecentClick(doc)"
        >
          <td>
            <div class="file-row-td">
              <span class="file-row-icon">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M5 3h9l5 5v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="currentColor" opacity=".15"/>
                  <path d="M5 3h9l5 5v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="none" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M14 3v5h5" fill="none" stroke="currentColor" stroke-width="1.3"/>
                  <text x="12" y="16.5" text-anchor="middle" font-size="5.5" font-weight="800" fill="currentColor">W</text>
                </svg>
              </span>
              <div class="file-row-text">
                <span class="file-row-name">{{ doc.name }}</span>
                <span class="file-secondary">{{ doc.desc }}</span>
              </div>
            </div>
          </td>
          <td><span class="file-secondary">{{ doc.date }}</span></td>
        </tr>
      </table>
    </div>
  </div>
</template>
