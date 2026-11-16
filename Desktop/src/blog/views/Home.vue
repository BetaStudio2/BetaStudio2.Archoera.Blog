<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="container hero-content">
        <h1 class="hero-title">{{ $t('blog.homeTitle') }}</h1>
        <p class="hero-subtitle">{{ $t('blog.homeSubtitle') }}</p>
        <div class="hero-stats" v-if="articles.length">
          <span class="stat-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            {{ $t('blog.articleCount', { count: articles.length }) }}
          </span>
          <span class="stat-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            {{ $t('blog.categoryCount', { count: uniqueCategories }) }}
          </span>
        </div>
      </div>
      <div class="hero-decoration">
        <div class="deco-dot" v-for="i in 30" :key="i" :style="dotStyle(i)"></div>
      </div>
    </section>

    <!-- Articles Grid -->
    <section class="container articles-section">
      <div class="section-header">
        <h2 class="section-title">{{ $t('blog.latestArticles') }}</h2>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ $t('blog.loadFailed', { msg: error }) }}</p>
        <button class="retry-btn" @click="init">{{ $t('blog.retry') }}</button>
      </div>

      <div v-else class="articles-grid">
        <article
          v-for="(article, index) in articles"
          :key="article.path"
          class="article-card"
          :style="{ animationDelay: `${index * 0.05}s` }"
          @click="openArticle(article)"
        >
          <div v-if="article.cover" class="card-cover">
            <img :src="coverUrl(article)" :alt="article.title" loading="lazy" />
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span class="card-category" @click.stop="openCategory(article)">{{ topCategoryPath(article.category, article.path) }}</span>
              <span class="card-date">{{ formatDate(article.created) }}</span>
            </div>
            <h3 class="card-title">{{ article.title }}</h3>
            <p v-if="article.description" class="card-desc">{{ article.description }}</p>
            <div v-if="article.tags && article.tags.length" class="card-tags">
              <span v-for="tag in article.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
              <span v-if="article.tags.length > 3" class="tag tag-more">+{{ article.tags.length - 3 }}</span>
            </div>
          </div>
        </article>

        <div v-if="!articles.length && !loading" class="empty-state">
          <p>{{ $t('blog.noArticles') }}</p>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="container category-section" v-if="store.categories.length">
      <div class="section-header">
        <h2 class="section-title">{{ $t('blog.browseCategories') }}</h2>
      </div>
      <div class="category-grid">
        <div
          v-for="cat in topCategories"
          :key="cat.path"
          class="category-card"
          @click="openCategory({ path: cat.path })"
        >
          <div class="cat-card-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          </div>
          <h3 class="cat-card-name">{{ cat.name }}</h3>
          <p v-if="cat.children" class="cat-card-count">{{ $t('blog.articleCount', { count: countDocs(cat) }) }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore, type ArticleListItem } from '@/blog/stores/blog'
import { STATIC_MODE, withBase } from '@/utils/siteMode'

const router = useRouter()
const store = useBlogStore()

const articles = ref<ArticleListItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const uniqueCategories = computed(() => {
  const cats = new Set(articles.value.map(a => a.category.split('/')[0]))
  return cats.size
})

const topCategories = computed(() => {
  return store.categories.filter(c => c.type === 'folder' || c.children)
})

function countDocs(node: any): number {
  if (node.type === 'document') return 1
  if (node.children) return node.children.reduce((sum: number, child: any) => sum + countDocs(child), 0)
  return 0
}

function formatCategory(cat: string): string {
  const parts = String(cat || '').split('/').filter(Boolean)
  return parts[0] || ''
}

/** 首页卡片上的分类标签只显示一级分类，点击也应跳到该一级分类 */
function topCategoryPath(cat: string, fallback: string): string {
  const first = formatCategory(cat)
  if (first) return first
  // 少数文档没有 category 字段，退回文章路径的一级目录
  return String(fallback || '').split('/').filter(Boolean)[0] || ''
}

