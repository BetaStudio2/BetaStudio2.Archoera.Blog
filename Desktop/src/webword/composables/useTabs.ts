import { reactive } from 'vue'
import { useAppStore } from '@/webword/stores/app'
import i18n from '@/i18n'

const t = (key: string): string => (i18n.global as any).t(key)

export function useTabs() {
  const appStore = useAppStore()

  const tabs = [
    { id: 'start', label: t('wwl.tabStart'), icon: 'bx-home', ribbonGroup: 'home' },
    { id: 'insert', label: t('wwl.tabInsert'), icon: 'bx-plus-circle', ribbonGroup: 'insert' },
    { id: 'design', label: t('wwl.tabDesign'), icon: 'bx-paint', ribbonGroup: 'design' },
    { id: 'layout', label: t('wwl.tabLayout'), icon: 'bx-grid-alt', ribbonGroup: 'layout' },
    { id: 'references', label: t('wwl.tabReferences'), icon: 'bx-bookmark', ribbonGroup: 'references' },
    { id: 'mailings', label: t('wwl.tabMailings'), icon: 'bx-mail-send', ribbonGroup: 'mailings' },
    { id: 'review', label: t('wwl.tabReview'), icon: 'bx-check-shield', ribbonGroup: 'review' },
    { id: 'view', label: t('wwl.tabView'), icon: 'bx-show-alt', ribbonGroup: 'view' },
    { id: 'addons', label: t('wwl.tabAddons'), icon: 'bx-puzzle', ribbonGroup: 'addons' }
  ] as const

  type TabId = typeof tabs[number]['id']

  const ribbonGroups = reactive<Record<string, boolean>>({
    home: true,
    insert: false,
    design: false,
    layout: false,
    references: false,
    mailings: false,
    review: false,
    view: false,
    addons: false
  })

  function switchTo(tabId: TabId | string) {
    appStore.setActiveTab(tabId)
    // show corresponding ribbon group
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      for (const key of Object.keys(ribbonGroups)) {
        ribbonGroups[key] = false
      }
      ribbonGroups[tab.ribbonGroup] = true
    }
  }

  function activateTab(tabId: TabId | string) {
    switchTo(tabId)
  }

  function toggleRibbonGroup(group: string) {
    ribbonGroups[group] = !ribbonGroups[group]
  }

  function showRibbonGroup(group: string) {
    for (const key of Object.keys(ribbonGroups)) {
      ribbonGroups[key] = false
    }
    if (group in ribbonGroups) {
      ribbonGroups[group] = true
    }
  }

  return {
    tabs, ribbonGroups,
    switchTo, activateTab, toggleRibbonGroup, showRibbonGroup
  }
}
