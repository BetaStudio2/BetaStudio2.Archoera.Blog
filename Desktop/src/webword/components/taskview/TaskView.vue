<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/webword/stores/app'
import { useDocumentStore } from '@/webword/stores/document'
import { useAddonStore } from '@/webword/stores/addons'

const appStore = useAppStore()
const documentStore = useDocumentStore()
const addonStore = useAddonStore()
const { t } = useI18n()

const visible = ref(false)
const closing = ref(false)
const showClass = ref(false)
const showCards = ref(false)

// Sync with appStore.taskViewVisible
watch(() => appStore.taskViewVisible, (val) => {
  if (val) {
    show()
  } else if (visible.value) {
    hide()
  }
})

interface TaskCard {
  id: string
  type: 'document' | 'addon'
  icon: string
  title: string
  subtitle: string
  addonId?: string | null
  el?: HTMLElement | null
}

const activeCardId = ref<string | null>(null)
const cards = ref<TaskCard[]>([])
const cardRefs = ref<Map<string, HTMLElement>>(new Map())

const isDocOpen = computed(() => !documentStore.docClosed)

function buildCards(): void {
  const result: TaskCard[] = []

  if (isDocOpen.value) {
    result.push({
      id: 'document-main',
      type: 'document',
      icon: '📄',
      title: documentStore.docInfo.title || t('ww.taskView.untitled'),
      subtitle: t('ww.taskView.docSubtitle', {
        words: documentStore.docInfo.words,
        pages: documentStore.docInfo.pages,
      }),
      addonId: null
    })
  }

  for (const [id, meta] of addonStore.loadedAddons) {
    if (addonStore.getIntegrity(id) === 'ok') {
      result.push({
        id: `addon-${id}`,
        type: 'addon',
        icon: meta.icon
          ? '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' + meta.icon + '</svg>'
          : '📦',
        title: meta.name || id,
        subtitle: meta.desc || '',
        addonId: id
      })
    }
  }

  cards.value = result
}

function show(): void {
  buildCards()
  visible.value = true
  closing.value = false
  showCards.value = false
  // Insert DOM without .show class first, then add it to trigger CSS transition
  requestAnimationFrame(() => {
    showClass.value = true
    // 卡片在下一帧进入，确保初始 scale(0.88)/opacity(0) 已渲染
    requestAnimationFrame(() => {
      showCards.value = true
    })
  })
}

function hide(): void {
  showClass.value = false
  closing.value = true
  setTimeout(() => {
    visible.value = false
    closing.value = false
    showClass.value = false
    appStore.taskViewVisible = false
  }, 250)
}

function toggle(): void {
  if (visible.value) {
    hide()
  } else {
    appStore.taskViewVisible = true
  }
}

function onCardClick(card: TaskCard): void {
  // 拖拽后不触发点击
  if (_draggedCards.has(card.id)) return
  hide()
  if (card.type === 'document') {
    // document is already the main view
  } else if (card.type === 'addon' && card.addonId) {
    addonStore.activeAddon = card.addonId
  }
}

function onCardClose(card: TaskCard): void {
  if (card.type === 'document') {
    documentStore.closeDocument()
  } else if (card.type === 'addon' && card.addonId) {
    addonStore.unloadAddon(card.addonId)
  }

  // FLIP: measure before removal
  const oldRects = new Map<string, DOMRect>()
  cards.value.forEach(c => {
    const el = cardRefs.value.get(c.id)
    if (el) oldRects.set(c.id, el.getBoundingClientRect())
  })

  // Remove card
  cards.value = cards.value.filter(c => c.id !== card.id)

  // FLIP: animate
  nextTick(() => {
    cards.value.forEach(c => {
      const el = cardRefs.value.get(c.id)
      const oldRect = oldRects.get(c.id)
      if (el && oldRect) {
        const newRect = el.getBoundingClientRect()
        const dx = oldRect.left - newRect.left
        const dy = oldRect.top - newRect.top
        if (dx !== 0 || dy !== 0) {
          el.style.transform = `translate(${dx}px, ${dy}px)`
          el.style.transition = 'none'
          requestAnimationFrame(() => {
            el.style.transition = 'transform .35s cubic-bezier(0.34,1.56,0.64,1), opacity .3s ease'
            el.style.transform = ''
          })
        }
      }
    })
  })
}

// ── 点击空白关闭 ─────────────────────────────
function onOverlayClick(e: MouseEvent): void {
  const target = e.target as HTMLElement
  if (target.closest('.taskview-card') || target.closest('.taskview-header')) return
  appStore.taskViewVisible = false
}

// ── 滑动手势关闭插件 ─────────────────────────
// 为每个 addon 卡片维护滑动状态
const _swipeStates = new Map<string, {
  startY: number
  startX: number
  isSwiping: boolean
  cancelled: boolean
  cardHeight: number
}>()
// 持久化标记拖拽过的卡片（mouseup→click 间隔中使用）
const _draggedCards = new Set<string>()

function onSwipeStart(e: TouchEvent | MouseEvent, card: TaskCard): void {
  if (card.type !== 'addon') return
  // 清除该卡片上一次拖拽标记，重新开始判断
  _draggedCards.delete(card.id)
  const point = ('touches' in e) ? e.touches[0] : (e as MouseEvent)
  const el = cardRefs.value.get(card.id)
  if (el) {
    el.style.transition = 'transform 0s, opacity 0s'
  }
  _swipeStates.set(card.id, {
    startY: point.clientY,
    startX: point.clientX,
    isSwiping: true,
    cancelled: false,
    cardHeight: el?.offsetHeight || 220
  })
}

