import { useAppStore } from './stores/app'
import { useDocumentStore } from './stores/document'
import { useAddonStore } from './stores/addons'
import { clearAllToasts } from './composables/useToast'

/**
 * 释放 WebWord 的全部运行态内存。在 WebWord 窗口真正关闭（关闭动画结束、组件树卸载后）调用：
 * - 重置 document / addons / app 三个 Pinia store：清空文档内容、卸载全部加载项、恢复启动态 UI
 * - 删除 window.WebWord 上的加载项全局状态，移除注入的脚本/样式与残留弹层 DOM
 * - 移除附着在 document.body 上的 Toast
 * 这样关闭 WebWord 后不再持有文档数据与加载项数据，重开时按全新启动流程初始化。
 */
export function disposeWebWord() {
  useDocumentStore().dispose()
  useAddonStore().dispose()
  useAppStore().dispose()
  clearAllToasts()
}
