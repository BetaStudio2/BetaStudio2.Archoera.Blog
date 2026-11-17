<template>
  <div class="desktop" @contextmenu.prevent @click="closeMenus">
    <!-- 壁纸 -->
    <div class="wallpaper" :style="wallpaperStyle"></div>

    <!-- 桌面图标 -->
    <div class="desktop-icons">
      <div
        v-for="icon in desktopIcons"
        :key="icon.id"
        class="desktop-icon"
        @dblclick="openApp(icon.id)"
      >
        <div class="icon-app" :class="'icon-' + icon.id">
          <span v-html="appIconSvg(icon.id)"></span>
        </div>
        <span class="icon-label">{{ icon.label }}</span>
      </div>
    </div>

    <!-- 窗口层 -->
    <DesktopWindow
      v-for="win in windows.windows"
      :key="win.id"
      :win="win"
    />

    <!-- Live2D -->
    <Live2D />

    <!-- 任务栏 -->
    <footer class="taskbar" @click.stop>
      <div class="taskbar-left">
        <button class="start-btn" :class="{ active: showStartMenu }" @click="toggleStartMenu" :title="$t('desktop.taskbar.start')">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M0 0h24v24H0z" fill="none" opacity="0"/>
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2zM4 9l8 4 8-4-8-4-8 4zm0 3l8 4 8-4v3l-8 4-8-4v-3z"/>
          </svg>
        </button>
        <div class="taskbar-divider"></div>

        <!-- 正在运行的应用 -->
        <button
          v-for="win in windows.windows"
          :key="'tb-' + win.id"
          :data-win-id="win.id"
          class="taskbar-item"
          :class="{
            active: isForeground(win.id),
            minimized: isMinimized(win.id),
            running: isRunning(win.id) && !isForeground(win.id),
            'enter': enterAnim?.id === win.id,
            'exit': exitAnim?.id === win.id,
            'bounce-up': bounceAnim?.id === win.id && bounceAnim?.dir === 'up',
            'bounce-down': bounceAnim?.id === win.id && bounceAnim?.dir === 'down'
          }"
          @click="toggleWindow(win.id)"
          :title="win.title"
        >
          <span class="tb-icon" v-html="iconSvg(win.icon)"></span>
        </button>
      </div>

      <div class="taskbar-right">
        <div class="tray-btn clock-btn" @click="toggleCalendar">
          <div class="tray-clock">
            <span>{{ clock.time }}</span>
            <span class="tray-date">{{ clock.date }}</span>
          </div>
        </div>
      </div>
    </footer>

    <!-- 开始菜单 -->
    <Transition name="menu-slide">
      <div v-if="showStartMenu" class="start-menu" @click.stop>
        <div class="start-header">
          <div class="start-user">
            <span class="start-avatar-placeholder">B</span>
            <span class="start-user-name">BetaStudio2</span>
          </div>
        </div>
        <div class="start-apps">
          <button
            v-for="app in appList"
            :key="app.id"
            class="start-app-item"
            @click="closeMenuThen(() => openApp(app.id))"
          >
            <div class="start-app-icon" :class="'start-' + app.id">
              <span v-html="appIconSvg(app.id)"></span>
            </div>
            <div class="start-app-info">
              <span class="start-app-name">{{ app.label }}</span>
              <span class="start-app-desc">{{ app.desc }}</span>
            </div>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 日历弹窗 -->
    <Transition name="menu-slide-up">
      <div v-if="showCalendar" class="calendar-popup" @click.stop>
        <div class="cal-header">
          <div class="cal-header-group">
            <button class="cal-nav" @click="calPrevYear" :title="$t('desktop.cal.prevYear')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 18l-6-6 6-6"/><path d="M19 18l-6-6 6-6"/></svg>
            </button>
            <button class="cal-nav" @click="calPrevMonth" :title="$t('desktop.cal.prevMonth')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </div>
          <span class="cal-title">{{ $t('desktop.cal.title', { year: calYear, month: calMonth + 1 }) }}</span>
          <div class="cal-header-group">
            <button class="cal-nav" @click="calNextMonth" :title="$t('desktop.cal.nextMonth')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button class="cal-nav" @click="calNextYear" :title="$t('desktop.cal.nextYear')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 18l6-6-6-6"/><path d="M5 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
        <Transition :name="calTransitionName" mode="out-in">
          <div :key="`${calYear}-${calMonth}`">
            <div class="cal-weekdays">
              <span v-for="d in weekdays" :key="d" class="cal-wd">{{ d }}</span>
            </div>
            <div class="cal-grid">
              <div
                v-for="(day, i) in calDays"
                :key="i"
                class="cal-day"
                :class="{
                  'cal-day-other': !day.isCurrentMonth,
                  'cal-day-today': day.isToday,
                  'cal-day-weekend': day.isWeekend && day.isCurrentMonth,
                  'cal-day-holiday': !!day.holiday && day.isCurrentMonth
                }"
              >
                <span class="cal-day-num">{{ day.num }}</span>
                <span v-if="day.holiday && day.isCurrentMonth" class="cal-day-label">{{ day.holiday }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import { STATIC_MODE, SITE_BASE, asset, withBase } from '@/utils/siteMode'
import { migrateWallpaperUrl } from '@/utils/wallpaper'
import { useWindowsStore } from '@/stores/windows'
import { TASK_ICONS, APP_ICONS } from '@/utils/icons'
import DesktopWindow from '@/components/DesktopWindow.vue'
import Live2D from '@/components/Live2D.vue'

const { t } = useI18n()
const windows = useWindowsStore()

// 开屏动画已移除：保留一次事件通知，Live2D 等组件据此开始加载
function notifyDesktopReady() {
  requestAnimationFrame(() => {
    window.dispatchEvent(new CustomEvent('desktop-welcome-done'))
  })
}

const showStartMenu = ref(false)

// ── Wallpaper ────────────────────────────
// 只信任安全协议的壁纸 URL，避免 localStorage/外部事件写入 file:// 等非法值触发安全错误
function isSafeWallpaperUrl(url: string): boolean {
  if (!url) return false
  return /^(https?:|data:image\/|blob:)/.test(url) || url.startsWith('/')
}

const storedWallpaper = migrateWallpaperUrl(localStorage.getItem('desktop_wallpaper_url') || '')
// 旧版本存的是站点根相对路径（/background/1.png），这里补上部署 base
const wallpaperUrl = ref(isSafeWallpaperUrl(storedWallpaper) ? withBase(storedWallpaper) : '')
// 静态模式下从 public/background 直接取图，避免依赖后端接口
const defaultWallpaper = STATIC_MODE ? asset('background/4.webp') : '/api/backgrounds/file/4.webp'

const wallpaperStyle = computed(() => {
  const url = wallpaperUrl.value || defaultWallpaper
  // 用自定义属性而不是内联 background 简写：某些浏览器扩展（如深色模式类）会把内联
  // background 的值拼进属性选择器，遇到 url("…") 里的引号会生成非法 CSS 并抛 insertRule 错误
  return { '--wallpaper-image': `url("${url.replace(/"/g, '%22')}")` }
})

function handleWallpaperChange(e: Event) {
  const detail = (e as CustomEvent).detail
  const candidate = typeof detail === 'string' ? detail : detail?.url
  if (typeof candidate === 'string' && isSafeWallpaperUrl(candidate)) {
    wallpaperUrl.value = candidate
  }
}

// ── Clock ──────────────────────────────
const clock = ref({ time: '', date: '' })
let clockTimer: ReturnType<typeof setInterval>

function updateClock() {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  clock.value.time = `${h}:${m}`
  const mon = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  clock.value.date = t('desktop.clock.date', { mon, day, week: t(WEEKDAY_KEYS[now.getDay()]) })
}

// ── Calendar ────────────────────────────
const showCalendar = ref(false)
const enterAnim = ref<{ id: string; dir: 'in' } | null>(null)
const exitAnim = ref<{ id: string } | null>(null)
const bounceAnim = ref<{ id: string; dir: 'up' | 'down' } | null>(null)

function triggerBounce(id: string, dir: 'up' | 'down') {
  bounceAnim.value = { id, dir }
  setTimeout(() => {
    if (bounceAnim.value?.id === id) bounceAnim.value = null
  }, 350)
}

function triggerEnter(id: string) {
  enterAnim.value = { id, dir: 'in' }
  setTimeout(() => {
    if (enterAnim.value?.id === id) enterAnim.value = null
  }, 350)
}
function triggerExit(id: string) {
  exitAnim.value = { id }
  setTimeout(() => {
    if (exitAnim.value?.id === id) exitAnim.value = null
  }, 350)
}
provide('triggerEnter', triggerEnter)
provide('triggerExit', triggerExit)
const calDate = ref(new Date())
const calDir = ref(1) // -1 = 向后（左）, 1 = 向前（右）
const calTransitionName = computed(() => calDir.value < 0 ? 'cal-slide-prev' : 'cal-slide-next')

const WEEKDAY_KEYS = [
  'desktop.cal.weekday.sun',
  'desktop.cal.weekday.mon',
  'desktop.cal.weekday.tue',
  'desktop.cal.weekday.wed',
  'desktop.cal.weekday.thu',
  'desktop.cal.weekday.fri',
  'desktop.cal.weekday.sat',
]

const weekdays = computed(() => WEEKDAY_KEYS.map(k => t(k)))

const calYear = computed(() => calDate.value.getFullYear())
const calMonth = computed(() => calDate.value.getMonth())

// 中国固定日期节假日
const holidayMap: Record<string, string> = {
  '1-1': 'desktop.cal.holiday.newYear',
  '2-14': 'desktop.cal.holiday.valentine',
  '3-8': 'desktop.cal.holiday.women',
  '3-12': 'desktop.cal.holiday.arbor',
  '4-1': 'desktop.cal.holiday.fools',
  '5-1': 'desktop.cal.holiday.labor',
  '5-4': 'desktop.cal.holiday.youth',
  '6-1': 'desktop.cal.holiday.children',
  '7-1': 'desktop.cal.holiday.party',
  '8-1': 'desktop.cal.holiday.army',
  '9-10': 'desktop.cal.holiday.teacher',
  '10-1': 'desktop.cal.holiday.national',
  '12-25': 'desktop.cal.holiday.christmas',
}

function getHoliday(month: number, day: number): string | null {
  const key = holidayMap[`${month + 1}-${day}`]
  return key ? t(key) : null
}

const calDays = computed(() => {
  const year = calDate.value.getFullYear()
  const month = calDate.value.getMonth()
  const today = new Date()

  // First day of month
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay() // 0=Sun

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Days in previous month (for leading blanks)
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days: { num: number; isCurrentMonth: boolean; isToday: boolean; isWeekend: boolean; holiday: string | null }[] = []

  // Leading days from previous month
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const date = new Date(year, month - 1, d)
    days.push({
      num: d,
      isCurrentMonth: false,
      isToday: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      holiday: null
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate()
    days.push({
      num: d,
      isCurrentMonth: true,
      isToday,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      holiday: getHoliday(month, d)
    })
  }

  // Trailing days to fill 6 rows (42 cells)
  while (days.length < 42) {
    const d = days.length - startWeekday - daysInMonth + 1
    const date = new Date(year, month + 1, d)
    days.push({
      num: d,
      isCurrentMonth: false,
      isToday: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      holiday: null
    })
  }

  return days
})

function toggleCalendar() {
  showStartMenu.value = false
  showCalendar.value = !showCalendar.value
}

function calPrevMonth() {
  calDir.value = -1
  calDate.value = new Date(calDate.value.getFullYear(), calDate.value.getMonth() - 1, 1)
}

function calNextMonth() {
  calDir.value = 1
  calDate.value = new Date(calDate.value.getFullYear(), calDate.value.getMonth() + 1, 1)
}

function calPrevYear() {
  calDir.value = -1
  calDate.value = new Date(calDate.value.getFullYear() - 1, calDate.value.getMonth(), 1)
}

function calNextYear() {
  calDir.value = 1
  calDate.value = new Date(calDate.value.getFullYear() + 1, calDate.value.getMonth(), 1)
}

// ── Apps / Icons ──────────────────────
const desktopIcons = computed(() => [
  { id: 'perfcounter', label: t('desktop.app.perfcounter'), color: 'teal' },
  { id: 'webword', label: 'WebWord', color: 'blue' },
  { id: 'blog', label: t('desktop.app.blog'), color: 'green' },
  { id: 'explorer', label: t('desktop.app.explorer'), color: 'purple' },
  { id: 'browser', label: t('desktop.app.browser'), color: 'orange' },
  { id: 'settings', label: t('common.settings'), color: 'grey' },
])

const appList = computed(() => [
  { id: 'perfcounter', label: t('desktop.app.perfcounter'), desc: t('desktop.app.perfcounter.desc'), color: 'teal' },
  { id: 'webword', label: 'WebWord', desc: t('desktop.app.webword.desc'), color: 'blue' },
  { id: 'blog', label: t('desktop.app.blog'), desc: t('desktop.app.blog.desc'), color: 'green' },
  { id: 'explorer', label: t('desktop.app.explorer'), desc: t('desktop.app.explorer.desc'), color: 'purple' },
  { id: 'browser', label: t('desktop.app.browser'), desc: t('desktop.app.browser.desc'), color: 'orange' },
  { id: 'settings', label: t('common.settings'), desc: t('desktop.app.settings.desc'), color: 'grey' },
])

const appConfig = computed<Record<string, { title: string; icon: string; url: string; width?: number; height?: number }>>(() => ({
  webword: { title: 'WebWord', icon: 'webword', url: '/webword' },
  blog: { title: t('desktop.app.blog'), icon: 'blog', url: '/blog' },
  explorer: { title: t('desktop.app.explorer'), icon: 'explorer', url: '' },
  browser: { title: t('desktop.app.browser'), icon: 'browser', url: '' },
  settings: { title: t('common.settings'), icon: 'settings', url: '' },
  perfcounter: { title: t('desktop.perfcounter'), icon: 'perfcounter', url: '' },
}))

function openApp(id: string) {
  const cfg = appConfig.value[id]
  if (!cfg) return
  windows.open({ id, title: cfg.title, icon: cfg.icon as any, url: cfg.url, width: cfg.width, height: cfg.height })
  triggerEnter(id)
}

const iconSvg = (name: string) => TASK_ICONS[name] || ''

const appIconSvg = (name: string) => APP_ICONS[name] || ''

function isForeground(id: string) {
  const win = windows.windows.find(w => w.id === id)
  if (!win) return false
  return win.zIndex === windows.nextZIndex - 1 && !win.minimized
}

function isMinimized(id: string) {
  const win = windows.windows.find(w => w.id === id)
  return win ? win.minimized : false
}

function isRunning(id: string) {
  const win = windows.windows.find(w => w.id === id)
  return win ? !win.minimized : false
}

function toggleWindow(id: string) {
  const win = windows.windows.find(w => w.id === id)
  if (!win) return
  if (isForeground(id)) {
    triggerBounce(id, 'down')
    windows.minimize(id)
  } else {
    triggerBounce(id, 'up')
    if (win.minimized) win.minimized = false
    windows.bringToFront(id)
  }
}

// ── Menu controls ─────────────────────
function closeMenus() {
  showStartMenu.value = false
  showCalendar.value = false
}

function toggleStartMenu() {
  showStartMenu.value = !showStartMenu.value
}

function closeMenuThen(fn: () => void) {
  showStartMenu.value = false
  showCalendar.value = false
  fn()
}

// ── Lifecycle ─────────────────────────
onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
  window.addEventListener('wallpaper-changed', handleWallpaperChange)
  notifyDesktopReady()

  // 兼容旧链接：?action=login 曾用于评论区登录引导，现已无账号体系，直接清掉参数
  const params = new URLSearchParams(window.location.search)
  if (params.get('action') === 'login') {
    window.history.replaceState({}, '', SITE_BASE)
  }
})

