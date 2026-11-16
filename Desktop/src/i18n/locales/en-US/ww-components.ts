/**
 * WebWord components strings (layout/modals/format/global search/task view/toast)
 * All keys prefixed with `ww.`
 */
export default {
  // ── TitleBar ──
  'ww.titlebar.searchPlaceholder': 'Search document content',
  'ww.titlebar.prevResult': 'Previous (Shift+Enter)',
  'ww.titlebar.nextResult': 'Next (Enter)',

  // ── Tabs ──
  'ww.tabs.file': 'File',
  'ww.tabs.start': 'Home',
  'ww.tabs.insert': 'Insert',
  'ww.tabs.draw': 'Draw',
  'ww.tabs.components': 'Components',
  'ww.tabs.view': 'View',
  'ww.tabs.help': 'Help',
  'ww.tabs.hideRibbon': 'Hide ribbon (Ctrl+F1)',

  // ── Ribbon ──
  'ww.ribbon.ariaLabel': 'Ribbon toolbar',
  'ww.ribbon.clipboard': 'Clipboard',
  'ww.ribbon.font': 'Font',
  'ww.ribbon.fontSize': 'Font size',
  'ww.ribbon.bold': 'Bold (Ctrl+B)',
  'ww.ribbon.italic': 'Italic (Ctrl+I)',
  'ww.ribbon.underline': 'Underline (Ctrl+U)',
  'ww.ribbon.strikethrough': 'Strikethrough',
  'ww.ribbon.fontColor': 'Font color',
  'ww.ribbon.clearFormat': 'Clear formatting',
  'ww.ribbon.highlight': 'Highlight text',
  'ww.ribbon.highlightColor': 'Highlight color',
  'ww.ribbon.alignLeft': 'Align left',
  'ww.ribbon.alignCenter': 'Center',
  'ww.ribbon.alignRight': 'Align right',
  'ww.ribbon.justify': 'Justify',
  'ww.ribbon.indent': 'Increase indent',
  'ww.ribbon.outdent': 'Decrease indent',
  'ww.ribbon.bulletList': 'Bullet list',
  'ww.ribbon.numberedList': 'Numbered list',
  'ww.ribbon.paragraph': 'Paragraph',
  'ww.ribbon.undo': 'Undo (Ctrl+Z)',
  'ww.ribbon.redo': 'Redo (Ctrl+Y)',
  'ww.ribbon.find': 'Find',
  'ww.ribbon.replace': 'Replace',
  'ww.ribbon.superscript': 'Superscript',
  'ww.ribbon.subscript': 'Subscript',
  'ww.ribbon.headingStyle': 'Heading style',
  'ww.ribbon.bodyText': 'Body',
  'ww.ribbon.headingN': 'Heading {n}',
  'ww.ribbon.lineSpacing': 'Line spacing',
  'ww.ribbon.typography': 'Typography',
  'ww.ribbon.insertImage': 'Insert image',
  'ww.ribbon.image': 'Image',
  'ww.ribbon.insertLink': 'Insert link',
  'ww.ribbon.link': 'Link',
  'ww.ribbon.insertTable': 'Insert table',
  'ww.ribbon.table': 'Table',
  'ww.ribbon.toggleNav': 'Toggle navigation',
  'ww.ribbon.navPane': 'Navigation pane',
  'ww.ribbon.zoomIn': 'Zoom in',
  'ww.ribbon.zoomOut': 'Zoom out',
  'ww.ribbon.drawSelectMode': 'Select mode',
  'ww.ribbon.drawSelect': 'Select',
  'ww.ribbon.pen': 'Pen',
  'ww.ribbon.gelPen': 'Gel pen',
  'ww.ribbon.pencil': 'Pencil',
  'ww.ribbon.brush': 'Brush',
  'ww.ribbon.marker': 'Marker',
  'ww.ribbon.highlighter': 'Highlighter',
  'ww.ribbon.laser': 'Laser pointer (auto-hide)',
  'ww.ribbon.laserShort': 'Laser pointer',
  'ww.ribbon.eraser': 'Eraser',
  'ww.ribbon.drawColor': 'Drawing color (click to pick)',
  'ww.ribbon.brushSize': 'Brush size',
  'ww.ribbon.clearDrawings': 'Clear all drawings',
  'ww.ribbon.clearDraw': 'Clear',

  // ── Sidebar ──
  'ww.sidebar.navigation': 'Navigation',
  'ww.sidebar.closeNavigation': 'Close navigation',
  'ww.sidebar.tocPlaceholder': 'Navigation is unavailable for a new document',

  // ── StatusBar ──
  'ww.statusbar.ready': 'Ready',
  'ww.statusbar.docInfo': 'Page {pages} · {words} words',
  'ww.statusbar.opening': 'Opening',

  // ── Workspace ──

  // ── AboutModal ──
  'ww.about.project': 'Project',
  'ww.about.projectValue': 'WebWord web document editor',
  'ww.about.version': 'Version',
  'ww.about.versionValue': '2026 LTS (long-term support)',
  'ww.about.position': 'Positioning',
  'ww.about.positionValue': 'An online document processing tool like Microsoft Word',
  'ww.about.techStack': 'Tech stack',
  'ww.about.coreCapabilities': 'Core capabilities',
  'ww.about.capEdit': 'Document editing',
  'ww.about.capFormat': 'Formatting & layout',
  'ww.about.capPdfExport': 'PDF export',
  'ww.about.capMultiSave': 'Multi-format saving',
  'ww.about.capToc': 'Table of contents navigation',
  'ww.about.capMusic': 'Music playback',
  'ww.about.createdDate': 'Created date',
  'ww.about.createdDateValue': 'April 16, 2026',
  'ww.about.footerNote': 'Built entirely with front-end technologies — no server required; everything runs locally in your browser.',

  // ── FindReplaceDialog ──
  'ww.findReplace.title': 'Find and Replace',
  'ww.findReplace.find': 'Find',
  'ww.findReplace.findPlaceholder': 'Enter search text...',
  'ww.findReplace.replace': 'Replace',
  'ww.findReplace.replacePlaceholder': 'Enter replacement text...',
  'ww.findReplace.caseSensitive': 'Match case',
  'ww.findReplace.wholeWord': 'Match whole word',
  'ww.findReplace.prev': 'Previous',
  'ww.findReplace.next': 'Next',
  'ww.findReplace.noResults': 'No results',
  'ww.findReplace.findNext': 'Find next',
  'ww.findReplace.replaceAll': 'Replace all',
  'ww.findReplace.replacedCount': '{count} replaced',

  // ── UnsavedModal ──
  'ww.unsaved.title': 'Save changes to "{name}"?',
  'ww.unsaved.body': "If you don't save, changes made since your last save will be lost.",
  'ww.unsaved.dontSave': "Don't save",

  // ── ShareModal ──
  'ww.share.title': 'Share Document',
  'ww.share.hint': 'Choose an export format to share your document',
  'ww.share.exportPdf': 'Export PDF',
  'ww.share.exportPdfDesc': 'Export as a printable PDF document',
  'ww.share.exportPng': 'Export PNG image',
  'ww.share.exportPngDesc': 'Export as a high-resolution bitmap image',
  'ww.share.exportHtml': 'Export web page',
  'ww.share.exportHtmlDesc': 'Export as an editable HTML web document',

  // ── LargeFileModal ──
  'ww.largeFile.warning': 'Warning',
  'ww.largeFile.message': 'This document is large (about {size} MB) and may take a while to open.',
  'ww.largeFile.body': 'Large files may affect editor performance. Continue opening?',
  'ww.largeFile.continue': 'Continue',

  // ── InsertLinkPopup ──
  'ww.insertLink.url': 'Link URL',
  'ww.insertLink.displayText': 'Display text',
  'ww.insertLink.displayTextPlaceholder': 'Link display text',
  'ww.insertLink.insert': 'Insert',

  // ── InsertTablePopup ──
  'ww.insertTable.rows': 'Rows',
  'ww.insertTable.cols': 'Columns',
  'ww.insertTable.info': '{r} × {c} table',
  'ww.insertTable.insert': 'Insert',

  // ── GlobalSearchDropdown ──
  'ww.globalSearch.opened': 'Open',
  'ww.globalSearch.load': 'Load',
  'ww.globalSearch.switch': 'Switch',
  'ww.globalSearch.execute': 'Run',
  'ww.globalSearch.resultCount': '{count} results',
  'ww.globalSearch.hint': '↑↓ navigate · Enter select · Esc close',

  // ── TaskView ──
  'ww.taskView.title': 'Task View',
  'ww.taskView.titleWithShortcut': 'Task view (Ctrl+`)',
  'ww.taskView.untitled': 'Untitled document',
  'ww.taskView.docSubtitle': '{words} words · {pages} pages',
  'ww.taskView.docPreview': 'Document preview',
  'ww.taskView.addonPreview': 'Add-on preview',
}
