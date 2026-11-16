#!/usr/bin/env node
/**
 * 本地预览静态构建产物（模拟 GitHub Pages 的子路径部署）
 *   node scripts/serve-static.mjs [--port=4173] [--base=/BetaStudio2-Blog/]
 * 行为与 Pages 一致：找不到的路径回退 404.html。
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'Desktop', 'dist')

const arg = (name, fallback) => {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}

let BASE = arg('base', process.env.BASE_PATH || '/')
if (!BASE.startsWith('/')) BASE = '/' + BASE
if (!BASE.endsWith('/')) BASE += '/'
const PORT = Number(arg('port', process.env.PORT || 4173))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm',
}

function sendFile(res, file, status = 200) {
  const ext = path.extname(file).toLowerCase()
  res.writeHead(status, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
}

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0])
  if (!url.startsWith(BASE)) {
    // 根路径重定向到部署子路径，方便直接打开 localhost
    res.writeHead(302, { Location: BASE })
    res.end()
    return
  }
  let rel = url.slice(BASE.length)
  if (rel === '' || rel.endsWith('/')) rel += 'index.html'
  const target = path.join(DIST, rel)
  if (!target.startsWith(DIST)) {
    res.writeHead(403).end('Forbidden')
    return
  }
  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    sendFile(res, target)
    return
  }
  // 目录请求 → 目录下的 index.html（与 Pages 的目录索引行为一致）
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    const idx = path.join(target, 'index.html')
    if (fs.existsSync(idx)) {
      sendFile(res, idx)
      return
    }
  }
  // SPA 回退（与 GitHub Pages 的 404.html 行为一致）
  const fallback = path.join(DIST, '404.html')
  if (fs.existsSync(fallback)) sendFile(res, fallback, 404)
  else res.writeHead(404).end('Not Found')
}).listen(PORT, () => {
  console.log(`静态预览: http://localhost:${PORT}${BASE}`)
})