onUnmounted(() => {
  clearInterval(clockTimer)
  window.removeEventListener('wallpaper-changed', handleWallpaperChange)
})
</script>

<style lang="scss" scoped>
.desktop {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  /* overflow:hidden 仍然可以被 scrollIntoView / focus 程序化滚动，把整个桌面外壳
     （图标、窗口、任务栏）一起滚走；clip 不是滚动容器，可以彻底避免 */
  overflow: clip;
  position: relative;
  font-family: 'Segoe UI', -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  user-select: none;
  color: #fff;
}

// ── Wallpaper ────────────────────────────
.wallpaper {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: var(--wallpaper-image);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  animation: wallpaper-breathe 20s ease-in-out infinite alternate;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,.15);
  }
}

@keyframes wallpaper-breathe {
  0% { transform: scale(1); }
  100% { transform: scale(1.05); }
}

// ── Desktop Icons ────────────────────────
.desktop-icons {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.desktop-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 74px;
  padding: 8px 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background .15s;
  animation: icon-appear .4s ease backwards;

  &:nth-child(1) { animation-delay: .05s; }
  &:nth-child(2) { animation-delay: .1s; }
  &:nth-child(3) { animation-delay: .15s; }
  &:nth-child(4) { animation-delay: .2s; }
  &:nth-child(5) { animation-delay: .25s; }
  &:nth-child(6) { animation-delay: .3s; }

  &:hover { background: rgba(255,255,255,.08); }
}

