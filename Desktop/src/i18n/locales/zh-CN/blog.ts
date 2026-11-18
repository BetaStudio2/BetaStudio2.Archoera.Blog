/**
 * 博客子应用文案（BlogLayout 引导启动/首页/分类/文章/评论区等）
 * key 前缀统一使用 `blog.`
 */
export default {
  // ── 导航（BlogLayout.vue）──
  'blog.home': '首页',
  'blog.navCategories': '分类',
  'blog.navAbout': '关于',
  'blog.search': '搜索文章…',
  'blog.backToTop': '回到顶部',

  // ── 首页（Home.vue）──
  'blog.homeTitle': 'BetaStudio2 的小栈',
  'blog.homeSubtitle': '记录技术、生活与思考。偶尔更新，常在折腾。',
  'blog.heroEyebrow': '欢迎光临 · 一个折腾不止的角落',
  'blog.exploreArticles': '开始探索',
  'blog.articleCount': '{count} 篇文章',
  'blog.categoryCount': '{count} 个分类',
  'blog.latestArticles': '最新文章',
  'blog.allCategories': '全部',
  'blog.sortNewest': '最新优先',
  'blog.sortOldest': '最早优先',
  'blog.noResults': '没有找到匹配的文章',
  'blog.clearFilters': '清除筛选',
  'blog.tagsCloud': '标签云',
  'blog.aboutMe': '关于我',
  'blog.aboutText': '一个喜欢折腾的开发者，在这里记录技术、生活与各种奇思妙想。坐坐，随便看看。',
  'blog.loadFailed': '加载失败：{msg}',
  'blog.retry': '重试',
  'blog.noArticles': '暂无文章',
  'blog.browseCategories': '分类浏览',

  // ── 分类页（Category.vue）──
  'blog.backHome': '← 返回首页',
  'blog.articlesTitle': '文章',
  'blog.categoryEmpty': '此分类暂无文章',
  'blog.subCategories': '子分类',

  // ── 文章页（Article.vue）──
  'blog.minutes': '{count} 分钟',
  'blog.tagsLabel': '标签',
  'blog.referencesTitle': '参考来源',
  'blog.tocTitle': '本文目录',
  'blog.noContent': '暂无内容',
  'blog.invalidArticlePath': '文章路径无效',
  'blog.relatedPosts': '相关文章',
  'blog.prevArticle': '上一篇',
  'blog.nextArticle': '下一篇',
  'blog.authorTagline': '记录技术、生活与折腾的日常',

  // ── 页脚（BlogLayout.vue）──
  'blog.footerTagline': '一个关于技术、生活与好奇心的角落。',
  'blog.footerNav': '导航',
  'blog.footerExplore': '探索',
  'blog.footerMadeWith': '用 Vue 3 与耐心构建',

  // ── 接口错误（services/api.ts）──
  'blog.requestFailed': '请求失败',
  'blog.articleNotFound': '文章不存在',
}
