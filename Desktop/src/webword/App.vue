<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/webword/stores/app'
import { useDocumentStore } from '@/webword/stores/document'
import { useAddonStore } from '@/webword/stores/addons'
import SplashScreen from './components/layout/SplashScreen.vue'
import TitleBar from './components/layout/TitleBar.vue'
import Tabs from './components/layout/Tabs.vue'
import Ribbon from './components/layout/Ribbon.vue'
import Sidebar from './components/layout/Sidebar.vue'
import Workspace from './components/layout/Workspace.vue'
import StatusBar from './components/layout/StatusBar.vue'
import FileMenu from './components/filemenu/FileMenu.vue'
import AboutModal from './components/modal/AboutModal.vue'
import UnsavedModal from './components/modal/UnsavedModal.vue'
import LargeFileModal from './components/modal/LargeFileModal.vue'
import ShareModal from './components/modal/ShareModal.vue'
import ToastContainer from './components/toast/ToastContainer.vue'
import TaskView from './components/taskview/TaskView.vue'
import { useExport } from './composables/useExport.ts'

const appStore = useAppStore()
const docStore = useDocumentStore()
const addonStore = useAddonStore()
const { t } = useI18n()
const { exportAsPDF, exportAsHTML, exportAsPNG } = useExport()

const showSplash = computed(() => appStore.splashVisible)
const showApp = computed(() => !appStore.splashVisible)

const mainClasses = computed(() => ({
  collapsed: appStore.collapsed,
}))

const appClasses = computed(() => ({
  'splash-app': true,
  'show': appStore.ready && showApp.value,
  'ribbon-hidden': !appStore.ribbonExpanded,
  'doc-closed': docStore.docClosed,
}))

const showAbout = computed(() => appStore.aboutModalVisible)

onMounted(async () => {
  await addonStore.initialize()
  appStore.setSplashProgress(100, t('wwl.startupComplete'))
})
</script>

<template>
  <SplashScreen v-if="showSplash" />

  <div v-if="showApp" class="app" :class="appClasses">
    <TitleBar />
    <Tabs />
    <Ribbon />

    <main id="main" class="main" :class="mainClasses">
      <Sidebar />
      <Workspace />
    </main>

    <StatusBar />
  </div>

  <!-- FileMenu overlay -->
  <FileMenu v-if="showApp" />

  <!-- Modal components -->
  <AboutModal :visible="showAbout" @update:visible="(v) => { if (!v) appStore.hideAboutModal() }" />
  <UnsavedModal
    :visible="appStore.unsavedModalVisible"
    @save="appStore.hideUnsavedModal()"
    @dont-save="appStore.hideUnsavedModal()"
    @cancel="appStore.hideUnsavedModal()"
  />
  <LargeFileModal
    :visible="appStore.largeFileModalVisible"
    :size-m-b="appStore.largeFileSizeMB"
    @continue="appStore.hideLargeFileModal()"
    @cancel="appStore.hideLargeFileModal()"
  />
  <ShareModal
    :visible="appStore.shareModalVisible"
    @export-pdf="exportAsPDF(); appStore.hideShareModal()"
    @export-png="exportAsPNG(); appStore.hideShareModal()"
    @export-html="exportAsHTML(); appStore.hideShareModal()"
    @cancel="appStore.hideShareModal()"
  />

  <!-- Task view -->
  <TaskView v-if="showApp" />

  <!-- Toast container -->
  <ToastContainer v-if="showApp" />
</template>
