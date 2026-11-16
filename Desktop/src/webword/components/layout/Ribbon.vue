<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/webword/stores/app'
import { useFormat } from '@/webword/composables/useFormat'
import { useZoom } from '@/webword/composables/useZoom'
import Dropdown from '@/webword/components/format/Dropdown.vue'
import ColorPicker from '@/webword/components/format/ColorPicker.vue'
import InsertLinkPopup from '@/webword/components/format/InsertLinkPopup.vue'
import InsertTablePopup from '@/webword/components/format/InsertTablePopup.vue'
import InsertImagePopup from '@/webword/components/format/InsertImagePopup.vue'

interface DropdownItem {
  label: string
  value: string | number
  active?: boolean
}

const appStore = useAppStore()
const activeTab = computed(() => appStore.activeTab)
const format = useFormat()
const zoom = useZoom()
const { t } = useI18n()

// ---- Drawing state ----
const drawTool = ref<string>('pen')
const drawColor = ref('#1a1a1a')
const drawSize = ref(3)

// ---- Heading style items ----
const headingItems = computed<DropdownItem[]>(() => [
  { label: t('ww.ribbon.bodyText'), value: 'P' },
  { label: t('ww.ribbon.headingN', { n: 1 }), value: 'H1' },
  { label: t('ww.ribbon.headingN', { n: 2 }), value: 'H2' },
  { label: t('ww.ribbon.headingN', { n: 3 }), value: 'H3' },
  { label: t('ww.ribbon.headingN', { n: 4 }), value: 'H4' },
  { label: t('ww.ribbon.headingN', { n: 5 }), value: 'H5' },
  { label: t('ww.ribbon.headingN', { n: 6 }), value: 'H6' },
])
const currentHeading = ref('P')

// ---- Line spacing items ----
const lineSpacingItems: DropdownItem[] = [
  { label: '1.0', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: '2.0', value: '2' },
  { label: '2.5', value: '2.5' },
  { label: '3.0', value: '3' },
]
const currentLineSpacing = ref('1.5')

// ---- Draw size items ----
const drawSizeItems: DropdownItem[] = [
  '1', '2', '3', '5', '8', '12', '16', '24',
].map(s => ({ label: `${s}px`, value: s }))

const ribbonVisibility = computed(() => ({
  ribbonStart:    activeTab.value === 'start',
  ribbonFont:     activeTab.value === 'start',
  ribbonParagraph:activeTab.value === 'start',
  ribbonEditing:  activeTab.value === 'start',
  ribbonLayout:   activeTab.value === 'start',
  ribbonInsert:   activeTab.value === 'insert',
  ribbonDraw:     activeTab.value === 'draw',
  ribbonView:     activeTab.value === 'view',
  ribbonHelp:     activeTab.value === 'help',
}))

// ---- Popup state ----
type PopupName =
  | 'fontFamily'
  | 'fontSize'
  | 'fontColor'
  | 'highlightColor'
  | 'insertLink'
  | 'insertTable'
  | 'headingStyle'
  | 'lineSpacing'
  | 'drawSize'
  | 'drawColor'

const activePopup = ref<PopupName | null>(null)
const popupPosition = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })

// ---- Font family items ----
const fontFamilyItems: DropdownItem[] = [
  { label: 'MiSans', value: 'MiSans' },
  { label: 'SimSun', value: 'SimSun' },
  { label: 'KaiTi', value: 'KaiTi' },
  { label: 'Microsoft YaHei', value: 'Microsoft YaHei' },
]
const currentFontFamily = ref('MiSans')

// ---- Font size items ----
const fontSizeItems: DropdownItem[] = [
  '8', '9', '10', '11', '12', '14', '16', '18', '20',
  '24', '28', '32', '36', '48', '72',
].map(size => ({ label: size, value: size }))
const currentFontSize = ref('16')

// ---- Color swatches ----
const currentFontColor = ref('#e2e8f2')
const currentHighlightColor = ref('#ffff00')

// ---- Insert image picker (no popup UI, just file dialog) ----
const insertImageRef = ref<InstanceType<typeof InsertImagePopup> | null>(null)

