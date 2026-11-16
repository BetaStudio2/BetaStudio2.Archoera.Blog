<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '@/webword/stores/document'
import { STATIC_MODE } from '@/utils/siteMode'
import { fetchAuthor } from '@/utils/staticData'
import { useFileMenu } from '@/webword/composables/useFileMenu'

const { t } = useI18n()

const docStore = useDocumentStore()
const fm = useFileMenu()

const docInfo = computed(() => docStore.docInfo)

// Local author info — fetched fresh from server by UUID on every load/refresh
const authorDisplayName = ref(docStore.docInfo.author)
const authorAvatarUrl = ref<string | null>(docStore.docInfo.authorAvatar)
const authorLoading = ref(false)

async function fetchAuthorByUuid() {
  const uuid = docStore.docInfo.authorUuid
  if (!uuid) {
    authorDisplayName.value = docStore.docInfo.author
    authorAvatarUrl.value = docStore.docInfo.authorAvatar
    return
  }
  authorLoading.value = true
  try {
    if (STATIC_MODE) {
      const data = await fetchAuthor(uuid)
      authorDisplayName.value = data.display_name
      authorAvatarUrl.value = data.avatar
      docStore.docInfo.author = data.display_name
      docStore.docInfo.authorAvatar = data.avatar
      return
    }
    const res = await fetch(`/api/author/${encodeURIComponent(uuid)}`)
    if (res.ok) {
      const data = await res.json()
      authorDisplayName.value = data.display_name
      authorAvatarUrl.value = data.avatar
      // Also sync back to store so other components stay in sync
      docStore.docInfo.author = data.display_name
      docStore.docInfo.authorAvatar = data.avatar
    } else {
      // Fallback to store values
      authorDisplayName.value = docStore.docInfo.author
      authorAvatarUrl.value = docStore.docInfo.authorAvatar
    }
  } catch {
    authorDisplayName.value = docStore.docInfo.author
    authorAvatarUrl.value = docStore.docInfo.authorAvatar
  } finally {
    authorLoading.value = false
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(2) + ' MB'
}

onMounted(() => {
  fm.refreshInfo()
  fetchAuthorByUuid()
})

async function refreshInfo() {
  fm.refreshInfo()
  await fetchAuthorByUuid()
}
</script>

<template>
  <h1 class="file-menu-title">{{ $t('wwf.info.title') }}</h1>
  <div class="file-info-layout">
    <div class="file-info-left">
      <div class="file-info-block">
        <div class="file-info-icon file-info-disabled">
          <svg viewBox="0 0 24 24"><path d="M12 17a2 2 0 002-2 2 2 0 00-2-2 2 2 0 00-2 2 2 2 0 002 2m6-9h-1V6a5 5 0 00-5-5 5 5 0 00-5 5v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2M8.9 6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H8.9V6z"/></svg>
          <span>{{ $t('wwf.info.protect') }}</span>
        </div>
        <div class="file-info-text">
          <h3>{{ $t('wwf.info.protect') }}</h3>
          <p>{{ $t('wwf.info.protectDesc') }}</p>
          <p class="file-info-unavailable">{{ $t('wwf.info.unavailable') }}</p>
        </div>
      </div>

      <div class="file-info-block">
        <div class="file-info-icon file-info-disabled">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <span>{{ $t('wwf.info.inspectIcon') }}</span>
        </div>
        <div class="file-info-text">
          <h3>{{ $t('wwf.info.inspect') }}</h3>
          <p>{{ $t('wwf.info.inspectDesc') }}</p>
          <p class="file-info-unavailable">{{ $t('wwf.info.unavailable') }}</p>
        </div>
      </div>

      <div class="file-info-block">
        <div class="file-info-icon file-info-disabled">
          <svg viewBox="0 0 24 24"><path d="M13.5 8H12v5l4.28 2.54.72-1.21-3.5-2.08V8M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 017-7 7 7 0 017 7 7 7 0 01-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 009-9 9 9 0 00-9-9z"/></svg>
          <span>{{ $t('wwf.info.versionHistory') }}</span>
        </div>
        <div class="file-info-text">
          <h3>{{ $t('wwf.info.versionHistory') }}</h3>
          <p>{{ $t('wwf.info.versionHistoryDesc') }}</p>
          <p class="file-info-unavailable">{{ $t('wwf.info.unavailable') }}</p>
        </div>
      </div>

      <div class="file-info-block">
        <div class="file-info-icon file-info-disabled">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6m2 16H8v-2h8v2m0-4H8v-2h8v2m-3-5V3.5L18.5 9H13z"/></svg>
          <span>{{ $t('wwf.info.manageDoc') }}</span>
        </div>
        <div class="file-info-text">
          <h3>{{ $t('wwf.info.manageDoc') }}</h3>
          <p class="file-info-unavailable">{{ $t('wwf.info.unavailable') }}</p>
        </div>
      </div>
    </div>

    <div class="file-info-right">
      <div class="file-info-prop-section">
        <h4>{{ $t('wwf.info.props') }}</h4>
        <div class="file-info-prop-row">
          <span class="file-info-prop-label">{{ $t('wwf.info.size') }}</span>
          <span class="file-info-prop-value">{{ docInfo.size ? formatSize(docInfo.size) : t('wwf.info.calculating') }}</span>
        </div>
        <div class="file-info-prop-row">
          <span class="file-info-prop-label">{{ $t('wwf.info.pages') }}</span>
          <span class="file-info-prop-value">{{ docInfo.pages }}</span>
        </div>
        <div class="file-info-prop-row">
          <span class="file-info-prop-label">{{ $t('wwf.info.words') }}</span>
          <span class="file-info-prop-value">{{ docInfo.words }}</span>
        </div>
        <div class="file-info-prop-row">
          <span class="file-info-prop-label">{{ $t('wwf.info.editTime') }}</span>
          <span class="file-info-prop-value">{{ t('wwf.info.editMinutes', { minutes: 0 }) }}</span>
        </div>
        <div class="file-info-prop-row">
          <span class="file-info-prop-label">{{ $t('wwf.info.titleLabel') }}</span>
          <span class="file-info-prop-value file-info-link">{{ docInfo.title }}</span>
        </div>
        <div class="file-info-prop-row">
          <span class="file-info-prop-label">{{ $t('wwf.info.tags') }}</span>
          <span class="file-info-prop-value file-info-link">{{ $t('wwf.info.addTags') }}</span>
        </div>
        <div class="file-info-prop-row">
          <span class="file-info-prop-label">{{ $t('wwf.info.comments') }}</span>
          <span class="file-info-prop-value file-info-link">{{ $t('wwf.info.addComments') }}</span>
        </div>
      </div>

      <div class="file-info-prop-section">
        <h4>{{ $t('wwf.info.dates') }}</h4>
        <div class="file-info-prop-row">
          <span class="file-info-prop-label">{{ $t('wwf.info.modified') }}</span>
          <span class="file-info-prop-value">{{ $t('wwf.info.notSaved') }}</span>
        </div>
        <div class="file-info-prop-row">
          <span class="file-info-prop-label">{{ $t('wwf.info.created') }}</span>
          <span class="file-info-prop-value">{{ docInfo.created || t('common.today') }}</span>
        </div>
        <div class="file-info-prop-row">
          <span class="file-info-prop-label">{{ $t('wwf.info.lastPrinted') }}</span>
          <span class="file-info-prop-value">{{ $t('wwf.info.neverPrinted') }}</span>
        </div>
      </div>

      <div class="file-info-prop-section">
        <h4>{{ $t('wwf.info.people') }}</h4>
        <div class="file-info-prop-row">
          <span class="file-info-prop-label">{{ $t('wwf.info.author') }}</span>
          <span class="file-info-prop-value">
            <span class="file-info-user">
              <span
                class="file-info-avatar"
                :class="{ 'file-info-avatar-deleted': authorDisplayName === '账号已注销' }"
                :style="authorAvatarUrl ? { backgroundImage: `url(${authorAvatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}"
              >{{ (authorDisplayName || 'W').charAt(0).toUpperCase() }}</span>{{ authorLoading ? t('wwf.info.loading') : (authorDisplayName || t('wwf.info.defaultUser')) }}
            </span>
          </span>
        </div>
        <div class="file-info-prop-row">
          <span class="file-info-prop-label">{{ $t('wwf.info.modifiedBy') }}</span>
          <span class="file-info-prop-value">{{ $t('wwf.info.notSaved') }}</span>
        </div>
      </div>

      <div class="file-info-link" style="font-size:13px;" @click="refreshInfo">{{ $t('wwf.info.refresh') }}</div>
    </div>
  </div>
</template>
