import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export interface WindowState {
  id: string
  title: string
  width: number
  height: number
  x: number
  y: number
  zIndex: number
  minimized: boolean
  maximized: boolean
  icon: string // 'webword' | 'blog' | 'explorer' | 'browser' | 'addons' | 'settings'
  url: string  // iframe src
  /** 最小化目标位置（相对于窗口当前位置的偏移和缩放），用于收缩到任务栏动画 */
  minimizeTarget?: { dx: number; dy: number; scale: number }
  /** 关闭中（动画播放中，完成后才从数组移除） */
  closing?: boolean
}

export const useWindowsStore = defineStore('windows', () => {
  const windows = reactive<WindowState[]>([])
  const nextZIndex = ref(100)

  function open(props: {
    id: string
    title: string
    icon: WindowState['icon']
    url: string
    width?: number
    height?: number
  }) {
    const existing = windows.find(w => w.id === props.id)
    if (existing) {
      // Bring to front
      if (existing.minimized) existing.minimized = false
      bringToFront(existing.id)
      return existing
    }

    // Cascade position
    const baseX = 60 + windows.length * 30
    const baseY = 40 + windows.length * 30

    const win: WindowState = reactive({
      id: props.id,
      title: props.title,
      icon: props.icon,
      url: props.url,
      width: props.width ?? 960,
      height: props.height ?? 640,
      x: Math.min(baseX, 200),
      y: Math.min(baseY, 120),
      zIndex: nextZIndex.value++,
      minimized: false,
      maximized: false
    })

    windows.push(win)
    return win
  }

  function close(id: string) {
    const win = windows.find(w => w.id === id)
    if (win) win.closing = true // 触发关闭动画，不会立即移除
  }

  /** 动画播放完毕后真正移除窗口 */
  function removeClosing(id: string) {
    const idx = windows.findIndex(w => w.id === id)
    if (idx !== -1) windows.splice(idx, 1)
  }

  function minimize(id: string) {
    const win = windows.find(w => w.id === id)
    if (win && !win.minimized) {
      // 通过 DOM 获取任务栏图标的实际位置
      const taskbarBtn = document.querySelector(`.taskbar-item[data-win-id="${id}"]`)
      let iconCX: number, iconCY: number
      if (taskbarBtn) {
        const rect = taskbarBtn.getBoundingClientRect()
        iconCX = rect.left + rect.width / 2
        iconCY = rect.top + rect.height / 2
      } else {
        // 回退到估算位置（使用 document.documentElement 获取真实视口尺寸，避免被游戏覆盖）
        const taskbarH = 48
        const idx = windows.findIndex(w => w.id === id)
        iconCX = 70 + idx * 42
        iconCY = (document.documentElement.clientHeight || 900) - taskbarH / 2
      }
      const winCX = win.x + win.width / 2
      const winCY = win.y + win.height / 2
      win.minimizeTarget = {
        dx: iconCX - winCX,
        dy: iconCY - winCY,
        scale: Math.min(32 / win.width, 32 / win.height)
      }
      win.minimized = true
    }
  }

  function toggleMaximize(id: string) {
    const win = windows.find(w => w.id === id)
    if (win) win.maximized = !win.maximized
  }

  function bringToFront(id: string) {
    const win = windows.find(w => w.id === id)
    if (win) {
      win.zIndex = nextZIndex.value++
    }
  }

  function updatePosition(id: string, x: number, y: number) {
    const win = windows.find(w => w.id === id)
    if (win && !win.maximized) {
      win.x = x
      win.y = y
    }
  }

  function updateSize(id: string, width: number, height: number) {
    const win = windows.find(w => w.id === id)
    if (win && !win.maximized) {
      win.width = Math.max(400, width)
      win.height = Math.max(300, height)
    }
  }

  /** 边缘缩放：同时更新位置与尺寸（左上/上/左边缘缩放时位置随之变化） */
  function resizeWindow(id: string, rect: { x?: number; y?: number; width?: number; height?: number }) {
    const win = windows.find(w => w.id === id)
    if (!win || win.maximized) return
    const MIN_W = 400
    const MIN_H = 300
    const vpW = document.documentElement.clientWidth
    const vpH = document.documentElement.clientHeight - 48

    let width = Math.max(MIN_W, rect.width ?? win.width)
    let height = Math.max(MIN_H, rect.height ?? win.height)
    let x = rect.x ?? win.x
    let y = rect.y ?? win.y

    // 视口内约束：窗口至少保留一角在屏幕内
    x = Math.max(-width + 120, Math.min(x, vpW - 120))
    y = Math.max(0, Math.min(y, Math.max(0, vpH - 60)))

    win.x = Math.round(x)
    win.y = Math.round(y)
    win.width = Math.round(width)
    win.height = Math.round(height)
  }

  return {
    windows,
    nextZIndex,
    open,
    close,
    removeClosing,
    minimize,
    toggleMaximize,
    bringToFront,
    updatePosition,
    updateSize,
    resizeWindow
  }
})
