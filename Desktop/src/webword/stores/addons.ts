import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAppStore } from './app'
import i18n from '@/i18n'
import { STATIC_MODE, STATIC_DATA_BASE } from '@/utils/siteMode'

const t = (key: string): string => (i18n.global as any).t(key)

// 加载项脚本目录：静态站点由构建期导出到 public/static/addons（导出时已补 base），
// 本地/自托管走 Express 的 /addons。
const ADDON_BASE = STATIC_MODE
  ? `${STATIC_DATA_BASE}addons/`
  : `${import.meta.env.BASE_URL || '/'}addons/`

export interface AddonMetaItem {
  id: string
  name: string
  version: string
  desc: string
  icon: string
  requires?: string[]
}

export const useAddonStore = defineStore('addons', () => {
  const initialized = ref(false)
  const loading = ref(false)
  const addonList = ref<AddonMetaItem[]>([])
  const activeAddon = ref<string | null>(null)
  const trayButtons = ref<{ id: string; icon: string; label: string; onClick: () => void }[]>([])
  /** Reactive version counter — bumped when _handlers changes, drives loadedAddons reactivity */
  const _handlersVersion = ref(0)
  function _bumpVersion() { _handlersVersion.value++ }

  /** Reflects whether an addon handler is registered (i.e. scripts loaded) */
  function isLoaded(id: string): boolean {
    const ww = (window as any).WebWord
    return !!(ww?.addons?._handlers?.[id])
  }

  /** Number of loaded addons (excluding addon-manager) */
  const loadedCount = computed(() => {
    const ww = (window as any).WebWord
    if (!ww?.addons?._handlers) return 0
    return Object.keys(ww.addons._handlers).filter(k => k !== 'addon-manager').length
  })

  /** Integrity status of an addon */
  function getIntegrity(id: string): string | undefined {
    const ww = (window as any).WebWord
    return ww?.addons?._integrity?.[id]
  }

  // ── Initialize: load addon-manager + populate metadata ──
  async function initialize() {
    if (initialized.value) return
    loading.value = true

    const appStore = useAppStore()

    // 1. Copy addon registry from index.json data into WW.addons._registry
    const ww = (window as any)
    ww.WebWord = ww.WebWord || {}
    ww.WebWord.addons = ww.WebWord.addons || {}
    ww.WebWord.addons._registry = ww.WebWord.addons._registry || {}
    ww.WebWord.addons._basePath = ADDON_BASE

    appStore.setSplashProgress(25, t('wwl.splashLoadingAddonList'))

    // Load addon list from server API (静态站点读取构建期导出的 addons.json)
    try {
      const res = await fetch(STATIC_MODE ? `${STATIC_DATA_BASE}addons.json` : '/api/addons')
      if (res.ok) {
        const data = await res.json()
        for (const item of data.addons || []) {
          addonList.value.push({
            id: item.name,
            name: item.display_name,
            version: item.version || '1.0.0',
            desc: item.description || '',
            icon: item.icon || '',
          })
          // Register in global registry
          // item.filename already has category prefix from server scan (e.g. 'official/constants')
          ww.WebWord.addons._registry[item.name] = {
            fullPath: item.filename,
            files: ['template.js', 'addon.js'],
            name: item.display_name
          }
        }
        // 将动态获取的加载项列表注入全局，供 addon-manager 使用
        ww.WebWord.addons._dynamicAddonMeta = addonList.value
      }
    } catch (e) {
      console.error('Failed to load addon list:', e)
    }

    appStore.setSplashProgress(50, t('wwl.splashLoadingAddonManager'))

    // 2. Load addon-manager scripts (these define handlers, etc.)
    try {
      await loadScript(ADDON_BASE + 'addon-manager/template.js')
      await loadScript(ADDON_BASE + 'addon-manager/addon.js')
    } catch (e) {
      console.error('Failed to load addon-manager:', e)
    }

    // Override addon-manager's addTrayButton/removeTrayButton to use Vue store
    // instead of direct DOM manipulation (prevents conflict with Vue's v-for rendering)
    if (ww.WebWord.addons) {
      const origAdd = ww.WebWord.addons.addTrayButton
      ww.WebWord.addons.addTrayButton = function(addonId: string) {
        // Lookup chain: 1) addon-manager hardcoded meta → 2) Pinia store metadata (from index.json) → 3) registry
        let meta = ww.WebWord.addons.getAddonMeta?.(addonId)
        if (!meta) {
          const storeMeta = getMeta(addonId)
          if (storeMeta) {
            meta = { name: storeMeta.name, icon: storeMeta.icon, version: storeMeta.version, desc: storeMeta.desc }
          }
        }
        if (!meta) meta = ww.WebWord.addons._registry?.[addonId]
        if (!meta) return origAdd?.(addonId)
        const name = meta.name || addonId
        const icon = meta.icon || ''
        if (!trayButtons.value.find(b => b.id === addonId)) {
          trayButtons.value.push({
            id: addonId,
            icon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' + icon + '</svg>',
            label: name,
            onClick: () => toggleAddon(addonId),
          })
        }
      }
      ww.WebWord.addons.removeTrayButton = function(addonId: string) {
        trayButtons.value = trayButtons.value.filter(b => b.id !== addonId)
      }
    }

    appStore.setSplashProgress(90, t('wwl.splashRegisteringAddons'))

    initialized.value = true
    loading.value = false
    _bumpVersion()
    syncTrayFromLoaded()
  }

  // ── Load a script tag and return a promise ──
  function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script')
      const timer = setTimeout(() => {
        reject(new Error('Timeout: ' + src))
      }, 10000)
      el.onload = () => { clearTimeout(timer); resolve() }
      el.onerror = () => { clearTimeout(timer); reject(new Error('Failed: ' + src)) }
      el.src = src
      document.body.appendChild(el)
    })
  }

  // ── Sync tray buttons from global handlers (for page reload) ──
  function syncTrayFromLoaded() {
    const ww = (window as any).WebWord
    if (!ww?.addons?._handlers) return
    const existing = new Set(trayButtons.value.map(b => b.id))
    for (const id of Object.keys(ww.addons._handlers)) {
      if (id === 'addon-manager' || existing.has(id)) continue
      const meta = getMeta(id)
      if (meta) {
        trayButtons.value.push({
          id,
          icon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' + (meta.icon || '') + '</svg>',
          label: meta.name,
          onClick: () => toggleAddon(id),
        })
      }
    }
  }

  // ── Get metadata for an addon ──
  function getMeta(id: string): AddonMetaItem | undefined {
    return addonList.value.find(m => m.id === id)
  }

  // ── Load addon files (template.js + addon.js) via script tags ──
  async function loadAddon(id: string): Promise<void> {
    const ww = (window as any).WebWord
    if (!ww?.addons?.loadAddonFiles) {
      throw new Error('Addon manager not loaded')
    }
    if (ww.addons._handlers?.[id]) return // already loaded
    await ww.addons.loadAddonFiles(id)
    _bumpVersion()
    syncTrayFromLoaded()
    // 通知加载项管理器刷新 UI
    if (ww?.addons?.refreshUI) ww.addons.refreshUI()
  }

  // ── Unload an addon ──
  function unloadAddon(id: string) {
    // addon-manager exposes unload via window._addonTrayUnload (not WW.addons.unloadAddon)
    const unload = (window as any)._addonTrayUnload
    if (typeof unload === 'function') {
      unload(id)
    } else {
      // Fallback: manually close + cleanup via addon-manager's WW.addons.unloadAll or close
      const ww = (window as any).WebWord
      if (ww?.addons?.close) ww.addons.close(id)
      if (ww?.addons?._handlers) delete ww.addons._handlers[id]
      if (ww?.addons?.[id]) delete ww.addons[id]
      // Clean loaded scripts
      if (ww?.addons?._loadedScripts?.[id]) {
        for (const s of ww.addons._loadedScripts[id]) {
          if (s?.parentNode) s.parentNode.removeChild(s)
        }
        delete ww.addons._loadedScripts[id]
      }
      // Clean integrity
      if (ww?.addons?._integrity) delete ww.addons._integrity[id]
      if (ww?.addons?._timeoutCount) delete ww.addons._timeoutCount[id]
    }
    trayButtons.value = trayButtons.value.filter(b => b.id !== id)
    if (activeAddon.value === id) activeAddon.value = null
    _bumpVersion()
    // 通知加载项管理器刷新 UI
    const ww = (window as any).WebWord
    if (ww?.addons?.refreshUI) ww.addons.refreshUI()
  }

  // ── Toggle addon dialog ──
  function toggleAddon(id: string) {
    const ww = (window as any).WebWord
    if (!ww?.addons) return

    const handler = ww.addons._handlers?.[id]
    if (!handler) {
      // Not loaded → try to load first, then activate
      loadAddon(id).then(() => {
        setTimeout(() => {
          // addon-manager exposes toggle via window._addonTrayToggle
          const toggle = (window as any)._addonTrayToggle
          if (typeof toggle === 'function') {
            toggle(id)
          } else {
            ww.addons.activate?.(id)
          }
          activeAddon.value = id
        }, 100)
      }).catch(e => {
        console.error('Failed to load addon:', e)
        if (ww.toast?.error) ww.toast.error(t('wwl.addonLoadFailed'))
      })
      return
    }

    // Toggle via the built-in mechanism
    const toggle = (window as any)._addonTrayToggle
    if (typeof toggle === 'function') {
      toggle(id)
    } else {
      ww.addons.activate?.(id)
    }
    activeAddon.value = activeAddon.value === id ? null : id
  }

  // ── Add/remove tray buttons (for external use) ──
  function addTrayButton(btn: { id: string; icon: string; label: string; onClick: () => void }) {
    if (!trayButtons.value.find(b => b.id === btn.id)) {
      trayButtons.value.push(btn)
    }
  }
  function removeTrayButton(id: string) {
    trayButtons.value = trayButtons.value.filter(b => b.id !== id)
  }

  // ── Dispose: 释放加载项占用的全部内存（WebWord 窗口关闭时调用） ──
  function dispose() {
    const ww = (window as any).WebWord

    // 1. 先让各 addon 执行 close 清理（DOM/事件/定时器），并移除其脚本标签
    try { ww?.addons?.unloadAll?.() } catch (e) { console.error('addons dispose: unloadAll failed', e) }

    // 2. 移除仍挂在 DOM 中的 addon 脚本与样式（含 addon-manager 自身）
    const scripts = document.querySelectorAll('script[src*="/addons/"]')
    for (const s of Array.from(scripts)) s.parentNode?.removeChild(s)
    const styles = document.querySelectorAll('link[rel="stylesheet"][href*="/addons/"]')
    for (const l of Array.from(styles)) l.parentNode?.removeChild(l)

    // 3. 移除残留的 addon 弹层 DOM（overlay/dialog 直接挂在 body 上）
    const leftovers = document.querySelectorAll('.addonmgr-overlay, .addonmgr-modal')
    for (const n of Array.from(leftovers)) n.parentNode?.removeChild(n)

    // 4. 删除 window.WebWord 上的加载项全局状态与辅助入口
    if (ww?.WebWord?.addons) delete ww.WebWord.addons
    if (ww?.WebWord && Object.keys(ww.WebWord).length === 0) delete ww.WebWord
    delete (window as any)._addonTrayToggle
    delete (window as any)._addonTrayUnload

    // 5. 重置 store，使下次打开可重新初始化
    initialized.value = false
    loading.value = false
    addonList.value = []
    activeAddon.value = null
    trayButtons.value = []
    _bumpVersion()
  }

  // ── Loaded addons (handlers registered) as [id, meta] tuples ──
  const loadedAddons = computed<[string, AddonMetaItem][]>(() => {
    void _handlersVersion.value // reactively depend on version counter
    const ww = (window as any).WebWord
    const handlers = ww?.addons?._handlers
    if (!handlers) return []
    const result: [string, AddonMetaItem][] = []
    for (const id of Object.keys(handlers)) {
      if (id === 'addon-manager') continue
      const meta = getMeta(id)
      if (meta) result.push([id, meta])
    }
    return result
  })

  return {
    initialized, loading, addonList, activeAddon, trayButtons,
    loadedAddons,
    isLoaded, loadedCount, getIntegrity, getMeta,
    initialize, loadAddon, unloadAddon, toggleAddon,
    addTrayButton, removeTrayButton, dispose,
  }
})
