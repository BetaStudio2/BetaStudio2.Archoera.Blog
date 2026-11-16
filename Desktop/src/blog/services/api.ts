const API_BASE = '/api'

import { domtHeaders } from '@/utils/domtToken'
import { STATIC_MODE } from '@/utils/siteMode'
import { getCategoryTree, fetchCategoryArticle, fetchAuthor } from '@/utils/staticData'
import i18n from '@/i18n'

const t = (key: string): string => (i18n.global as any).t(key)

// 根据当前界面语言返回文档语言代码（'en'），中文界面返回空串（后端回退默认）
function getLang(): string {
  const locale = String(i18n.global.locale.value)
  return locale.toLowerCase().startsWith('en') ? 'en' : ''
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...domtHeaders(),
    ...(options.headers as Record<string, string>)
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: t('blog.requestFailed') }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  return response.json()
}

const staticLang = () => getLang() || 'default'

export const api = {
  getCategories() {
    if (STATIC_MODE) {
      return getCategoryTree(staticLang()).then(tree => ({
        tree: tree as import('@/blog/types').CategoryNode[]
      }))
    }
    const lang = getLang()
    return request<{ tree: import('@/blog/types').CategoryNode[] }>(`/documents/categories${lang ? `?lang=${lang}` : ''}`)
  },

  getCategoryContent(path: string) {
    if (STATIC_MODE) {
      return fetchCategoryArticle(path, staticLang())
        .catch(() => { throw new Error(t('blog.articleNotFound')) }) as Promise<import('@/blog/types').ArticleResponse>
    }
    const lang = getLang()
    return request<import('@/blog/types').ArticleResponse>(`/documents/category/${path}${lang ? `?lang=${lang}` : ''}`)
  },

  getAuthor(uuid: string) {
    if (STATIC_MODE) {
      return fetchAuthor(uuid) as Promise<import('@/blog/types').AuthorInfo>
    }
    return request<import('@/blog/types').AuthorInfo>(`/author/${uuid}`)
  },

  getDocuments() {
    if (STATIC_MODE) return Promise.resolve({ documents: [] })
    return request<{ documents: any[] }>('/documents')
  }
}
