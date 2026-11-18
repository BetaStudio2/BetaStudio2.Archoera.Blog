<template>
  <div class="article-page">
    <div v-if="loading" class="container loading-state">
      <div class="loader"></div>
    </div>

    <div v-else-if="error" class="container error-state">
      <p>{{ error }}</p>
      <router-link to="/blog/" class="back-link">{{ $t('blog.backHome') }}</router-link>
    </div>

    <template v-else-if="article">
      <!-- Article Header -->
      <header class="article-header">
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
            <span class="breadcrumb-current">{{ categoryParts[0] }}</span>
            <span v-if="categoryParts.length > 1" class="breadcrumb-sep">/</span>
            <span v-if="categoryParts.length > 1" class="breadcrumb-current">{{ categoryParts.slice(1).join(' / ') }}</span>
          </div>

          <div class="article-kicker">
            <span class="kicker-line"></span>
            ARTICLE
            <span v-if="article.meta?.category" class="kicker-category">/ {{ categoryParts.join(' / ') }}</span>
          </div>
          <h1 class="article-title">{{ article.title }}</h1>
          <p v-if="article.meta?.subtitle" class="article-subtitle">{{ article.meta.subtitle }}</p>

          <div class="article-meta">
            <div v-if="author" class="meta-author">
              <img v-if="author.avatar" :src="author.avatar" class="author-avatar" />
              <span class="author-name">{{ author.display_name }}</span>
            </div>
            <span v-if="article.meta?.created" class="meta-date">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
              {{ article.meta.created }}
            </span>
            <span v-if="article.meta?.reading_time_minutes" class="meta-reading">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ $t('blog.minutes', { count: article.meta.reading_time_minutes }) }}
            </span>
          </div>
        </div>
      </header>

      <!-- Cover banner -->
      <div v-if="coverUrl" class="container cover-wrap">
        <div class="article-cover">
          <img :src="coverUrl" :alt="article.title" />
          <div class="cover-fade"></div>
        </div>
      </div>

      <!-- Article Content -->
      <div class="container article-layout">
        <article class="article-body">
          <div
            ref="contentRef"
            class="article-content"
            v-html="renderedContent"
            @click="handleContentClick"
          ></div>

          <!-- Tags -->
          <div v-if="article.meta?.tags?.length" class="article-tags">
            <span class="tags-label">{{ $t('blog.tagsLabel') }}</span>
            <span v-for="tag in article.meta.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>

          <!-- References -->
          <div v-if="article.meta?.references?.length" class="article-references">
            <h3 class="refs-title">{{ $t('blog.referencesTitle') }}</h3>
            <ol class="refs-list">
              <li v-for="(ref, i) in article.meta.references" :key="i">
                <a :href="ref.url" target="_blank" rel="noopener">
                  {{ ref.title }}
                  <span v-if="ref.publisher" class="ref-publisher">— {{ ref.publisher }}</span>
                </a>
              </li>
            </ol>
          </div>

          <div class="article-end"><span>// END OF ARTICLE</span></div>

          <!-- Author card -->
          <div v-if="author" class="author-card">
            <div class="author-avatar-wrap">
              <img :src="author.avatar || defaultAvatar" :alt="author.display_name" class="author-card-avatar" />
            </div>
            <div class="author-card-info">
              <span class="author-card-label">{{ $t('blog.authorTagline') }}</span>
              <h4>{{ author.display_name }}</h4>
            </div>
            <a href="https://github.com/BetaStudio2" target="_blank" rel="noopener" class="author-card-link">
              GitHub
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
            </a>
          </div>

          <!-- Prev / Next -->
          <div v-if="prevArticle || nextArticle" class="post-nav">
            <button v-if="prevArticle" class="post-nav-item prev" @click="openArticle(prevArticle)">
              <span class="post-nav-label">← {{ $t('blog.prevArticle') }}</span>
              <span class="post-nav-title">{{ prevArticle.title }}</span>
            </button>
            <button v-if="nextArticle" class="post-nav-item next" @click="openArticle(nextArticle)">
              <span class="post-nav-label">{{ $t('blog.nextArticle') }} →</span>
              <span class="post-nav-title">{{ nextArticle.title }}</span>
            </button>
          </div>

        </article>

        <!-- Sidebar: Table of Contents -->
        <aside class="article-sidebar" v-if="toc.length">
          <div class="toc-heading">
            <h4 class="toc-title">{{ $t('blog.tocTitle') }}</h4>
            <span class="toc-percent">{{ readPct }}%</span>
          </div>
          <div class="toc-progress"><div class="toc-progress-bar" :style="{ width: readPct + '%' }"></div></div>
          <nav class="toc-nav">
            <a
              v-for="(item, i) in toc"
              :key="i"
              :href="item.href"
              class="toc-link"
              :class="{ 'toc-active': activeToc === item.href }"
              @click.prevent="scrollToHeading(item.href)"
            >
              <span class="toc-text">{{ item.text }}</span>
            </a>
          </nav>
        </aside>
      </div>

      <!-- Related posts -->
      <div v-if="relatedArticles.length" class="container related-section">
        <div class="section-header">
          <div>
            <div class="section-kicker">KEEP READING</div>
            <h2 class="section-title">{{ $t('blog.relatedPosts') }}</h2>
          </div>
        </div>
        <div class="related-grid">
          <article v-for="item in relatedArticles" :key="item.path" class="related-card" @click="openArticle(item)">
            <div class="related-cover">
              <img v-if="item.cover" :src="itemCoverUrl(item)" :alt="item.title" />
              <div v-else class="related-fallback">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                <span>{{ item.category.split('/')[0] }}</span>
              </div>
            </div>
            <div class="related-body">
              <span class="related-cat">{{ item.category.split('/')[0] }}</span>
              <h3>{{ item.title }}</h3>
              <span class="related-date">{{ formatListDate(item.created) }}</span>
            </div>
          </article>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '@/blog/services/api'
