#!/usr/bin/env node
/**
 * 静态站点数据导出
 * ─────────────────────────────────────────────────────────────
 * GitHub Pages 只能托管静态文件，本脚本在构建时把原本由 Express 提供的
 * /api/documents/* 数据预先导出为静态文件，供 VITE_STATIC=1 构建的前端直接读取。
 *
 * 产物（均提交到仓库，供 GitHub Actions 直接使用）：
 *   Desktop/public/static/blog/tree.json   分类树（按语言）+ 作者信息
 *   Desktop/public/static/blog/<hash>.json 单篇文章（按语言），由 tree 的 data 字段指向
 *   Desktop/public/static/documents/**     文章资源（assets 等，绝不含 .domt/.md 源文件）
 *   Desktop/public/static/avatars/*        作者头像
 *   Desktop/public/static/addons.json      加载项注册表（等价于 /api/addons）
 *   Desktop/public/static/backgrounds.json 壁纸列表（等价于 /api/backgrounds）
 *   Desktop/public/addons/**               WebWord 加载项（template.js / addon.js / style.css）
 *
 * 路径一律为站点根相对（/static/...），部署到子路径时由前端运行时补 base。
 *
 * 用法：
 *   pnpm export        # 有 data/documents/main 时重新导出
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const domt = require('../server/domt.cjs')

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOCS_DIR = path.join(ROOT, 'data', 'documents', 'main')
const AVATAR_DIR = path.join(ROOT, 'data', 'accounts', 'base', 'avatars')
const ADDONS_DIR = path.join(ROOT, 'data', 'addons', 'main')
const BACKGROUND_DIR = path.join(ROOT, 'Desktop', 'public', 'background')
const OUT_DIR = path.join(ROOT, 'Desktop', 'public', 'static')

// ── 路径工具 ────────────────────────────────────────────────
// 输出站点根相对路径，前端读取时统一补上部署 base（SITE_BASE）
const urlOf = relPath => '/' + relPath.split('/').filter(Boolean).map(encodeURIComponent).join('/')

// ── 文章渲染（与 server/index.cjs 的 /api/documents/category 路由保持一致）──

/** 单文件多语言：元数据 translations 覆盖 + <article data-lang> 正文块选择 */
function applyLang(meta, content, lang) {
  if (lang) {
    const langKey = String(lang).toLowerCase()
    const trans = (meta && meta.translations &&
      (meta.translations[langKey] || meta.translations[lang])) || null
    if (trans) meta = { ...meta, ...trans }
  }
  if (meta && meta.translations) {
    meta = { ...meta }
    delete meta.translations
  }

  const articleRe = /<article\b[^>]*>[\s\S]*?<\/article\s*>/gi
  const blocks = []
  let m
  while ((m = articleRe.exec(content)) !== null) blocks.push(m[0])
  if (!blocks.length) return { meta, content }

  let target = null
  if (lang) {
    const langKey = String(lang).toLowerCase()
    const langRe = new RegExp('data-lang\\s*=\\s*["\']' + langKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']', 'i')
    target = blocks.find(b => langRe.test(b))
  }
  if (!target) target = blocks.find(b => !/data-lang\s*=/i.test(b)) || blocks[0]

  const headIdx = content.search(/<article\b/i)
  return { meta, content: content.slice(0, headIdx) + target }
}

/** 相对资源路径改写为静态文件地址 */
function rewriteAssets(content, relPath) {
  const encodedBase = urlOf(`static/documents/${relPath}`)
  return content.replace(
    /(src|href|srcset)\s*=\s*["'](?!https?:\/\/|\/\/|\/|data:|#|tel:|mailto:)([^"']+)["']/gi,
    (m, attr, url) => `${attr}="${encodedBase}/${url.split('/').map(s => encodeURIComponent(s)).join('/')}"`
  )
}