@keyframes icon-appear {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icon-app {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,.25);
  transition: transform .15s, box-shadow .15s;
  will-change: transform;

  :deep(span) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  :deep(svg),
  :deep(img) {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain;
  }

  &.icon-perfcounter {
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  }
  &.icon-webword {
    background: linear-gradient(135deg, #667eea 0%, #5568d3 100%);
  }
  &.icon-blog {
    background: linear-gradient(135deg, #42b883 0%, #359a6a 100%);
  }
  &.icon-explorer {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  }
  &.icon-browser {
    background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
  }
  &.icon-settings {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  }
}

.desktop-icon:hover .icon-app {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(0,0,0,.35);
}

.icon-label {
  margin-top: 6px;
  font-size: 11px;
  text-align: center;
  text-shadow: 0 1px 4px rgba(0,0,0,.8);
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ── Taskbar ──────────────────────────────
.taskbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 500;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: rgba(12,12,30,.55);
  backdrop-filter: blur(32px) saturate(1.2);
  -webkit-backdrop-filter: blur(32px) saturate(1.2);
  border-top: 1px solid rgba(255,255,255,.06);
  animation: taskbar-in .3s ease .1s backwards;
}

@keyframes taskbar-in {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.taskbar-left, .taskbar-right {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 100%;
}

.taskbar-divider {
  width: 1px;
  height: 24px;
  background: rgba(255,255,255,.12);
  margin: 0 4px;
}

.start-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: rgba(255,255,255,.85);
  border-radius: 4px;
  cursor: pointer;
  transition: all .15s;

  &:hover, &.active {
    background: rgba(255,255,255,.1);
    color: #667eea;
  }
}

.taskbar-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: rgba(255,255,255,.8);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: background .15s;

  &:hover {
    background: rgba(255,255,255,.1);

    .tb-icon {
      opacity: 1;
    }
  }

  &:active {
    background: rgba(255,255,255,.12);
  }

  // ── Highlight bar (base: hidden) ──
  &::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    border-radius: 1px;
    background: #667eea;
    opacity: 0;
    transition: all .25s cubic-bezier(.34,1.56,.64,1);
  }

  // ── Active (foreground) ──
  &.active {
    background: rgba(255,255,255,.14);

    .tb-icon {
      opacity: 1;
    }

    &::after {
      opacity: 1;
      width: 16px;
      height: 2px;
      box-shadow: 0 0 6px rgba(102,126,234,.5);
    }
  }

  // ── Running but not foreground ──
  &.running {
    &::after {
      opacity: 1;
      width: 8px;
      height: 2px;
      background: rgba(255,255,255,.3);
    }
  }

  // ── Minimized ──
  &.minimized {
    &::after {
      opacity: 1;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(255,255,255,.35);
      bottom: 3px;
      transition: all .3s cubic-bezier(.34,1.56,.64,1);
    }

    .tb-icon {
      opacity: .55;
    }
  }
}

