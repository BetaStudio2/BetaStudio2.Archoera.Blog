import { ref } from 'vue'
import i18n from '@/i18n'

const t = (key: string): string => (i18n.global as any).t(key)

function exec(cmd: string, value?: string): boolean {
  try {
    if (value !== undefined) {
      return document.execCommand(cmd, false, value)
    }
    return document.execCommand(cmd)
  } catch {
    return false
  }
}

export function useFormat() {
  const currentFont = ref('MiSans')
  const currentFontSize = ref('16px')
  const currentForeColor = ref('#000000')
  const currentHiliteColor = ref('#ffff00')

  // inline toggles
  function bold() { exec('bold') }
  function italic() { exec('italic') }
  function underline() { exec('underline') }
  function strikethrough() { exec('strikeThrough') }
  function superscript() { exec('superscript') }
  function subscript() { exec('subscript') }

  // block formatting
  function alignLeft() { exec('justifyLeft') }
  function alignCenter() { exec('justifyCenter') }
  function alignRight() { exec('justifyRight') }
  function alignJustify() { exec('justifyFull') }
  function indent() { exec('indent') }
  function outdent() { exec('outdent') }
  function insertUnorderedList() { exec('insertUnorderedList') }
  function insertOrderedList() { exec('insertOrderedList') }

  function setHeading(level: number) {
    const tag = level >= 1 && level <= 6 ? `H${level}` : 'P'
    exec('formatBlock', tag)
  }

  function setParagraph() {
    exec('formatBlock', 'P')
  }

  function lineSpacing(multiplier: number) {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    const container = range.commonAncestorContainer
    const block = container.nodeType === 3
      ? container.parentElement
      : container as HTMLElement
    if (block) {
      const el = block.closest?.('p,div,h1,h2,h3,h4,h5,h6,li') as HTMLElement
      if (el) {
        el.style.lineHeight = String(multiplier)
      }
    }
  }

  function setFontSize(size: string) {
    currentFontSize.value = size
    exec('fontSize', '7')
    const fontElements = document.querySelectorAll('font[size="7"]')
    fontElements.forEach(el => {
      const span = document.createElement('span')
      span.style.fontSize = size
      span.innerHTML = el.innerHTML
      el.parentNode?.replaceChild(span, el)
    })
  }

  function setFont(font: string) {
    currentFont.value = font
    exec('fontName', font)
  }

  function foreColor(color: string) {
    currentForeColor.value = color
    exec('foreColor', color)
  }

  function hiliteColor(color: string) {
    currentHiliteColor.value = color
    exec('hiliteColor', color)
  }

  function undo() { exec('undo') }
  function redo() { exec('redo') }
  function copy() { exec('copy') }
  function cut() { exec('cut') }
  function paste() { exec('paste') }

  function removeFormat() { exec('removeFormat') }

  function insertImage(src: string, alt?: string) {
    const docEl = document.getElementById('doc')
    if (!docEl) return

    const img = document.createElement('img')
    img.src = src
    img.alt = alt || ''

    docEl.focus()
    const sel = window.getSelection()

    if (!sel || sel.rangeCount === 0) {
      docEl.appendChild(img)
      docEl.dispatchEvent(new Event('input', { bubbles: true }))
      return
    }

    const range = sel.getRangeAt(0)
    if (!docEl.contains(range.commonAncestorContainer)) {
      range.selectNodeContents(docEl)
      range.collapse(false)
    }

    range.deleteContents()
    range.insertNode(img)
    range.setStartAfter(img)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)

    docEl.dispatchEvent(new Event('input', { bubbles: true }))
  }

  function insertLink(url: string, text?: string) {
    const display = text || url
    const a = `<a href="${url}" target="_blank" rel="noopener noreferrer">${display}</a>`
    exec('insertHTML', a)
  }

  function insertTable(rows: number, cols: number) {
    let html = '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;">'
    html += '<tbody>'
    for (let r = 0; r < rows; r++) {
      html += '<tr>'
      for (let c = 0; c < cols; c++) {
        html += `<td style="min-width:60px;padding:6px;">&nbsp;</td>`
      }
      html += '</tr>'
    }
    html += '</tbody></table><br/>'
    exec('insertHTML', html)
  }

  function findReplace() {
    const searchTerm = prompt(t('wwl.findPrompt'))
    if (!searchTerm) return
    const replaceTerm = prompt(t('wwl.replacePrompt'))
    if (replaceTerm === null) return

    const editor = document.querySelector('[contenteditable="true"]')
    if (!editor) return

    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null)
    const textNodes: Text[] = []
    let node: Text | null
    while ((node = walker.nextNode() as Text | null)) {
      textNodes.push(node)
    }

    for (const tn of textNodes) {
      if (tn.nodeValue?.includes(searchTerm)) {
        tn.nodeValue = tn.nodeValue.split(searchTerm).join(replaceTerm)
      }
    }
  }

  return {
    currentFont, currentFontSize, currentForeColor, currentHiliteColor,
    bold, italic, underline, strikethrough, superscript, subscript,
    alignLeft, alignCenter, alignRight, alignJustify,
    indent, outdent,
    insertUnorderedList, insertOrderedList,
    setHeading, setParagraph,
    lineSpacing, setFontSize, setFont,
    foreColor, hiliteColor,
    undo, redo, copy, cut, paste,
    removeFormat,
    insertImage, insertLink, insertTable,
    findReplace
  }
}
