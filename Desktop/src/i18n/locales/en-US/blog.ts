/**
 * Blog sub-app strings (BlogLayout boot splash/home/category/article/comments)
 * All keys prefixed with `blog.`
 */
export default {
  // ── Navigation (BlogLayout.vue) ──
  'blog.home': 'Home',
  'blog.navCategories': 'Categories',

  // ── Home (Home.vue) ──
  'blog.homeTitle': "BetaStudio2's Nook",
  'blog.homeSubtitle': 'Documenting tech, life, and thoughts. Rarely updated, always tinkering.',
  'blog.articleCount': '{count} articles',
  'blog.categoryCount': '{count} categories',
  'blog.latestArticles': 'Latest Articles',
  'blog.loadFailed': 'Failed to load: {msg}',
  'blog.retry': 'Retry',
  'blog.noArticles': 'No articles yet',
  'blog.browseCategories': 'Browse Categories',

  // ── Category (Category.vue) ──
  'blog.backHome': '← Back to Home',
  'blog.articlesTitle': 'Articles',
  'blog.categoryEmpty': 'No articles in this category yet',

  // ── Article (Article.vue) ──
  'blog.minutes': '{count} min read',
  'blog.tagsLabel': 'Tags',
  'blog.referencesTitle': 'References',
  'blog.tocTitle': 'Table of Contents',
  'blog.noContent': 'No content',
  'blog.invalidArticlePath': 'Invalid article path',

  // ── API errors (services/api.ts) ──
  'blog.requestFailed': 'Request failed',
  'blog.articleNotFound': 'Article not found',
}
