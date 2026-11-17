// 彩蛋：Konami 秘技（↑↑↓↓←→←→BA + 回车）
// ─────────────────────────────────────────────────────────────
// 移植自 WebWord 静态版 modules/framework/js/modules/cssassets/filemenu/options.js
// 仅在「选项」页激活时生效：输入秘技后满屏烟雾，随后把文件菜单背景换成随机壁纸。
// 激活一次后记入 localStorage.konamiActivated，并在高级选项里出现「切换壁纸」按钮。

import { ref } from 'vue'
import { asset } from '@/utils/siteMode'

const KONAMI_SEQ = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
]

const STORAGE_KEY = 'konamiActivated'

/** 本次会话是否已经换过壁纸（对应原版 wallpaperApplied，仅内存） */
export const wallpaperApplied = ref(false)

/** 本次会话选中的壁纸文件名，菜单重新打开时据此还原背景 */
let appliedWallpaper: string | null = null

export function isKonamiActivated(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** 文件菜单是否处于打开状态 */
function overlayOpen(): HTMLElement | null {
  const overlay = document.getElementById('fileMenuOverlay')
  if (!overlay) return null
  if (!overlay.classList.contains('show')) return null
  return overlay
}

const KONAMI_CSS = `
.file-menu-overlay.konami-active .file-menu-container,
.file-menu-overlay.konami-active .file-menu-sidebar{
  backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);
}
.file-menu-nav-item.active{background:rgba(51,51,51,0.4)!important;}
.file-menu-nav-item:hover{background:rgba(42,42,42,0.4)!important;}
.file-menu-back:hover{background:rgba(51,51,51,0.4)!important;}
.file-menu-nav-highlighter{background:rgba(0,120,212,0.5)!important;}
.file-options-tab:hover{background:rgba(42,42,42,0.4)!important;}
.file-options-tab.active{background:rgba(51,51,51,0.4)!important;}
.file-option-section{background:rgba(30,30,30,0.55)!important;border-color:rgba(59,59,59,0.5)!important;}
.file-option-item:hover{background:rgba(255,255,255,0.03)!important;}
.file-option-select{background:rgba(37,37,37,0.5)!important;}
.file-option-select:hover{background:rgba(42,42,42,0.5)!important;}
.file-option-btn{background:rgba(45,45,45,0.5)!important;}
.file-option-btn:hover{background:rgba(58,58,58,0.5)!important;}
.file-option-input{background:rgba(37,37,37,0.5)!important;}
.file-option-input:hover{background:rgba(42,42,42,0.5)!important;}
.file-option-reset-btn{background:rgba(192,57,43,0.7)!important;}
.addon-version{background:rgba(37,37,37,0.5)!important;}
.addon-activate-btn{background:rgba(30,58,95,0.6)!important;}
.addon-activate-btn:hover{background:rgba(15,43,72,0.6)!important;}
.file-save-big-btn{background:rgba(30,30,30,0.55)!important;}
.file-save-big-btn:hover{background:rgba(51,51,51,0.55)!important;}
.file-export-big-btn{background:rgba(30,30,30,0.55)!important;}
.file-export-big-btn:hover{background:rgba(51,51,51,0.55)!important;}
.file-export-tab:hover{background:rgba(50,50,50,0.4)!important;}
.file-export-tab.active{background:rgba(30,30,30,0.55)!important;}
.file-save-type-card:hover{background:rgba(42,42,42,0.4)!important;}
.file-export-type-card:hover{background:rgba(50,50,50,0.4)!important;}
.file-row:hover{background:rgba(51,51,51,0.35)!important;}
.file-row-icon{background:rgba(30,30,30,0.45)!important;}
.file-info-icon:hover{background:rgba(51,51,51,0.35)!important;}
.file-print-big-btn{background:rgba(51,51,51,0.45)!important;}
.file-print-block:hover{background:rgba(51,51,51,0.35)!important;}
.file-print-dropdown-item:hover{background:rgba(51,51,51,0.35)!important;}
.file-print-nav-btn:hover{background:rgba(51,51,51,0.4)!important;}
.file-print-zoom-btn:hover{background:rgba(51,51,51,0.4)!important;}
.file-source-item:hover{background:rgba(51,51,51,0.35)!important;}
.file-source-item.active{background:rgba(42,42,42,0.35)!important;}
.file-feature-tag{background:rgba(37,42,51,0.45)!important;}
.file-product-logo{background:rgba(37,42,51,0.45)!important;}
.file-search-bar{background:rgba(26,26,26,0.45)!important;}
.file-print-copies-input{background:rgba(43,43,43,0.45)!important;}
`

function ensureKonamiStyle() {
  if (document.getElementById('konamiStyle')) return
  const style = document.createElement('style')
  style.id = 'konamiStyle'
  style.textContent = KONAMI_CSS
  document.head.appendChild(style)
}

const WALLPAPERS = ['1.webp', '2.webp', '3.webp', '4.webp', '5.webp']

/** 把背景样式写到 overlay 上 */
function paintOverlay(el: HTMLElement, file: string) {
  el.classList.add('konami-active')
  el.style.backgroundImage = `url("${asset('/background/' + file)}")`
  el.style.backgroundSize = 'cover'
  el.style.backgroundPosition = 'center'
  el.style.backgroundRepeat = 'no-repeat'
  el.style.backgroundAttachment = 'fixed'
  el.style.backgroundColor = 'transparent'

  const container = el.querySelector<HTMLElement>('.file-menu-container')
  if (container) container.style.backgroundColor = 'rgba(18,22,29,0.65)'
  const sidebar = el.querySelector<HTMLElement>('.file-menu-sidebar')
  if (sidebar) sidebar.style.backgroundColor = 'rgba(18,22,29,0.5)'

  ensureKonamiStyle()
}

/** 把文件菜单背景换成随机壁纸（渐显） */
export function applyRandomWallpaper(overlay?: HTMLElement | null): boolean {
  const el = overlay || document.getElementById('fileMenuOverlay')
  if (!el) return false
  if (wallpaperApplied.value) return false

  const file = WALLPAPERS[(Math.random() * WALLPAPERS.length) | 0]
  appliedWallpaper = file
  wallpaperApplied.value = true

  el.style.transition = 'opacity 2.2s ease'
  el.style.opacity = '0'
  paintOverlay(el, file)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.opacity = '1'
    })
  })
  return true
}

