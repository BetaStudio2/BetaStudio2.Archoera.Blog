<template>
  <div class="category-page">
    <div v-if="loading" class="container loading-state">
      <div class="loader"></div>
    </div>

    <div v-else-if="error" class="container error-state">
      <p>{{ error }}</p>
      <router-link to="/blog/" class="back-link">{{ $t('blog.backHome') }}</router-link>
    </div>

    <template v-else>
      <!-- Category Header -->
      <header class="category-header">
        <div class="container header-content">
          <div class="header-top">
            <button class="back-btn" @click="goBack">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
              {{ $t('common.back') }}
            </button>
          </div>
          <div class="breadcrumb">
            <router-link to="/blog/" class="breadcrumb-link">{{ $t('blog.home') }}</router-link>
            <span class="breadcrumb-sep">/</span>
            <span v-for="(part, i) in pathParts" :key="i">
              <template v-if="i < pathParts.length - 1">
                <span class="breadcrumb-current">{{ part }}</span>
                <span class="breadcrumb-sep">/</span>
              </template>
              <span v-else class="breadcrumb-active">{{ part }}</span>
            </span>
          </div>
          <h1 class="cat-title">{{ currentCategory?.name || pathParts[pathParts.length - 1] }}</h1>
          <p v-if="currentCategory?.description" class="cat-desc">{{ currentCategory.description }}</p>
          <p v-else class="cat-count">{{ $t('blog.articleCount', { count: articles.length }) }}</p>
        </div>
      </header>

      <!-- Sub-categories -->
      <div v-if="currentCategory?.children?.length" class="container sub-categories">
        <div
          v-for="(sub, si) in currentCategory.children"
          :key="sub.path"
          class="sub-cat-card"
          :style="{ animationDelay: `${si * 0.06}s` }"
          @click="navigateTo(sub)"
        >
          <div class="sub-cat-icon">
            <svg v-if="sub.type === 'folder'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="sub-cat-info">
            <span class="sub-cat-name">{{ sub.title || sub.name }}</span>
            <span v-if="sub.description" class="sub-cat-desc">{{ sub.description }}</span>
          </div>
          <svg class="sub-cat-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      <!-- Articles in this category -->
      <div v-if="articles.length" class="container articles-section">
        <h2 class="section-title">{{ $t('blog.articlesTitle') }}</h2>
        <div class="articles-list">
          <article
            v-for="(article, ai) in articles"
            :key="article.path"
            class="article-row"
            :style="{ animationDelay: `${ai * 0.04}s` }"
            @click="openArticle(article)"
          >
            <div class="row-body">
              <h3 class="row-title">{{ article.title }}</h3>
              <p v-if="article.description" class="row-desc">{{ article.description }}</p>
              <div class="row-meta">
                <span class="row-date">{{ formatDate(article.created) }}</span>
                <span v-if="article.tags?.length" class="row-tags">
                  <span v-for="tag in article.tags.slice(0, 3)" :key="tag" class="mini-tag">{{ tag }}</span>
                </span>
              </div>
            </div>
            <svg class="row-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg>
          </article>
        </div>
      </div>

      <div v-else class="container empty-state">
        <p>{{ $t('blog.categoryEmpty') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlogStore, type ArticleListItem } from '@/blog/stores/blog'
import type { CategoryNode } from '@/blog/types'

const route = useRoute()
const router = useRouter()
const store = useBlogStore()

const loading = ref(true)
const error = ref<string | null>(null)

// 去掉尾部斜杠（Pages 目录式 URL 会重定向并补上斜杠）
function normalizePath(raw: unknown): string {
  return String(raw || '').replace(/\/+$/, '')
}

const pathParts = computed(() => {
  const path = normalizePath(route.params.path)
  return path ? path.split('/') : []
})

const currentCategory = computed<CategoryNode | null>(() => {
  const path = normalizePath(route.params.path)
  if (!path) return null
  return findNode(store.categories, path)
})

const articles = computed<ArticleListItem[]>(() => {
  if (!currentCategory.value) return []
  const flat = store.flattenArticles(currentCategory.value.children || [])
  // Only include documents directly under this category
  const path = normalizePath(route.params.path)
  return flat.filter(a => a.category === path || a.category.startsWith(path + '/'))
})

function findNode(nodes: CategoryNode[], targetPath: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.path === targetPath) return node
    if (node.children) {
      const found = findNode(node.children, targetPath)
      if (found) return found
    }
  }
  return null
}