.tb-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  opacity: .85;
  transition: opacity .2s, transform .2s cubic-bezier(.34,1.56,.64,1);

  :deep(span) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  :deep(svg),
  :deep(img) {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain;
  }
}

.taskbar-item:hover .tb-icon {
  opacity: 1;
}

// ── Enter / Exit animations (打开/关闭) ──
.taskbar-item.enter .tb-icon {
  animation: dock-enter .35s cubic-bezier(.34,1.56,.64,1);
}

.taskbar-item.exit .tb-icon {
  animation: dock-exit .25s ease-in forwards;
}

@keyframes dock-enter {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes dock-exit {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0); opacity: 0; }
}

// ── Bounce animations (最小化/还原) ──
.taskbar-item.bounce-up .tb-icon {
  animation: bounce-up .3s cubic-bezier(.34,1.56,.64,1);
}

.taskbar-item.bounce-down .tb-icon {
  animation: bounce-down .3s cubic-bezier(.34,1.56,.64,1);
}

@keyframes bounce-up {
  0% { transform: translateY(0); }
  25% { transform: translateY(-6px); }
  65% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
}

@keyframes bounce-down {
  0% { transform: translateY(0); }
  25% { transform: translateY(6px); }
  65% { transform: translateY(6px); }
  100% { transform: translateY(0); }
}

