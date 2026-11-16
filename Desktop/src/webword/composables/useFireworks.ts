// 彩蛋：烟花
// ─────────────────────────────────────────────────────────────
// 移植自 WebWord 静态版 modules/framework/js/modules/cssassets/filemenu/account.js
// 触发方式见 AccountPage.vue：连点「不可用」10 次。
// 15 波烟花 + 冲天炮，9 种爆发形态（单色 / 双色 / 渐变 / 混色 / 五彩 / 金柳 / 垂瀑 / 龙吟 / 极光）。

interface Vec { x: number; y: number }

interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number; decay: number
  color: string | { gradient: true; h1: number; h2: number; s: string; l: string }
  glowColor: string
  size: number
  trail: Vec[]; trailLen: number
  grav: number; drag: number
  burstType: number
  hueStart: number; hueEnd: number
  willowPhase?: number
  auroraPhase?: number
}

interface Spark {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number; decay: number
  grav: number; drag: number
  flicker: number
}

interface Palette { h1: number; h2: number; s: string; l: string }
interface DuoPalette { h1: number; h2: number; s1: string; l1: string; h3: number; h4: number; s2: string; l2: string }

const PALETTES: Palette[] = [
  { h1: 0, h2: 25, s: '100%', l: '58%' },
  { h1: 200, h2: 230, s: '100%', l: '60%' },
  { h1: 270, h2: 310, s: '95%', l: '65%' },
  { h1: 110, h2: 140, s: '90%', l: '55%' },
  { h1: 40, h2: 55, s: '100%', l: '60%' },
  { h1: 330, h2: 355, s: '100%', l: '62%' },
  { h1: 170, h2: 195, s: '95%', l: '55%' },
  { h1: 0, h2: 360, s: '95%', l: '60%' },
  { h1: 15, h2: 40, s: '100%', l: '55%' },
  { h1: 240, h2: 270, s: '90%', l: '55%' },
  { h1: 140, h2: 170, s: '90%', l: '55%' },
  { h1: 300, h2: 340, s: '95%', l: '60%' },
  { h1: 50, h2: 80, s: '90%', l: '55%' },
  { h1: 0, h2: 20, s: '80%', l: '70%' },
  { h1: 30, h2: 50, s: '80%', l: '70%' },
  { h1: 50, h2: 60, s: '30%', l: '85%' },
]

const DUO_PALETTES: DuoPalette[] = [
  { h1: 0, h2: 20, s1: '100%', l1: '60%', h3: 210, h4: 240, s2: '100%', l2: '60%' },
  { h1: 270, h2: 310, s1: '95%', l1: '65%', h3: 40, h4: 55, s2: '100%', l2: '60%' },
  { h1: 110, h2: 140, s1: '90%', l1: '55%', h3: 170, h4: 195, s2: '95%', l2: '55%' },
  { h1: 330, h2: 355, s1: '100%', l1: '62%', h3: 200, h4: 230, s2: '100%', l2: '60%' },
  { h1: 0, h2: 25, s1: '100%', l1: '58%', h3: 40, h4: 55, s2: '100%', l2: '60%' },
  { h1: 200, h2: 230, s1: '100%', l1: '60%', h3: 240, h4: 270, s2: '90%', l2: '55%' },
  { h1: 300, h2: 340, s1: '95%', l1: '60%', h3: 110, h4: 140, s2: '90%', l2: '55%' },
  { h1: 140, h2: 170, s1: '90%', l1: '55%', h3: 330, h4: 355, s2: '100%', l2: '62%' },
  { h1: 170, h2: 195, s1: '95%', l1: '55%', h3: 50, h4: 80, s2: '90%', l2: '55%' },
  { h1: 280, h2: 320, s1: '95%', l1: '65%', h3: 200, h4: 230, s2: '100%', l2: '60%' },
]

const pick = <T,>(arr: T[]): T => arr[(Math.random() * arr.length) | 0]

export interface FireworksOptions {
  /** 全部动画结束（canvas 已移除）后回调 */
  onDone?: () => void
}

