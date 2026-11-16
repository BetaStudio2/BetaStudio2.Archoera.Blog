import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

const router = createRouter({
  // base 让站点可部署在 GitHub Pages 的子路径（如 /BetaStudio2-Blog/）
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    // ── Blog ──
    {
      path: '/blog',
      component: () => import('@/components/BlogLayout.vue'),
      children: [
        { path: '', redirect: { path: '/blog/' } },
        {
          path: '/blog/',
          name: 'blog-home',
          component: () => import('@/blog/views/Home.vue')
        },
        {
          path: '/blog/category/:path(.*)',
          name: 'blog-category',
          component: () => import('@/blog/views/Category.vue')
        },
        {
          path: '/blog/article/:path(.*)',
          name: 'blog-article',
          component: () => import('@/blog/views/Article.vue')
        }
      ]
    },
    // ── WebWord ──
    {
      path: '/webword',
      name: 'webword',
      component: () => import('@/components/WebWordWrapper.vue')
    }
  ]
})

export default router
