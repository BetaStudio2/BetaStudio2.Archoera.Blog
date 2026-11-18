<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-aurora"></div>
      <div class="hero-grid"></div>
      <div class="hero-decoration">
        <div class="deco-dot" v-for="i in 30" :key="i" :style="dotStyle(i)"></div>
      </div>
      <div class="container hero-content">
        <div class="hero-eyebrow"><span class="status-dot"></span>{{ $t('blog.heroEyebrow') }}</div>
        <div class="hero-avatar">
          <img :src="aboutAvatar" alt="BetaStudio2" />
          <span class="avatar-ring"></span>
        </div>
        <h1 class="hero-title">{{ $t('blog.homeTitle') }}</h1>
        <p class="hero-subtitle">{{ $t('blog.homeSubtitle') }}</p>
        <div class="hero-stats" v-if="articles.length">
          <span class="stat-item">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            {{ $t('blog.articleCount', { count: articles.length }) }}
          </span>
          <span class="stat-divider"></span>
          <span class="stat-item">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            {{ $t('blog.categoryCount', { count: uniqueCategories }) }}
          </span>
        </div>
        <div class="hero-actions">
          <button class="hero-cta" @click="scrollToArticles">
            {{ $t('blog.exploreArticles') }}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
          <a class="hero-ghost" href="https://github.com/BetaStudio2" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 .3a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.54-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.23 0 4.63-2.8 5.65-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0012 .3z"/></svg>
            GitHub
          </a>
        </div>
      </div>
      <div class="scroll-cue"><span></span></div>
    </section>

    <!-- Articles -->
    <section class="container articles-section">
      <div class="section-header">
        <div>
          <div class="section-kicker">01 / ARCHIVE</div>
          <h2 class="section-title">{{ $t('blog.latestArticles') }}</h2>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ $t('blog.loadFailed', { msg: error }) }}</p>
        <button class="retry-btn" @click="init">{{ $t('blog.retry') }}</button>
      </div>

      <template v-else>
        <div class="toolbar">
          <div class="search-box" :class="{ focused: searchFocused }">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              :placeholder="$t('blog.search')"
              @focus="searchFocused = true"
              @blur="searchFocused = false"
            />
            <kbd v-if="!query">/</kbd>
            <button v-else class="search-clear" @click="query = ''" aria-label="clear">×</button>
          </div>
          <div class="filter-chips">
            <button
              class="chip"
              :class="{ active: activeCategory === '' }"
              @click="activeCategory = ''"
            >{{ $t('blog.allCategories') }}</button>
            <button
              v-for="cat in topCategories"
              :key="cat.path"
              class="chip"
              :class="{ active: activeCategory === cat.name }"
              @click="activeCategory = cat.name"
            >{{ cat.name }}</button>
          </div>
          <button class="sort-btn" :title="$t('blog.sortNewest')" @click="sortNewest = !sortNewest">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h13M3 12h9M3 18h5M17 15l3 3 3-3M20 18V6"/></svg>
            <span>{{ sortNewest ? $t('blog.sortNewest') : $t('blog.sortOldest') }}</span>
          </button>
        </div>

        <div v-if="filteredArticles.length" class="articles-grid">
          <article
            v-for="(article, index) in filteredArticles"
            :key="article.path"
            class="article-card"
            :style="{ animationDelay: `${index * 0.05}s` }"
            @click="openArticle(article)"
          >
            <div class="card-cover">
              <img v-if="article.cover" :src="coverUrl(article)" :alt="article.title" loading="lazy" />
              <div v-else class="card-cover-fallback">
                <div class="cover-fallback-inner">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                  <span>{{ topCategoryPath(article.category, article.path) }}</span>
                </div>
              </div>
              <span class="card-cover-shine"></span>
            </div>
            <div class="card-body">
              <div class="card-meta">
                <span class="card-category" @click.stop="openCategory(article)">{{ topCategoryPath(article.category, article.path) }}</span>
                <span class="card-date">{{ formatDate(article.created) }}</span>
              </div>
              <h3 class="card-title">{{ article.title }}</h3>
              <p v-if="article.description" class="card-desc">{{ article.description }}</p>
              <div class="card-footer">
                <div v-if="article.tags && article.tags.length" class="card-tags">
                  <span v-for="tag in article.tags.slice(0, 2)" :key="tag" class="tag">{{ tag }}</span>
                  <span v-if="article.tags.length > 2" class="tag tag-more">+{{ article.tags.length - 2 }}</span>
                </div>
                <svg class="card-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">⌕</div>
          <p>{{ $t('blog.noResults') }}</p>
          <button class="retry-btn" @click="clearFilters">{{ $t('blog.clearFilters') }}</button>
        </div>
      </template>
    </section>

    <!-- Tags -->
    <section class="container tags-section" v-if="allTags.length">
      <div class="section-header tags-header">
        <div>
          <div class="section-kicker">02 / DISCOVER</div>
          <h2 class="section-title">{{ $t('blog.tagsCloud') }}</h2>
        </div>
      </div>
      <div class="tag-cloud">
        <button
          v-for="item in allTags"
          :key="item.name"
          class="cloud-tag"
          @click="selectTag(item.name)"
        >
          <span class="hash">#</span>{{ item.name }}
          <span class="cloud-count">{{ item.count }}</span>
        </button>
      </div>
    </section>

    <!-- Categories -->
    <section class="container category-section" v-if="store.categories.length">
      <div class="section-header">
        <div>
          <div class="section-kicker">03 / BROWSE</div>
          <h2 class="section-title">{{ $t('blog.browseCategories') }}</h2>
        </div>
      </div>
      <div class="category-grid">
        <div
          v-for="(cat, ci) in topCategories"
          :key="cat.path"
          class="category-card"
          :style="{ '--cat-hue': 260 + ci * 28 }"
          @click="openCategory({ path: cat.path })"
        >
          <div class="cat-card-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          </div>
          <h3 class="cat-card-name">{{ cat.name }}</h3>
          <p class="cat-card-count">{{ $t('blog.articleCount', { count: countDocs(cat) }) }}</p>
          <svg class="cat-card-arrow" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </div>
      </div>
    </section>

    <!-- About -->
    <section class="container about-section">
      <div class="about-card">
        <div class="about-glow"></div>
        <div class="about-avatar"><img :src="aboutAvatar" alt="BetaStudio2" /></div>
        <div class="about-info">
          <span class="section-kicker">// ABOUT</span>
          <h3>{{ $t('blog.aboutMe') }}</h3>
          <p>{{ $t('blog.aboutText') }}</p>
        </div>
        <div class="about-links">
          <a href="https://github.com/BetaStudio2" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 .3a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.54-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.23 0 4.63-2.8 5.65-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0012 .3z"/></svg>
            GitHub
          </a>
          <button @click="scrollToArticles">{{ $t('blog.latestArticles') }} →</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore, type ArticleListItem } from '@/blog/stores/blog'