/** 按 meta.sections 给正文标题补 id，供目录跳转使用 */
function injectHeadingIds(meta, content) {
  if (!meta?.sections || !Array.isArray(meta.sections)) return content

  const headingTagRegex = /<h([23])([^>]*?)>([\s\S]*?)<\/h\1>/gi
  const headingTags = []
  let headingMatch
  while ((headingMatch = headingTagRegex.exec(content)) !== null) {
    headingTags.push({
      full: headingMatch[0],
      level: headingMatch[1],
      attrs: headingMatch[2],
      inner: headingMatch[3],
      innerText: headingMatch[3].replace(/<[^>]*>/g, '').trim(),
      matched: false,
    })
  }

  const unmatchedSections = []
  for (const section of meta.sections) {
    if (!section.id) continue
    const cleanTitle = section.title.replace(/[「」]/g, '').trim()
    let found = false
    for (const h of headingTags) {
      if (h.matched || /id\s*=/.test(h.attrs)) continue
      const cleanText = h.innerText.replace(/[「」]/g, '').replace(/^[一二三四五六七八九十]+、?\s*/, '').trim()
      if (cleanText.includes(cleanTitle) || cleanTitle.includes(cleanText)) {
        h.matched = true
        h.sectionId = section.id
        found = true
        break
      }
      const titleSegment = cleanTitle.split(/[：:]/)[0].trim()
      if (titleSegment.length >= 2 && cleanText.includes(titleSegment)) {
        h.matched = true
        h.sectionId = section.id
        found = true
        break
      }
    }
    if (!found) unmatchedSections.push(section)
  }

  const unmatchedHeadings = headingTags.filter(h => !h.matched && !/id\s*=/.test(h.attrs))
  for (let i = 0; i < Math.min(unmatchedSections.length, unmatchedHeadings.length); i++) {
    unmatchedHeadings[i].sectionId = unmatchedSections[i].id
    unmatchedHeadings[i].matched = true
  }

  for (const h of headingTags) {
    if (h.matched && h.sectionId && !/id\s*=/.test(h.attrs)) {
      content = content.replace(h.full, `<h${h.level} id="${h.sectionId}"${h.attrs}>${h.inner}</h${h.level}>`)
    }
  }
  return content
}

/** 读取文章目录原始内容（.domt 优先，兼容旧 index.json + .html） */
function readRawArticle(dirPath) {
  const { domtFile, htmlFile } = domt.findArticleFiles(dirPath)
  if (domtFile) {
    const raw = fs.readFileSync(path.join(dirPath, domtFile), 'utf-8')
    const { meta, content } = domt.parseDomt(raw)
    return { meta: meta || {}, content, filename: domtFile, format: 'domt' }
  }
  if (!htmlFile) return null
  let meta = {}
  const indexFile = path.join(dirPath, 'index.json')
  if (fs.existsSync(indexFile)) {
    try { meta = JSON.parse(fs.readFileSync(indexFile, 'utf-8')) } catch { /* ignore */ }
  }
  return {
    meta,
    content: fs.readFileSync(path.join(dirPath, htmlFile), 'utf-8'),
    filename: htmlFile,
    format: 'html',
  }
}

// ── 作者信息 ────────────────────────────────────────────────
// GitHub Actions 上读不到 SQLite（数据库不随仓库发布），因此以仓库内的快照
// data/accounts/base/authors.json 为准；本地存在数据库时优先用数据库并回写快照，
// 保证改了昵称/头像后重新导出即可生效。
const USERS_DB = path.join(ROOT, 'data', 'accounts', 'base', 'webword.db')
const AUTHORS_SNAPSHOT = path.join(ROOT, 'data', 'accounts', 'base', 'authors.json')

function readAuthorsFromDb() {
  if (!fs.existsSync(USERS_DB)) return null
  try {
    const Database = require('better-sqlite3')
    const db = new Database(USERS_DB, { readonly: true })
    const rows = db.prepare('SELECT uuid, display_name, avatar FROM users WHERE uuid IS NOT NULL').all()
    db.close()
    return rows
  } catch {
    return null
  }
}