/** 菜单关闭再打开后还原已选壁纸（原版 overlay 常驻，效果等价） */
export function restoreWallpaper(overlay?: HTMLElement | null): void {
  const el = overlay || document.getElementById('fileMenuOverlay')
  if (!el || !appliedWallpaper) return
  paintOverlay(el, appliedWallpaper)
}

interface SmokeParticle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number; decay: number
  size: number; gray: number; alpha: number
  grav: number; drag: number
  blobOffsets?: { ox: number; oy: number; rs: number; ra: number }[]
}

/** 满屏烟雾弹，喷射结束后回调（原版实现的轻量化版本） */
function smokeBurst(onDone: () => void) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483646;pointer-events:none;'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    onDone()
    return
  }

  const particles: SmokeParticle[] = []
  const w = canvas.width
  const h = canvas.height
  // 原版 1400~2000 颗，逐帧绘制数千个径向渐变会掉到个位数 FPS；
  // 这里减少粒子数并加大每批投放量，视觉观感一致但几秒内就能喷完。
  const totalSmoke = (280 + Math.random() * 120) | 0
  const batchSize = 24
  const originX = w * (0.3 + Math.random() * 0.4)
  const originY = h - 3
  let spawned = 0

  function spawnBatch() {
    const count = Math.min(batchSize, totalSmoke - spawned)
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI + Math.random() * Math.PI
      const speed = 2 + Math.random() * 12
      particles.push({
        x: originX + (Math.random() - 0.5) * 15,
        y: originY + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.2 + Math.random() * 1.0,
        maxLife: 2.2,
        decay: 0.008 + Math.random() * 0.008,
        size: 12 + Math.random() * 30,
        gray: (40 + Math.random() * 110) | 0,
        alpha: 0.25 + Math.random() * 0.35,
        grav: -0.03 + Math.random() * 0.03,
        drag: 0.988 + Math.random() * 0.008,
      })
    }
    spawned += count
    if (spawned < totalSmoke) {
      setTimeout(spawnBatch, 24)
    } else {
      // 与原版一致：喷射完成即换背景，烟雾继续自然消散
      setTimeout(onDone, 100)
    }
  }

  let windPhase = 0
  function animateSmoke() {
    ctx!.clearRect(0, 0, w, h)
    let anyAlive = false
    windPhase += 0.01
    const wind = Math.sin(windPhase) * 0.3

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.vx *= p.drag
      p.vy *= p.drag
      p.x += p.vx + wind
      p.y += p.vy
      p.vy += p.grav
      p.life -= p.decay
      if (p.life <= 0) { particles.splice(i, 1); continue }
      anyAlive = true

      const lifeRatio = 1 - p.life / p.maxLife
      const fadeCurve = Math.pow(lifeRatio, 1.8)
      const alpha = p.alpha * (0.35 + 0.65 * (1 - fadeCurve))
      const size = p.size * (1 + lifeRatio * 4.0)

      if (!p.blobOffsets) {
        p.blobOffsets = []
        for (let bi = 0; bi < 3; bi++) {
          p.blobOffsets.push({
            ox: (Math.random() - 0.5) * size * 0.8,
            oy: (Math.random() - 0.5) * size * 0.8,
            rs: 0.5 + Math.random() * 0.7,
            ra: 0.6 + Math.random() * 0.4,
          })
        }
      }

      for (const b of p.blobOffsets) {
        const bx = p.x + b.ox * lifeRatio * 1.5
        const by = p.y + b.oy * lifeRatio * 1.5
        const bSize = size * b.rs
        const bAlpha = alpha * b.ra
        const grad = ctx!.createRadialGradient(bx, by, 0, bx, by, bSize)
        grad.addColorStop(0, `rgba(${p.gray},${p.gray},${p.gray},${bAlpha})`)
        grad.addColorStop(0.5, `rgba(${p.gray},${p.gray},${p.gray},${bAlpha * 0.5})`)
        grad.addColorStop(1, `rgba(${p.gray},${p.gray},${p.gray},0)`)
        ctx!.fillStyle = grad
        ctx!.beginPath()
        ctx!.arc(bx, by, bSize, 0, Math.PI * 2)
        ctx!.fill()
      }
    }

    ctx!.globalAlpha = 1
    if (anyAlive || spawned < totalSmoke) {
      requestAnimationFrame(animateSmoke)
    } else {
      canvas.remove()
    }
  }

  spawnBatch()
  animateSmoke()
}

