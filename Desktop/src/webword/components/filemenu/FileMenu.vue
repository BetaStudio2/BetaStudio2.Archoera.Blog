<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/webword/stores/app'
import { useDocumentStore } from '@/webword/stores/document'
import { useRecentDocs } from '@/webword/composables/useRecentDocs'
import StartPage from './StartPage.vue'
import NewPage from './NewPage.vue'
import OpenPage from './OpenPage.vue'
import InfoPage from './InfoPage.vue'
import SavePage from './SavePage.vue'
import SaveAsPage from './SaveAsPage.vue'
import PrintPage from './PrintPage.vue'
import ExportPage from './ExportPage.vue'
import OptionsPage from './OptionsPage.vue'
import AccountPage from './AccountPage.vue'
import { asset } from '@/utils/siteMode'
import { restoreWallpaper } from '@/webword/composables/useKonamiEgg'

const appStore = useAppStore()
const docStore = useDocumentStore()
const { addRecentDoc } = useRecentDocs()
const { t } = useI18n()

const visible = ref(false)
const currentPage = ref('start')
const switching = ref(false)
const highlighterTop = ref('0px')

const docClosed = computed(() => docStore.docClosed)

interface NavItem {
  page: string
  label: string
  needsDoc: boolean
}

const navItems: NavItem[] = [
  { page: 'start', label: t('wwf.navStart'), needsDoc: false },
  { page: 'new', label: t('common.new'), needsDoc: false },
  { page: 'open', label: t('common.open'), needsDoc: false },
  { page: 'info', label: t('wwf.navInfo'), needsDoc: true },
  { page: 'save', label: t('common.save'), needsDoc: true },
  { page: 'saveAs', label: t('common.saveAs'), needsDoc: true },
  { page: 'print', label: t('common.print'), needsDoc: true },
  { page: 'share', label: t('common.share'), needsDoc: true },
  { page: 'export', label: t('common.export'), needsDoc: true },
  { page: 'close', label: t('common.close'), needsDoc: true },
]

// 底部导航：账户 + 选项（站点无登录态，账户页展示「默认账户」）
const bottomNavItems: NavItem[] = [
  { page: 'account', label: t('wwf.navAccount'), needsDoc: false },
  { page: 'options', label: t('wwf.navOptions'), needsDoc: false },
]

const visibleNavItems = computed(() => navItems)

const leavingPage = ref('')
const enteringPage = ref('')

function showPageClass(page: string) {
  return {
    // Keep active while leaving so the leaving animation can play
    active: (currentPage.value === page && !switching.value) || leavingPage.value === page,
    'page-entering': enteringPage.value === page,
    'page-leaving': leavingPage.value === page,
  }
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 9) return t('wwf.greetingMorningEarly')
  if (hour >= 9 && hour < 12) return t('wwf.greetingMorning')
  if (hour >= 12 && hour < 14) return t('wwf.greetingNoon')
  if (hour >= 14 && hour < 18) return t('wwf.greetingAfternoon')
  return t('wwf.greetingEvening')
}

const greeting = ref(getGreeting())

function show() {
  greeting.value = getGreeting()
  visible.value = true
  // Use nextTick to ensure the v-if DOM is inserted, then force reflow
  // before adding .show class — this is the same pattern as original
  // `void fileMenuOverlay.offsetWidth; fileMenuOverlay.classList.add('show')`
  nextTick(() => {
    const overlay = document.getElementById('fileMenuOverlay')
    if (overlay) {
      // Ensure no stale hide class
      overlay.classList.remove('hide')
      // Force reflow so browser registers initial state (opacity:0)
      void overlay.offsetWidth
      // Add show class directly (bypass Vue to avoid timing issues)
      overlay.classList.add('show')
      // 若 Konami 彩蛋已换过壁纸，重新挂载后需要还原背景
      restoreWallpaper(overlay)
    }
    // Defer highlighter move until after show class is applied
    nextTick(() => moveHighlighter(currentPage.value))
  })
}

