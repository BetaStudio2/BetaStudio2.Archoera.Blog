import { createI18n } from 'vue-i18n'
import zhCommon from './locales/zh-CN/common'
import zhDesktop from './locales/zh-CN/desktop'
import zhSettings from './locales/zh-CN/settings'
import zhBlog from './locales/zh-CN/blog'
import zhWwComponents from './locales/zh-CN/ww-components'
import zhWwFilemenu from './locales/zh-CN/ww-filemenu'
import zhWwLogic from './locales/zh-CN/ww-logic'
import enCommon from './locales/en-US/common'
import enDesktop from './locales/en-US/desktop'
import enSettings from './locales/en-US/settings'
import enBlog from './locales/en-US/blog'
import enWwComponents from './locales/en-US/ww-components'
import enWwFilemenu from './locales/en-US/ww-filemenu'
import enWwLogic from './locales/en-US/ww-logic'

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
}

const STORAGE_KEY = 'desktop_locale'

function detectLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) {
      return saved as SupportedLocale
    }
    const nav = (navigator.language || '').toLowerCase()
    return nav.startsWith('zh') ? 'zh-CN' : 'en-US'
  } catch {
    return 'zh-CN'
  }
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': {
      ...zhCommon,
      ...zhDesktop,
      ...zhSettings,
      ...zhBlog,
      ...zhWwComponents,
      ...zhWwFilemenu,
      ...zhWwLogic,
    },
    'en-US': {
      ...enCommon,
      ...enDesktop,
      ...enSettings,
      ...enBlog,
      ...enWwComponents,
      ...enWwFilemenu,
      ...enWwLogic,
    },
  },
})

/** Switch the active locale and persist the choice. */
export function setLocale(locale: SupportedLocale) {
  i18n.global.locale.value = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch { /* ignore */ }
  document.documentElement.lang = locale
}

// Keep <html lang> in sync on startup
document.documentElement.lang = i18n.global.locale.value

// 跨框架语言同步：博客 / WebWord 以同源 iframe 整页加载，会各自生成独立 i18n 实例。
// 桌面端切换语言写入 localStorage 时，iframe 内会触发 storage 事件，据此同步本地 locale。
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return
    if ((SUPPORTED_LOCALES as readonly string[]).includes(e.newValue)) {
      i18n.global.locale.value = e.newValue as SupportedLocale
      document.documentElement.lang = e.newValue
    }
  })
}

export default i18n
