import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// 部署基路径：GitHub Pages 项目页为 /<repo>/，自定义域名/用户主页为 /
// 由 scripts/build-static.mjs 通过 BASE_PATH 注入；本地开发默认 /
function normalizeBase(raw?: string): string {
  let base = String(raw || '/').trim()
  if (!base.startsWith('/')) base = '/' + base
  if (!base.endsWith('/')) base += '/'
  return base
}

const BASE_PATH = normalizeBase(process.env.BASE_PATH)

export default defineConfig({
  base: BASE_PATH,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api']
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/addons': 'http://localhost:3001',
      '/documents': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  }
})
