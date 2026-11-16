// 站点运行模式
// ─────────────────────────────────────────────────────────────
// STATIC_MODE = true 时（GitHub Pages 等纯静态托管），博客数据来自构建期导出的
// /static/blog.json，评论、账号、保存等需要后端的交互全部关闭。
// 本地开发/自托管仍走 Express 的 /api/*。
export const STATIC_MODE = import.meta.env.VITE_STATIC === '1'

export const SITE_BASE: string = import.meta.env.BASE_URL || '/'

/** 静态数据目录（带 base，兼容 GitHub Pages 子路径部署） */
export const STATIC_DATA_BASE = `${SITE_BASE}static/`

/**
 * 把 public/ 下的绝对路径转成带部署 base 的地址。
 * 例如 asset('live2d/Core/live2dcubismcore.js')
 *   dev   → /live2d/Core/live2dcubismcore.js
 *   Pages → /BetaStudio2-Blog/live2d/Core/live2dcubismcore.js
 */
export function asset(relPath: string): string {
  return SITE_BASE + String(relPath).replace(/^\/+/, '')
}

/**
 * 把导出数据里的站点根相对路径补上部署 base。
 * 导出脚本产出与 base 无关的路径，同一份快照可用于任意部署地址。
 */
export function withBase(url: string | null | undefined): string {
  if (!url) return ''
  if (SITE_BASE === '/') return url
  if (url.startsWith('/static/') || url.startsWith('/background/')) return SITE_BASE + url.slice(1)
  return url
}

/** 批量重写 HTML 正文里的 /static/ 资源地址 */
export function withBaseInHtml(html: string): string {
  if (!html || SITE_BASE === '/') return html
  return html.split('/static/').join(`${SITE_BASE}static/`)
}