import { useBlogStore, type ArticleListItem } from '@/blog/stores/blog'
import { STATIC_MODE, withBase, asset } from '@/utils/siteMode'
import type { ArticleResponse } from '@/blog/types'

const route = useRoute()
const router = useRouter()
const store = useBlogStore()
const { t, locale } = useI18n()
const contentRef = ref<HTMLElement | null>(null)
const defaultAvatar = asset('images/about-cover.jpg')

const article = ref<ArticleResponse | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const activeToc = ref('')
const readPct = ref(0)

// GitHub Pages 会把 /blog/article/xxx 301 到 /blog/article/xxx/，
// 使 path 参数末尾多一个斜杠；统一去掉，保证能和导出数据里的路径对上
function normalizePath(raw: unknown): string {
  return String(raw || '').replace(/\/+$/, '')
}

const articlePath = computed(() => normalizePath(route.params.path))

const author = computed(() => article.value?.author || null)


const categoryParts = computed(() => {
  if (!article.value?.meta?.category) return []
  return article.value.meta.category.split('/')
})

const renderedContent = computed(() => {
  if (!article.value?.content) return '<p>' + t('blog.noContent') + '</p>'
  // 静态模式下资源路径已在构建期改写为带 base 的绝对地址，无需再处理
  if (STATIC_MODE) return article.value.content
  // Rewrite relative URLs to absolute paths under /documents/category-files/
  const rawPath = articlePath.value
  const basePath = `/documents/category-files/${encodeURI(rawPath)}`
  return article.value.content.replace(
    /(src|href)\s*=\s*"((?!https?:\/\/|\/\/|\/|data:|#|mailto:)[^"]*)"/gi,
    (_, attr, url) => `${attr}="${basePath}/${url}"`
  ).replace(
    /(src|href)\s*=\s*'((?!https?:\/\/|\/\/|\/|data:|#|mailto:)[^']*)'/gi,
    (_, attr, url) => `${attr}='${basePath}/${url}'`
  )
})

interface TocItem {
  href: string
  text: string
}

const toc = computed<TocItem[]>(() => {
  if (!article.value?.meta?.sections) return []
  return article.value.meta.sections.map(s => ({
    href: `#${s.id}`,
    text: s.title
  }))
})

