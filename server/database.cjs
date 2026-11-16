const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const DATA_DIR = path.resolve(__dirname, '..', 'data', 'accounts', 'base')
const DB_PATH = path.join(DATA_DIR, 'webword.db')
const AVATAR_DIR = path.join(DATA_DIR, 'avatars')
const BACKGROUNDS_DIR = path.join(DATA_DIR, 'backgrounds')

const ADDONS_DIR = path.resolve(__dirname, '..', 'data', 'addons')
const ADDONS_DB_DIR = path.join(ADDONS_DIR, 'database')
const ADDONS_DB_PATH = path.join(ADDONS_DB_DIR, 'addons.db')
const MAIN_ADDONS_DIR = path.join(ADDONS_DIR, 'main')

const DOCUMENTS_DIR = path.resolve(__dirname, '..', 'data', 'documents')
const DOCUMENTS_DB_DIR = path.join(DOCUMENTS_DIR, 'database')
const DOCUMENTS_DB_PATH = path.join(DOCUMENTS_DB_DIR, 'documents.db')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true })
}
if (!fs.existsSync(BACKGROUNDS_DIR)) {
  fs.mkdirSync(BACKGROUNDS_DIR, { recursive: true })
}
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

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    last_login TEXT
  )
`)

// Migrations for older schemas
try { db.exec('ALTER TABLE users ADD COLUMN email TEXT') } catch (_) {}
try { db.exec('ALTER TABLE users ADD COLUMN avatar TEXT') } catch (_) {}
try { db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'") } catch (_) {}

// Fix: unlock admin users that were locked by the old DEFAULT 'locked' migration
try { db.exec("UPDATE users SET status = 'active' WHERE role = 'admin' AND status = 'locked'") } catch (_) {}

// Migration: add 16-char UUID column for stronger account identification
try { db.exec('ALTER TABLE users ADD COLUMN uuid TEXT') } catch (_) {}
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid) WHERE uuid IS NOT NULL') } catch (_) {}
// Generate UUIDs for existing users that don't have one
try {
  const existing = db.prepare('SELECT id FROM users WHERE uuid IS NULL').all()
  const updateStmt = db.prepare('UPDATE users SET uuid = ? WHERE id = ?')
  for (const row of existing) {
    const hex = crypto.randomBytes(8).toString('hex')
    const uuid = `${hex.slice(0,4)}-${hex.slice(4,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}`
    updateStmt.run(uuid, row.id)
  }
} catch (_) {}

// Migration: add restrictions field for per-user bans (e.g. "comment_banned")
try { db.exec("ALTER TABLE users ADD COLUMN restrictions TEXT NOT NULL DEFAULT '[]'") } catch (_) {}
// Migration: add locked_until for timed bans
try { db.exec("ALTER TABLE users ADD COLUMN locked_until TEXT") } catch (_) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`)

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

// Migration: upgrade the first admin user to super_admin (fixes existing DBs)
try {
  const firstAdmin = db.prepare("SELECT id, role FROM users WHERE role IS NOT NULL ORDER BY id ASC LIMIT 1").get()
  if (firstAdmin && firstAdmin.role !== 'super_admin') {
    db.prepare("UPDATE users SET role = 'super_admin' WHERE id = ?").run(firstAdmin.id)
  }
} catch (_) {}

module.exports = { db, addonsDb, documentsDb, DATA_DIR, AVATAR_DIR, BACKGROUNDS_DIR, ADDONS_DIR, MAIN_ADDONS_DIR, DOCUMENTS_DIR, DOCUMENTS_MAIN_DIR }