/** 触发一次完整烟花表演（约 15 波） */
export function fireFireworks(options: FireworksOptions = {}): void {
  const { onDone } = options

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:none;'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    onDone?.()
    return
  }

  const rockets: Array<Rocket | Skyrocket> = []
  const particles: Particle[] = []
  const sparks: Spark[] = []
  let animId: number | null = null
  let waveIdx = 0

  // ── 配色工具 ──
  const paletteColor = (p: Palette) =>
    `hsl(${p.h1 + Math.random() * (p.h2 - p.h1)},${p.s},${parseInt(p.l) - 12 + Math.random() * 24}%)`
  const paletteGlow = (p: Palette) =>
    `hsla(${p.h1 + Math.random() * (p.h2 - p.h1)},${p.s},${p.l},`
  const duoColorA = (d: DuoPalette) =>
    `hsl(${d.h1 + Math.random() * (d.h2 - d.h1)},${d.s1},${parseInt(d.l1) - 10 + Math.random() * 20}%)`
  const duoColorB = (d: DuoPalette) =>
    `hsl(${d.h3 + Math.random() * (d.h4 - d.h3)},${d.s2},${parseInt(d.l2) - 10 + Math.random() * 20}%)`
  const duoGlowA = (d: DuoPalette) => `hsla(${d.h1 + Math.random() * (d.h2 - d.h1)},${d.s1},${d.l1},`
  const duoGlowB = (d: DuoPalette) => `hsla(${d.h3 + Math.random() * (d.h4 - d.h3)},${d.s2},${d.l2},`

  // ── 冲天炮（只飞不炸）──
  class Skyrocket {
    x: number; y: number
    vx: number; vy: number
    gravity = 0.30
    trail: Vec[] = []
    trailLen: number
    hue: number; sat: string; lit: string
    done = false
    tailParticles: { x: number; y: number; life: number; maxLife: number; decay: number; size: number; hue: number; sat: string; lit: string }[] = []
    glowAlpha = 1.0

    constructor(startX: number) {
      this.x = startX
      this.y = canvas.height
      this.vx = (Math.random() - 0.5) * 0.6
      this.vy = -(22 + Math.random() * 6)
      this.trailLen = (50 + Math.random() * 20) | 0
      const cp = pick([
        { h: 45, s: '100%', l: '65%' },
        { h: 35, s: '100%', l: '75%' },
        { h: 0, s: '0%', l: '90%' },
        { h: 0, s: '100%', l: '65%' },
        { h: 220, s: '40%', l: '85%' },
      ])
      this.hue = cp.h
      this.sat = cp.s
      this.lit = cp.l
    }

    update() {
      this.x += this.vx
      this.vy += this.gravity
      this.y += this.vy
      this.trail.push({ x: this.x, y: this.y })
      if (this.trail.length > this.trailLen) this.trail.shift()

      if (Math.random() < 0.6) {
        this.tailParticles.push({
          x: this.x + (Math.random() - 0.5) * 3,
          y: this.y + (Math.random() - 0.5) * 3,
          life: 0.6 + Math.random() * 0.4,
          maxLife: 1.0,
          decay: 0.015 + Math.random() * 0.01,
          size: Math.random() * 1.5 + 0.5,
          hue: this.hue + (Math.random() - 0.5) * 15,
          sat: this.sat,
          lit: this.lit,
        })
      }

      if (this.vy >= 0 || this.y < canvas.height * 0.05) {
        this.glowAlpha -= 0.015
        if (this.glowAlpha <= 0) this.done = true
      }

      for (let i = this.tailParticles.length - 1; i >= 0; i--) {
        const p = this.tailParticles[i]
        p.life -= p.decay
        if (p.life <= 0) { this.tailParticles.splice(i, 1); continue }
        p.x += (Math.random() - 0.5) * 0.3
        p.y -= Math.random() * 0.5
      }
    }

    draw() {
      for (let i = 0; i < this.trail.length; i++) {
        ctx!.globalAlpha = (i / this.trail.length) * 0.6 * this.glowAlpha
        ctx!.fillStyle = `hsl(${this.hue},${this.sat},${this.lit})`
        ctx!.beginPath()
        ctx!.arc(this.trail[i].x, this.trail[i].y, (i / this.trail.length) * 2.0 + 0.5, 0, Math.PI * 2)
        ctx!.fill()
      }
      for (const p of this.tailParticles) {
        ctx!.globalAlpha = (p.life / p.maxLife) * 0.5 * this.glowAlpha
        ctx!.fillStyle = `hsl(${p.hue},${p.sat},${p.lit})`
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fill()
      }
      if (this.glowAlpha > 0 && this.y < canvas.height) {
        const glowColor = `hsl(${this.hue},${this.sat},${this.lit})`
        ctx!.globalAlpha = this.glowAlpha * 0.3
        const grad = ctx!.createRadialGradient(this.x, this.y, 0, this.x, this.y, 25)
        grad.addColorStop(0, glowColor)
        grad.addColorStop(1, 'transparent')
        ctx!.fillStyle = grad
        ctx!.beginPath()
        ctx!.arc(this.x, this.y, 25, 0, Math.PI * 2)
        ctx!.fill()

        ctx!.globalAlpha = this.glowAlpha
        ctx!.fillStyle = '#fff'
        ctx!.beginPath()
        ctx!.arc(this.x, this.y, 2.5, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
    }
  }

  // ── 开花火箭 ──
  class Rocket {
    startX: number; targetY: number; startY: number
    vx: number; vy: number
    gravity = 0.32
    x: number; y: number
    trail: Vec[] = []
    trailLen: number
    hue: number
    done = false
    explodeCount = 0

    constructor(startX: number, targetY: number) {
      this.startX = startX
      this.targetY = targetY
      this.startY = canvas.height
      this.vx = (Math.random() - 0.5) * 4
      this.vy = -(18 + Math.random() * 5)
      this.x = startX
      this.y = this.startY
      this.trailLen = (30 + Math.random() * 10) | 0
      this.hue = 20 + Math.random() * 30
    }

    update() {
      this.trail.push({ x: this.x, y: this.y })
      if (this.trail.length > this.trailLen) this.trail.shift()
      this.x += this.vx
      this.vy += this.gravity
      this.y += this.vy
      if (this.vy >= 0 || this.y <= this.targetY) {
        if (this.explodeCount < 3) {
          this.explodeCount++
          return
        }
        this.done = true
        explode(this.x, Math.min(this.y, this.startY - 50))
      }
    }

    draw() {
      for (let i = 0; i < this.trail.length; i++) {
        ctx!.globalAlpha = (i / this.trail.length) * 0.7
        ctx!.fillStyle = `hsl(${this.hue},100%,70%)`
        ctx!.beginPath()
        ctx!.arc(this.trail[i].x, this.trail[i].y, (i / this.trail.length) * 2.5, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
      ctx!.fillStyle = '#fff'
      ctx!.beginPath()
      ctx!.arc(this.x, this.y, 3, 0, Math.PI * 2)
      ctx!.fill()
    }
  }

  // ── 爆发（9 种形态 + 核心 + 子爆 + 星/环 + 余烬）──
  function explode(cx: number, cy: number) {
    const rnd = Math.random()
    let burstType: number
    if (rnd < 0.18) burstType = 0
    else if (rnd < 0.33) burstType = 1
    else if (rnd < 0.46) burstType = 2
    else if (rnd < 0.57) burstType = 3
    else if (rnd < 0.66) burstType = 4
    else if (rnd < 0.74) burstType = 5
    else if (rnd < 0.82) burstType = 6
    else if (rnd < 0.90) burstType = 7
    else burstType = 8

    const palette = pick(PALETTES)

    if (burstType <= 4) {
      const count = (180 + Math.random() * 70) | 0
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 14 + 3
        const life = 0.8 + Math.random() * 0.4
        let color: Particle['color']
        let glowColor: string

        if (burstType === 0) {
          color = paletteColor(palette)
          glowColor = paletteGlow(palette)
        } else if (burstType === 1) {
          const duo = pick(DUO_PALETTES)
          color = i < count / 2 ? duoColorA(duo) : duoColorB(duo)
          glowColor = i < count / 2 ? duoGlowA(duo) : duoGlowB(duo)
        } else if (burstType === 2) {
          const hueStart = Math.random() * 360
          color = {
            gradient: true,
            h1: hueStart,
            h2: hueStart + 60 + Math.random() * 120,
            s: '95%',
            l: `${55 + Math.random() * 10}%`,
          }
          glowColor = `hsla(${hueStart + 30},95%,${color.l},`
        } else if (burstType === 3) {
          if (i < count / 2) {
            color = paletteColor(palette)
            glowColor = paletteGlow(palette)
          } else {
            const h = Math.random() * 360
            color = `hsl(${h},95%,60%)`
            glowColor = `hsla(${h},95%,60%,`
          }
        } else {
          const h = Math.random() * 360
          color = `hsl(${h},95%,60%)`
          glowColor = `hsla(${h},95%,60%,`
        }

        particles.push({
          x: cx + (Math.random() - 0.5) * 6, y: cy + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1,
          life, maxLife: life, decay: Math.random() * 0.006 + 0.003,
          color, glowColor, size: Math.random() * 2.5 + 1.5,
          trail: [], trailLen: (8 + Math.random() * 6) | 0,
          grav: 0.06 + Math.random() * 0.03, drag: 0.985 + Math.random() * 0.01,
          burstType, hueStart: 0, hueEnd: 0,
        })
      }
    } else if (burstType === 5) {
      // 金柳
      const count = (130 + Math.random() * 40) | 0
      const goldPal = { h1: 35, h2: 55, s: '100%', l: '60%' }
      const greenPal = { h1: 100, h2: 140, s: '80%', l: '55%' }
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI - Math.PI / 2
        const speed = Math.random() * 12 + 4
        const life = 0.7 + Math.random() * 0.3
        const pal = Math.random() < 0.65 ? goldPal : greenPal
        const hue = pal.h1 + Math.random() * (pal.h2 - pal.h1)
        particles.push({
          x: cx + (Math.random() - 0.5) * 4, y: cy + (Math.random() - 0.5) * 4,
          vx: Math.cos(angle) * speed * 0.7, vy: Math.sin(angle) * speed * 0.5,
          life, maxLife: life, decay: Math.random() * 0.005 + 0.002,
          color: `hsl(${hue},${pal.s},${parseInt(pal.l) - 8 + Math.random() * 16}%)`,
          glowColor: `hsla(${hue},${pal.s},${pal.l},`,
          size: Math.random() * 1.8 + 0.8,
          trail: [], trailLen: (12 + Math.random() * 8) | 0,
          grav: 0.12 + Math.random() * 0.06, drag: 0.992 + Math.random() * 0.005,
          burstType: 5, hueStart: 0, hueEnd: 0,
          willowPhase: Math.random() * Math.PI * 2,
        })
      }
    } else if (burstType === 6) {
      // 垂瀑
      const count = (200 + Math.random() * 80) | 0
      for (let i = 0; i < count; i++) {
        const angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8
        const speed = Math.random() * 16 + 2
        const life = 0.5 + Math.random() * 0.4
        const bright = (75 + Math.random() * 20) | 0
        const hueW = Math.random() < 0.6 ? 35 + Math.random() * 30 : Math.random() * 20
        particles.push({
          x: cx + (Math.random() - 0.5) * 8, y: cy + (Math.random() - 0.5) * 4,
          vx: Math.cos(angle) * speed * 0.3, vy: Math.sin(angle) * speed * 0.9,
          life, maxLife: life, decay: Math.random() * 0.01 + 0.005,
          color: `hsl(${hueW},${80 + Math.random() * 20}%,${bright}%)`,
          glowColor: `hsla(${hueW},100%,${bright}%,`,
          size: Math.random() * 1.2 + 0.5,
          trail: [], trailLen: (4 + Math.random() * 4) | 0,
          grav: 0.04 + Math.random() * 0.02, drag: 0.99 + Math.random() * 0.008,
          burstType: 6, hueStart: 0, hueEnd: 0,
        })
      }
    } else if (burstType === 7) {
      // 龙吟
      const count = (60 + Math.random() * 30) | 0
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 8 + 4
        const life = 1.2 + Math.random() * 0.5
        let dHue = 10 + Math.random() * 30
        if (Math.random() < 0.2) dHue = 40 + Math.random() * 20
        particles.push({
          x: cx + (Math.random() - 0.5) * 4, y: cy + (Math.random() - 0.5) * 4,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
          life, maxLife: life, decay: Math.random() * 0.003 + 0.0015,
          color: `hsl(${dHue},100%,${55 + Math.random() * 15}%)`,
          glowColor: `hsla(${dHue},100%,60%,`,
          size: Math.random() * 3 + 2.5,
          trail: [], trailLen: (18 + Math.random() * 10) | 0,
          grav: 0.02 + Math.random() * 0.02, drag: 0.995 + Math.random() * 0.004,
          burstType: 7, hueStart: 0, hueEnd: 0,
        })
      }
    } else {
      // 极光
      const count = (150 + Math.random() * 50) | 0
      const hues = [
        { h: 160, s: '80%', l: '65%' }, { h: 200, s: '90%', l: '60%' },
        { h: 270, s: '70%', l: '70%' }, { h: 130, s: '60%', l: '70%' },
        { h: 300, s: '60%', l: '65%' },
      ]
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 8 + 2
        const life = 1.0 + Math.random() * 0.5
        const ah = pick(hues)
        particles.push({
          x: cx + (Math.random() - 0.5) * 10, y: cy + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed * 0.5, vy: Math.sin(angle) * speed * 0.5,
          life, maxLife: life, decay: Math.random() * 0.003 + 0.002,
          color: `hsl(${ah.h},${ah.s},${ah.l})`,
          glowColor: `hsla(${ah.h},${ah.s},${ah.l},`,
          size: Math.random() * 3 + 2,
          trail: [], trailLen: (10 + Math.random() * 8) | 0,
          grav: -0.01 + Math.random() * 0.03, drag: 0.99 + Math.random() * 0.008,
          burstType: 8, hueStart: 0, hueEnd: 0,
          auroraPhase: Math.random() * Math.PI * 2,
        })
      }
    }

    // 炽热核心
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 5 + 1
      const life = 1.0 + Math.random() * 0.5
      particles.push({
        x: cx + (Math.random() - 0.5) * 4, y: cy + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.5,
        life, maxLife: life, decay: Math.random() * 0.004 + 0.002,
        color: '#fffbe6', glowColor: 'rgba(255,250,220,',
        size: Math.random() * 1.2 + 0.5,
        trail: [], trailLen: (4 + Math.random() * 4) | 0,
        grav: 0.04 + Math.random() * 0.02, drag: 0.992 + Math.random() * 0.006,
        burstType: 0, hueStart: 0, hueEnd: 0,
      })
    }

    // 子爆
    const subCount = (3 + Math.random() * 4) | 0
    for (let s = 0; s < subCount; s++) {
      const scx = cx + (Math.random() - 0.5) * 20
      const scy = cy + (Math.random() - 0.5) * 20
      const subCount2 = (8 + Math.random() * 8) | 0
      for (let j = 0; j < subCount2; j++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 3 + 1
        const life = 0.5 + Math.random() * 0.3
        particles.push({
          x: scx, y: scy,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life, maxLife: life, decay: Math.random() * 0.015 + 0.008,
          color: '#fff', glowColor: 'rgba(255,255,255,',
          size: Math.random() * 1.0 + 0.3,
          trail: [], trailLen: 2, grav: 0.04, drag: 0.98,
          burstType: 0, hueStart: 0, hueEnd: 0,
        })
      }
    }

    // 形状爆发：15% 星形 + 15% 环形
    const shape = Math.random()
    if (shape < 0.15) {
      const duo = pick(DUO_PALETTES)
      const spikes = 5
      const outerR = 70 + Math.random() * 30
      for (let s = 0; s < spikes; s++) {
        const a = (s * Math.PI * 2) / spikes - Math.PI / 2
        const sideColor = s % 2 === 0 ? duoColorA(duo) : duoColorB(duo)
        const sideGlow = s % 2 === 0 ? duoGlowA(duo) : duoGlowB(duo)
        for (let j = 0; j < 20; j++) {
          const spread = (Math.random() - 0.5) * 8
          const r = outerR * (0.85 + Math.random() * 0.15)
          const px = cx + Math.cos(a + spread * 0.03) * r
          const py = cy + Math.sin(a + spread * 0.03) * r
          const life = 0.6 + Math.random() * 0.3
          particles.push({
            x: cx, y: cy,
            vx: (px - cx) * 0.1 + (Math.random() - 0.5) * 0.3,
            vy: (py - cy) * 0.1 + (Math.random() - 0.5) * 0.3,
            life, maxLife: life, decay: Math.random() * 0.008 + 0.004,
            color: sideColor, glowColor: sideGlow,
            size: Math.random() * 2 + 1,
            trail: [], trailLen: 6, grav: 0.05, drag: 0.99,
            burstType: 0, hueStart: 0, hueEnd: 0,
          })
        }
      }
    } else if (shape < 0.30) {
      const ringR = 55 + Math.random() * 25
      for (let j = 0; j < 200; j++) {
        const a = Math.random() * Math.PI * 2
        const r = ringR * (0.9 + Math.random() * 0.1)
        const px = cx + Math.cos(a) * r
        const py = cy + Math.sin(a) * r
        const life = 0.5 + Math.random() * 0.3
        const rH = Math.random() * 360
        particles.push({
          x: cx, y: cy,
          vx: (px - cx) * 0.09 + (Math.random() - 0.5) * 0.2,
          vy: (py - cy) * 0.09 + (Math.random() - 0.5) * 0.2,
          life, maxLife: life, decay: Math.random() * 0.01 + 0.005,
          color: `hsl(${rH},95%,60%)`, glowColor: `hsla(${rH},95%,60%,`,
          size: Math.random() * 2 + 1,
          trail: [], trailLen: 5, grav: 0.05, drag: 0.99,
          burstType: 0, hueStart: 0, hueEnd: 0,
        })
      }
    }

    // 闪烁余烬
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 10 + 2
      const life = 0.3 + Math.random() * 0.4
      sparks.push({
        x: cx + (Math.random() - 0.5) * 5, y: cy + (Math.random() - 0.5) * 5,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.5,
        life, maxLife: life, decay: Math.random() * 0.02 + 0.01,
        grav: 0.08, drag: 0.97, flicker: Math.random() * 10,
      })
    }
  }

  // ── 逐波发射 ──
  function launchNext() {
    if (waveIdx >= 15) {
      if (!animId) animId = requestAnimationFrame(animate)
      return
    }
    waveIdx++
    if (Math.random() < 0.3) {
      rockets.push(new Skyrocket(Math.random() * canvas.width * 0.6 + canvas.width * 0.2))
    }
    const count = Math.random() < 0.3 ? 2 : 1
    for (let i = 0; i < count; i++) {
      const x = Math.random() * canvas.width * 0.7 + canvas.width * 0.15
      const targetY = Math.random() * canvas.height * 0.35 + canvas.height * 0.1
      rockets.push(new Rocket(x, targetY))
    }
    setTimeout(launchNext, 150 + Math.random() * 120)
  }

  // ── 主循环 ──
  function animate() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = rockets.length - 1; i >= 0; i--) {
      rockets[i].update()
      if (rockets[i].done) rockets.splice(i, 1)
    }
    for (const r of rockets) r.draw()

    let alive = false
    ctx!.save()
    ctx!.globalCompositeOperation = 'lighter'

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.vx *= p.drag
      p.x += p.vx
      p.y += p.vy
      p.vy += p.grav
      p.trail.push({ x: p.x, y: p.y })
      if (p.trail.length > p.trailLen) p.trail.shift()
      p.life -= p.decay
      if (p.life <= 0) { particles.splice(i, 1); continue }
      alive = true

      const lifeRatio = 1 - p.life / p.maxLife
      const alpha = Math.max(0.15, 1 - lifeRatio * 1.2)
      const sizeScale = lifeRatio < 0.7 ? 1 : Math.max(0.2, 1 - ((lifeRatio - 0.7) / 0.3) * 0.8)
      const drawSize = p.size * sizeScale

      let drawColor: string
      let drawGlow: string
      if (p.burstType === 2 && typeof p.color === 'object' && p.color.gradient) {
        const h = p.color.h1 + (p.color.h2 - p.color.h1) * lifeRatio
        drawColor = `hsl(${h},${p.color.s},${p.color.l})`
        drawGlow = `hsla(${h},${p.color.s},${p.color.l},`
      } else {
        drawColor = p.color as string
        drawGlow = p.glowColor
      }

      let effX = p.x
      const effY = p.y
      let effSize = drawSize
      let glowMult = 1
      let drawAsLine = false

      if (p.burstType === 5) {
        effX += Math.sin(p.life * 8 + (p.willowPhase || 0)) * 0.8
        drawAsLine = true
      } else if (p.burstType === 6) {
        drawAsLine = true
        glowMult = 0.6
      } else if (p.burstType === 7) {
        effSize = drawSize * (1 + Math.sin(p.life * 12) * 0.25)
        glowMult = 2.5
      } else if (p.burstType === 8) {
        effX += Math.sin(p.life * 4 + (p.auroraPhase || 0)) * 6
        effSize = drawSize * 0.9
        glowMult = 1.5
      }

      if (effSize > 0.8) {
        const glowR = effSize * 5 * glowMult
        if (p.burstType === 7) {
          ctx!.globalAlpha = alpha * 0.15
          ctx!.fillStyle = drawGlow + alpha * 0.15 + ')'
          ctx!.beginPath()
          ctx!.arc(effX, effY, glowR * 1.8, 0, Math.PI * 2)
          ctx!.fill()
        }
        ctx!.globalAlpha = alpha * 0.25 * (p.burstType === 8 ? 0.5 : 1)
        ctx!.fillStyle = drawGlow + alpha * 0.25 + ')'
        ctx!.beginPath()
        ctx!.arc(effX, effY, glowR, 0, Math.PI * 2)
        ctx!.fill()
      }

      if (drawAsLine && effSize > 0.5) {
        const lineLen = effSize * 4
        ctx!.globalAlpha = alpha * 0.7
        ctx!.strokeStyle = drawColor
        ctx!.lineWidth = effSize * 0.5
        ctx!.lineCap = 'round'
        ctx!.beginPath()
        ctx!.moveTo(effX, effY)
        ctx!.lineTo(effX + p.vx * 0.8, effY + lineLen)
        ctx!.stroke()
      } else {
        ctx!.globalAlpha = alpha
        ctx!.fillStyle = drawColor
        ctx!.beginPath()
        ctx!.arc(effX, effY, effSize, 0, Math.PI * 2)
        ctx!.fill()
      }

      if (p.burstType !== 5 && p.burstType !== 6 && effSize > 1.5) {
        ctx!.globalAlpha = alpha * 0.5
        ctx!.fillStyle = '#fff'
        ctx!.beginPath()
        ctx!.arc(effX - effSize * 0.2, effY - effSize * 0.2, effSize * 0.3, 0, Math.PI * 2)
        ctx!.fill()
      }

      if (p.burstType === 7 && p.trail.length > 2) {
        ctx!.globalAlpha = alpha * 0.2
        ctx!.strokeStyle = drawGlow + alpha * 0.2 + ')'
        ctx!.lineWidth = effSize * 0.6
        ctx!.lineCap = 'round'
        ctx!.beginPath()
        ctx!.moveTo(p.trail[0].x, p.trail[0].y)
        for (let ti = 1; ti < p.trail.length; ti++) ctx!.lineTo(p.trail[ti].x, p.trail[ti].y)
        ctx!.stroke()
      }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]
      s.vx *= s.drag
      s.x += s.vx
      s.y += s.vy
      s.vy += s.grav
      s.life -= s.decay
      if (s.life <= 0) { sparks.splice(i, 1); continue }
      alive = true

      const flicker = Math.sin(s.life * 30 + s.flicker) * 0.4 + 0.6
      const alpha = (s.life / s.maxLife) * flicker
      const drawSize = 1.0 + (1 - s.life / s.maxLife) * 2.0

      ctx!.globalAlpha = alpha * 0.3
      ctx!.fillStyle = `rgba(255,220,150,${alpha * 0.3})`
      ctx!.beginPath()
      ctx!.arc(s.x, s.y, drawSize * 4, 0, Math.PI * 2)
      ctx!.fill()

      ctx!.globalAlpha = alpha * 0.8
      ctx!.fillStyle = '#fffbe6'
      ctx!.beginPath()
      ctx!.arc(s.x, s.y, drawSize * 0.5, 0, Math.PI * 2)
      ctx!.fill()
    }

    ctx!.restore()
    ctx!.globalAlpha = 1

    if (alive || rockets.length > 0 || particles.length > 0 || sparks.length > 0) {
      animId = requestAnimationFrame(animate)
    } else {
      if (animId) { cancelAnimationFrame(animId); animId = null }
      canvas.remove()
      onDone?.()
    }
  }

  animId = requestAnimationFrame(animate)
  launchNext()
}