function onSwipeMove(e: TouchEvent | MouseEvent, card: TaskCard): void {
  const state = _swipeStates.get(card.id)
  if (!state || !state.isSwiping || state.cancelled) return

  const point = ('touches' in e) ? e.touches[0] : (e as MouseEvent)
  const deltaY = point.clientY - state.startY
  const deltaX = Math.abs(point.clientX - state.startX)

  // 标记为拖拽手势（超过 10px），阻止后续 click 触发
  if (Math.abs(deltaY) > 10 || deltaX > 10) {
    _draggedCards.add(card.id)
  }

  // 水平滑动过大则取消手势
  if (deltaX > 60 && deltaX > Math.abs(deltaY) * 1.5) {
    state.cancelled = true
    const el = cardRefs.value.get(card.id)
    if (el) { el.style.transform = ''; el.style.opacity = '' }
    return
  }

  if (Math.abs(deltaY) > 5) {
    if ('cancelable' in e && e.cancelable) e.preventDefault()
    const ratio = Math.min(1, Math.abs(deltaY) / state.cardHeight)
    const el = cardRefs.value.get(card.id)
    if (el) {
      el.style.transition = 'transform 0s, opacity 0s'
      el.style.transform = `translateY(${deltaY}px)`
      el.style.opacity = String(Math.max(0.3, 1 - ratio * 0.7))
    }
  }
}

function onSwipeEnd(e: TouchEvent | MouseEvent, card: TaskCard): void {
  const state = _swipeStates.get(card.id)
  if (!state || !state.isSwiping) return
  state.isSwiping = false
  _swipeStates.delete(card.id)

  if (state.cancelled) return

  const point = ('changedTouches' in e) ? e.changedTouches[0] : (e as MouseEvent)
  const deltaY = point.clientY - state.startY
  const deltaX = Math.abs(point.clientX - state.startX)
  const threshold = state.cardHeight * 0.5

  const el = cardRefs.value.get(card.id)
  if (Math.abs(deltaY) > threshold && deltaX < 80 && el) {
    // 超过阈值 → 滑出关闭
    el.style.transition = 'transform .25s cubic-bezier(0.4,0,0.2,1), opacity .2s ease-out'
    el.style.transform = `translateY(${deltaY > 0 ? 300 : -300}px)`
    el.style.opacity = '0'
    setTimeout(() => onCardClose(card), 200)
  } else if (el) {
    // 未超过阈值 → 回弹
    el.style.transition = 'transform .25s cubic-bezier(0.4,0,0.2,1), opacity .2s ease-out'
    el.style.transform = ''
    el.style.opacity = ''
  }
}

// 鼠标拖拽（桌面端）
function onMouseDown(e: MouseEvent, card: TaskCard): void {
  if (e.button !== 0 || card.type !== 'addon') return
  e.preventDefault() // 防止文本选中
  const overlay = document.querySelector('.taskview-overlay')
  if (overlay) overlay.classList.add('taskview-dragging')
  onSwipeStart(e, card)
  const onMove = (ev: MouseEvent) => onSwipeMove(ev, card)
  const onUp = (ev: MouseEvent) => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    if (overlay) overlay.classList.remove('taskview-dragging')
    onSwipeEnd(ev, card)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// Keyboard: Ctrl+`
function onKeydown(e: KeyboardEvent): void {
  if (e.ctrlKey && e.key === '`') {
    e.preventDefault()
    toggle()
  }
  if (visible.value && e.key === 'Escape') {
    appStore.taskViewVisible = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

// Expose
defineExpose({ show, hide, toggle, visible })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="taskview-overlay"
      :class="{ show: showClass, closing }"
      @click="onOverlayClick"
    >
      <div class="taskview-header">
        <span class="taskview-title">{{ $t('ww.taskView.title') }}</span>
      </div>

      <div class="taskview-grid-wrap">
        <div class="taskview-grid">
          <div
            v-for="(card, idx) in cards"
            :key="card.id"
            :ref="(el) => { if (el) cardRefs.set(card.id, el as HTMLElement) }"
            class="taskview-card"
            :class="{
              visible: showCards,
              active: activeCardId === card.id,
              [card.type]: true
            }"
            :style="{ '--anim-delay': `${idx * 0.04}s` }"
            @click="onCardClick(card)"
            @touchstart="onSwipeStart($event, card)"
            @touchmove="onSwipeMove($event, card)"
            @touchend="onSwipeEnd($event, card)"
            @mousedown="onMouseDown($event, card)"
          >
            <!-- Preview area -->
            <div class="taskview-card-preview">
              <div class="taskview-card-placeholder">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <template v-if="card.type === 'document'">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
                  </template>
                  <template v-else>
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16zM6 7h5v5H6V7zm0 7h12v2H6v-2zm7-7h5v2h-5V7z"/>
                  </template>
                </svg>
                <span>{{ card.type === 'document' ? $t('ww.taskView.docPreview') : $t('ww.taskView.addonPreview') }}</span>
              </div>
            </div>

            <!-- Card footer -->
            <div class="taskview-card-footer">
              <div class="taskview-card-icon" :class="card.type" v-html="card.icon"></div>
              <div class="taskview-card-info">
                <div class="taskview-card-title">{{ card.title }}</div>
                <div class="taskview-card-subtitle">{{ card.subtitle }}</div>
              </div>
              <button
                class="taskview-card-close"
                @click.stop="onCardClose(card)"
                :title="$t('common.close')"
              >✕</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