function readAuthors() {
  const fromDb = readAuthorsFromDb()
  if (fromDb) {
    try {
      fs.mkdirSync(path.dirname(AUTHORS_SNAPSHOT), { recursive: true })
      fs.writeFileSync(AUTHORS_SNAPSHOT, JSON.stringify(fromDb, null, 2))
      console.log('[export-static] 已从数据库刷新作者快照 authors.json')
    } catch { /* 无写权限时忽略，直接使用内存数据 */ }
    return fromDb
  }
  if (!fs.existsSync(AUTHORS_SNAPSHOT)) {
    console.warn('[export-static] 缺少作者快照 authors.json，作者信息将显示为“账号已注销”')
    return []
  }
  try {
    const list = JSON.parse(fs.readFileSync(AUTHORS_SNAPSHOT, 'utf-8'))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

// ── 复制资源 ────────────────────────────────────────────────
// 只复制文章目录里的资源文件，.domt/.md/.html/.xml 等源文件一律不发布
const SKIP_COPY_EXT = new Set(['.domt', '.md', '.html', '.xml'])

function copyArticleAssets(srcDir, destDir) {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const src = path.join(srcDir, entry.name)
    if (entry.isDirectory()) {
      copyArticleAssets(src, path.join(destDir, entry.name))
      continue
    }
    if (SKIP_COPY_EXT.has(path.extname(entry.name).toLowerCase())) continue
    fs.mkdirSync(destDir, { recursive: true })
    fs.copyFileSync(src, path.join(destDir, entry.name))
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

// ── 主流程 ──────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`[export-static] 找不到文章目录: ${DOCS_DIR}`)
    process.exit(1)
  }

  // 上一次导出产出的头像先备份：本地没有数据库/头像文件时沿用，避免导出后头像丢失
  const prevAvatars = path.join(OUT_DIR, 'avatars')
  let avatarBackup = null
  if (fs.existsSync(prevAvatars)) {
    avatarBackup = new Map()
    for (const f of fs.readdirSync(prevAvatars)) {
      avatarBackup.set(f, fs.readFileSync(path.join(prevAvatars, f)))
    }
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true })
  const BLOG_DIR = path.join(OUT_DIR, 'blog')
  fs.mkdirSync(BLOG_DIR, { recursive: true })

  // 作者快照（数据库 → 静态 JSON）
  const authors = readAuthors()
  const authorsOut = {}
  for (const a of authors) {
    if (!a.uuid) continue
    let avatar = null
    if (a.avatar) {
      const src = path.join(AVATAR_DIR, a.avatar)
      const dest = path.join(OUT_DIR, 'avatars', a.avatar)
      fs.mkdirSync(path.join(OUT_DIR, 'avatars'), { recursive: true })
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest)
      } else if (avatarBackup?.has(a.avatar)) {
        // 干净克隆里没有 data/，沿用上次导出留下的头像
        fs.writeFileSync(dest, avatarBackup.get(a.avatar))
      }
      if (fs.existsSync(dest)) avatar = urlOf(`static/avatars/${a.avatar}`)
    }
    authorsOut[a.uuid] = { display_name: a.display_name || '未知用户', avatar }
  }

  // 语言集合：默认 + 所有 translations 里出现的语言
  const langs = new Set(['default', 'en'])
  function collectLangs(dirPath) {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'assets') continue
      const fullPath = path.join(dirPath, entry.name)
      if (!entry.isDirectory()) continue
      const raw = readRawArticle(fullPath)
      if (raw) {
        for (const key of Object.keys(raw.meta.translations || {})) langs.add(String(key).toLowerCase())
      } else {
        collectLangs(fullPath)
      }
    }
  }
  collectLangs(DOCS_DIR)

  const treeByLang = {}
  for (const lang of langs) treeByLang[lang] = []

  let articleCount = 0

  // 递归构建时每个语言各自遍历一次目录，逻辑更直观
  function buildLang(lang, dirPath, relativePath) {
    const nodes = []
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(e => !e.name.startsWith('.') && e.name !== 'assets')
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const fullPath = path.join(dirPath, entry.name)
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name
      const raw = readRawArticle(fullPath)
      if (raw) {
        // 文章元数据在第一次遍历（lang=default）时已写入文件，这里只取树字段
        const variants = readVariants(relPath)
        const current = variants[lang] || variants.default
        const meta = current.meta
        nodes.push({
          name: entry.name,
          path: relPath,
          type: 'document',
          title: current.title,
          description: meta.description || '',
          cover: meta.cover
            ? `${urlOf(`static/documents/${relPath}`)}/${meta.cover.split('/').map(s => encodeURIComponent(s)).join('/')}`
            : null,
          category: meta.category || '',
          tags: meta.tags || [],
          created: meta.created || '',
          filename: raw.filename,
          data: urlOf(`static/blog/${hashOf(relPath)}.json`),
        })
      } else {
        const children = buildLang(lang, fullPath, relPath)
        if (children.length) nodes.push({ name: entry.name, path: relPath, type: 'folder', children })
      }
    }
    return nodes
  }

  const hashOf = p => crypto.createHash('sha1').update(p).digest('hex').slice(0, 16)
  const variantsCache = new Map()
  function readVariants(relPath) {
    if (!variantsCache.has(relPath)) {
      const file = path.join(BLOG_DIR, `${hashOf(relPath)}.json`)
      variantsCache.set(relPath, JSON.parse(fs.readFileSync(file, 'utf-8')))
    }
    return variantsCache.get(relPath)
  }

  // 1. 先写全部文章文件
  function writeArticles(dirPath, relativePath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(e => !e.name.startsWith('.') && e.name !== 'assets')
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const fullPath = path.join(dirPath, entry.name)
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name
      const raw = readRawArticle(fullPath)
      if (!raw) {
        writeArticles(fullPath, relPath)
        continue
      }
      const variants = {}
      for (const lang of langs) {
        const localized = applyLang(raw.meta, raw.content, lang === 'default' ? '' : lang)
        let content = rewriteAssets(localized.content, relPath)
        content = injectHeadingIds(localized.meta, content)
        const meta = localized.meta || {}
        variants[lang] = {
          content,
          meta,
          title: meta.title || entry.name,
          author: meta.author_uuid
            ? (authorsOut[meta.author_uuid] || { display_name: '账号已注销', avatar: null })
            : null,
          comments_mode: 'closed',
        }
      }
      fs.writeFileSync(path.join(BLOG_DIR, `${hashOf(relPath)}.json`), JSON.stringify(variants))
      articleCount++
    }
  }
  writeArticles(DOCS_DIR, '')

  // 2. 再生成各语言分类树
  for (const lang of langs) {
    treeByLang[lang] = buildLang(lang, DOCS_DIR, '')
  }

  fs.writeFileSync(path.join(BLOG_DIR, 'tree.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    langs: Array.from(langs),
    tree: treeByLang,
    authors: authorsOut,
  }))

  // 复制文章资源（仅 assets 等非源文件）
  copyArticleAssets(DOCS_DIR, path.join(OUT_DIR, 'documents'))

  // WebWord 加载项
  copyDir(ADDONS_DIR, path.join(OUT_DIR, 'addons'))
  const addons = []
  for (const cat of ['official', 'third_party', '']) {
    const catDir = cat ? path.join(ADDONS_DIR, cat) : ADDONS_DIR
    if (!fs.existsSync(catDir)) continue
    for (const entry of fs.readdirSync(catDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const indexFile = path.join(catDir, entry.name, 'index.json')
      if (!fs.existsSync(indexFile)) continue
      try {
        const meta = JSON.parse(fs.readFileSync(indexFile, 'utf-8'))
        const qualified = cat ? `${cat}/${entry.name}` : entry.name
        addons.push({
          name: meta.id,
          display_name: meta.name,
          version: meta.version || null,
          author: meta.author || null,
          description: meta.description || null,
          icon: meta.icon || null,
          filename: qualified,
          enabled: meta.enabled !== false ? 1 : 0,
        })
      } catch { /* 跳过损坏的 index.json */ }
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, 'addons.json'), JSON.stringify({ addons }, null, 2))

  // 壁纸：public/background 下已随构建发布，这里只导出列表
  const backgrounds = fs.existsSync(BACKGROUND_DIR)
    ? fs.readdirSync(BACKGROUND_DIR)
      .filter(f => /\.(png|jpe?g|webp)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
      .map(f => ({ id: f.replace(/\.\w+$/, ''), filename: f, url: urlOf(`background/${f}`) }))
    : []
  fs.writeFileSync(path.join(OUT_DIR, 'backgrounds.json'), JSON.stringify({ backgrounds }, null, 2))

  const kb = n => `${(n / 1024).toFixed(1)} KB`
  console.log(`[export-static] 输出目录: ${path.relative(ROOT, OUT_DIR)}`)
  console.log(`[export-static] 文章 ${articleCount} 篇 / 语言 ${Array.from(langs).join(', ')} / 作者 ${Object.keys(authorsOut).length} 人`)
  console.log(`[export-static] 加载项 ${addons.length} 个 / 壁纸 ${backgrounds.length} 张`)
  console.log(`[export-static] tree.json ${kb(fs.statSync(path.join(BLOG_DIR, 'tree.json')).size)}`)
}

main()
