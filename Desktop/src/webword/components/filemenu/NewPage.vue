<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  (e: 'new-document'): void
  (e: 'open-template', key: string): void
  (e: 'hide-menu'): void
}>()

const { t } = useI18n()

const searchQuery = ref('')

interface TemplateItem {
  id: string
  name: string
  desc: string
  thumbClass: string
  binderKey: string
  icon: string
}

const templates: TemplateItem[] = [
  { id: 'blank', name: t('wwf.tplBlank'), desc: t('wwf.tplBlankDesc'), thumbClass: '', binderKey: '', icon: '📄' },
  { id: 'resume', name: t('wwf.tplResume'), desc: t('wwf.tplResumeDesc'), thumbClass: 'file-template-resume', binderKey: 'resume', icon: '📋' },
  { id: 'report', name: t('wwf.tplReport'), desc: t('wwf.tplReportDesc'), thumbClass: 'file-template-report', binderKey: 'report', icon: '📊' },
  { id: 'meeting', name: t('wwf.tplMeeting'), desc: t('wwf.tplMeetingDesc'), thumbClass: 'file-template-meeting', binderKey: 'meeting', icon: '📝' },
  { id: 'proposal', name: t('wwf.tplProposal'), desc: t('wwf.tplProposalDesc'), thumbClass: 'file-template-proposal', binderKey: 'proposal', icon: '📐' },
  { id: 'notes', name: t('wwf.tplNotes'), desc: t('wwf.tplNotesDesc'), thumbClass: 'file-template-notes', binderKey: 'notes', icon: '📓' },
  { id: 'weekreport', name: t('wwf.tplWeekreport'), desc: t('wwf.tplWeekreportDesc'), thumbClass: 'file-template-weekreport', binderKey: 'weekreport', icon: '📅' },
  { id: 'contract', name: t('wwf.tplContract'), desc: t('wwf.tplContractDesc'), thumbClass: 'file-template-contract', binderKey: 'contract', icon: '📜' },
  { id: 'coverletter', name: t('wwf.tplCoverletter'), desc: t('wwf.tplCoverletterDesc'), thumbClass: 'file-template-coverletter', binderKey: 'coverletter', icon: '✉️' },
  { id: 'invitation', name: t('wwf.tplInvitation'), desc: t('wwf.tplInvitationDesc'), thumbClass: 'file-template-invitation', binderKey: 'invitation', icon: '💌' },
  { id: 'prd', name: t('wwf.tplPrd'), desc: t('wwf.tplPrdDesc'), thumbClass: 'file-template-prd', binderKey: 'prd', icon: '📋' },
  { id: 'blog', name: t('wwf.tplBlog'), desc: t('wwf.tplBlogDesc'), thumbClass: 'file-template-blog', binderKey: 'blog', icon: '📰' },
  { id: 'press', name: t('wwf.tplPress'), desc: t('wwf.tplPressDesc'), thumbClass: 'file-template-press', binderKey: 'press', icon: '📢' },
  { id: 'diary', name: t('wwf.tplDiary'), desc: t('wwf.tplDiaryDesc'), thumbClass: 'file-template-diary', binderKey: 'diary', icon: '📖' },
  { id: 'travel', name: t('wwf.tplTravel'), desc: t('wwf.tplTravelDesc'), thumbClass: 'file-template-travel', binderKey: 'travel', icon: '✈️' },
]

const filteredTemplates = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return templates
  return templates.filter(t =>
    t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
  )
})

function getCardClass(t: TemplateItem) {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return ''
  if (t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)) return 'highlight'
  return 'dim'
}

function handleTemplateClick(template: TemplateItem) {
  if (template.id === 'blank') {
    emit('new-document')
  } else if (template.binderKey) {
    emit('open-template', template.binderKey)
  }
}
</script>

<template>
  <h1 class="file-menu-title">{{ $t('common.new') }}</h1>
  <input
    type="text"
    class="file-search-bar"
    v-model="searchQuery"
    :placeholder="$t('wwf.searchTemplates')"
  >
  <div class="file-template-grid">
    <div
      v-for="tpl in filteredTemplates"
      :key="tpl.id"
      class="file-template-card"
      :class="getCardClass(tpl)"
      @click="handleTemplateClick(tpl)"
    >
      <div class="file-template-thumb" :class="tpl.thumbClass"></div>
      <div class="file-template-name">{{ tpl.name }}</div>
    </div>
  </div>
</template>