// ---- Computed dropdown items with active flag ----
const fontFamilyItemsComputed = computed<DropdownItem[]>(() =>
  fontFamilyItems.map(item => ({ ...item, active: item.value === currentFontFamily.value }))
)
const fontSizeItemsComputed = computed<DropdownItem[]>(() =>
  fontSizeItems.map(item => ({ ...item, active: item.value === currentFontSize.value }))
)

// ---- Popup helpers ----
function computePosition(el: HTMLElement, offset = 4): { top: string; left: string } {
  const rect = el.getBoundingClientRect()
  return {
    top: `${rect.bottom + offset}px`,
    left: `${rect.left}px`,
  }
}

function togglePopup(name: PopupName, e: MouseEvent) {
  if (activePopup.value === name) {
    activePopup.value = null
    return
  }
  const target = e.currentTarget as HTMLElement
  popupPosition.value = computePosition(target)
  activePopup.value = name
}

function closePopup() {
  activePopup.value = null
}

// ---- Outside click handler ----
// Trigger buttons use @click.stop so they don't reach here.
// Popup roots use @click.stop so internal clicks don't reach here.
// Any click reaching here is an outside click → close.
function onDocumentClick() {
  if (activePopup.value !== null) {
    closePopup()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

// ---- Popup event handlers ----
function onFontFamilySelect(value: string | number) {
  const v = String(value)
  currentFontFamily.value = v
  format.setFont(v)
  closePopup()
}

function onFontSizeSelect(value: string | number) {
  const v = String(value)
  currentFontSize.value = v
  format.setFontSize(`${v}px`)
  closePopup()
}

function onFontColorSelect(color: string) {
  currentFontColor.value = color
  format.foreColor(color)
}

function onHighlightColorSelect(color: string) {
  currentHighlightColor.value = color
  format.hiliteColor(color)
}

function onInsertLink(payload: { url: string; text: string }) {
  format.insertLink(payload.url, payload.text)
  closePopup()
}

function onInsertTable(payload: { rows: number; cols: number }) {
  format.insertTable(payload.rows, payload.cols)
  closePopup()
}

function onInsertImage(payload: { src: string; alt?: string }) {
  format.insertImage(payload.src, payload.alt)
}

function onInsertImageClick() {
  insertImageRef.value?.openFilePicker()
}

// ---- Format button handlers ----
function onPaste() { format.paste() }
function onCut() { format.cut() }
function onCopy() { format.copy() }
function onBold() { format.bold() }
function onItalic() { format.italic() }
function onUnderline() { format.underline() }
function onStrike() { format.strikethrough() }
function onClearFormat() { format.removeFormat() }
function onHighlight() { format.hiliteColor(currentHighlightColor.value) }

// ---- Paragraph handlers ----
function onAlignLeft() { format.alignLeft() }
function onAlignCenter() { format.alignCenter() }
function onAlignRight() { format.alignRight() }
function onJustify() { format.alignJustify() }
function onIndent() { format.indent() }
function onOutdent() { format.outdent() }
function onBullet() { format.insertUnorderedList() }
function onNumbering() { format.insertOrderedList() }

// ---- Editing handlers ----
function onUndo() { format.undo() }
function onRedo() { format.redo() }
function onFind() { format.findReplace() }
function onReplace() { format.findReplace() }

// ---- Layout handlers ----
function onSuperscript() { format.superscript() }
function onSubscript() { format.subscript() }
function onHeadingSelect(value: string | number) {
  const v = String(value)
  currentHeading.value = v
  format.setHeading(parseInt(v.replace('H', '')) || 0)
  closePopup()
}
function onLineSpacingSelect(value: string | number) {
  const v = String(value)
  currentLineSpacing.value = v
  format.lineSpacing(parseFloat(v))
  closePopup()
}

// ---- View handlers ----
function onToggleNav() { appStore.setCollapsed(!appStore.collapsed) }
function onZoomIn() { zoom.zoomIn() }
function onZoomOut() { zoom.zoomOut() }

// ---- Help handlers ----
function onAbout() { appStore.showAboutModal() }

// ---- Drawing handlers ----
function onDrawTool(tool: string) {
  drawTool.value = tool
  // Dispatch custom event for DrawCanvas to pick up
  window.dispatchEvent(new CustomEvent('webword:draw-tool', { detail: { tool } }))
}
function onDrawColorSelect(color: string) {
  drawColor.value = color
  window.dispatchEvent(new CustomEvent('webword:draw-color', { detail: { color } }))
}
function onDrawSizeSelect(value: string | number) {
  drawSize.value = Number(value)
  window.dispatchEvent(new CustomEvent('webword:draw-size', { detail: { size: Number(value) } }))
  closePopup()
}
function onDrawUndo() {
  window.dispatchEvent(new Event('webword:draw-undo'))
}
function onDrawClear() {
  window.dispatchEvent(new Event('webword:draw-clear'))
}

// Adapter for v-model:visible pattern
function makeVisibleHandler() {
  return (v: boolean) => {
    if (!v) closePopup()
  }
}
const onVisibleChange = makeVisibleHandler()
</script>

<template>
  <section class="ribbon" :aria-label="$t('ww.ribbon.ariaLabel')">
    <!-- 剪贴板 -->
    <div v-show="ribbonVisibility.ribbonStart" id="ribbonStart" class="group">
      <div class="group-body">
        <button id="pasteBtn" :title="$t('common.paste')" @click="onPaste">📋 {{ $t('common.paste') }}</button>
        <button id="cutBtn" :title="$t('common.cut')" @click="onCut">✂ {{ $t('common.cut') }}</button>
        <button id="copyBtn" :title="$t('common.copy')" @click="onCopy">📄 {{ $t('common.copy') }}</button>
      </div>
      <div class="group-title">{{ $t('ww.ribbon.clipboard') }}</div>
    </div>

    <!-- 字体 -->
    <div v-show="ribbonVisibility.ribbonFont" id="ribbonFont" class="group">
      <div class="group-body">
        <button
          id="fontFamily"
          class="dropdown-btn"
          :title="$t('ww.ribbon.font')"
          data-dropdown="fontFamily"
          :data-value="currentFontFamily"
          @click.stop="togglePopup('fontFamily', $event)"
        >{{ currentFontFamily }}</button>
        <button
          id="fontSize"
          class="dropdown-btn"
          :title="$t('ww.ribbon.fontSize')"
          data-dropdown="fontSize"
          :data-value="currentFontSize"
          @click.stop="togglePopup('fontSize', $event)"
        >{{ currentFontSize }}</button>
        <button id="boldBtn" :title="$t('ww.ribbon.bold')" @click="onBold"><b>B</b></button>
        <button id="italicBtn" :title="$t('ww.ribbon.italic')" @click="onItalic"><i>I</i></button>
        <button id="underlineBtn" :title="$t('ww.ribbon.underline')" @click="onUnderline"><u>U</u></button>
        <button id="strikeBtn" :title="$t('ww.ribbon.strikethrough')" @click="onStrike"><s>S</s></button>
        <div
          class="color-swatch"
          id="fontColorSwatch"
          :title="$t('ww.ribbon.fontColor')"
          :data-color="currentFontColor"
          @click.stop="togglePopup('fontColor', $event)"
        >
          <span class="color-swatch-fill"></span>
          <svg class="color-swatch-icon" viewBox="0 0 16 16">
            <text x="8" y="12" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">A</text>
            <rect class="swatch-accent" x="3.5" y="13" width="9" height="2" rx="1" :fill="currentFontColor"/>
          </svg>
        </div>
        <button id="clearFormatBtn" :title="$t('ww.ribbon.clearFormat')" @click="onClearFormat">
          <svg width="14" height="14" viewBox="0 0 16 16" style="vertical-align:middle">
            <rect x="1" y="8" width="13" height="5" rx="1.5" fill="none" stroke="#c2cad8" stroke-width="1.2"/>
            <rect x="0" y="6" width="3" height="5" rx=".8" fill="#c2cad8"/>
            <rect x="12" y="9" width="1.5" height="3" rx=".5" fill="#c2cad8"/>
          </svg>
        </button>
        <button id="highlightBtn" :title="$t('ww.ribbon.highlight')" @click="onHighlight">🖍</button>
        <div
          class="color-swatch"
          id="highlightColorSwatch"
          :title="$t('ww.ribbon.highlightColor')"
          :data-color="currentHighlightColor"
          @click.stop="togglePopup('highlightColor', $event)"
        >
          <span class="color-swatch-fill"></span>
          <svg class="color-swatch-icon" viewBox="0 0 16 16">
            <rect class="swatch-accent" x="2" y="6" width="12" height="4" rx="2" :fill="currentHighlightColor"/>
            <rect x="3" y="7" width="10" height="1" rx=".5" fill="rgba(0,0,0,.15)"/>
          </svg>
        </div>
      </div>
      <div class="group-title">{{ $t('ww.ribbon.font') }}</div>
    </div>

    <!-- 段落 -->
    <div v-show="ribbonVisibility.ribbonParagraph" id="ribbonParagraph" class="group">
      <div class="group-body">
        <button id="alignLeftBtn" :title="$t('ww.ribbon.alignLeft')" @click="onAlignLeft">⬅</button>
        <button id="alignCenterBtn" :title="$t('ww.ribbon.alignCenter')" @click="onAlignCenter">⬌</button>
        <button id="alignRightBtn" :title="$t('ww.ribbon.alignRight')" @click="onAlignRight">➡</button>
        <button id="justifyBtn" :title="$t('ww.ribbon.justify')" @click="onJustify">⇹</button>
        <button id="indentBtn" :title="$t('ww.ribbon.indent')" @click="onIndent">→|</button>
        <button id="outdentBtn" :title="$t('ww.ribbon.outdent')" @click="onOutdent">|←</button>
        <button id="bulletBtn" :title="$t('ww.ribbon.bulletList')" @click="onBullet">•≡</button>
        <button id="numberingBtn" :title="$t('ww.ribbon.numberedList')" @click="onNumbering">1≡</button>
      </div>
      <div class="group-title">{{ $t('ww.ribbon.paragraph') }}</div>
    </div>

    <!-- 编辑 -->
    <div v-show="ribbonVisibility.ribbonEditing" id="ribbonEditing" class="group">
      <div class="group-body">
        <button id="undoBtn" :title="$t('ww.ribbon.undo')" @click="onUndo">↩</button>
        <button id="redoBtn" :title="$t('ww.ribbon.redo')" @click="onRedo">↪</button>
        <button id="findBtn" :title="$t('ww.ribbon.find')" @click="onFind">🔍 {{ $t('ww.ribbon.find') }}</button>
        <button id="replaceBtn" :title="$t('ww.ribbon.replace')" @click="onReplace">⇆ {{ $t('ww.ribbon.replace') }}</button>
      </div>
      <div class="group-title">{{ $t('common.edit') }}</div>
    </div>

    <!-- 排版 -->
    <div v-show="ribbonVisibility.ribbonLayout" id="ribbonLayout" class="group">
      <div class="group-body">
        <button id="superscriptBtn" :title="$t('ww.ribbon.superscript')" @click="onSuperscript">x²</button>
        <button id="subscriptBtn" :title="$t('ww.ribbon.subscript')" @click="onSubscript">x₂</button>
        <button
          id="headingStyle"
          class="dropdown-btn"
          :title="$t('ww.ribbon.headingStyle')"
          data-dropdown="headingStyle"
          :data-value="currentHeading"
          @click.stop="togglePopup('headingStyle', $event)"
        >{{ headingItems.find(i => i.value === currentHeading)?.label || $t('ww.ribbon.bodyText') }}</button>
        <button
          id="lineSpacing"
          class="dropdown-btn"
          :title="$t('ww.ribbon.lineSpacing')"
          data-dropdown="lineSpacing"
          :data-value="currentLineSpacing"
          @click.stop="togglePopup('lineSpacing', $event)"
        >{{ currentLineSpacing }}</button>
      </div>
      <div class="group-title">{{ $t('ww.ribbon.typography') }}</div>
    </div>

    <!-- 插入 -->
    <div v-show="ribbonVisibility.ribbonInsert" id="ribbonInsert" class="group">
      <div class="group-body">
        <button id="insertImageBtn" :title="$t('ww.ribbon.insertImage')" @click.stop="onInsertImageClick">🖼 {{ $t('ww.ribbon.image') }}</button>
        <button id="insertLinkBtn" :title="$t('ww.ribbon.insertLink')" @click.stop="togglePopup('insertLink', $event)">🔗 {{ $t('ww.ribbon.link') }}</button>
        <button id="insertTableBtn" :title="$t('ww.ribbon.insertTable')" @click.stop="togglePopup('insertTable', $event)">⊞ {{ $t('ww.ribbon.table') }}</button>
      </div>
      <div class="group-title">{{ $t('ww.tabs.insert') }}</div>
    </div>

    <!-- 视图 -->
    <div v-show="ribbonVisibility.ribbonView" id="ribbonView" class="group">
      <div class="group-body">
        <button id="toggleNavBtn" :title="$t('ww.ribbon.toggleNav')" @click="onToggleNav">📑 {{ $t('ww.ribbon.navPane') }}</button>
        <button id="zoomInBtn" :title="$t('ww.ribbon.zoomIn')" @click="onZoomIn">🔍+</button>
        <button id="zoomOutBtn" :title="$t('ww.ribbon.zoomOut')" @click="onZoomOut">🔍-</button>
      </div>
      <div class="group-title">{{ $t('ww.tabs.view') }}</div>
    </div>

    <!-- 帮助 -->
    <div v-show="ribbonVisibility.ribbonHelp" id="ribbonHelp" class="group">
      <div class="group-body">
        <button id="aboutBtn" :title="$t('common.about')" @click="onAbout">ℹ️ {{ $t('common.about') }}</button>
      </div>
      <div class="group-title">{{ $t('common.about') }}</div>
    </div>

    <!-- 绘图 -->
    <div v-show="ribbonVisibility.ribbonDraw" id="ribbonDraw" class="group">
      <div class="group-body">
        <button id="drawSelect" class="draw-tool" :title="$t('ww.ribbon.drawSelectMode')" data-tool="select" @click="onDrawTool('select')">👆 {{ $t('ww.ribbon.drawSelect') }}</button>
        <button id="drawPen" class="draw-tool" :title="$t('ww.ribbon.pen')" data-tool="pen" @click="onDrawTool('pen')">✒ {{ $t('ww.ribbon.pen') }}</button>
        <button id="drawGelPen" class="draw-tool" :title="$t('ww.ribbon.gelPen')" data-tool="gelpen" @click="onDrawTool('gelpen')">🖊 {{ $t('ww.ribbon.gelPen') }}</button>
        <button id="drawPencil" class="draw-tool" :title="$t('ww.ribbon.pencil')" data-tool="pencil" @click="onDrawTool('pencil')">✏ {{ $t('ww.ribbon.pencil') }}</button>
        <button id="drawBrush" class="draw-tool" :title="$t('ww.ribbon.brush')" data-tool="brush" @click="onDrawTool('brush')">🖌 {{ $t('ww.ribbon.brush') }}</button>
        <button id="drawMarker" class="draw-tool" :title="$t('ww.ribbon.marker')" data-tool="marker" @click="onDrawTool('marker')">🖍 {{ $t('ww.ribbon.marker') }}</button>
        <button id="drawHighlighter" class="draw-tool" :title="$t('ww.ribbon.highlighter')" data-tool="highlighter" @click="onDrawTool('highlighter')">🖍 {{ $t('ww.ribbon.highlighter') }}</button>
        <button id="drawLaser" class="draw-tool" :title="$t('ww.ribbon.laser')" data-tool="laser" @click="onDrawTool('laser')">🔦 {{ $t('ww.ribbon.laserShort') }}</button>
        <button id="drawEraser" class="draw-tool" :title="$t('ww.ribbon.eraser')" data-tool="eraser" @click="onDrawTool('eraser')">🧹 {{ $t('ww.ribbon.eraser') }}</button>
        <div class="color-swatch" id="drawColorSwatch" :title="$t('ww.ribbon.drawColor')" :data-color="drawColor" @click.stop="togglePopup('drawColor', $event)">
          <span class="color-swatch-fill" :style="{ background: drawColor }"></span>
        </div>
        <button
          id="drawSize"
          class="dropdown-btn"
          :title="$t('ww.ribbon.brushSize')"
          data-dropdown="drawSize"
          :data-value="drawSize"
          @click.stop="togglePopup('drawSize', $event)"
        >{{ drawSize }}px</button>
        <button id="drawUndo" :title="$t('common.undo')" @click="onDrawUndo">↩ {{ $t('common.undo') }}</button>
        <button id="drawClear" :title="$t('ww.ribbon.clearDrawings')" @click="onDrawClear">🗑 {{ $t('ww.ribbon.clearDraw') }}</button>
      </div>
      <div class="group-title">{{ $t('ww.tabs.draw') }}</div>
    </div>
  </section>

  <!-- Format popups: teleported to body to avoid ribbon overflow clipping -->
  <Teleport to="body">
    <Dropdown
      :visible="activePopup === 'fontFamily'"
      :items="fontFamilyItemsComputed"
      :position="popupPosition"
      @update:visible="onVisibleChange"
      @select="onFontFamilySelect"
    />
    <Dropdown
      :visible="activePopup === 'fontSize'"
      :items="fontSizeItemsComputed"
      :position="popupPosition"
      @update:visible="onVisibleChange"
      @select="onFontSizeSelect"
    />
    <ColorPicker
      :visible="activePopup === 'fontColor'"
      :initial-color="currentFontColor"
      :position="popupPosition"
      @update:visible="onVisibleChange"
      @select="onFontColorSelect"
    />
    <ColorPicker
      :visible="activePopup === 'highlightColor'"
      :initial-color="currentHighlightColor"
      :position="popupPosition"
      @update:visible="onVisibleChange"
      @select="onHighlightColorSelect"
    />
    <InsertLinkPopup
      :visible="activePopup === 'insertLink'"
      :position="popupPosition"
      @update:visible="onVisibleChange"
      @insert="onInsertLink"
    />
    <InsertTablePopup
      :visible="activePopup === 'insertTable'"
      :position="popupPosition"
      @update:visible="onVisibleChange"
      @insert="onInsertTable"
    />
    <!-- Heading style dropdown -->
    <Dropdown
      :visible="activePopup === 'headingStyle'"
      :items="headingItems.map(i => ({ ...i, active: i.value === currentHeading }))"
      :position="popupPosition"
      @update:visible="onVisibleChange"
      @select="onHeadingSelect"
    />
    <!-- Line spacing dropdown -->
    <Dropdown
      :visible="activePopup === 'lineSpacing'"
      :items="lineSpacingItems.map(i => ({ ...i, active: i.value === currentLineSpacing }))"
      :position="popupPosition"
      @update:visible="onVisibleChange"
      @select="onLineSpacingSelect"
    />
    <!-- Draw size dropdown -->
    <Dropdown
      :visible="activePopup === 'drawSize'"
      :items="drawSizeItems.map(i => ({ ...i, active: Number(i.value) === drawSize }))"
      :position="popupPosition"
      @update:visible="onVisibleChange"
      @select="onDrawSizeSelect"
    />
    <!-- Draw color picker -->
    <ColorPicker
      :visible="activePopup === 'drawColor'"
      :initial-color="drawColor"
      :position="popupPosition"
      @update:visible="onVisibleChange"
      @select="onDrawColorSelect"
    />
    <!-- Hidden image picker: just opens the native file dialog -->
    <InsertImagePopup ref="insertImageRef" @insert="onInsertImage" />
  </Teleport>
</template>
