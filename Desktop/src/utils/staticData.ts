// 静态站点的数据访问层
// ─────────────────────────────────────────────────────────────
// 构建期脚本 scripts/export-static.mjs 会把分类树、单篇正文、作者、加载项、
// 壁纸导出到 public/static。这里统一读取并缓存：
//   static/blog/tree.json   分类树（按语言）+ 作者快照
//   static/blog/<hash>.json 单篇正文（按语言，由 tree 节点的 data 字段给出）
// 导出数据里的地址是站点根相对（/static/...），读出时统一补上部署 base。
import { STATIC_DATA_BASE, withBase, withBaseInHtml } from '@/utils/siteMode'

const jsonCache = new Map<string, Promise<any>>()

/** 导出数据里的站点根相对地址 → 实际可请求地址 */
function resolveUrl(url: string): string {
  // /static/... 需要补 base；其他（http、/api 等）原样返回
  return withBase(url)
}

function loadJson<T>(url: string): Promise<T> {
  const target = resolveUrl(url)
  let pending = jsonCache.get(target)
  if (!pending) {
    pending = fetch(target).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
    jsonCache.set(target, pending)
  }
  return pending as Promise<T>
}

export interface StaticCategoryNode {
  name: string
  path: string
  type: 'folder' | 'document'
  title?: string
  description?: string
  cover?: string | null
  category?: string
  tags?: string[]
  created?: string
  filename?: string | null
  /** 单篇文章数据地址（站点根相对） */
  data?: string
  children?: StaticCategoryNode[]
}

export interface StaticArticle {
  content: string
  meta: Record<string, any>
  title: string
  author: { display_name: string; avatar: string | null } | null
  comments_mode?: string
}

export interface BlogTree {
  langs: string[]
  tree: Record<string, StaticCategoryNode[]>
  authors: Record<string, { display_name: string; avatar: string | null }>
}

const TREE_URL = `${STATIC_DATA_BASE}blog/tree.json`

export function loadBlogTree() {
  return loadJson<BlogTree>(TREE_URL)
}

export function loadAddons() {
  return loadJson<{ addons: any[] }>(`${STATIC_DATA_BASE}addons.json`)
}

/** 给分类树补 base（封面地址、文章数据地址） */
function withBaseTree(nodes: StaticCategoryNode[]): StaticCategoryNode[] {
  return nodes.map(node => ({
    ...node,
    cover: node.cover ? withBase(node.cover) : node.cover,
    data: node.data ? withBase(node.data) : node.data,
    children: node.children ? withBaseTree(node.children) : node.children,
  }))
}

/** 取某个语言的分类树（未匹配时回退默认语言） */
export async function getCategoryTree(lang = 'default') {
  const data = await loadBlogTree()
  return withBaseTree(data.tree[lang] || data.tree.default || [])
}

/** 在分类树里按文章路径找节点 */
export async function findArticleNode(path: string) {
  const data = await loadBlogTree()
  const walk = (nodes: StaticCategoryNode[]): StaticCategoryNode | null => {
    for (const node of nodes) {
      if (node.type === 'document' && node.path === path) return node
      if (node.children) {
        const hit = walk(node.children)
        if (hit) return hit
      }
    }
    return null
  }
  return walk(data.tree.default || [])
}

/** 取某篇文章（未匹配语言时回退默认语言） */
export async function getArticle(path: string, lang = 'default'): Promise<StaticArticle | null> {
  const node = await findArticleNode(path)
  if (!node?.data) return null
  const variants = await loadJson<Record<string, StaticArticle>>(node.data)
  const article = variants[lang] || variants.default || null
  if (!article) return null
  return {
    ...article,
    content: withBaseInHtml(article.content || ''),
    author: article.author
      ? { ...article.author, avatar: withBase(article.author.avatar) }
      : null,
  }
}

/**
 * 兼容 Express /api/documents/category/:path 返回结构的文章读取。
 * WebWord 打开文档、协议弹窗等场景共用，静态模式下改读导出的 JSON。
 */
export async function fetchCategoryArticle(path: string, lang = 'default') {
  const article = await getArticle(path, lang)
  if (!article) throw new Error(`Not found: ${path}`)
  return {
    content: article.content,
    meta: article.meta || {},
    title: article.title,
    author: article.author,
    comments_mode: article.comments_mode || 'closed',
  }
}

/** 作者信息查询（静态模式下读导出快照） */
export async function fetchAuthor(uuid: string) {
  const data = await loadBlogTree()
  const author = data.authors[uuid]
  if (!author) return { display_name: '账号已注销', avatar: null }
  return { ...author, avatar: withBase(author.avatar) }
}