/** 文章封面横幅：优先 cover，缺省时回退正文第一张图片资源 */
const coverUrl = computed(() => {
  const meta = article.value?.meta
  const coverAsset = Array.isArray(meta?.assets)
    ? meta.assets.find(a => a && a.type === 'image' && a.path)
    : null
  const cover = meta?.cover || coverAsset?.path
  if (!cover) return ''
  if (/^https?:\/\//i.test(cover)) return cover
  if (cover.startsWith('/static/') || cover.startsWith('/background/')) return withBase(cover)
  if (STATIC_MODE) {
    const seg = articlePath.value.split('/').map(encodeURIComponent).join('/')
    return withBase(`/static/documents/${seg}/${cover}`)
  }
  const base = `/documents/category-files/${encodeURI(articlePath.value)}`
  return `${base}/${cover.split('/').map(encodeURIComponent).join('/')}`
})

/** 按发布时间排序的全局文章列表，用于上一篇 / 下一篇 / 相关文章 */
const sortedArticles = computed<ArticleListItem[]>(() => {
  return [...store.flattenArticles()].sort((a, b) => b.created.localeCompare(a.created))
})
const currentIndex = computed(() => sortedArticles.value.findIndex(a => a.path === articlePath.value))
const prevArticle = computed(() => currentIndex.value > 0 ? sortedArticles.value[currentIndex.value - 1] : null)
const nextArticle = computed(() => currentIndex.value >= 0 ? sortedArticles.value[currentIndex.value + 1] || null : null)
const relatedArticles = computed<ArticleListItem[]>(() => {
  const list = sortedArticles.value.filter(a => a.path !== articlePath.value)
  const cat = String(article.value?.meta?.category || '').split('/')[0]
  const same = list.filter(a => a.category.split('/')[0] === cat)
  const others = list.filter(a => a.category.split('/')[0] !== cat)
  return [...same, ...others].slice(0, 3)
})

function openArticle(item: ArticleListItem) {
  router.push(`/blog/article/${item.path}`)
}

function formatListDate(date: string): string {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function itemCoverUrl(item: ArticleListItem): string {
  if (!item.cover) return ''
  if (STATIC_MODE) return withBase(item.cover)
  const base = `/documents/category-files/${item.path.split('/').map(encodeURIComponent).join('/')}`
  return `${base}/${item.cover.split('/').map(encodeURIComponent).join('/')}`
}

function handleContentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
    e.preventDefault()
    scrollToHeading(target.getAttribute('href')!)
  }
}

// 点击目录后的平滑滚动期间，锁定 TOC 高亮为目标章节，避免被 onScroll 的中间章节覆盖
let tocScrollLock = false
let tocScrollEndTimer: number | undefined

function onTocScrollEnd() {
  tocScrollLock = false
  clearTimeout(tocScrollEndTimer)
}

/**
 * 文章配图是 loading="lazy"：如果目标章节在图片下方，平滑滚动途中图片才加载，
 * 高度突然增加会把目标推走，表现为“点了目录却停不到位置 / 越点越往下”。
 * 跳转前先把正文里的懒加载图片放出来，并等它们完成（最多等 1.2s）。
 */
async function ensureArticleImagesReady() {
  const root = contentRef.value
  if (!root) return
  const pending: Promise<unknown>[] = []
  root.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach(img => {
    if (img.complete) return
    // 已有显式宽高时浏览器会按属性预留比例，图片晚到也不会改变布局
    if (img.getAttribute('width') && img.getAttribute('height')) {
      img.loading = 'eager'
      return
    }
    img.loading = 'eager'
    pending.push(new Promise<void>(resolve => {
      img.addEventListener('load', () => resolve(), { once: true })
      img.addEventListener('error', () => resolve(), { once: true })
    }))
  })
  if (!pending.length) return
  await Promise.race([
    Promise.all(pending),
    new Promise<void>(resolve => window.setTimeout(resolve, 1200)),
  ])
}

