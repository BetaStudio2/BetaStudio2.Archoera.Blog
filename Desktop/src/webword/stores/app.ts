import { defineStore } from 'pinia'
import { ref } from 'vue'
import i18n from '@/i18n'

const t = (key: string): string => (i18n.global as any).t(key)

export const useAppStore = defineStore('app', () => {
  const ready = ref(false)
  const splashVisible = ref(true)
  const splashProgress = ref(0)
  const splashText = ref<string>(t('wwl.starting'))
  const ribbonExpanded = ref(true)
  const collapsed = ref(false)
  const activeTab = ref('start')
  const fileMenuVisible = ref(false)
  const unsavedModalVisible = ref(false)
  const largeFileModalVisible = ref(false)
  const largeFileSizeMB = ref(0)
  const shareModalVisible = ref(false)
  const aboutModalVisible = ref(false)
  const taskViewVisible = ref(false)

  function toggleTaskView() { taskViewVisible.value = !taskViewVisible.value }
  function setReady(val: boolean) { ready.value = val }
  function setSplashProgress(progress: number, text?: string) {
    const clamped = Math.min(progress, 100)
    splashProgress.value = Math.max(splashProgress.value, clamped)
    if (text) splashText.value = text
  }
  function hideSplash() { splashVisible.value = false }
  function toggleRibbon() { ribbonExpanded.value = !ribbonExpanded.value }
  function setCollapsed(val: boolean) { collapsed.value = val }
  function setActiveTab(val: string) { activeTab.value = val }
  function showFileMenu() { fileMenuVisible.value = true }
  function hideFileMenu() { fileMenuVisible.value = false }
  function toggleFileMenu() { fileMenuVisible.value = !fileMenuVisible.value }
  function showUnsavedModal() { unsavedModalVisible.value = true }
  function hideUnsavedModal() { unsavedModalVisible.value = false }
  function showLargeFileModal(sizeMB: number) {
    largeFileSizeMB.value = sizeMB
    largeFileModalVisible.value = true
  }
  function hideLargeFileModal() { largeFileModalVisible.value = false }
  function showShareModal() { shareModalVisible.value = true }
  function hideShareModal() { shareModalVisible.value = false }
  function showAboutModal() { aboutModalVisible.value = true }
  function hideAboutModal() { aboutModalVisible.value = false }

  /** 释放 UI 状态：恢复到初始启动状态（窗口关闭时调用） */
  function dispose() {
    ready.value = false
    splashVisible.value = true
    splashProgress.value = 0
    splashText.value = t('wwl.starting')
    ribbonExpanded.value = true
    collapsed.value = false
    activeTab.value = 'start'
    fileMenuVisible.value = false
    unsavedModalVisible.value = false
    largeFileModalVisible.value = false
    largeFileSizeMB.value = 0
    shareModalVisible.value = false
    aboutModalVisible.value = false
    taskViewVisible.value = false
  }

  return {
    ready, splashVisible, splashProgress, splashText, ribbonExpanded, collapsed, activeTab, fileMenuVisible,
    unsavedModalVisible, largeFileModalVisible, largeFileSizeMB, shareModalVisible,
    aboutModalVisible, taskViewVisible,
    toggleTaskView,
    setReady, setSplashProgress, hideSplash, toggleRibbon, setCollapsed, setActiveTab,
    showFileMenu, hideFileMenu, toggleFileMenu,
    showUnsavedModal, hideUnsavedModal, showLargeFileModal, hideLargeFileModal,
    showShareModal, hideShareModal, showAboutModal, hideAboutModal, dispose
  }
})