function hide() {
  const overlay = document.getElementById('fileMenuOverlay')
  if (overlay) {
    overlay.classList.remove('show')
    overlay.classList.add('hide')
  }
  appStore.hideFileMenu()
  setTimeout(() => {
    visible.value = false
    // Clean up classes after hide animation completes
    const overlay = document.getElementById('fileMenuOverlay')
    if (overlay) overlay.classList.remove('hide')
  }, 260)
}

// Watch store-managed fileMenuVisible
watch(() => appStore.fileMenuVisible, (val) => {
  if (val) show()
  else if (visible.value) hide()
})

// When document is closed, force back to 'start' if on a doc-dependent page
watch(() => docStore.docClosed, (closed) => {
  if (closed) {
    const needsDoc = navItems.filter(n => n.needsDoc).map(n => n.page)
    if (needsDoc.includes(currentPage.value)) {
      currentPage.value = 'start'
    }
  }
})

function showPage(page: string) {
  if (switching.value) return
  if (page === currentPage.value) return

  switching.value = true
  moveHighlighter(page)

  // Mark current page as leaving — showPageClass will apply 'page-leaving' class
  leavingPage.value = currentPage.value

  // Wait for Vue to apply the 'page-leaving' class to the leaving element
  nextTick(() => {
    const leavingEl = document.querySelector('.file-menu-content.page-leaving') as HTMLElement | null
    if (leavingEl) {
      const onLeaveEnd = () => {
        leavingEl.removeEventListener('animationend', onLeaveEnd)
        // Now switch to target page
        activateTargetPage(page)
      }
      leavingEl.addEventListener('animationend', onLeaveEnd, { once: true })
      // Fallback (filePageOut is 0.1s = 100ms)
      setTimeout(() => {
        if (leavingPage.value) {
          leavingEl.removeEventListener('animationend', onLeaveEnd)
          activateTargetPage(page)
        }
      }, 130)
    } else {
      activateTargetPage(page)
    }
  })
}

function activateTargetPage(page: string) {
  // Switch current page — Vue updates v-if and showPageClass
  currentPage.value = page
  leavingPage.value = ''
  // Mark entering — showPageClass will apply 'page-entering' class
  enteringPage.value = page

  // Find the entering element to listen for its animationend
  nextTick(() => {
    const targetEl = document.querySelector('.file-menu-content.page-entering') as HTMLElement | null
    if (!targetEl) {
      enteringPage.value = ''
      switching.value = false
      return
    }
    const onEnterEnd = () => {
      targetEl.removeEventListener('animationend', onEnterEnd)
      enteringPage.value = ''
      switching.value = false
    }
    targetEl.addEventListener('animationend', onEnterEnd, { once: true })
    // Fallback (filePageIn is 0.18s = 180ms)
    setTimeout(() => {
      if (enteringPage.value) {
        targetEl.removeEventListener('animationend', onEnterEnd)
        enteringPage.value = ''
        switching.value = false
      }
    }, 220)
  })
}

function moveHighlighter(pageId: string) {
  nextTick(() => {
    const targetItem = document.querySelector(`.file-menu-nav-item[data-page="${pageId}"]`)
    if (!targetItem) return
    const sidebar = document.querySelector('.file-menu-sidebar')
    if (!sidebar) return
    const sidebarRect = sidebar.getBoundingClientRect()
    const itemRect = targetItem.getBoundingClientRect()
    const top = itemRect.top - sidebarRect.top + (targetItem.clientHeight - 24) / 2
    highlighterTop.value = top + 'px'
  })
}

function handleNavClick(page: string) {
  if (page === 'close') {
    docStore.docDirty = false
    docStore.closeDocument()
    hide()
    return
  }
  if (page === 'share') {
    hide()
    setTimeout(() => { appStore.showShareModal() }, 300)
    return
  }
  showPage(page)
}

function handleBack() {
  hide()
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) hide()
}

function handleNewDocument() {
  addRecentDoc(t('wwf.tplBlank'), 'blank')
  docStore.newDocument()
  hide()
}

