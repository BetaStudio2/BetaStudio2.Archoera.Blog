#!/usr/bin/env node
/**
 * 静态站点构建（GitHub Pages 用）
 * ─────────────────────────────────────────────────────────────
 * 步骤：
 *   1. 使用已提交的 Desktop/public/static 快照
 *      （本地改过文章时先执行 pnpm export 重新导出）
 *   2. 以 VITE_STATIC=1 + 部署 base 执行 vite build
 *   3. 生成 404.html（Pages 的 SPA 回退）、.nojekyll 和已知路由的入口页
 *
 * 用法：
 *   BASE_PATH=/BetaStudio2-Blog/ node scripts/build-static.mjs
 *   BASE_PATH=/ node scripts/build-static.mjs            # 自定义域名 / 用户主页
 *   pnpm export && pnpm build:static                     # 文章有更新时
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'Desktop', 'dist')
const STATIC_DIR = path.join(ROOT, 'Desktop', 'public', 'static')

function normalizeBase(raw) {
  let base = String(raw || '/').trim()
  if (!base.startsWith('/')) base = '/' + base
  if (!base.endsWith('/')) base += '/'
  return base
}

const BASE = normalizeBase(process.env.BASE_PATH || '/')

function run(cmd, args, env = {}) {
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  })
  if (res.status !== 0) {
    console.error(`\n[build-static] 命令失败: ${cmd} ${args.join(' ')}`)
    process.exit(res.status || 1)
  }
}

console.log(`[build-static] 部署 base: ${BASE}`)

// 1. 检查静态快照
if (!fs.existsSync(path.join(STATIC_DIR, 'blog', 'tree.json'))) {
  console.error('[build-static] 缺少 Desktop/public/static 快照，请先执行: pnpm export')
  process.exit(1)
}

// 2. 前端构建（静态模式）
run('pnpm', ['--filter', 'desktop', 'exec', '--', 'vite', 'build'], {
  VITE_STATIC: '1',
  BASE_PATH: BASE,
})

// 3. Pages 配套文件
const indexHtml = path.join(DIST, 'index.html')
if (!fs.existsSync(indexHtml)) {
  console.error('[build-static] 未找到 dist/index.html，构建可能未完成')
  process.exit(1)
}
// SPA 回退：GitHub Pages 对未知路径返回 404.html，内容与 index.html 相同即可
// 保留原始 URL 让 vue-router 正常解析（资源使用绝对 base 路径）
fs.copyFileSync(indexHtml, path.join(DIST, '404.html'))
fs.writeFileSync(path.join(DIST, '.nojekyll'), '')

// 4. 预生成文章/分类入口页
// Pages 对不存在的路径返回 404（虽然也能渲染，但状态码不友好）。这里为已知路由
// 各生成一份 index.html，让深链接返回 200。
const treeFile = path.join(STATIC_DIR, 'blog', 'tree.json')
if (fs.existsSync(treeFile)) {
  const { tree } = JSON.parse(fs.readFileSync(treeFile, 'utf-8'))
  // 静态路由入口（桌面根页面已有 dist/index.html）
  const routes = new Set(['webword', 'blog'])
  const walk = nodes => {
    for (const node of nodes || []) {
      if (node.type === 'document') {
        routes.add(`blog/article/${node.path}`)
        // 分类页也预生成（每个文档的父级链会单独出现在 tree 中）
      }
      if (node.children) walk(node.children)
    }
  }
  walk(tree.default || [])
  // 目录节点（分类页）
  const walkFolders = nodes => {
    for (const node of nodes || []) {
      if (node.type === 'folder') routes.add(`blog/category/${node.path}`)
      if (node.children) walkFolders(node.children)
    }
  }
  walkFolders(tree.default || [])

  let generated = 0
  for (const route of routes) {
    const dir = path.join(DIST, ...route.split('/').filter(Boolean))
    fs.mkdirSync(dir, { recursive: true })
    fs.copyFileSync(indexHtml, path.join(dir, 'index.html'))
    generated++
  }
  console.log(`[build-static] 预生成入口页 ${generated} 个`)
}

const distSize = Number(
  spawnSync('du', ['-sm', DIST], { encoding: 'utf-8' }).stdout?.trim().split(/\s+/)[0] || 0
)
console.log(`[build-static] 完成 → ${path.relative(ROOT, DIST)} (约 ${distSize} MB)`)