.tray-btn {
  height: 40px;
  display: flex;
  align-items: center;
  border: none;
  background: none;
  color: rgba(255,255,255,.85);
  border-radius: 4px;
  cursor: pointer;
  padding: 0 8px;
  transition: background .15s;

  &:hover { background: rgba(255,255,255,.1); }
}
.clock-btn { cursor: pointer; }

.tray-clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
  font-size: 12px;

  .tray-date { font-size: 11px; opacity: .6; }
}
// ── Start Menu ──────────────────────────
.start-menu {
  position: absolute;
  bottom: 52px;
  left: 8px;
  z-index: 600;
  width: 340px;
  max-height: 420px;
  background: rgba(12,12,30,.65);
  backdrop-filter: blur(36px) saturate(1.2);
  -webkit-backdrop-filter: blur(36px) saturate(1.2);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0,0,0,.5);
}

.start-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.start-user {
  display: flex; align-items: center; gap: 10px; font-size: 14px;
  a { color: #667eea; text-decoration: none; font-weight: 500; }
}

.start-avatar, .start-avatar-placeholder {
  width: 32px; height: 32px; border-radius: 50%; object-fit: cover;
}
.start-avatar-placeholder {
  background: #667eea; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600;
}

.start-user-name {
  background: none; border: none; color: #667eea;
  font-size: 13px; cursor: pointer; padding: 0;
  &:hover { text-decoration: underline; }
}

.start-apps {
  flex: 1; overflow-y: auto; padding: 4px 8px;
}

.start-app-item {
  width: 100%; display: flex; align-items: center; gap: 12px;
  padding: 8px 10px; border: none; background: none; border-radius: 6px;
  cursor: pointer; color: #fff; text-align: left; transition: background .15s;

  &:hover { background: rgba(255,255,255,.08); }
}

.start-app-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  :deep(span) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  :deep(svg),
  :deep(img) {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain;
  }

  &.start-perfcounter {
    background: linear-gradient(135deg,#14b8a6,#0d9488);
  }
  &.start-webword {
    background: linear-gradient(135deg,#667eea,#5568d3);
  }
  &.start-blog {
    background: linear-gradient(135deg,#42b883,#359a6a);
  }
  &.start-browser {
    background: linear-gradient(135deg,#fb923c,#ea580c);
  }
  &.start-explorer {
    background: linear-gradient(135deg,#8b5cf6,#7c3aed);
  }
  &.start-settings {
    background: linear-gradient(135deg,#64748b,#475569);
  }
}

.start-app-info {
  display: flex; flex-direction: column; line-height: 1.3;
  .start-app-name { font-size: 13px; font-weight: 500; }
  .start-app-desc { font-size: 11px; opacity: .5; }
}
// ── Calendar Popup ────────────────────────
.calendar-popup {
  position: absolute;
  bottom: 52px; right: 8px; z-index: 600;
  width: 280px;
  background: rgba(12,12,30,.65); backdrop-filter: blur(36px) saturate(1.2);
  -webkit-backdrop-filter: blur(36px) saturate(1.2);
  border: 1px solid rgba(255,255,255,.06); border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,.5);
}

.cal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}

.cal-nav {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: none; color: rgba(255,255,255,.5);
  border-radius: 6px; cursor: pointer; transition: all .15s;
  &:hover { background: rgba(255,255,255,.08); color: #fff; }
}

.cal-header-group {
  display: flex; gap: 2px;
}

.cal-title {
  font-size: 14px; font-weight: 600;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}

.cal-wd {
  text-align: center; font-size: 11px; padding: 4px 0;
  color: rgba(255,255,255,.4); font-weight: 500;
  &:first-child, &:last-child { color: rgba(255,255,255,.25); }
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-day {
  text-align: center;
  padding: 4px 2px;
  border-radius: 6px;
  cursor: default;
  transition: background .15s;
  position: relative;
  min-height: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.cal-day-num {
  font-size: 13px; line-height: 1.2;
}

.cal-day-label {
  font-size: 8px;
  color: #f59e0b;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.cal-day-other {
  .cal-day-num { color: rgba(255,255,255,.2); }
}

.cal-day-weekend:not(.cal-day-other) {
  .cal-day-num { color: rgba(255,255,255,.5); }
}

.cal-day-holiday:not(.cal-day-other) {
  .cal-day-num { color: #f59e0b; font-weight: 600; }
}

.cal-day-today {
  background: rgba(102,126,234,.25);
  .cal-day-num { color: #667eea; font-weight: 700; }
  &.cal-day-holiday .cal-day-num { color: #f59e0b; }
}

// ── Transitions ──────────────────────────
.menu-slide-enter-active, .menu-slide-leave-active { transition: all .2s ease; }
.menu-slide-enter-from, .menu-slide-leave-to { opacity: 0; transform: translateY(8px) scale(.96); }

.menu-slide-up-enter-active, .menu-slide-up-leave-active { transition: all .2s ease; }
.menu-slide-up-enter-from, .menu-slide-up-leave-to { opacity: 0; transform: translateY(8px) scale(.96); }

.cal-slide-next-enter-active, .cal-slide-next-leave-active,
.cal-slide-prev-enter-active, .cal-slide-prev-leave-active {
  transition: all .18s ease;
}
.cal-slide-next-enter-from { opacity: 0; transform: translateX(10px); }
.cal-slide-next-leave-to   { opacity: 0; transform: translateX(-10px); }
.cal-slide-prev-enter-from { opacity: 0; transform: translateX(-10px); }
.cal-slide-prev-leave-to   { opacity: 0; transform: translateX(10px); }

.dialog-fade-enter-active {
  transition: opacity .2s ease;
}
.dialog-fade-leave-active {
  transition: opacity .15s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

</style>
