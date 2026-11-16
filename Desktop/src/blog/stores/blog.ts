import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '@/blog/services/api'
import type { CategoryNode } from '@/blog/types'
import i18n from '@/i18n'

export const useBlogStore = defineStore('blog', () => {
  const categories = ref<CategoryNode[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCategories() {
    loading.value = true
    error.value = null
    try {
      const res = await api.getCategories()
      categories.value = res.tree
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // 界面语言切换（设置 > 外观）时，重新拉取对应语言版本的分类/文章元数据
  watch(() => String(i18n.global.locale.value), () => {
    if (categories.value.length || error.value) fetchCategories()
  })

  // Flatten the category tree into a list of documents with full path info
  function flattenArticles(nodes?: CategoryNode[], _basePath?: string): ArticleListItem[] {
    const items: ArticleListItem[] = []
    const list = nodes || categories.value
    for (const node of list) {
      if (node.type === 'document') {
        items.push({
          name: node.name,
          path: node.path,
          title: node.title || node.name,
          description: node.description || '',
          cover: node.cover || null,
          category: node.category || node.path,
          tags: node.tags || [],
          created: node.created || '',
        })
      }
      if (node.children) {
        items.push(...flattenArticles(node.children, node.path))
      }
    }
    return items
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    flattenArticles
  }
})

export interface ArticleListItem {
  name: string
  path: string
  title: string
  description: string
  cover: string | null
  category: string
  tags: string[]
  created: string
}