async function scrollToHeading(href: string) {
  const id = href.replace('#', '')
  const el = document.getElementById(id)
  if (!el) return

  // 点击目录：立即将高亮设为目标章节，并锁定直到滚动结束
  activeToc.value = href
  tocScrollLock = true
  clearTimeout(tocScrollEndTimer)
  // 兜底：scrollend 事件在某些环境下不可靠时，超时后恢复跟随
  tocScrollEndTimer = window.setTimeout(onTocScrollEnd, 1200)

  // 等懒加载图片落位后再测量，否则途中增长的高度会让目标偏移
  await ensureArticleImagesReady()

  const container = document.querySelector('.blog-app')
  if (container) {
    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const offset = elRect.top - containerRect.top - 80
    container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' })
  }

  history.replaceState(null, '', href)
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/blog/')
  }
}

function onScroll() {
  // 以 .blog-app 滚动容器为坐标基准（而非浏览器视口），
  // 否则窗口在桌面中的位置会导致 TOC 高亮产生像素级偏差。
  const container = document.querySelector<HTMLElement>('.blog-app')
  if (container) {
    const max = container.scrollHeight - container.clientHeight
    readPct.value = max > 0 ? Math.min(100, Math.round((container.scrollTop / max) * 100)) : 0
  }
  if (tocScrollLock) return
  if (!toc.value.length) return
  const baseTop = container ? container.getBoundingClientRect().top : 0
  const headings = toc.value.map(t => {
    const el = document.getElementById(t.href.replace('#', ''))
    return el ? { href: t.href, top: el.getBoundingClientRect().top - baseTop } : null
  }).filter(Boolean) as { href: string; top: number }[]

  // 标题滚动到容器顶部下方停靠线（80px，与 scrollToHeading / sticky top 对齐）以内即高亮
  let current = ''
  for (const h of headings) {
    if (h.top <= 80) current = h.href
  }
  if (!current && headings.length) current = headings[0].href
  activeToc.value = current
}

/**
 * Recreate <script> elements inside contentRef so inline scripts actually execute.
 * Browser's innerHTML (used by v-html) discards script execution.
 */
function recreateScripts() {
  const el = contentRef.value
  if (!el) return
  el.querySelectorAll('script').forEach((s) => {
    const ns = document.createElement('script')
    for (let i = 0; i < s.attributes.length; i++) {
      ns.setAttribute(s.attributes[i].name, s.attributes[i].value)
    }
    ns.textContent = s.textContent
    s.replaceWith(ns)
  })
}

async function init() {
  loading.value = true
  error.value = null
  try {
    const path = articlePath.value
    if (!path) throw new Error(t('blog.invalidArticlePath'))
    if (!store.categories.length) {
      try { await store.fetchCategories() } catch { /* 上下篇导航为可选增强，不阻断正文 */ }
    }
    const res = await api.getCategoryContent(path)
    article.value = res
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(() => article.value?.content, () => {
  if (article.value?.content) {
    nextTick(recreateScripts)
  }
})

// 界面语言切换时按对应语言版本重新加载文章内容
watch(locale, () => {
  if (route.params.path) init()
})

onMounted(() => {
  init()
  const container = document.querySelector('.blog-app')
  if (container) {
    container.addEventListener('scroll', onScroll, { passive: true })
    container.addEventListener('scrollend', onTocScrollEnd)
  }
})

onUnmounted(() => {
  clearTimeout(tocScrollEndTimer)
  const container = document.querySelector('.blog-app')
  if (container) {
    container.removeEventListener('scroll', onScroll)
    container.removeEventListener('scrollend', onTocScrollEnd)
  }
})
</script>

<style lang="scss" scoped>
.article-page {
  padding-bottom: 80px;
}

// ── Header ──
.article-header {
  padding: 48px 0 40px;
  position: relative;
  background: radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, .06) 0%, transparent 60%);
  border-bottom: 1px solid rgba(255, 255, 255, .04);
  overflow: hidden;
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
  margin-bottom: 20px;
  font-size: 13px;
}

