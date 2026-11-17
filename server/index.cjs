const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { addonsDb, documentsDb, ADDONS_DIR, MAIN_ADDONS_DIR, DOCUMENTS_DIR, DOCUMENTS_MAIN_DIR } = require('./database.cjs')
const domt = require('./domt.cjs')

// 站点已不做账号体系：作者与壁纸等公共资源放在不受 .gitignore 影响的目录里，
// 随仓库提交，本地开发与静态构建使用同一份数据。
const AUTHORS_DIR = path.resolve(__dirname, '..', 'data', 'authors')
const AUTHORS_FILE = path.join(AUTHORS_DIR, 'authors.json')
const BACKGROUNDS_DIR = path.resolve(__dirname, '..', 'Desktop', 'public', 'background')

function readAuthors() {
  try {
    const list = JSON.parse(fs.readFileSync(AUTHORS_FILE, 'utf-8'))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ── Serve unified dist (multi-page build) ──
const desktopDistPath = path.resolve(__dirname, '..', 'Desktop', 'dist')
app.use(express.static(desktopDistPath))

// ── Serve addon files (template.js, addon.js, style.css) ──
app.use('/addons', express.static(MAIN_ADDONS_DIR))

// Serve static assets for categorized documents (main/ subdirectory tree)
// 阻止文档源文件（.domt/.md/.html）被直接下载，assets 等资源仍可访问
const BLOCKED_DOC_EXT = ['.domt', '.md', '.html']
app.use('/documents/category-files', (req, res, next) => {
  if (BLOCKED_DOC_EXT.includes(path.extname(req.path).toLowerCase())) {
    return res.status(404).end()
  }
  next()
})
app.use('/documents/category-files', express.static(DOCUMENTS_MAIN_DIR))

// ── Author lookup by UUID (public) ────────
// 站点已无账号体系：作者信息来自仓库内的 data/authors/authors.json（只读）

// 作者头像：data/authors 下随仓库提交的静态文件
app.use('/api/avatars', express.static(AUTHORS_DIR))

function resolveAuthorByUUID(uuid) {
  if (!uuid) return null
  const author = readAuthors().find(a => a.uuid === uuid)
  if (author) {
    return {
      display_name: author.display_name || '未知用户',
      avatar: author.avatar ? `/api/avatars/${author.avatar}` : null,
    }
  }
  return { display_name: '账号已注销', avatar: null }
}

app.get('/api/author/:uuid', (req, res) => {
  const { uuid } = req.params
  if (!uuid || uuid.includes('..')) return res.status(400).json({ error: '无效的 UUID' })
  const authorInfo = resolveAuthorByUUID(uuid)
  res.json(authorInfo)
})

// ── Documents API 隐藏：静态令牌请求头校验 ──
// 博客为公开站，令牌随前端代码分发；仅防随手 curl，非安全边界
const DOMT_API_TOKEN = 'bs2-domt-2026-x7k9'
function requireDomtToken(req, res, next) {
  if (req.headers['x-domt-token'] === DOMT_API_TOKEN) return next()
  res.status(404).json({ error: 'Not Found' })
}
app.use('/api/documents', requireDomtToken)

// ── Documents: List ─────────────────────────
app.get('/api/documents', (_req, res) => {
  try {
    const rows = documentsDb.prepare('SELECT id, title, filename, format, size, author, category, created_at, updated_at FROM documents ORDER BY updated_at DESC').all()
    res.json({ documents: rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Documents: Save (create/update) ─────────
app.post('/api/documents', (req, res) => {
  const { title, content, format, filename } = req.body
  if (!title || content === undefined) {
    return res.status(400).json({ error: '缺少必填字段(title, content)' })
  }

  try {
    const fmt = format || 'html'
    const safeFilename = filename || `${title.replace(/[<>:"/\\|?*]/g, '_')}.${fmt}`
    const filePath = path.join(DOCUMENTS_DIR, safeFilename)
    const buf = Buffer.from(content, 'utf-8')

    fs.writeFileSync(filePath, buf)

    const existing = documentsDb.prepare('SELECT id FROM documents WHERE filename = ?').get(safeFilename)
    if (existing) {
      documentsDb.prepare('UPDATE documents SET size = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?').run(buf.length, existing.id)
    } else {
      documentsDb.prepare('INSERT INTO documents (title, filename, format, size) VALUES (?, ?, ?, ?)').run(title, safeFilename, fmt, buf.length)
    }

    const doc = documentsDb.prepare('SELECT * FROM documents WHERE filename = ?').get(safeFilename)
    res.json({ document: doc })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Documents: Category Browse (main/ subdirectory tree) ──
// NOTE: These routes MUST be defined before the /api/documents/:filename wildcard route.

// Index category documents from filesystem into documents table
function indexCategoryDocuments() {
  if (!fs.existsSync(DOCUMENTS_MAIN_DIR)) return

  const upsertStmt = documentsDb.prepare(`
    INSERT INTO documents (title, filename, format, size, author, category, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'category', ?, ?)
    ON CONFLICT(filename) DO UPDATE SET
      title = excluded.title, format = excluded.format, size = excluded.size,
      author = excluded.author, category = excluded.category,
      updated_at = excluded.updated_at
  `)
  const getStmt = documentsDb.prepare('SELECT filename FROM documents WHERE source = \'category\'')
  const deleteStmt = documentsDb.prepare('DELETE FROM documents WHERE filename = ? AND source = \'category\'')

  const indexedPaths = new Set()

  function walk(dirPath, categoryPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'assets') continue
      const fullPath = path.join(dirPath, entry.name)
      if (!entry.isDirectory()) continue

      const catPath = categoryPath ? `${categoryPath}/${entry.name}` : entry.name
      const hasDomt = fs.existsSync(path.join(fullPath, 'index.json')) || domt.findArticleFiles(fullPath).domtFile

      if (hasDomt) {
        try {
          const article = domt.readArticle(fullPath)
          if (article) {
            const meta = article.meta || {}
            const stat = fs.statSync(path.join(fullPath, article.filename))
            const title = meta.title || entry.name
            const author = meta.author_uuid || meta.author || null
            upsertStmt.run(
              title,
              `cat:${catPath}`,
              meta.format || article.format,
              stat.size,
              author,
              catPath,
              meta.created || new Date().toISOString().slice(0, 10),
              meta.updated || meta.created || new Date().toISOString().slice(0, 10)
            )
            indexedPaths.add(`cat:${catPath}`)
          }
          // Also recurse in case there are sub-directories
          walk(fullPath, catPath)
        } catch (_) {
          // If parsing fails, try to index using directory name as title
          const article = (() => {
            try { return domt.readArticle(fullPath) } catch { return null }
          })()
          if (article) {
            const stat = fs.statSync(path.join(fullPath, article.filename))
            upsertStmt.run(
              entry.name,
              `cat:${catPath}`,
              article.format,
              stat.size,
              null,
              catPath,
              new Date().toISOString().slice(0, 10),
              new Date().toISOString().slice(0, 10)
            )
            indexedPaths.add(`cat:${catPath}`)
          }
          walk(fullPath, catPath)
        }
      } else {
        walk(fullPath, catPath)
      }
    }
  }

  walk(DOCUMENTS_MAIN_DIR, '')

  // Clean up stale category entries (directories removed)
  const existing = getStmt.all()
  for (const row of existing) {
    if (!indexedPaths.has(row.filename)) {
      deleteStmt.run(row.filename)
    }
  }
}

// Recursively scan a directory for index.json → build category tree
function scanCategoryTree(dirPath, relativePath, lang) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const children = []
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'assets') continue
    const fullPath = path.join(dirPath, entry.name)
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name
    if (!entry.isDirectory()) continue

    const indexFile = path.join(fullPath, 'index.json')
    const hasArticle = fs.existsSync(indexFile) || domt.findArticleFiles(fullPath).domtFile
    if (hasArticle) {
      try {
        const article = domt.readArticle(fullPath, lang)
        const meta = article ? (article.meta || {}) : {}
        children.push({
          name: entry.name,
          path: relPath,
          type: 'document',
          title: meta.title || entry.name,
          description: meta.description || '',
          cover: meta.cover || null,
          category: meta.category || '',
          tags: meta.tags || [],
          created: meta.created || '',
          filename: article ? article.filename : null
        })
      } catch {
        const sub = scanCategoryTree(fullPath, relPath, lang)
        if (sub.length > 0) children.push({ name: entry.name, path: relPath, type: 'folder', children: sub })
      }
    } else {
      const sub = scanCategoryTree(fullPath, relPath, lang)
      if (sub.length > 0) children.push({ name: entry.name, path: relPath, type: 'folder', children: sub })
    }
  }
  return children
}

// List all categories (tree of folders + documents)
app.get('/api/documents/categories', (req, res) => {
  try {
    if (!fs.existsSync(DOCUMENTS_MAIN_DIR)) return res.json({ tree: [] })
    const lang = String(req.query.lang || '')
    const tree = scanCategoryTree(DOCUMENTS_MAIN_DIR, '', lang)
    res.json({ tree })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get categorized document content by path (e.g. /api/documents/category/科技/AI/Kimi%20K3%20发布-20260720)
app.get(/^\/api\/documents\/category\/(.+)$/, (req, res) => {
  try {
    const relPath = req.params[0]
    if (!relPath || relPath.includes('..')) return res.status(400).json({ error: '无效路径' })

    const dirPath = path.join(DOCUMENTS_MAIN_DIR, relPath)
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return res.status(404).json({ error: '目录不存在' })
    }

    // Read article via .domt interpreter (falls back to legacy index.json + .html)
    // ?lang= 从单文件内提取对应语言版本（translations 元数据 + <article data-lang> 正文块），未匹配时回退默认语言
    const lang = String(req.query.lang || '')
    const article = domt.readArticle(dirPath, lang)
    if (!article) return res.status(404).json({ error: '文档文件不存在' })
    const meta = article.meta || {}

    let content = article.content

    // Rewrite relative asset paths (src/href/srcset) to absolute URLs via the static file route
    // URL-encode each path segment to handle Chinese characters and spaces
    const encodedBase = '/documents/category-files/' + relPath
      .split('/')
      .map(seg => encodeURIComponent(seg))
      .join('/')
    content = content.replace(
      /(src|href|srcset)\s*=\s*["'](?!https?:\/\/|\/\/|\/|data:|#|tel:|mailto:)([^"']+)["']/gi,
      (m, attr, url) => `${attr}="${encodedBase}/${url.split('/').map(s => encodeURIComponent(s)).join('/')}"`
    )

    // Inject heading IDs for TOC navigation based on meta.sections
    if (meta?.sections && Array.isArray(meta.sections)) {
      // Collect all heading tags from content
      const headingTagRegex = /<h([23])([^>]*?)>([\s\S]*?)<\/h\1>/gi
      const headingTags = []
      let headingMatch
      while ((headingMatch = headingTagRegex.exec(content)) !== null) {
        const innerText = headingMatch[3].replace(/<[^>]*>/g, '').trim()
        headingTags.push({
          full: headingMatch[0],
          level: headingMatch[1],
          attrs: headingMatch[2],
          inner: headingMatch[3],
          innerText,
          matched: false
        })
      }

      // First pass: match by text content (strip Chinese numbering prefix and 「」quotes)
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
          // Fallback: match on first segment before "：" for titles like "前身：本地编辑器"
          if (!found) {
            const titleSegment = cleanTitle.split(/[：:]/)[0].trim()
            if (titleSegment.length >= 2 && cleanText.includes(titleSegment)) {
              h.matched = true
              h.sectionId = section.id
              found = true
              break
            }
          }
        }
        if (!found) unmatchedSections.push(section)
      }

      // Second pass: positional matching for remaining unmatched sections
      const unmatchedHeadings = headingTags.filter(h => !h.matched && !/id\s*=/.test(h.attrs))
      for (let i = 0; i < Math.min(unmatchedSections.length, unmatchedHeadings.length); i++) {
        unmatchedHeadings[i].sectionId = unmatchedSections[i].id
        unmatchedHeadings[i].matched = true
      }

      // Apply replacements
      for (const h of headingTags) {
        if (h.matched && h.sectionId && !/id\s*=/.test(h.attrs)) {
          const replacement = `<h${h.level} id="${h.sectionId}"${h.attrs}>${h.inner}</h${h.level}>`
          content = content.replace(h.full, replacement)
          h.full = replacement
        }
      }
    }

    // Resolve author by UUID if author_uuid is present in meta
    const authorInfo = meta?.author_uuid ? resolveAuthorByUUID(meta.author_uuid) : null

    res.json({
      content,
      meta,
      comments_mode: meta?.comments_mode || 'public',
      title: meta?.title || path.basename(relPath),
      author: authorInfo
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Documents: Get content ──────────────────
app.get('/api/documents/:filename', (req, res) => {
  const { filename } = req.params
  if (!filename || filename.includes('..')) {
    return res.status(400).json({ error: '无效的文件名' })
  }

  const filePath = path.join(DOCUMENTS_DIR, filename)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' })
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const doc = documentsDb.prepare('SELECT * FROM documents WHERE filename = ?').get(filename)
    res.json({ content, document: doc || null })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Documents: Delete ───────────────────────
app.delete('/api/documents/:filename', (req, res) => {
  const { filename } = req.params
  if (!filename || filename.includes('..')) {
    return res.status(400).json({ error: '无效的文件名' })
  }

  const filePath = path.join(DOCUMENTS_DIR, filename)
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    documentsDb.prepare('DELETE FROM documents WHERE filename = ?').run(filename)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Addons: List ────────────────────────────
app.get('/api/addons', (_req, res) => {
  try {
    const rows = addonsDb.prepare('SELECT * FROM addons ORDER BY name ASC').all()
    res.json({ addons: rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Addons: Scan & Import from index.json ──
app.post('/api/addons/scan', (_req, res) => {
  try {
    const results = { imported: [], skipped: [], errors: [] }
    const categories = ['official', 'third_party', '']
    for (const cat of categories) {
      const catDir = cat ? path.join(MAIN_ADDONS_DIR, cat) : MAIN_ADDONS_DIR
      if (!fs.existsSync(catDir)) continue
      const entries = fs.readdirSync(catDir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const indexFile = path.join(catDir, entry.name, 'index.json')
        if (!fs.existsSync(indexFile)) {
          results.skipped.push(entry.name + ' (无 index.json)')
          continue
        }
        try {
          const meta = JSON.parse(fs.readFileSync(indexFile, 'utf-8'))
          const addonDir = path.join(catDir, entry.name)
          const files = meta.files || []
          let totalSize = 0
          for (const f of files) {
            const fp = path.join(addonDir, f)
            if (fs.existsSync(fp)) {
              totalSize += fs.statSync(fp).size
            }
          }
          const qualifiedFilename = cat ? cat + '/' + entry.name : entry.name
          addonsDb.prepare(`
            INSERT OR REPLACE INTO addons
            (name, display_name, version, author, description, icon, filename, size, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            meta.id, meta.name, meta.version || null, meta.author || null,
            meta.description || null, meta.icon || null, qualifiedFilename, totalSize,
            meta.enabled !== false ? 1 : 0
          )
          results.imported.push(meta.id)
        } catch (e) {
          results.errors.push(entry.name + ': ' + e.message)
        }
      }
    }
    const count = addonsDb.prepare('SELECT COUNT(*) as c FROM addons').get().c
    res.json({ ...results, total: count })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Addons: Add ─────────────────────────────
app.post('/api/addons', (req, res) => {
  const { name, display_name, version, author, description, content } = req.body
  if (!name || content === undefined) {
    return res.status(400).json({ error: '缺少必填字段(name, content)' })
  }

  try {
    const safeFilename = `${name.replace(/[<>:"/\\|?*]/g, '_')}.js`
    const filePath = path.join(ADDONS_DIR, safeFilename)
    const buf = Buffer.from(content, 'utf-8')
    fs.writeFileSync(filePath, buf)

    const dn = display_name || name
    addonsDb.prepare(
      'INSERT OR REPLACE INTO addons (name, display_name, version, author, description, filename, size) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name, dn, version || null, author || null, description || null, safeFilename, buf.length)

    const addon = addonsDb.prepare('SELECT * FROM addons WHERE name = ?').get(name)
    res.json({ addon })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Addons: Get content ─────────────────────
app.get('/api/addons/:name/file', (req, res) => {
  const { name } = req.params
  try {
    const addon = addonsDb.prepare('SELECT * FROM addons WHERE name = ?').get(name)
    if (!addon) return res.status(404).json({ error: '加载项不存在' })

    // addon.filename already has category prefix (e.g. 'official/constants') or root-level (e.g. 'addon-manager')
    const searchPaths = [
      path.join(MAIN_ADDONS_DIR, addon.filename),
      path.join(ADDONS_DIR, addon.filename),
    ]

    let foundDir = null
    for (const sp of searchPaths) {
      if (fs.existsSync(sp) && fs.statSync(sp).isDirectory()) {
        foundDir = sp
        break
      }
    }
    if (!foundDir) return res.status(404).json({ error: '加载项目录不存在' })

    // Return all files in the addon directory
    const result = { addon, files: {} }
    const fileList = ['addon.js', 'style.css', 'template.js']
    for (const f of fileList) {
      const fp = path.join(foundDir, f)
      if (fs.existsSync(fp)) {
        result.files[f] = fs.readFileSync(fp, 'utf-8')
      }
    }
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Addons: Delete ──────────────────────────
app.delete('/api/addons/:name', (req, res) => {
  const { name } = req.params
  try {
    const addon = addonsDb.prepare('SELECT * FROM addons WHERE name = ?').get(name)
    if (addon) {
      const filePath = path.join(ADDONS_DIR, addon.filename)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      addonsDb.prepare('DELETE FROM addons WHERE name = ?').run(name)
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Addons: Toggle enabled ──────────────────
app.patch('/api/addons/:name/toggle', (req, res) => {
  const { name } = req.params
  try {
    const addon = addonsDb.prepare('SELECT * FROM addons WHERE name = ?').get(name)
    if (!addon) return res.status(404).json({ error: '加载项不存在' })
    addonsDb.prepare('UPDATE addons SET enabled = ?, updated_at = datetime(\'now\',\'localtime\') WHERE name = ?').run(addon.enabled ? 0 : 1, name)
    const updated = addonsDb.prepare('SELECT * FROM addons WHERE name = ?').get(name)
    res.json({ addon: updated })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Backgrounds API ─────────────────────────

// Serve background files（公开静态资源，仓库里的 Desktop/public/background 即壁纸源）
app.use('/api/backgrounds/file', express.static(BACKGROUNDS_DIR))

// List available backgrounds
app.get('/api/backgrounds', (req, res) => {
  try {
    const files = fs.readdirSync(BACKGROUNDS_DIR)
      .filter(f => /\.(png|jpe?g|webp)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    const presets = files.map(f => ({
      id: f.replace(/\.\w+$/, ''),
      filename: f,
      url: `/api/backgrounds/file/${f}`,
    }))
    res.json({ backgrounds: presets })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Browser proxy（伪装为真实浏览器，去掉 iframe 嵌入限制）──

const http = require('http')
const https = require('https')
const zlib = require('zlib')

const PROXY_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const PROXY_MAX_REDIRECTS = 5
const PROXY_TIMEOUT = 15000
const PROXY_MAX_BYTES = 200 * 1024 * 1024

// 注入到代理页面中的脚本：
// 1) 拦截链接点击 / window.open，跳转继续走代理，避免整页跳转后被 X-Frame-Options 拦截
// 2) 劫持 fetch / XMLHttpRequest：页面内的 API 请求（相对路径或跨域）统一转到代理，
//    绕开 CORS（如 B 站视频页按 location.origin 拼接 API 地址的问题）
// 3) 监听页面内导航（SPA history API / JS 跳转），把真实地址同步给父窗口
function buildProxyInject(realOrigin) {
  return `<script>
(function(){
  var PROXY = '/api/proxy?url=';
  var REAL_ORIGIN = '${realOrigin}';
  function toProxy(u){ return PROXY + encodeURIComponent(u); }
  function rewriteUrl(url){
    if (typeof url !== 'string' || !url) return null;
    if (/^(data|blob|javascript):/i.test(url)) return null;
    var abs;
    try { abs = new URL(url, location.href).href; } catch (err) { return null; }
    var u;
    try { u = new URL(abs); } catch (err) { return null; }
    if (!/^https?:$/.test(u.protocol)) return null;
    if (u.origin === location.origin) {
      if (u.pathname.indexOf('/api/proxy') === 0) return null; // 代理自身请求，放行
      // 相对路径请求语义上发给真实站点 → 补上真实 origin
      return toProxy(REAL_ORIGIN + u.pathname + u.search);
    }
    // 跨域请求（含 B 站 API）也走代理，避免 CORS
    return toProxy(abs);
  }

  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a || !a.href) return;
    var u;
    try { u = new URL(a.href); } catch (err) { return; }
    if (u.origin === location.origin) {
      if (a.target === '_blank') a.target = '_self';
      return;
    }
    e.preventDefault();
    a.target = '_self';
    location.href = toProxy(u.href);
  }, true);

  var _open = window.open;
  window.open = function(url){
    try {
      var u = new URL(url, location.href);
      if (u.origin !== location.origin) {
        location.href = toProxy(u.href);
        return null;
      }
      return _open.call(window, u.href);
    } catch (err) { return null; }
  };

  var _fetch = window.fetch;
  window.fetch = function(input, init){
    var rw = rewriteUrl(typeof input === 'string' ? input : (input && input.url));
    if (rw) { try { return _fetch.call(window, rw, init); } catch (err) {} }
    return _fetch.apply(window, arguments);
  };

  var _xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url){
    var rw = rewriteUrl(url);
    if (rw) arguments[1] = rw;
    return _xhrOpen.apply(this, arguments);
  };

  var last = location.href;
  setInterval(function(){
    if (location.href !== last) {
      last = location.href;
      try { window.parent.postMessage({ type: 'browser-nav', url: location.href }, '*'); } catch (err) {}
    }
  }, 400);
})();
<\/script>`
}

// 匿名会话 cookie jar：从上游 set-cookie 累积，后续请求自动携带
const proxyCookieJar = new Map()

function proxyJarCookie() {
  return Array.from(proxyCookieJar.values()).filter(Boolean).join('; ')
}

function proxySaveCookies(upstreamRes) {
  const setCookies = upstreamRes.headers['set-cookie']
  if (!setCookies || !setCookies.length) return
  const host = new URL(upstreamRes.url).host
  let jar = proxyCookieJar.get(host) || ''
  for (const sc of Array.isArray(setCookies) ? setCookies : [setCookies]) {
    const pair = sc.split(';')[0]
    if (!pair || !pair.includes('=')) continue
    const key = pair.slice(0, pair.indexOf('=')).trim()
    jar = jar.split(';').map((s) => s.trim()).filter((p) => p && p.split('=')[0] !== key).join('; ')
    jar = (jar ? jar + '; ' : '') + pair.trim()
  }
  proxyCookieJar.set(host, jar)
}

function proxyFetch(target, redirectsLeft, extraHeaders, onDone) {
  let u
  try { u = new URL(target) } catch { return onDone(new Error('无效的网址')) }
  if (!/^https?:$/.test(u.protocol)) return onDone(new Error('仅支持 http/https 协议'))

  const lib = u.protocol === 'https:' ? https : http
  const headers = {
    'User-Agent': PROXY_UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'identity',
    'Connection': 'close',
    'Referer': u.origin + '/',
    ...extraHeaders,
  }
  const cookie = proxyJarCookie()
  if (cookie) headers['Cookie'] = cookie

  const req = lib.get(u, { headers, timeout: PROXY_TIMEOUT }, (res) => {
    res.url = u.toString()
    proxySaveCookies(res)
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
      res.resume()
      let next = res.headers.location
      try { next = new URL(next, u).toString() } catch {}
      return proxyFetch(next, redirectsLeft - 1, extraHeaders, onDone)
    }
    onDone(null, { finalUrl: u.toString(), upstream: res })
  })
  req.on('error', (err) => onDone(err))
  req.on('timeout', () => { req.destroy(new Error('请求超时')) })
}

app.get('/api/proxy', (req, res) => {
  const target = typeof req.query.url === 'string' ? req.query.url : ''
  if (!target) return res.status(400).json({ error: '缺少 url 参数' })

  // 透传客户端请求头：Range（媒体流 seek）、Accept（API 期望 json 等）
  const extraHeaders = {}
  if (req.headers.range) extraHeaders['Range'] = req.headers.range
  if (req.headers.accept) extraHeaders['Accept'] = req.headers.accept

  proxyFetch(target, PROXY_MAX_REDIRECTS, extraHeaders, (err, ctx) => {
    if (err) return res.status(502).json({ error: err.message || '代理请求失败' })
    const { finalUrl, upstream } = ctx

    // 透传响应头，但去掉 iframe 嵌入限制与 hop-by-hop 头
    const headers = { ...upstream.headers }
    delete headers['x-frame-options']
    delete headers['content-security-policy']
    delete headers['content-security-policy-report-only']
    delete headers['strict-transport-security']
    delete headers['content-length']
    for (const h of ['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer']) {
      delete headers[h]
    }
    headers['x-proxy-final-url'] = finalUrl

    const isHtml = (upstream.headers['content-type'] || '').includes('text/html')
    const enc = upstream.headers['content-encoding']

    // 非 HTML，或带无法解压的编码时直接透传
    const decompressible = enc === undefined || enc === null || enc === '' || enc === 'gzip' || enc === 'deflate' || enc === 'br'
    if (!isHtml || !decompressible) {
      res.status(upstream.statusCode).set(headers)
      upstream.pipe(res)
      return
    }

    // HTML：解压（部分服务器无视 Accept-Encoding: identity 强制压缩）后注入脚本
    if (enc) delete headers['content-encoding']
    res.status(upstream.statusCode).set(headers)

    let source = upstream
    if (enc === 'gzip') source = upstream.pipe(zlib.createGunzip())
    else if (enc === 'deflate') source = upstream.pipe(zlib.createInflate())
    else if (enc === 'br') source = upstream.pipe(zlib.createBrotliDecompress())

    // 注入 <base> 与代理脚本，让页面内资源/API 请求/跳转继续可用
    const origin = new URL(finalUrl).origin
    const inject = `<base href="${origin}/">` + buildProxyInject(origin)
    let buffer = ''
    let injected = false
    let total = 0

    source.on('data', (chunk) => {
      total += chunk.length
      if (total > PROXY_MAX_BYTES) { res.destroy(); source.destroy(); return }
      buffer += chunk.toString('utf8')
      if (!injected) {
        const headIdx = buffer.toLowerCase().indexOf('<head')
        if (headIdx !== -1) {
          const gtIdx = buffer.indexOf('>', headIdx)
          if (gtIdx !== -1) {
            buffer = buffer.slice(0, gtIdx + 1) + inject + buffer.slice(gtIdx + 1)
            injected = true
          }
        } else if (buffer.length > 2 * 1024 * 1024) {
          injected = true // 找不到 <head> 则不再等待
        }
      }
      if (injected && buffer) {
        res.write(buffer)
        buffer = ''
      }
    })
    source.on('end', () => {
      if (buffer.length) res.write(buffer)
      res.end()
    })
    source.on('error', () => res.destroy())
    res.on('close', () => source.destroy())
  })
})

// SPA fallback: serve Desktop index.html for all non-API routes
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(desktopDistPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`BetaStudio2 Blog server running at http://localhost:${PORT}`)
  console.log(`Desktop: http://localhost:${PORT}/`)
  console.log(`WebWord: http://localhost:${PORT}/webword`)
  console.log(`Blog: http://localhost:${PORT}/blog`)
  console.log(`Documents: ${DOCUMENTS_DIR}`)
  console.log(`Addons: ${MAIN_ADDONS_DIR}`)

  // Auto-scan addons on startup
  try {
    const fs = require('fs')
    const path = require('path')
    const categories = ['official', 'third_party', '']
    let importedCount = 0
    for (const cat of categories) {
      const catDir = cat ? path.join(MAIN_ADDONS_DIR, cat) : MAIN_ADDONS_DIR
      if (!fs.existsSync(catDir)) continue
      const entries = fs.readdirSync(catDir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const indexFile = path.join(catDir, entry.name, 'index.json')
        if (!fs.existsSync(indexFile)) continue
        try {
          const meta = JSON.parse(fs.readFileSync(indexFile, 'utf-8'))
          const addonDir = path.join(catDir, entry.name)
          const fileList = meta.files || []
          let totalSize = 0
          for (const f of fileList) {
            const fp = path.join(addonDir, f)
            if (fs.existsSync(fp)) totalSize += fs.statSync(fp).size
          }
          const qualifiedFilename = cat ? cat + '/' + entry.name : entry.name
          addonsDb.prepare(`
            INSERT OR REPLACE INTO addons
            (name, display_name, version, author, description, icon, filename, size, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            meta.id, meta.name, meta.version || null, meta.author || null,
            meta.description || null, meta.icon || null, qualifiedFilename, totalSize,
            meta.enabled !== false ? 1 : 0
          )
          importedCount++
        } catch (_) {}
      }
    }
    console.log(`Addons indexed: ${importedCount} addons in database`)
  } catch (_) {}

  // Index category documents from filesystem into database
  try {
    indexCategoryDocuments()
    console.log('Category documents indexed from filesystem')
  } catch (_) {}
})
