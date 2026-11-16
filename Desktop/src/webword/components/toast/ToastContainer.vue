<script setup lang="ts">
import { reactive } from 'vue'

interface ToastEntry {
  id: number
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
  duration: number
  timer: ReturnType<typeof setTimeout> | null
  barTimer: ReturnType<typeof requestAnimationFrame> | null
  removing: boolean
}

let uid = 0
const toasts = reactive<ToastEntry[]>([])

function addToast(message: string, type: ToastEntry['type'] = 'info', duration: number = 3000): void {
  const id = ++uid
  const entry: ToastEntry = reactive({
    id,
    message,
    type,
    duration,
    timer: null,
    barTimer: null,
    removing: false
  })
  toasts.push(entry)

  // Animate progress bar
  const start = performance.now()
  const animateBar = () => {
    const elapsed = performance.now() - start
    const progress = Math.min(elapsed / duration, 1)
    if (progress < 1 && !entry.removing) {
      entry.barTimer = requestAnimationFrame(animateBar)
    }
  }
  entry.barTimer = requestAnimationFrame(animateBar)

  entry.timer = setTimeout(() => removeToast(entry), duration)
}

function removeToast(entry: ToastEntry): void {
  if (entry.removing) return
  entry.removing = true
  if (entry.timer) clearTimeout(entry.timer)
  if (entry.barTimer) cancelAnimationFrame(entry.barTimer)

  setTimeout(() => {
    const idx = toasts.indexOf(entry)
    if (idx !== -1) toasts.splice(idx, 1)
  }, 250)
}

function onClickToast(entry: ToastEntry): void {
  removeToast(entry)
}

// Watch lastToast changes from the existing useToast to add to reactive array
// Expose methods
defineExpose({ addToast, removeToast, toasts })
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast-entry"
        :class="[`toast-${t.type}`, { 'toast-removing': t.removing }]"
        @click="onClickToast(t)"
      >
        <div class="toast-content">
          <span class="toast-icon">
            <template v-if="t.type === 'info'">ℹ</template>
            <template v-else-if="t.type === 'success'">✓</template>
            <template v-else-if="t.type === 'error'">✕</template>
            <template v-else-if="t.type === 'warning'">⚠</template>
          </span>
          <span class="toast-message">{{ t.message }}</span>
        </div>
        <div class="toast-progress">
          <div class="toast-progress-bar" :class="`toast-progress-${t.type}`" />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast-entry {
  position: relative;
  min-width: 260px;
  max-width: 80vw;
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
  font-size: 13px;
  color: #fff;
  overflow: hidden;
  pointer-events: auto;
  cursor: pointer;
  transform-origin: top right;
  transition: opacity 0.25s ease, transform 0.25s ease;
}

/* Type-specific backgrounds and borders */
.toast-entry.toast-error   { background: #2a1818; border-color: #6b2424; }
.toast-entry.toast-success { background: #162a1f; border-color: #1f5234; }
.toast-entry.toast-info    { background: #16202d; border-color: #2a4a6b; }
.toast-entry.toast-warning { background: #2a2114; border-color: #6b4a1f; }

.toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toast-icon {
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}
.toast-entry.toast-error .toast-icon   { color: #c0392b; }
.toast-entry.toast-success .toast-icon { color: #27ae60; }
.toast-entry.toast-info .toast-icon    { color: #3498db; }
.toast-entry.toast-warning .toast-icon { color: #d68910; }

.toast-message {
  flex: 1;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
}

.toast-progress-bar {
  height: 100%;
  width: 100%;
  transform-origin: left center;
  animation: toast-progress-shrink var(--toast-duration, 3s) linear forwards;
}
.toast-entry.toast-error .toast-progress-bar   { background: #c0392b; }
.toast-entry.toast-success .toast-progress-bar { background: #27ae60; }
.toast-entry.toast-info .toast-progress-bar    { background: #3498db; }
.toast-entry.toast-warning .toast-progress-bar { background: #d68910; }

@keyframes toast-progress-shrink {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

/* TransitionGroup animations */
.toast-enter-active {
  transition: all 0.25s ease;
}
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-removing {
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.25s ease;
}
</style>