.breadcrumb-link {
  color: rgba(255, 255, 255, .4);
  transition: color .15s;
  &:hover { color: #8b5cf6; }
}

.breadcrumb-sep {
  color: rgba(255, 255, 255, .15);
}

.breadcrumb-current {
  color: rgba(255, 255, 255, .3);
}

.article-kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(139, 92, 246, .8);
  font-family: 'JetBrains Mono', monospace;

  .kicker-line {
    width: 24px;
    height: 2px;
    border-radius: 2px;
    background: var(--accent);
  }

  .kicker-category { color: rgba(255, 255, 255, .3); }
}

.article-title {
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 800;
  color: #fff;
  line-height: 1.3;
  letter-spacing: -0.01em;
  margin-bottom: 10px;
}

.article-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, .45);
  line-height: 1.5;
  max-width: 700px;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, .4);
}

.meta-author {
  display: flex;
  align-items: center;
  gap: 6px;
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.meta-date,
.meta-reading {
  display: flex;
  align-items: center;
  gap: 4px;
  svg { opacity: .5; }
}

// ── Cover banner ──
.cover-wrap {
  padding-top: 32px;
}

.article-cover {
  position: relative;
  aspect-ratio: 2.4 / 1;
  max-height: 420px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(139, 92, 246, .14);
  box-shadow: 0 20px 50px rgba(0, 0, 0, .3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.cover-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 50%, rgba(11, 11, 20, .55));
  pointer-events: none;
}

// ── Layout ──
/* 正文页比首页/分类更宽：单独放大容器，正文列放宽到 1000px */
.article-header .header-content,
.article-layout.container {
  max-width: 1360px;
}

.article-layout {
  display: flex;
  gap: 48px;
  padding-top: 40px;
  /* 正文 + 目录整体在页面中居中，避免右侧留白 */
  justify-content: center;
}

.article-body {
  flex: 1;
  min-width: 0;
  /* 加宽正文列：过窄会把长文拉得很长 */
  max-width: 1000px;
  animation: article-fade .5s ease both;
}

@keyframes article-fade {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.article-sidebar {
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  align-self: flex-start;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  display: none;

  @media (min-width: 1024px) {
    display: block;
  }
}

.toc-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.toc-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, .4);
  text-transform: uppercase;
  letter-spacing: .08em;
}

.toc-percent {
  font-size: 11px;
  color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
}

.toc-progress {
  height: 2px;
  border-radius: 2px;
  background: rgba(255, 255, 255, .06);
  margin-bottom: 14px;
  overflow: hidden;
}

.toc-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  border-radius: 2px;
  transition: width .15s linear;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toc-link {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  color: rgba(255, 255, 255, .35);
  transition: all .15s;

  &:hover {
    color: rgba(255, 255, 255, .6);
    background: rgba(255, 255, 255, .03);
  }

  &.toc-active {
    color: #8b5cf6;
    background: rgba(139, 92, 246, .08);
    box-shadow: inset 2px 0 0 var(--accent);
  }
}

.toc-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ── Content Styles (scoped globally within .article-content) ──
/* 文章正文 HTML 自带 .blog-post，WebWord 全局样式里限制为 780px；博客文章页放开到正文列宽 */
.article-content :deep(.blog-post) {
  max-width: 100%;
  margin: 0;
}