const templateScripts: Record<string, { url: string; size: number }> = {
  'introduction': { url: asset('/templates/features/introduction/introduction.js'), size: 0.015 },
  'welcome': { url: asset('/templates/features/welcome/welcome.js'), size: 0.02 },
  'resume': { url: asset('/templates/features/resume/resume.js'), size: 0.025 },
  'report': { url: asset('/templates/features/report/report.js'), size: 0.03 },
  'meeting': { url: asset('/templates/features/meeting/meeting.js'), size: 0.028 },
  'proposal': { url: asset('/templates/features/proposal/proposal.js'), size: 0.032 },
  'notes': { url: asset('/templates/features/notes/notes.js'), size: 0.022 },
  'weekreport': { url: asset('/templates/features/weekreport/weekreport.js'), size: 0.026 },
  'contract': { url: asset('/templates/features/contract/contract.js'), size: 0.035 },
  'coverletter': { url: asset('/templates/features/coverletter/coverletter.js'), size: 0.018 },
  'invitation': { url: asset('/templates/features/invitation/invitation.js'), size: 0.02 },
  'prd': { url: asset('/templates/features/prd/prd.js'), size: 0.04 },
  'blog': { url: asset('/templates/features/blog/blog.js'), size: 0.02 },
  'press': { url: asset('/templates/features/press/press.js'), size: 0.02 },
  'diary': { url: asset('/templates/features/diary/diary.js'), size: 0.02 },
  'travel': { url: asset('/templates/features/travel/travel.js'), size: 0.02 },
  'designscheme': { url: asset('/templates/features/designscheme/data_1.0/designscheme.js'), size: 0.06 },
}

function handleOpenTemplate(key: string) {
  addRecentDoc(getTemplateTitle(key) || key, key)
  if (key === 'welcome') {
    openTemplate('welcome')
    return
  }
  openTemplate(key)
}

function openTemplate(key: string) {
  const scriptInfo = templateScripts[key]
  if (!scriptInfo) {
    handleNewDocument()
    return
  }

  const LARGE_FILE_THRESHOLD = 0.5

  function doOpen() {
    docStore.docDirty = true
    docStore.docClosed = false
    docStore.showOpeningProgress()

    const w = window as any
    if (w.BINDER) delete w.BINDER[key]

    const script = document.createElement('script')
    script.src = scriptInfo.url + '?v=' + Date.now()
    script.onload = () => {
      const html = w.BINDER?.[key] || ''
      docStore.setContent(html)
      docStore.updateStatus({ title: getTemplateTitle(key) })

      if (w.BINDER) delete w.BINDER[key]
      document.body.removeChild(script)

      docStore.hideOpeningProgress()
      appStore.setActiveTab('start')
      hide()
    }
    script.onerror = () => {
      docStore.setContent('')
      if (document.body.contains(script)) document.body.removeChild(script)
      docStore.hideOpeningProgress()
      appStore.setActiveTab('start')
      hide()
    }
    document.body.appendChild(script)
  }

  if (scriptInfo.size > LARGE_FILE_THRESHOLD) {
    appStore.showLargeFileModal(scriptInfo.size)
    doOpen()
  } else {
    doOpen()
  }
}

function getTemplateTitle(key: string): string {
  const titles: Record<string, string> = {
    'introduction': t('wwf.tplIntroduction'),
    'welcome': t('wwf.tplWelcome'),
    'resume': t('wwf.tplResume'),
    'report': t('wwf.tplReport'),
    'meeting': t('wwf.tplMeeting'),
    'proposal': t('wwf.tplProposal'),
    'notes': t('wwf.tplNotes'),
    'weekreport': t('wwf.tplWeekreport'),
    'contract': t('wwf.tplContract'),
    'coverletter': t('wwf.tplCoverletter'),
    'invitation': t('wwf.tplInvitation'),
    'prd': t('wwf.tplPrd'),
    'blog': t('wwf.tplBlog'),
    'press': t('wwf.tplPress'),
    'diary': t('wwf.tplDiary'),
    'travel': t('wwf.tplTravel'),
    'designscheme': t('wwf.tplDesignscheme'),
  }
  return titles[key] || t('wwf.untitledDoc')
}

defineExpose({ show, hide, showPage, handleNewDocument })

const contentAreaClass = computed(() => ({
  'fm-page-new': currentPage.value === 'new',
  'fm-page-start': currentPage.value === 'start',
}))

</script>

