const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// 账号体系已移除：不再有账号数据库（users / sessions），这里只保留
// 加载项索引与文章索引两个数据库。
const ADDONS_DIR = path.resolve(__dirname, '..', 'data', 'addons')
const ADDONS_DB_DIR = path.join(ADDONS_DIR, 'database')
const ADDONS_DB_PATH = path.join(ADDONS_DB_DIR, 'addons.db')
const MAIN_ADDONS_DIR = path.join(ADDONS_DIR, 'main')

const DOCUMENTS_DIR = path.resolve(__dirname, '..', 'data', 'documents')
const DOCUMENTS_DB_DIR = path.join(DOCUMENTS_DIR, 'database')
const DOCUMENTS_DB_PATH = path.join(DOCUMENTS_DB_DIR, 'documents.db')

if (!fs.existsSync(ADDONS_DIR)) {
  fs.mkdirSync(ADDONS_DIR, { recursive: true })
}
if (!fs.existsSync(ADDONS_DB_DIR)) {
  fs.mkdirSync(ADDONS_DB_DIR, { recursive: true })
}
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true })
}
if (!fs.existsSync(DOCUMENTS_DB_DIR)) {
  fs.mkdirSync(DOCUMENTS_DB_DIR, { recursive: true })
}

// ── Addons database ──
const addonsDb = new Database(ADDONS_DB_PATH)
addonsDb.pragma('journal_mode = WAL')
addonsDb.exec(`
  CREATE TABLE IF NOT EXISTS addons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT,
    version TEXT,
    author TEXT,
    description TEXT,
    icon TEXT,
    filename TEXT NOT NULL,
    size INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  )
`)
try { addonsDb.exec('ALTER TABLE addons ADD COLUMN icon TEXT') } catch (_) {}

// ── Documents database ──
const documentsDb = new Database(DOCUMENTS_DB_PATH)
documentsDb.pragma('journal_mode = WAL')
documentsDb.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    filename TEXT UNIQUE NOT NULL,
    format TEXT NOT NULL DEFAULT 'html',
    size INTEGER DEFAULT 0,
    author TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  )
`)

// Migration: add category column for folder-based indexing
try { documentsDb.exec('ALTER TABLE documents ADD COLUMN category TEXT') } catch (_) {}
try { documentsDb.exec('ALTER TABLE documents ADD COLUMN source TEXT NOT NULL DEFAULT \'db\'') } catch (_) {}
try { documentsDb.exec('CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)') } catch (_) {}

const DOCUMENTS_MAIN_DIR = path.join(DOCUMENTS_DIR, 'main')

module.exports = { addonsDb, documentsDb, ADDONS_DIR, MAIN_ADDONS_DIR, DOCUMENTS_DIR, DOCUMENTS_MAIN_DIR }