function formatDate(date: string): string {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

function navigateTo(node: CategoryNode) {
  if (node.type === 'document') {
    router.push(`/blog/article/${node.path}`)
  } else {
    router.push(`/blog/category/${node.path}`)
  }
}

function openArticle(article: ArticleListItem) {
  router.push(`/blog/article/${article.path}`)
}

async function init() {
  loading.value = true
  error.value = null
  try {
    if (!store.categories.length) {
      await store.fetchCategories()
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/blog/')
  }
}

onMounted(init)
</script>

<style lang="scss" scoped>
.category-page {
  padding-bottom: 80px;
}

// ── Header ──
.category-header {
  padding: 48px 0 40px;
  background: radial-gradient(ellipse at 50% 0%, rgba(66, 184, 131, .06) 0%, transparent 60%);
  border-bottom: 1px solid rgba(255, 255, 255, .04);
}

.header-top {
  margin-bottom: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, .04);
  color: rgba(255, 255, 255, .5);
  font-size: 13px;
  cursor: pointer;
  transition: all .15s;

  &:hover {
    background: rgba(255, 255, 255, .08);
    color: rgba(255, 255, 255, .8);
  }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 13px;
}

.breadcrumb-link {
  color: rgba(255, 255, 255, .4);
  transition: color .15s;
  &:hover { color: #42b883; }
}

.breadcrumb-sep {
  color: rgba(255, 255, 255, .15);
}

.breadcrumb-current {
  color: rgba(255, 255, 255, .3);
}

.breadcrumb-active {
  color: rgba(255, 255, 255, .6);
}

.cat-title {
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 800;
  color: #fff;
  margin-bottom: 8px;
}

.cat-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, .45);
  max-width: 600px;
}

.cat-count {
  font-size: 14px;
  color: rgba(255, 255, 255, .35);
}

// ── Sub Categories ──
.sub-categories {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 32px;
  padding-bottom: 32px;
}

.sub-cat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 10px;
  animation: card-in .35s ease both;
  background: rgba(255, 255, 255, .02);
  border: 1px solid rgba(255, 255, 255, .04);
  cursor: pointer;
  transition: all .2s;

  &:hover {
    background: rgba(255, 255, 255, .04);
    border-color: rgba(66, 184, 131, .12);
    transform: translateX(4px);
  }
}

.sub-cat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(66, 184, 131, .08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #42b883;
}

.sub-cat-info {
  flex: 1;
  min-width: 0;
}

.sub-cat-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 2px;
}

.sub-cat-desc {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, .4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-cat-arrow {
  flex-shrink: 0;
  color: rgba(255, 255, 255, .2);
}

// ── Articles List ──
.articles-section {
  padding-top: 40px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 20px;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.article-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 10px;
  animation: card-in .35s ease both;
  background: rgba(255, 255, 255, .02);
  border: 1px solid rgba(255, 255, 255, .04);
  cursor: pointer;
  transition: all .2s;

  &:hover {
    background: rgba(255, 255, 255, .04);
    border-color: rgba(66, 184, 131, .1);
    transform: translateX(4px);
  }
}

.row-body {
  flex: 1;
  min-width: 0;
}

.row-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
  line-height: 1.4;
}

.row-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, .45);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.row-date {
  font-size: 12px;
  color: rgba(255, 255, 255, .3);
}

.row-tags {
  display: flex;
  gap: 4px;
}

.mini-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, .04);
  color: rgba(255, 255, 255, .35);
}

.row-arrow {
  flex-shrink: 0;
  color: rgba(255, 255, 255, .15);
}

// ── States ──
.loading-state {
  display: flex;
  justify-content: center;
  padding: 120px 0;
}

.loader {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, .06);
  border-top-color: #42b883;
  border-radius: 50%;
  animation: spin .6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.error-state {
  padding: 120px 0;
  text-align: center;
  color: rgba(255, 255, 255, .5);

  .back-link {
    display: inline-block;
    margin-top: 16px;
    padding: 8px 20px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, .1);
    color: #42b883;
    font-size: 13px;
    transition: all .15s;

    &:hover {
      background: rgba(66, 184, 131, .08);
      border-color: rgba(66, 184, 131, .2);
    }
  }
}

.empty-state {
  padding: 80px 0;
  text-align: center;
  color: rgba(255, 255, 255, .3);
}

// ── Responsive ──
@media (max-width: 768px) {
  .category-header {
    padding: 28px 0 24px;
  }

  .header-top {
    margin-bottom: 12px;
  }

  .breadcrumb {
    margin-bottom: 12px;
    font-size: 12px;
    flex-wrap: wrap;
  }

  .cat-title {
    font-size: clamp(20px, 5vw, 28px);
  }

  .cat-desc {
    font-size: 14px;
  }

  .sub-categories {
    padding-top: 20px;
    padding-bottom: 20px;
    gap: 6px;
  }

  .sub-cat-card {
    padding: 12px 14px;
    gap: 10px;

    &:hover {
      // 触屏避免位移
      transform: none;
    }
  }

  .sub-cat-icon {
    width: 32px;
    height: 32px;
  }

  .sub-cat-name {
    font-size: 14px;
  }

  .sub-cat-desc {
    font-size: 12px;
  }

  .articles-section {
    padding-top: 24px;
  }

  .section-title {
    font-size: 16px;
    margin-bottom: 14px;
  }

  .article-row {
    padding: 12px 14px;
    gap: 10px;

    &:hover {
      transform: none;
    }
  }

  .row-title {
    font-size: 14.5px;
  }

  .row-desc {
    font-size: 13px;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .row-meta {
    gap: 10px;
    flex-wrap: wrap;
  }

  .loading-state,
  .error-state,
  .empty-state {
    padding: 80px 0;
  }
}

@media (max-width: 480px) {
  .category-header {
    padding: 20px 0 18px;
  }

  .cat-title {
    font-size: 20px;
  }
}
</style>
