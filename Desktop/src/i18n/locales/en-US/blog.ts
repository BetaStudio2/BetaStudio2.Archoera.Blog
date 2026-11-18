/**
 * Blog sub-app strings (BlogLayout boot splash/home/category/article/comments)
 * All keys prefixed with `blog.`
 */
export default {
  // ── Navigation (BlogLayout.vue) ──
  'blog.home': 'Home',
  'blog.navCategories': 'Categories',
  'blog.navAbout': 'About',
  'blog.search': 'Search articles…',
  'blog.backToTop': 'Back to top',

  // ── Home (Home.vue) ──
  'blog.homeTitle': "BetaStudio2's Nook",
  'blog.homeSubtitle': 'Documenting tech, life, and thoughts. Rarely updated, always tinkering.',
  'blog.heroEyebrow': 'WELCOME · A CORNER FOR TINKERERS',
  'blog.exploreArticles': 'Explore articles',
  'blog.articleCount': '{count} articles',
  'blog.categoryCount': '{count} categories',
  'blog.latestArticles': 'Latest Articles',
  'blog.allCategories': 'All',
  'blog.sortNewest': 'Newest first',
  'blog.sortOldest': 'Oldest first',
  'blog.noResults': 'No matching articles',
  'blog.clearFilters': 'Clear filters',
  'blog.tagsCloud': 'Tags',
  'blog.aboutMe': 'About me',
  'blog.aboutText': 'A developer who loves tinkering. This is where I note down tech, life, and every curious idea. Pull up a chair.',
  'blog.loadFailed': 'Failed to load: {msg}',
  'blog.retry': 'Retry',
  'blog.noArticles': 'No articles yet',
  'blog.browseCategories': 'Browse Categories',

  // ── Category (Category.vue) ──
  'blog.backHome': '← Back to Home',
  'blog.articlesTitle': 'Articles',
  'blog.categoryEmpty': 'No articles in this category yet',
  'blog.subCategories': 'Subcategories',

  // ── Article (Article.vue) ──
  'blog.minutes': '{count} min read',
  'blog.tagsLabel': 'Tags',
  'blog.referencesTitle': 'References',
  'blog.tocTitle': 'On this page',
  'blog.noContent': 'No content',
  'blog.invalidArticlePath': 'Invalid article path',
  'blog.relatedPosts': 'Related posts',
  'blog.prevArticle': 'Previous',
  'blog.nextArticle': 'Next',
  'blog.authorTagline': 'Notes on tech, life, and tinkering',

  // ── Footer (BlogLayout.vue) ──
  'blog.footerTagline': 'A corner for tech, life, and curiosity.',
  'blog.footerNav': 'Navigate',
  'blog.footerExplore': 'Explore',
  'blog.footerMadeWith': 'Built with Vue 3 & patience',

  // ── API errors (services/api.ts) ──
  'blog.requestFailed': 'Request failed',
  'blog.articleNotFound': 'Article not found',
}
