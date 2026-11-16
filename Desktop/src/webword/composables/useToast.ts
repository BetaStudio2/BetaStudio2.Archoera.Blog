import { ref } from 'vue'

type ToastType = 'info' | 'success' | 'error' | 'warning'

interface ToastInstance {
  id: number
  el: HTMLDivElement
  timer: ReturnType<typeof setTimeout> | null
  barTimer: ReturnType<typeof requestAnimationFrame> | null
}

let uid = 0
const activeToasts: ToastInstance[] = []

function removeToast(inst: ToastInstance) {
  if (inst.timer) clearTimeout(inst.timer)
  if (inst.barTimer) cancelAnimationFrame(inst.barTimer)
  inst.el.style.opacity = '0'
  inst.el.style.transform = 'translateY(-10px)'
  inst.el.addEventListener('transitionend', () => {
    if (inst.el.parentNode) {
      inst.el.parentNode.removeChild(inst.el)
    }
    const idx = activeToasts.indexOf(inst)
    if (idx !== -1) activeToasts.splice(idx, 1)
  }, { once: true })
}

function createToastElement(message: string, type: ToastType, duration: number): HTMLDivElement {
  const el = document.createElement('div')
  const colors: Record<ToastType, { bg: string; border: string; bar: string; icon: string }> = {
    info:    { bg: '#16202d', border: '#2a4a6b', bar: '#3498db', icon: '#3498db' },
    success: { bg: '#162a1f', border: '#1f5234', bar: '#27ae60', icon: '#27ae60' },
    error:   { bg: '#2a1818', border: '#6b2424', bar: '#c0392b', icon: '#c0392b' },
    warning: { bg: '#2a2114', border: '#6b4a1f', bar: '#d68910', icon: '#d68910' }
  }
  const c = colors[type] || colors.info

  el.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    min-width: 260px;
    max-width: 80vw;
    padding: 12px 20px;
    background: ${c.bg};
    border: 1px solid ${c.border};
    border-radius: 8px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.4);
    font-size: 13px;
    color: #fff;
    z-index: 10000;
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.25s ease, transform 0.25s ease;
    overflow: hidden;
    pointer-events: auto;
  `

  const content = document.createElement('div')
  content.style.cssText = 'display:flex;align-items:center;gap:8px;'
  const icon = document.createElement('span')
  const icons: Record<ToastType, string> = {
    info: 'ℹ',
    success: '✓',
    error: '✕',
    warning: '⚠'
  }
  icon.textContent = icons[type] || icons.info
  icon.style.cssText = `color:${c.icon};font-weight:bold;font-size:14px;`
  const text = document.createElement('span')
  text.textContent = message
  content.appendChild(icon)
  content.appendChild(text)

  const bar = document.createElement('div')
  bar.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: ${c.bar};
    width: 100%;
    transform-origin: left center;
  `

  el.appendChild(content)
  el.appendChild(bar)

  document.body.appendChild(el)

  const inst: ToastInstance = {
    id: ++uid,
    el,
    timer: null,
    barTimer: null
  }

  // animate in
  requestAnimationFrame(() => {
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
  })

  // progress bar animation
  const start = performance.now()
  const totalMs = duration
  const animateBar = () => {
    const elapsed = performance.now() - start
    const progress = Math.min(elapsed / totalMs, 1)
    bar.style.transform = `scaleX(${1 - progress})`
    if (progress < 1) {
      inst.barTimer = requestAnimationFrame(animateBar)
    }
  }
  inst.barTimer = requestAnimationFrame(animateBar)

  inst.timer = setTimeout(() => removeToast(inst), duration)

  // click to dismiss
  el.addEventListener('click', () => removeToast(inst))

  // stack previous toasts
  const offset = activeToasts.length * 70
  el.style.top = `${24 + offset}px`
  activeToasts.push(inst)

  return el
}

export function useToast() {
  const lastToast = ref<{ message: string; type: ToastType } | null>(null)

  function show(message: string, type: ToastType = 'info', duration: number = 3000) {
    lastToast.value = { message, type }
    createToastElement(message, type, duration)
  }

  function error(message: string, duration?: number) {
    show(message, 'error', duration)
  }

  function success(message: string, duration?: number) {
    show(message, 'success', duration)
  }

  function info(message: string, duration?: number) {
    show(message, 'info', duration)
  }

  function warning(message: string, duration?: number) {
    show(message, 'warning', duration)
  }

  return { show, error, success, info, warning, lastToast }
}

/** 立即移除全部 Toast（清除定时器并删除 body 上的 DOM），窗口关闭时释放内存用 */
export function clearAllToasts() {
  const pending = activeToasts.splice(0, activeToasts.length)
  for (const inst of pending) {
    if (inst.timer) clearTimeout(inst.timer)
    if (inst.barTimer) cancelAnimationFrame(inst.barTimer)
    if (inst.el.parentNode) inst.el.parentNode.removeChild(inst.el)
  }
}
