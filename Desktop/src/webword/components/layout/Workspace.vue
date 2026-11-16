<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useDocumentStore } from '@/webword/stores/document'
import DrawCanvas from '@/webword/components/draw/DrawCanvas.vue'

const documentStore = useDocumentStore()
const emit = defineEmits<{
  input: [ev: Event]
  selectionchange: [ev: Event]
}>()

const docRef = ref<HTMLDivElement | null>(null)
const paperWrapRef = ref<HTMLDivElement | null>(null)
const workspaceRef = ref<HTMLElement | null>(null)

const zoom = ref(100)

const isFirefox = /Firefox|Zen|Mozilla\/5\.0.*Gecko/i.test(navigator.userAgent) &&
  !/Chrome|Edg|Safari/i.test(navigator.userAgent.replace(/Mozilla|Gecko|Firefox|Zen/g, ''))

function applyZoom(val: number) {
  zoom.value = val
  const wrap = paperWrapRef.value
  const workspace = workspaceRef.value
  if (!wrap) return
  const scale = val / 100

  if (isFirefox) {
    wrap.classList.add('ff-zoom-mode')
    wrap.style.removeProperty('zoom')
    wrap.style.transform = `scale(${scale})`
    wrap.style.transformOrigin = 'top center'
    if (workspace) {
      workspace.style.setProperty('--ff-zoom-scale', String(scale))
      workspace.classList.add('ff-zoom-mode')
    }
  } else {
    wrap.classList.remove('ff-zoom-mode')
    wrap.style.setProperty('zoom', `${val}%`)
    wrap.style.removeProperty('transform')
    if (workspace) {
      workspace.style.removeProperty('--ff-zoom-scale')
      workspace.classList.remove('ff-zoom-mode')
    }
  }
}

watch(() => documentStore.zoom, (val: number) => {
  applyZoom(val)
}, { immediate: true })

onMounted(() => {
  const el = document.getElementById('workspace')
  if (el) workspaceRef.value = el
  applyZoom(documentStore.zoom)
})

// Handle content changes — only store, don't re-render
// Guard: only react to direct edits on the contenteditable div,
// not bubbled events from child elements (e.g. <input type="range">)
function onInput(ev: Event) {
  if (ev.target !== docRef.value) return
  const el = ev.target as HTMLDivElement
  documentStore.setContent(el.innerHTML)
  emit('input', ev)
}

function onSelectionChange(ev: Event) {
  emit('selectionchange', ev)
}

// One-way sync: store → DOM only when content is loaded externally
// Skip when DOM already matches (avoids destroying contenteditable state)
// Re-create <script> tags after innerHTML assignment so they execute
watch(() => documentStore.content, (html) => {
  const el = docRef.value
  if (!el) return
  if (el.innerHTML === html) return
  el.innerHTML = html
  el.querySelectorAll('script').forEach((s) => {
    const ns = document.createElement('script')
    for (let i = 0; i < s.attributes.length; i++) {
      ns.setAttribute(s.attributes[i].name, s.attributes[i].value)
    }
    ns.textContent = s.textContent
    s.replaceWith(ns)
  })
})
</script>

<template>
  <section
    id="workspace"
    ref="workspaceRef"
    class="workspace"
    :class="{ 'doc-closed': documentStore.docClosed, 'ff-zoom-mode': isFirefox }"
  >
    <div
      id="paperWrap"
      ref="paperWrapRef"
      class="paper-wrap"
      :class="{ 'ff-zoom-mode': isFirefox }"
    >
      <article class="paper">
        <div
          id="doc"
          ref="docRef"
          class="content"
          :contenteditable="true"
          @input="onInput"
          @selectionchange="onSelectionChange"
        ></div>
      </article>
    </div>
    <DrawCanvas />
  </section>
</template>

<style scoped>
.workspace.ff-zoom-mode .paper-wrap {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  width: calc(100% / var(--ff-zoom-scale, 1));
  height: calc(100% / var(--ff-zoom-scale, 1));
  transform-origin: top left;
}

.workspace.ff-zoom-mode .paper,
.workspace.ff-zoom-mode .content {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
