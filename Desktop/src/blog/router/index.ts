import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/blog`),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/blog/views/Home.vue')
    },
    {
      path: '/category/:path(.*)',
      name: 'category',
      component: () => import('@/blog/views/Category.vue')
    },
    {
      path: '/article/:path(.*)',
      name: 'article',
      component: () => import('@/blog/views/Article.vue')
    }
  ]
})

export default router
