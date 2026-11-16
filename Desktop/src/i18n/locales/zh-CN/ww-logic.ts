/**
 * WebWord 逻辑层文案（composables/stores/App/api 中的用户可见提示）
 * key 前缀统一使用 `wwl.`
 */
export default {
  // ── 启动 / 加载项（App.vue / stores/app.ts / stores/addons.ts）──
  'wwl.startupComplete': '启动完成',
  'wwl.starting': '正在启动...',
  'wwl.splashLoadingAddonList': '正在获取加载项列表...',
  'wwl.splashLoadingAddonManager': '正在加载加载项管理器...',
  'wwl.splashRegisteringAddons': '正在注册加载项...',
  'wwl.addonLoadFailed': '加载项加载失败',

  // ── 文档（stores/document.ts / useExport.ts）──
  'wwl.untitledDocument': '未命名文档',
  'wwl.docTitle': '文档',
  'wwl.newDocTitle': '新文档',
  'wwl.newDocPlaceholder': '在此输入内容...',

  // ── 导出（useExport.ts）──
  'wwl.exportPdfTitle': '导出 PDF',
  'wwl.exportPngSizeError': '无法获取文档尺寸，请确保文档已打开',
  'wwl.exportPngUnsupported': 'PNG 导出失败：浏览器不支持此操作',
  'wwl.exportPngExternalResource': 'PNG 导出失败：文档可能包含无法导出的外部资源。请尝试移除图片后重试。',
  'wwl.exportPngRenderError': 'PNG 导出失败：无法渲染文档内容',
  'wwl.exportPngReadError': 'PNG 导出失败：读取文档内容时出错',

  // ── 文件菜单问候语（useFileMenu.ts）──
  'wwl.greetingLateNight': '夜深了',
  'wwl.greetingEarlyMorning': '早上好',
  'wwl.greetingMorning': '上午好',
  'wwl.greetingNoon': '中午好',
  'wwl.greetingAfternoon': '下午好',
  'wwl.greetingEvening': '晚上好',

  // ── 格式（useFormat.ts）──
  'wwl.findPrompt': '查找:',
  'wwl.replacePrompt': '替换为:',

  // ── 功能区标签页（useTabs.ts）──
  'wwl.tabStart': '开始',
  'wwl.tabInsert': '插入',
  'wwl.tabDesign': '设计',
  'wwl.tabLayout': '布局',
  'wwl.tabReferences': '引用',
  'wwl.tabMailings': '邮件',
  'wwl.tabReview': '审阅',
  'wwl.tabView': '视图',
  'wwl.tabAddons': '插件',
}