import { STATIC_MODE, withBase, asset } from '@/utils/siteMode'

const router = useRouter()
const store = useBlogStore()

const aboutAvatar = asset('images/about-cover.jpg')

const articles = ref<ArticleListItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// ── 搜索 / 筛选 / 排序 ──
const query = ref('')
const activeCategory = ref('')
const sortNewest = ref(true)
const searchInput = ref<HTMLInputElement | null>(null)
const searchFocused = ref(false)

const uniqueCategories = computed(() => {
  const cats = new Set(articles.value.map(a => a.category.split('/')[0]))
  return cats.size
})

const topCategories = computed(() => {
  return store.categories.filter(c => c.type === 'folder' || c.children)
})

const allTags = computed(() => {
  const counts = new Map<string, number>()
  for (const a of articles.value) {
    for (const tag of a.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 18)
})

const filteredArticles = computed(() => {
  let list = articles.value
  const q = query.value.trim().toLowerCase()
  if (q) {
    list = list.filter(a => [a.title, a.description, a.category, ...(a.tags || [])].join(' ').toLowerCase().includes(q))
  }
  if (activeCategory.value) {
    list = list.filter(a => topCategoryPath(a.category, a.path) === activeCategory.value)
  }
  return sortNewest.value ? list : [...list].reverse()
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

function selectTag(tag: string) {
  query.value = tag
  activeCategory.value = ''
  scrollToArticles()
}

function clearFilters() {
  query.value = ''
  activeCategory.value = ''
}

function scrollToArticles() {
  const el = document.querySelector('.articles-section')
  const container = document.querySelector('.blog-app')
  if (el && container) {
    const top = el.getBoundingClientRect().top + container.scrollTop - 72
    container.scrollTo({ top, behavior: 'smooth' })
  }
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

function onGlobalKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(target.tagName)) {
    e.preventDefault()
    searchInput.value?.focus()
  }
  if (e.key === 'Escape' && document.activeElement === searchInput.value) {
    searchInput.value?.blur()
  }
}

function onFocusSearch() {
  searchInput.value?.focus()
  scrollToArticles()
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  window.addEventListener('blog:focus-search', onFocusSearch)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('blog:focus-search', onFocusSearch)
})

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
    padding: 64px 0 72px;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, .04);
  }

  .hero-aurora {
    position: absolute;
    inset: -40% 0 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse 520px 260px at 50% 42%, rgba(139, 92, 246, .16), transparent 70%),
      radial-gradient(ellipse 380px 220px at 28% 60%, rgba(99, 102, 241, .08), transparent 70%),
      radial-gradient(ellipse 380px 220px at 72% 60%, rgba(139, 92, 246, .07), transparent 70%);
    filter: blur(20px);
  }

  .hero-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(255, 255, 255, .022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, .022) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,.7), transparent 85%);
    -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,.7), transparent 85%);
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
    background: #8b5cf6;
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

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 14px;
    border: 1px solid rgba(139, 92, 246, .22);
    border-radius: 999px;
    background: rgba(139, 92, 246, .06);
    color: rgba(139, 92, 246, .9);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #a78bfa;
    box-shadow: 0 0 8px rgba(167, 139, 250, .7);
    animation: status-pulse 2s ease-in-out infinite;
  }

  @keyframes status-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .35; }
  }

  .hero-avatar {
    position: relative;
    width: 86px;
    height: 86px;
    margin: 26px auto 18px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      position: relative;
      z-index: 1;
      width: 72px;
      height: 72px;
      border-radius: 22px;
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, .16);
      box-shadow: 0 14px 34px rgba(0, 0, 0, .38), 0 0 24px rgba(139, 92, 246, .12);
    }
  }

  .avatar-ring {
    position: absolute;
    inset: 0;
    border: 1px dashed rgba(139, 92, 246, .32);
    border-radius: 28px;
    animation: ring-spin 18s linear infinite;
  }

  @keyframes ring-spin {
    to { transform: rotate(360deg); }
  }

  .hero-title {
    font-size: clamp(30px, 5vw, 50px);
    font-weight: 800;
    color: #fff;
    margin-bottom: 12px;
    letter-spacing: -.03em;
    background: linear-gradient(180deg, #fff 30%, rgba(255, 255, 255, .72));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero-subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, .5);
    max-width: 520px;
    margin: 0 auto 22px;
  }

  .hero-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: rgba(255, 255, 255, .4);
    svg { color: var(--accent); opacity: .7; }
  }

  .stat-divider {
    width: 1px;
    height: 12px;
    background: rgba(255, 255, 255, .12);
  }

  .hero-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: 28px;
  }

  .hero-cta,
  .hero-ghost {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 600;
    transition: all .2s;
  }

  .hero-cta {
    border: 1px solid rgba(139, 92, 246, .5);
    color: #0b0b14;
    background: linear-gradient(135deg, #c4b5fd, #8b5cf6);
    box-shadow: 0 8px 24px rgba(139, 92, 246, .18);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(139, 92, 246, .3);
    }
  }

  .hero-ghost {
    border: 1px solid rgba(255, 255, 255, .1);
    color: rgba(255, 255, 255, .7);
    background: rgba(255, 255, 255, .03);

    &:hover {
      color: #fff;
      border-color: rgba(255, 255, 255, .25);
      background: rgba(255, 255, 255, .07);
    }
  }

  .scroll-cue {
    position: absolute;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 30px;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 12px;
    display: flex;
    justify-content: center;
    padding-top: 6px;
    opacity: .5;

    span {
      width: 3px;
      height: 6px;
      border-radius: 2px;
      background: var(--accent);
      animation: scroll-cue 1.8s ease-in-out infinite;
    }
  }

  @keyframes scroll-cue {
    0%, 100% { transform: translateY(0); opacity: 1; }
    60% { transform: translateY(9px); opacity: .2; }
  }

  // ── Section ──
  .section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 26px;
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

  .section-title {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    position: relative;
    display: inline-block;

    &::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 0;
      width: 44px;
      height: 3px;
      border-radius: 2px;
      background: linear-gradient(90deg, #8b5cf6, transparent);
    }
  }

  // ── Articles ──
  .articles-section { padding-top: 72px; }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 240px;
    flex: 1 1 240px;
    max-width: 340px;
    height: 38px;
    padding: 0 12px;
    border-radius: 9px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, .025);
    color: rgba(255, 255, 255, .35);
    transition: all .2s;

    &.focused {
      border-color: rgba(139, 92, 246, .45);
      background: rgba(139, 92, 246, .04);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, .06);
    }

    input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      color: #fff;
      font-size: 13px;

      &::placeholder { color: rgba(255, 255, 255, .28); }
    }

    kbd {
      padding: 1px 6px;
      border: 1px solid rgba(255, 255, 255, .1);
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: rgba(255, 255, 255, .3);
    }
  }

  .search-clear {
    border: none;
    background: none;
    color: rgba(255, 255, 255, .4);
    font-size: 18px;
    line-height: 1;
    &:hover { color: #fff; }
  }

  .filter-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    flex: 1;
  }

  .chip {
    padding: 7px 14px;
    border-radius: 7px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, .02);
    color: var(--text-dim);
    font-size: 12.5px;
    transition: all .15s;

    &:hover {
      color: #fff;
      border-color: rgba(255, 255, 255, .16);
    }

    &.active {
      color: #0b0b14;
      font-weight: 600;
      background: var(--accent);
      border-color: var(--accent);
    }
  }

  .sort-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 7px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, .02);
    color: var(--text-dim);
    font-size: 12.5px;
    white-space: nowrap;
    transition: all .15s;

    &:hover { color: var(--accent); border-color: rgba(139, 92, 246, .3); }
  }

  .articles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .article-card {
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, .025);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: all .25s cubic-bezier(.4,0,.2,1);
    animation: card-in .4s ease backwards;

    &:hover {
      transform: translateY(-5px);
      border-color: rgba(139, 92, 246, .3);
      box-shadow: 0 16px 44px rgba(0, 0, 0, .32), 0 0 30px rgba(139, 92, 246, .06);
      background: rgba(255, 255, 255, .04);

      .card-cover-shine { opacity: 1; }
      .card-arrow { color: var(--accent); transform: translateX(3px); }
    }
  }

  @keyframes card-in {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .card-cover {
    position: relative;
    height: 156px;
    overflow: hidden;
    background: rgba(255, 255, 255, .02);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform .35s ease;
    }

    .article-card:hover & img { transform: scale(1.06); }
  }

  .card-cover-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(circle at 28% 18%, rgba(139, 92, 246, .14), transparent 60%),
      linear-gradient(145deg, #141f29, #0d1119);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255, 255, 255, .028) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, .028) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(circle at center, #000, transparent 78%);
      -webkit-mask-image: radial-gradient(circle at center, #000, transparent 78%);
    }
  }

  .cover-fallback-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: rgba(196, 181, 253, .5);

    span {
      font-size: 11px;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, .34);
    }
  }

  .card-cover-shine {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity .25s;
    background: linear-gradient(120deg, transparent 40%, rgba(255, 255, 255, .08) 50%, transparent 60%);
  }

  .card-body {
    padding: 18px 20px 16px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .card-category {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--accent);
    background: rgba(139, 92, 246, .1);
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: .04em;

    &:hover { background: rgba(139, 92, 246, .22); }
  }

  .card-date {
    font-size: 11.5px;
    color: rgba(255, 255, 255, .32);
    font-family: 'JetBrains Mono', monospace;
  }

  .card-title {
    font-size: 16px;
    font-weight: 650;
    color: #fff;
    margin-bottom: 8px;
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-desc {
    font-size: 13px;
    color: var(--text-dim);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.6;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: auto;
    padding-top: 14px;
  }

  .card-tags { display: flex; flex-wrap: wrap; gap: 6px; }

  .tag {
    font-size: 10.5px;
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

  .card-arrow {
    flex-shrink: 0;
    color: rgba(255, 255, 255, .18);
    transition: all .2s;
  }

  // ── Tags ──
  .tags-section { padding-top: 72px; }

  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cloud-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 7px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, .02);
    color: var(--text-dim);
    font-size: 12.5px;
    transition: all .15s;

    .hash { color: var(--accent); opacity: .7; }
    .cloud-count {
      margin-left: 3px;
      padding: 0 5px;
      border-radius: 4px;
      background: rgba(255, 255, 255, .05);
      font-size: 10px;
      color: rgba(255, 255, 255, .3);
    }

    &:hover {
      color: #fff;
      border-color: rgba(139, 92, 246, .3);
      background: rgba(139, 92, 246, .07);
      transform: translateY(-2px);
    }
  }

  // ── Category Grid ──
  .category-section { padding-top: 72px; }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 14px;
  }

  .category-card {
    position: relative;
    background: rgba(255, 255, 255, .02);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 22px;
    cursor: pointer;
    transition: all .2s;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 100% 0%, hsl(var(--cat-hue) 70% 50% / .12), transparent 60%);
      opacity: 0;
      transition: opacity .25s;
    }

    &:hover {
      border-color: hsl(var(--cat-hue) 70% 50% / .4);
      transform: translateY(-3px);
      background: rgba(255, 255, 255, .04);

      &::before { opacity: 1; }
      .cat-card-arrow { opacity: 1; color: hsl(var(--cat-hue) 70% 65%); }
    }
  }

  .cat-card-icon {
    width: 42px;
    height: 42px;
    border-radius: 11px;
    background: hsl(var(--cat-hue) 70% 50% / .12);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
    color: hsl(var(--cat-hue) 70% 65%);
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

  .cat-card-arrow {
    position: absolute;
    top: 22px;
    right: 20px;
    opacity: 0;
    color: var(--accent);
    transition: all .2s;
  }

  // ── About ──
  .about-section { padding-top: 72px; }

  .about-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 30px 32px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: linear-gradient(135deg, rgba(255,255,255,.035), rgba(255,255,255,.012));
    overflow: hidden;
  }

  .about-glow {
    position: absolute;
    width: 300px;
    height: 300px;
    top: -160px;
    left: -60px;
    border-radius: 50%;
    background: rgba(139, 92, 246, .12);
    filter: blur(70px);
    pointer-events: none;
  }

  .about-avatar {
    position: relative;
    flex-shrink: 0;
    width: 66px;
    height: 66px;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, .14);
    box-shadow: 0 10px 26px rgba(0, 0, 0, .3);
    background: #0d141f;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  .about-info {
    position: relative;
    flex: 1;
    min-width: 0;

    h3 { font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    p { font-size: 13px; line-height: 1.7; color: var(--text-dim); max-width: 560px; }
  }

  .about-links {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;

    a, button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0;
      border: none;
      background: none;
      font-size: 12.5px;
      color: var(--text-dim);
      transition: color .15s;
      &:hover { color: var(--accent); }
    }
  }

  // ── States ──
  .loading-state {
    display: flex;
    justify-content: center;
    padding: 80px 0;
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
    text-align: center;
    padding: 80px 0;
    color: var(--text-dim);

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
        border-color: rgba(139, 92, 246, .3);
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 64px 20px;
    border: 1px dashed rgba(255, 255, 255, .08);
    border-radius: 14px;
    color: var(--text-faint);

    .empty-icon { font-size: 36px; opacity: .4; margin-bottom: 8px; }
    p { font-size: 14px; margin-bottom: 16px; }

    .retry-btn {
      padding: 7px 16px;
      border-radius: 7px;
      border: 1px solid rgba(139, 92, 246, .25);
      background: rgba(139, 92, 246, .06);
      color: var(--accent);
      font-size: 12px;
      &:hover { background: rgba(139, 92, 246, .14); }
    }
  }

  // ── Responsive ──
  @media (max-width: 768px) {
    .hero { padding: 44px 0 48px; }
    .hero-title { font-size: clamp(26px, 6vw, 36px); }
    .hero-subtitle { font-size: 14px; padding: 0 8px; }
    .hero-avatar { margin-top: 20px; }
    .section-title { font-size: 20px; }
    .articles-section, .tags-section, .category-section, .about-section { padding-top: 52px; }

    .toolbar { gap: 10px; }
    .search-box { flex: 1 1 100%; max-width: none; }
    .filter-chips {
      flex: 1 1 auto;
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }
    .chip { flex-shrink: 0; }
    .sort-btn { flex: 0 0 auto; }
    .sort-btn span { display: none; }

    .articles-grid { grid-template-columns: 1fr; gap: 14px; }
    .article-card:hover { transform: none; }
    .card-cover { height: 140px; }

    .category-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .category-card { padding: 16px; }

    .about-card { flex-direction: column; align-items: flex-start; gap: 16px; padding: 24px; }
    .about-links { flex-direction: row; flex-wrap: wrap; gap: 16px; }
  }

  @media (max-width: 480px) {
    .hero { padding: 32px 0 40px; }
    .hero-eyebrow { font-size: 10px; }
    .hero-stats { gap: 10px; }
    .stat-item { font-size: 11px; }
    .hero-actions { flex-direction: column; }
    .hero-cta, .hero-ghost { width: 190px; justify-content: center; }
    .category-grid { grid-template-columns: 1fr; }
    .empty-state { padding: 48px 16px; }
  }
}
</style>