:deep(.article-content) {
  font-size: 16px;
  line-height: 1.8;
  color: #d1d5db;

  h1, h2, h3, h4 {
    color: #fff;
    font-weight: 700;
    margin-top: 1.8em;
    margin-bottom: .6em;
    line-height: 1.3;
  }

  h2 { font-size: 24px; }
  h3 { font-size: 20px; }
  h4 { font-size: 17px; }

  p {
    margin-bottom: 1.2em;
  }

  a {
    color: #8b5cf6;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: opacity .15s;

    &:hover { opacity: .75; }
  }

  strong {
    color: #fff;
    font-weight: 600;
  }

  blockquote {
    border-left: 3px solid rgba(139, 92, 246, .3);
    padding: 12px 20px;
    margin: 1.5em 0;
    background: rgba(255, 255, 255, .02);
    border-radius: 0 8px 8px 0;
    color: rgba(255, 255, 255, .6);
    font-style: italic;
  }

  ul, ol {
    padding-left: 24px;
    margin-bottom: 1.2em;
  }

  li {
    margin-bottom: .3em;
  }

  code {
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    background: rgba(255, 255, 255, .04);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: .9em;
    color: #e4e4e7;
  }

  pre {
    background: rgba(0, 0, 0, .3);
    border: 1px solid rgba(255, 255, 255, .04);
    border-radius: 10px;
    padding: 20px;
    overflow-x: auto;
    margin: 1.5em 0;

    code {
      background: none;
      padding: 0;
      border-radius: 0;
      font-size: 14px;
      line-height: 1.6;
    }
  }

  img {
    border-radius: 10px;
    margin: 1.5em 0;
    border: 1px solid rgba(255, 255, 255, .04);
  }

  hr {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, .06);
    margin: 2em 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    font-size: 14px;
  }

  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, .06);
  }

  th {
    color: #fff;
    font-weight: 600;
    background: rgba(255, 255, 255, .02);
  }
}

// ── Tags ──
.article-tags {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, .04);
}

.tags-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, .3);
  text-transform: uppercase;
  letter-spacing: .05em;
  display: block;
  margin-bottom: 10px;
}

.tag {
  display: inline-block;
  padding: 4px 10px;
  margin: 0 4px 4px 0;
  border-radius: 4px;
  font-size: 12px;
  background: rgba(139, 92, 246, .08);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, .12);
}

// ── References ──
.article-references {
  margin-top: 32px;
}

.refs-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, .6);
  margin-bottom: 12px;
}

.refs-list {
  padding-left: 20px;

  li {
    font-size: 13px;
    margin-bottom: 8px;
    line-height: 1.5;
  }

  a {
    color: rgba(255, 255, 255, .5);
    transition: color .15s;

    &:hover {
      color: #8b5cf6;
    }
  }

  .ref-publisher {
    color: rgba(255, 255, 255, .25);
  }
}

// ── End mark ──
.article-end {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 56px 0 40px;
  color: rgba(139, 92, 246, .45);
  font-size: 10px;
  letter-spacing: .2em;
  font-family: 'JetBrains Mono', monospace;

  &::before,
  &::after {
    content: '';
    height: 1px;
    flex: 1;
    background: linear-gradient(90deg, transparent, rgba(139, 92, 246, .2));
  }
  &::after { background: linear-gradient(90deg, rgba(139, 92, 246, .2), transparent); }
  span { margin: 0 16px; }
}

// ── Author card ──
.author-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 14px;
  border: 1px solid rgba(139, 92, 246, .16);
  background: linear-gradient(135deg, rgba(139, 92, 246, .06), rgba(255, 255, 255, .015));
}

.author-avatar-wrap { flex-shrink: 0; }

.author-card-avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  object-fit: cover;
  display: block;
  border: 1px solid rgba(255, 255, 255, .14);
  background: #0d141f;
}

.author-card-info {
  flex: 1;
  min-width: 0;

  h4 { font-size: 15px; color: #fff; font-weight: 700; }
}

.author-card-label {
  display: block;
  font-size: 11px;
  color: var(--text-faint);
  margin-bottom: 3px;
}

.author-card-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, .1);
  font-size: 12px;
  color: var(--text-dim);
  transition: all .15s;

  &:hover {
    color: var(--accent);
    border-color: rgba(139, 92, 246, .35);
    background: rgba(139, 92, 246, .06);
  }
}

// ── Prev / Next ──
.post-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 20px;
}

.post-nav-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, .02);
  text-align: left;
  transition: all .2s;

  &:hover {
    border-color: rgba(139, 92, 246, .3);
    background: rgba(139, 92, 246, .05);
    transform: translateY(-2px);
    .post-nav-title { color: #fff; }
  }

  &.next { align-items: flex-end; text-align: right; }
}

.post-nav-label {
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
}

.post-nav-title {
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color .2s;
}

