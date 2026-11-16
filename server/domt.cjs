// ─────────────────────────────────────────────────────────────
//  .domt 专用解释器
//  .domt = YAML frontmatter（元数据，明文）+ HTML 正文（明文）
//  ─────────────────────────────────────────────────────────────
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

// frontmatter 分隔符：文件以 "---\n" 开头，到下一个独立 "---\n" 结束
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/

/**
 * 解析 .domt 文件内容
 * @param {string} content .domt 文件原文
 * @returns {{ meta: object, content: string, hasMeta: boolean }} meta=元数据, content=HTML正文
 */
function parseDomt(content) {
  const match = FRONTMATTER_RE.exec(content)
  if (!match) {
    // 无 frontmatter：整个文件视为正文
    return { meta: {}, content: content.trim(), hasMeta: false }
  }
  let meta = {}
  try {
    meta = yaml.load(match[1]) || {}
  } catch (e) {
    // frontmatter 解析失败不致命：元数据置空，正文继续可用
    meta = {}
  }
  return { meta, content: content.slice(match[0].length).trimStart(), hasMeta: true }
}

/**
 * 序列化为 .domt 文件内容
 * @param {object} meta 元数据
 * @param {string} content HTML 正文
 * @returns {string}
 */
function stringifyDomt(meta, content) {
  const head = '---\n' + yaml.dump(meta || {}).replace(/\n$/, '') + '\n---\n'
  return head + '\n' + String(content || '').trim() + '\n'
}

/**
 * 在目录中查找 .domt 文件，兼容旧格式返回 .html
 * @param {string} dirPath 文章目录
 * @returns {{ domtFile: string|null, htmlFile: string|null }}
 */
function findArticleFiles(dirPath) {
  let domtFile = null
  let htmlFile = null
  try {
    const files = fs.readdirSync(dirPath)
    domtFile = files.find(f => f.toLowerCase().endsWith('.domt')) || null
    htmlFile = files.find(f => f.toLowerCase().endsWith('.html')) || null
  } catch (_) {}
  return { domtFile, htmlFile }
}

/**
 * 单文件多语言支持：
 * - 元数据：frontmatter 中 translations.<lang> 覆盖对应语言字段（title/subtitle/description/sections 等）
 * - 正文：同文件内放置多个 <article data-lang="<lang>"> 块，按语言选择；未匹配或未指定语言时回退默认块（无 data-lang）
 * @param {object} meta 解析后的元数据
 * @param {string} content 正文
 * @param {string} [lang] 语言代码（如 'en'）
 * @returns {{ meta: object, content: string }}
 */
function applyLang(meta, content, lang) {
  // 元数据语言覆盖
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

  // 正文语言块选择：<article data-lang="<lang>"> 优先；否则默认（无 data-lang）块；再否则首个块
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

  // 保留首个 <article> 之前的头部（如 <style> 块），仅替换语言正文块
  const headIdx = content.search(/<article\b/i)
  return { meta, content: content.slice(0, headIdx) + target }
}

/**
 * 读取文章目录并解析（优先 .domt，兼容旧格式 index.json + .html）
 * 返回的 content 已按 lang 提取单文件内对应语言版本
 * @param {string} dirPath 文章目录
 * @param {string} [lang] 语言代码；按单文件 translations + <article data-lang> 提取
 * @returns {{ meta: object, content: string, filename: string, format: string } | null}
 */
function readArticle(dirPath, lang) {
  const { domtFile, htmlFile } = findArticleFiles(dirPath)

  if (domtFile) {
    const raw = fs.readFileSync(path.join(dirPath, domtFile), 'utf-8')
    const { meta, content } = parseDomt(raw)
    const out = applyLang(meta, content, lang)
    return { meta: out.meta, content: out.content, filename: domtFile, format: 'domt' }
  }

  // 旧格式回退：index.json + .html
  const indexFile = path.join(dirPath, 'index.json')
  let meta = {}
  if (fs.existsSync(indexFile)) {
    try { meta = JSON.parse(fs.readFileSync(indexFile, 'utf-8')) } catch (_) {}
  }
  if (!htmlFile) return null
  const content = fs.readFileSync(path.join(dirPath, htmlFile), 'utf-8')
  return { meta, content, filename: htmlFile, format: 'html' }
}

/**
 * 更新 .domt 的元数据并写回（若无 frontmatter 则新建）
 * @param {string} dirPath 文章目录
 * @param {object} patch 需要合并的元数据字段
 * @returns {boolean} 是否成功
 */
function updateDomtMeta(dirPath, patch) {
  const { domtFile } = findArticleFiles(dirPath)
  if (!domtFile) return false

  const filePath = path.join(dirPath, domtFile)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { meta, content } = parseDomt(raw)
  Object.assign(meta, patch)
  fs.writeFileSync(filePath, stringifyDomt(meta, content), 'utf-8')
  return true
}

module.exports = { parseDomt, stringifyDomt, findArticleFiles, readArticle, updateDomtMeta }