export interface KonamiOptions {
  /** 秘技被激活（按下回车）后回调，仅一次 */
  onActivated?: () => void
}

/**
 * 挂载 Konami 监听。调用方需在组件卸载时执行返回的清理函数。
 * 只有在「选项」页某面板 active 且文件菜单已打开时才会累积按键。
 */
export function useKonamiEgg(options: KonamiOptions = {}) {
  let idx = 0
  let armed = false
  let triggered = false

  function reset() {
    idx = 0
    armed = false
  }

  function onKeydown(e: KeyboardEvent) {
    if (triggered || wallpaperApplied.value) return
    if (!overlayOpen()) { reset(); return }
    // 只在选项面板激活时响应
    if (!document.querySelector('.file-options-panel.active')) { reset(); return }

    const key = e.key

    if (armed) {
      if (key === 'Enter') {
        triggered = true
        armed = false
        idx = 0
        try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
        options.onActivated?.()
        smokeBurst(() => {
          applyRandomWallpaper(document.getElementById('fileMenuOverlay'))
        })
      } else {
        reset()
      }
      return
    }

    if (key === KONAMI_SEQ[idx]) {
      idx++
      if (idx === KONAMI_SEQ.length) {
        armed = true
        idx = 0
      }
    } else {
      idx = 0
    }
  }

  document.addEventListener('keydown', onKeydown)

  return {
    /** 卸载时调用 */
    dispose() {
      document.removeEventListener('keydown', onKeydown)
    },
    get activated() { return triggered },
  }
}
