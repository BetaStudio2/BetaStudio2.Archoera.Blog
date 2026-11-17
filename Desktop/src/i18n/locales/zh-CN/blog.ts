/**
 * 博客子应用文案（BlogLayout 引导启动/首页/分类/文章/评论区等）
 * key 前缀统一使用 `blog.`
 */
export default {
  // ── 导航（BlogLayout.vue）──
  'blog.home': '首页',
  'blog.navCategories': '分类',

  // ── 首页（Home.vue）──
  'blog.homeTitle': 'BetaStudio2 的博客',
  'blog.homeSubtitle': '记录技术、生活与思考。偶尔更新，常在折腾。',
  'blog.articleCount': '{count} 篇文章',
  'blog.categoryCount': '{count} 个分类',
  'blog.latestArticles': '最新文章',
  'blog.loadFailed': '加载失败：{msg}',
  'blog.retry': '重试',
  'blog.noArticles': '暂无文章',
  'blog.browseCategories': '分类浏览',

  // ── 分类页（Category.vue）──
  'blog.backHome': '← 返回首页',
  'blog.articlesTitle': '文章',
  'blog.categoryEmpty': '此分类暂无文章',

  // ── 文章页（Article.vue）──
  'blog.minutes': '{count} 分钟',
  'blog.tagsLabel': '标签',
  'blog.referencesTitle': '参考来源',
  'blog.tocTitle': '目录',
  'blog.noContent': '暂无内容',
  'blog.invalidArticlePath': '文章路径无效',

  // ── 接口错误（services/api.ts）──
  'blog.requestFailed': '请求失败',
  'blog.articleNotFound': '文章不存在',
}
