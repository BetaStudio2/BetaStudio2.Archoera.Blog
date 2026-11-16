export interface AddonMeta {
  id: string
  name: string
  version: string
  desc: string
  icon: string
  requires?: {
    secure?: boolean
    bluetooth?: boolean
    serial?: boolean
    usb?: boolean
    hid?: boolean
    geolocation?: boolean
  }
}

export interface AddonHandler {
  activate: () => void
  close: () => void
  isActive: () => boolean
}

export interface AddonRegistryEntry {
  fullPath: string
  files: string[]
  name: string
}

export interface AddonIntegrity {
  [addonId: string]: 'ok' | 'corrupt' | 'timeout' | 'timeout2' | 'timeoutN'
}

export interface DocumentInfo {
  size: number
  words: number
  pages: number
  created: string
  title: string
  author: string
  authorUuid: string | null
  authorAvatar: string | null
}

export interface TemplateInfo {
  id: string
  name: string
  desc: string
  icon: string
  size: number
  path: string
  binderKey: string
}

export interface SearchItem {
  id: string
  title: string
  desc: string
  type: 'addon' | 'tool' | 'nav'
  addonId?: string
  loaded?: boolean
  icon?: string
  action?: string
  _pinyin?: { full: string; initials: string }
}

export interface PerfData {
  fps: number
  fpsMin: number
  fps1Low: number
  cpu: number
  gpu: number
  domCount: number
  jsHeap: number
  navigation: { dns: number; tcp: number; ttfb: number; load: number }
  paint: { fp: number; fcp: number; lcp: number }
  longTasks: number
}

export interface ToastType {
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
  duration?: number
}