// ── Related ──
.related-section {
  padding-top: 72px;
}

.section-kicker {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(139, 92, 246, .7);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 8px;
}

.section-header { margin-bottom: 20px; }

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  position: relative;
  display: inline-block;

  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 38px;
    height: 3px;
    border-radius: 2px;
    background: linear-gradient(90deg, #8b5cf6, transparent);
  }
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.related-card {
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, .02);
  overflow: hidden;
  cursor: pointer;
  transition: all .2s;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(139, 92, 246, .3);
    box-shadow: 0 12px 30px rgba(0, 0, 0, .25);

    .related-cover img { transform: scale(1.05); }
    .related-body h3 { color: var(--accent); }
  }
}

.related-cover {
  height: 110px;
  overflow: hidden;
  background: linear-gradient(145deg, #14202a, #0d1119);
  display: flex;
  align-items: center;
  justify-content: center;

  img { width: 100%; height: 100%; object-fit: cover; transition: transform .35s; }
}

.related-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: rgba(196, 181, 253, .45);

  span {
    font-size: 10px;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, .3);
  }
}

.related-body {
  padding: 14px 16px;

  h3 {
    font-size: 13.5px;
    font-weight: 600;
    color: #fff;
    line-height: 1.5;
    margin: 6px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color .2s;
  }
}

.related-cat {
  font-size: 10px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: .06em;
}

.related-date {
  font-size: 11px;
  color: rgba(255, 255, 255, .3);
  font-family: 'JetBrains Mono', monospace;
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
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin .6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
    color: #8b5cf6;
    font-size: 13px;
    transition: all .15s;

    &:hover {
      background: rgba(139, 92, 246, .08);
      border-color: rgba(139, 92, 246, .2);
    }
  }
}

// ── Responsive ──
@media (max-width: 768px) {
  .article-header {
    padding: 28px 0 24px;
  }

  .article-kicker { margin-bottom: 10px; }

  .cover-wrap { padding-top: 20px; }
  .article-cover { height: 180px; border-radius: 12px; }

  .author-card { padding: 16px; gap: 12px; }
  .author-card-link { display: none; }

  .post-nav { grid-template-columns: 1fr; gap: 10px; }
  .post-nav-item.next { align-items: flex-start; text-align: left; }

  .related-section { padding-top: 52px; }
  .related-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .related-cover { height: 90px; }

  .header-top {
    margin-bottom: 12px;
  }

  .breadcrumb {
    margin-bottom: 14px;
    font-size: 12px;
    flex-wrap: wrap;
  }

  .article-title {
    font-size: clamp(20px, 5vw, 28px);
  }

  .article-subtitle {
    font-size: 14px;
  }

  .article-meta {
    gap: 12px;
    margin-top: 14px;
    font-size: 12px;
  }

  .article-layout {
    flex-direction: column;
    gap: 24px;
    padding-top: 24px;
  }

  .article-body {
    max-width: 100%;
  }

  :deep(.article-content) {
    font-size: 15px;
    line-height: 1.75;

    h2 { font-size: 20px; }
    h3 { font-size: 17px; }
    h4 { font-size: 15px; }

    pre {
      padding: 14px;
      margin: 1em 0;
      // 允许代码块横向滚动而非溢出
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;

      code {
        font-size: 13px;
      }
    }

    blockquote {
      padding: 10px 14px;
      margin: 1em 0;
    }

    ul, ol {
      padding-left: 20px;
    }

    table {
      font-size: 13px;
      display: block;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    img {
      border-radius: 8px;
    }
  }

  .article-tags,
  .article-references {
    margin-top: 28px;
  }

  .loading-state,
  .error-state {
    padding: 80px 0;
  }
}

@media (max-width: 480px) {
  .article-header {
    padding: 20px 0 18px;
  }

  .article-cover { height: 140px; }
  .related-grid { grid-template-columns: 1fr; }

  .article-title {
    font-size: 20px;
  }

  :deep(.article-content) {
    font-size: 14.5px;

    pre {
      padding: 12px;
      border-radius: 8px;
    }
  }
}
</style>