<template>
  <div
    v-if="visible"
    id="fileMenuOverlay"
    class="file-menu-overlay"
    @click="handleOverlayClick"
  >
    <div class="file-menu-container">
      <div class="file-menu-sidebar">
        <div class="file-menu-back" @click="handleBack">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <template v-for="item in visibleNavItems" :key="item.page">
          <div
            v-if="item.page === 'info'"
            class="file-menu-separator"
          ></div>
          <div
            class="file-menu-nav-item"
            :class="{
              active: currentPage === item.page,
              'nav-needs-doc': item.needsDoc,
              'nav-disabled': item.needsDoc && docClosed,
            }"
            :data-page="item.page"
            @click="handleNavClick(item.page)"
          >
            {{ item.label }}
          </div>
        </template>

        <div class="file-menu-sidebar-bottom">
          <div class="file-menu-separator"></div>
          <div
            v-for="item in bottomNavItems"
            :key="item.page"
            class="file-menu-nav-item"
            :class="{
              active: currentPage === item.page,
              'nav-needs-doc': item.needsDoc,
              'nav-disabled': item.needsDoc && docClosed,
            }"
            :data-page="item.page"
            @click="handleNavClick(item.page)"
          >
            {{ item.label }}
          </div>
        </div>

        <div
          class="file-menu-nav-highlighter"
          :style="{ top: highlighterTop }"
        ></div>
      </div>

      <div class="file-menu-content-area" :class="contentAreaClass">
        <!-- Start Page -->
        <div id="fileMenuStart" class="file-menu-content" :class="showPageClass('start')">
          <StartPage
            v-if="currentPage === 'start' || leavingPage === 'start'"
            :greeting="greeting"
            @new-document="handleNewDocument"
            @open-template="handleOpenTemplate"
          />
        </div>

        <!-- New Page -->
        <div id="fileMenuNew" class="file-menu-content" :class="showPageClass('new')">
          <NewPage
            v-if="currentPage === 'new' || leavingPage === 'new'"
            @new-document="handleNewDocument"
            @open-template="handleOpenTemplate"
            @hide-menu="hide"
          />
        </div>

        <!-- Open Page -->
        <div id="fileMenuOpen" class="file-menu-content" :class="showPageClass('open')">
          <OpenPage
            v-if="currentPage === 'open' || leavingPage === 'open'"
            @open-document="handleNewDocument"
            @new-document="handleNewDocument"
            @open-template="handleOpenTemplate"
            @hide-menu="hide"
          />
        </div>

        <!-- Info Page -->
        <div id="fileMenuInfo" class="file-menu-content" :class="showPageClass('info')">
          <InfoPage
            v-if="currentPage === 'info' || leavingPage === 'info'"
          />
        </div>

        <!-- Save Page -->
        <div id="fileMenuSave" class="file-menu-content" :class="showPageClass('save')">
          <SavePage
            v-if="currentPage === 'save' || leavingPage === 'save'"
            @hide-menu="hide"
          />
        </div>

        <!-- SaveAs Page -->
        <div id="fileMenuSaveAs" class="file-menu-content" :class="showPageClass('saveAs')">
          <SaveAsPage
            v-if="currentPage === 'saveAs' || leavingPage === 'saveAs'"
            @hide-menu="hide"
          />
        </div>

        <!-- Print Page -->
        <div id="fileMenuPrint" class="file-menu-content" :class="showPageClass('print')">
          <PrintPage
            v-if="currentPage === 'print' || leavingPage === 'print'"
          />
        </div>

        <!-- Export Page -->
        <div id="fileMenuExport" class="file-menu-content" :class="showPageClass('export')">
          <ExportPage
            v-if="currentPage === 'export' || leavingPage === 'export'"
            @hide-menu="hide"
          />
        </div>

        <!-- Account Page -->
        <div id="fileMenuAccount" class="file-menu-content" :class="showPageClass('account')">
          <AccountPage
            v-if="currentPage === 'account' || leavingPage === 'account'"
          />
        </div>

        <!-- Options Page -->
        <div id="fileMenuOptions" class="file-menu-content" :class="showPageClass('options')">
          <OptionsPage
            v-if="currentPage === 'options' || leavingPage === 'options'"
          />
        </div>
      </div>
    </div>
  </div>
</template>