function formatDate(date: string): string {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

function coverUrl(article: ArticleListItem): string {
  if (!article.cover) return ''
  // 静态构建时封面是站点根相对地址（/static/...），需补部署 base
  if (STATIC_MODE) return withBase(article.cover)
  // Build full URL from relative path
  const base = `/documents/category-files/${article.path.split('/').map(encodeURIComponent).join('/')}`
  return `${base}/${article.cover.split('/').map(encodeURIComponent).join('/')}`
}

function openArticle(article: ArticleListItem) {
  router.push(`/blog/article/${article.path}`)
}

function openCategory(article: { path: string; category?: string }) {
  const target = topCategoryPath(article.category || '', article.path)
  if (!target) return
  router.push(`/blog/category/${target}`)
}

function dotStyle(i: number) {
  const x = (i * 37 + 13) % 100
  const y = (i * 53 + 7) % 100
  const size = 2 + (i % 4)
  const opacity = 0.03 + (i % 5) * 0.02
  const delay = i * 0.5
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}px`,
    height: `${size}px`,
    opacity,
    animationDelay: `${delay}s`
  }
}

async function init() {
  loading.value = true
  error.value = null
  try {
    await store.fetchCategories()
    const flat = store.flattenArticles()
    // Sort by created date descending
    flat.sort((a, b) => {
      if (!a.created) return 1
      if (!b.created) return -1
      return b.created.localeCompare(a.created)
    })
    articles.value = flat
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(init)
</script>

<style lang="scss" scoped>
.home {
  // ── Hero ──
  .hero {
    position: relative;
    overflow: hidden;
    padding: 80px 0;
    text-align: center;
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(66, 184, 131, .08) 0%, transparent 60%);
    pointer-events: none;
  }

  .hero-decoration {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .deco-dot {
    position: absolute;
    border-radius: 50%;
    background: #42b883;
    animation: dot-float 8s ease-in-out infinite alternate;
  }

  @keyframes dot-float {
    0% { transform: translateY(0); }
    100% { transform: translateY(-20px); }
  }

  .hero-content {
    position: relative;
    z-index: 1;
  }

  .hero-title {
    font-size: clamp(28px, 5vw, 48px);
    font-weight: 800;
    color: #fff;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }

  .hero-subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, .5);
    max-width: 480px;
    margin: 0 auto 24px;
  }

  .hero-stats {
    display: flex;
    justify-content: center;
    gap: 24px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, .4);
    
    svg { opacity: .5; }
  }

  // ── Section ──
  .section-header {
    margin-bottom: 32px;
  }

  .section-title {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    position: relative;
    display: inline-block;

    &::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 40px;
      height: 3px;
      border-radius: 2px;
      background: linear-gradient(90deg, #42b883, transparent);
    }
  }

  .articles-section {
    padding-top: 40px;
  }

  // ── Articles Grid ──
  .articles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 24px;
  }

  .article-card {
    background: rgba(255, 255, 255, .03);
    border: 1px solid rgba(255, 255, 255, .04);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all .25s cubic-bezier(.4,0,.2,1);
    animation: card-in .4s ease backwards;

    &:hover {
      transform: translateY(-4px);
      border-color: rgba(66, 184, 131, .2);
      box-shadow: 0 12px 40px rgba(0, 0, 0, .3);
      background: rgba(255, 255, 255, .05);
    }
  }

  @keyframes card-in {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .card-cover {
    height: 180px;
    overflow: hidden;
    background: rgba(255, 255, 255, .02);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform .3s ease;
    }

    .article-card:hover & img {
      transform: scale(1.05);
    }
  }

  .card-body {
    padding: 20px;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

  .card-category {
    font-size: 11px;
    font-weight: 600;
    color: #42b883;
    background: rgba(66, 184, 131, .1);
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: .03em;

    &:hover { background: rgba(66, 184, 131, .18); }
  }

  .card-date {
    font-size: 12px;
    color: rgba(255, 255, 255, .35);
  }

  .card-title {
    font-size: 17px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-desc {
    font-size: 14px;
    color: rgba(255, 255, 255, .5);
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, .04);
    color: rgba(255, 255, 255, .4);
    border: 1px solid rgba(255, 255, 255, .06);

    &.tag-more {
      background: none;
      color: rgba(255, 255, 255, .25);
      border-style: dashed;
    }
  }

  // ── Category Grid ──
  .category-section {
    padding-top: 80px;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .category-card {
    background: rgba(255, 255, 255, .02);
    border: 1px solid rgba(255, 255, 255, .04);
    border-radius: 10px;
    padding: 24px 20px;
    cursor: pointer;
    transition: all .2s;
    text-align: center;

    &:hover {
      border-color: rgba(66, 184, 131, .15);
      background: rgba(66, 184, 131, .04);
      transform: translateY(-2px);
    }
  }

  .cat-card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(66, 184, 131, .1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
    color: #42b883;
  }

  .cat-card-name {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
  }

  .cat-card-count {
    font-size: 12px;
    color: rgba(255, 255, 255, .35);
  }

  // ── States ──
  .loading-state {
    display: flex;
    justify-content: center;
    padding: 60px 0;
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

  .error-state {
    text-align: center;
    padding: 60px 0;
    color: rgba(255, 255, 255, .5);

    .retry-btn {
      margin-top: 12px;
      padding: 8px 20px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, .1);
      background: none;
      color: #fff;
      font-size: 13px;
      transition: all .15s;

      &:hover {
        background: rgba(255, 255, 255, .06);
        border-color: rgba(66, 184, 131, .3);
      }
    }
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px;
    color: rgba(255, 255, 255, .3);
  }

  // ── Responsive ──
  @media (max-width: 768px) {
    .hero {
      padding: 48px 0;
    }

    .hero-title {
      font-size: clamp(24px, 6vw, 36px);
    }

    .hero-subtitle {
      font-size: 14px;
      padding: 0 8px;
    }

    .hero-stats {
      gap: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .section-header {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 18px;
    }

    .articles-section {
      padding-top: 28px;
    }

    .articles-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .article-card:hover {
      // 触屏设备避免悬停状态卡住
      transform: none;
    }

    .card-cover {
      height: 140px;
    }

    .card-body {
      padding: 14px;
    }

    .card-title {
      font-size: 15px;
    }

    .card-desc {
      font-size: 13px;
    }

    .category-section {
      padding-top: 48px;
    }

    .category-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .category-card {
      padding: 16px 12px;
    }

    .cat-card-icon {
      width: 32px;
      height: 32px;
    }

    .cat-card-name {
      font-size: 13px;
    }
  }

  @media (max-width: 480px) {
    .hero {
      padding: 32px 0;
    }

    .articles-grid {
      gap: 12px;
    }

    .category-grid {
      grid-template-columns: 1fr;
    }

    .empty-state {
      padding: 40px 16px;
    }
  }
}
</style>
