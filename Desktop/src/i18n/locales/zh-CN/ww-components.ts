/**
 * WebWord 组件层文案（布局/对话框/格式工具/全局搜索/任务视图/提示等）
 * key 前缀统一使用 `ww.`
 */
export default {
  // ── TitleBar 标题栏 ──
  'ww.titlebar.searchPlaceholder': '搜索文档内容',
  'ww.titlebar.prevResult': '上一个 (Shift+Enter)',
  'ww.titlebar.nextResult': '下一个 (Enter)',

  // ── Tabs 标签页 ──
  'ww.tabs.file': '文件',
  'ww.tabs.start': '开始',
  'ww.tabs.insert': '插入',
  'ww.tabs.draw': '绘图',
  'ww.tabs.components': '组件',
  'ww.tabs.view': '视图',
  'ww.tabs.help': '帮助',
  'ww.tabs.hideRibbon': '隐藏工具栏 (Ctrl+F1)',

  // ── Ribbon 功能区 ──
  'ww.ribbon.ariaLabel': '工具样',
  'ww.ribbon.clipboard': '剪贴板',
  'ww.ribbon.font': '字体',
  'ww.ribbon.fontSize': '字号',
  'ww.ribbon.bold': '加粗 (Ctrl+B)',
  'ww.ribbon.italic': '倾斜 (Ctrl+I)',
  'ww.ribbon.underline': '下划线 (Ctrl+U)',
  'ww.ribbon.strikethrough': '删除线',
  'ww.ribbon.fontColor': '字体颜色',
  'ww.ribbon.clearFormat': '清除格式',
  'ww.ribbon.highlight': '文本高亮',
  'ww.ribbon.highlightColor': '高亮颜色',
  'ww.ribbon.alignLeft': '左对齐',
  'ww.ribbon.alignCenter': '居中',
  'ww.ribbon.alignRight': '右对齐',
  'ww.ribbon.justify': '两端对齐',
  'ww.ribbon.indent': '增加缩进',
  'ww.ribbon.outdent': '减少缩进',
  'ww.ribbon.bulletList': '项目符号',
  'ww.ribbon.numberedList': '编号',
  'ww.ribbon.paragraph': '段落',
  'ww.ribbon.undo': '撤销 (Ctrl+Z)',
  'ww.ribbon.redo': '重做 (Ctrl+Y)',
  'ww.ribbon.find': '查找',
  'ww.ribbon.replace': '替换',
  'ww.ribbon.superscript': '上标',
  'ww.ribbon.subscript': '下标',
  'ww.ribbon.headingStyle': '标题样式',
  'ww.ribbon.bodyText': '正文',
  'ww.ribbon.headingN': '标题 {n}',
  'ww.ribbon.lineSpacing': '行间距',
  'ww.ribbon.typography': '排版',
  'ww.ribbon.insertImage': '插入图片',
  'ww.ribbon.image': '图片',
  'ww.ribbon.insertLink': '插入链接',
  'ww.ribbon.link': '链接',
  'ww.ribbon.insertTable': '插入表格',
  'ww.ribbon.table': '表格',
  'ww.ribbon.toggleNav': '显示/隐藏导航',
  'ww.ribbon.navPane': '导航窗格',
  'ww.ribbon.zoomIn': '放大',
  'ww.ribbon.zoomOut': '缩小',
  'ww.ribbon.drawSelectMode': '选择模式',
  'ww.ribbon.drawSelect': '选择',
  'ww.ribbon.pen': '钢笔',
  'ww.ribbon.gelPen': '水笔',
  'ww.ribbon.pencil': '铅笔',
  'ww.ribbon.brush': '毛笔',
  'ww.ribbon.marker': '记号笔',
  'ww.ribbon.highlighter': '荧光笔',
  'ww.ribbon.laser': '激光笔（自动消失）',
  'ww.ribbon.laserShort': '激光笔',
  'ww.ribbon.eraser': '橡皮擦',
  'ww.ribbon.drawColor': '绘图颜色（点击调色）',
  'ww.ribbon.brushSize': '笔触大小',
  'ww.ribbon.clearDrawings': '清除所有绘图',
  'ww.ribbon.clearDraw': '清除',

  // ── Sidebar 侧边栏 ──
  'ww.sidebar.navigation': '导航',
  'ww.sidebar.closeNavigation': '关闭导航',
  'ww.sidebar.tocPlaceholder': '新建文档下，导航窗格暂时不可用',

  // ── StatusBar 状态栏 ──
  'ww.statusbar.ready': '就绪',
  'ww.statusbar.docInfo': '第 {pages} 页 · 字数 {words}',
  'ww.statusbar.opening': '正在打开',

  // ── Workspace 工作区 ──

  // ── AboutModal 关于对话框 ──
  'ww.about.project': '项目',
  'ww.about.projectValue': 'WebWord 网页文档编辑器',
  'ww.about.version': '版本',
  'ww.about.versionValue': '2026 LTS（长期支持版）',
  'ww.about.position': '定位',
  'ww.about.positionValue': '类 Microsoft Word 的在线文档处理工具',
  'ww.about.techStack': '技术栈',
  'ww.about.coreCapabilities': '核心能力',
  'ww.about.capEdit': '文档编辑',
  'ww.about.capFormat': '格式排版',
  'ww.about.capPdfExport': 'PDF导出',
  'ww.about.capMultiSave': '多格式保存',
  'ww.about.capToc': '目录导航',
  'ww.about.capMusic': '音乐播放',
  'ww.about.createdDate': '创建日期',
  'ww.about.createdDateValue': '2026年4月16日',
  'ww.about.footerNote': '基于纯前端技术构建，无需服务器，所有功能均在浏览器本地运行。',

  // ── FindReplaceDialog 查找替换 ──
  'ww.findReplace.title': '查找和替换',
  'ww.findReplace.find': '查找',
  'ww.findReplace.findPlaceholder': '输入查找内容...',
  'ww.findReplace.replace': '替换',
  'ww.findReplace.replacePlaceholder': '输入替换内容...',
  'ww.findReplace.caseSensitive': '区分大小写',
  'ww.findReplace.wholeWord': '全词匹配',
  'ww.findReplace.prev': '上一个',
  'ww.findReplace.next': '下一个',
  'ww.findReplace.noResults': '无结果',
  'ww.findReplace.findNext': '查找下一个',
  'ww.findReplace.replaceAll': '全部替换',
  'ww.findReplace.replacedCount': '已替换 {count} 处',

  // ── UnsavedModal 未保存提示 ──
  'ww.unsaved.title': '是否保存对“{name}”的更改？',
  'ww.unsaved.body': '如果不保存，将丢失上次保存之后的更改。',
  'ww.unsaved.dontSave': '不保存',

  // ── ShareModal 分享 ──
  'ww.share.title': '共享文档',
  'ww.share.hint': '选择导出格式以共享您的文档',
  'ww.share.exportPdf': '导出 PDF',
  'ww.share.exportPdfDesc': '导出为可打印的 PDF 文档',
  'ww.share.exportPng': '导出 PNG 图片',
  'ww.share.exportPngDesc': '导出为高清位图图像',
  'ww.share.exportHtml': '导出网页',
  'ww.share.exportHtmlDesc': '导出为可编辑的 HTML 网页文档',

  // ── LargeFileModal 大文件提示 ──
  'ww.largeFile.warning': '警告',
  'ww.largeFile.message': '此文档较大（约 {size} MB），打开可能需要较长时间。',
  'ww.largeFile.body': '大文件可能会影响编辑器性能。是否继续打开？',
  'ww.largeFile.continue': '继续',

  // ── InsertLinkPopup 插入链接 ──
  'ww.insertLink.url': '链接地址',
  'ww.insertLink.displayText': '显示文本',
  'ww.insertLink.displayTextPlaceholder': '链接显示文字',
  'ww.insertLink.insert': '插入',

  // ── InsertTablePopup 插入表格 ──
  'ww.insertTable.rows': '行',
  'ww.insertTable.cols': '列',
  'ww.insertTable.info': '{r} × {c} 表格',
  'ww.insertTable.insert': '插入',

  // ── GlobalSearchDropdown 全局搜索 ──
  'ww.globalSearch.opened': '已打开',
  'ww.globalSearch.load': '加载',
  'ww.globalSearch.switch': '切换',
  'ww.globalSearch.execute': '执行',
  'ww.globalSearch.resultCount': '{count} 个结果',
  'ww.globalSearch.hint': '↑↓ 导航 · Enter 选择 · Esc 关闭',

  // ── TaskView 任务视图 ──
  'ww.taskView.title': '任务视图',
  'ww.taskView.titleWithShortcut': '任务视图 (Ctrl+`)',
  'ww.taskView.untitled': '未命名文档',
  'ww.taskView.docSubtitle': '{words} 字 · {pages} 页',
  'ww.taskView.docPreview': '文档预览',
  'ww.taskView.addonPreview': '插件预览',
}
