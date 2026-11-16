import { spawn, exec } from 'child_process'
import { createServer } from 'net'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PORT = process.env.PORT || 3001
const DESKTOP_PORT = 3000
const URL = `http://localhost:${DESKTOP_PORT}`

// 终端颜色
const COLORS = {
  desktop: '\x1b[35m', // magenta
  server:  '\x1b[36m', // cyan
}
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

// 检查端口是否被占用
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(true))
    server.once('listening', () => {
      server.close()
      resolve(false)
    })
    server.listen(port)
  })
}

// 获取占用端口的进程信息 { pid, ppid, cmd }，无则返回 null
function getPortProcess(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti :${port}`, (err, stdout) => {
      if (err || !stdout.trim()) return resolve(null)
      const pid = Number(stdout.trim().split('\n')[0])
      if (!pid) return resolve(null)
      exec(`ps -p ${pid} -o pid=,ppid=,cmd=`, (e, out) => {
        if (e || !out.trim()) return resolve({ pid, ppid: 0, cmd: '' })
        const parts = out.trim().split(/\s+/)
        resolve({ pid: Number(parts[0]), ppid: Number(parts[1]), cmd: parts.slice(2).join(' ') })
      })
    })
  })
}

// 判断是否为本项目自己启动的子进程（后端 / Vite / dev.js 主进程）
function isOurProcess(cmd) {
  return /server[\\/]index\.cjs/.test(cmd) || /\bvite\b/.test(cmd) || /dev\.js/.test(cmd)
}

// 确保端口可用：若被本项目孤儿进程占用则自动清理，非本项目进程则报错
async function ensurePortFree(port) {
  if (!(await isPortInUse(port))) return true
  const info = await getPortProcess(port)
  if (!info) return true

  if (!isOurProcess(info.cmd)) {
    console.log(`  ${BOLD}[ERROR]${RESET} 端口 ${port} 被非本项目进程占用：PID ${info.pid} (${info.cmd})，请手动关闭后重试`)
    return false
  }

  console.log(`  ${BOLD}[INFO]${RESET} 端口 ${port} 被残留进程占用：PID ${info.pid} (${info.cmd})，正在清理...`)
  try { process.kill(info.pid, 'SIGTERM') } catch (_) { /* 可能已退出 */ }

  // 最多等 3 秒等其退出
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 100))
    if (!(await isPortInUse(port))) {
      console.log(`  ${BOLD}[INFO]${RESET} 端口 ${port} 已释放`)
      return true
    }
  }

  // SIGTERM 未生效，强杀
  console.log(`  ${BOLD}[INFO]${RESET} SIGTERM 未生效，发送 SIGKILL...`)
  try { process.kill(info.pid, 'SIGKILL') } catch (_) { /* ignore */ }
  await new Promise((r) => setTimeout(r, 500))

  if (await isPortInUse(port)) {
    const still = await getPortProcess(port)
    console.log(`  ${BOLD}[ERROR]${RESET} 无法清理端口 ${port} 上的进程 PID ${still?.pid}`)
    return false
  }
  console.log(`  ${BOLD}[INFO]${RESET} 端口 ${port} 已释放`)
  return true
}

function formatTime() {
  const now = new Date()
  return now.toLocaleTimeString('zh-CN', { hour12: false })
}

async function start() {
  // 检查端口（自动清理本项目残留的孤儿进程）
  for (const p of [PORT, DESKTOP_PORT]) {
    if (!(await ensurePortFree(p))) process.exit(1)
  }

  // ── Banner ──
  console.log('')
  console.log(`  ${BOLD}╔══════════════════════════════════════╗${RESET}`)
  console.log(`  ${BOLD}║     BetaStudio2 Blog Dev Server      ║${RESET}`)
  console.log(`  ${BOLD}╚══════════════════════════════════════╝${RESET}`)
  console.log('')

  const allProcesses = []
  let backendReady = false
  let desktopViteReady = false

  // ── 1. 启动 Express 后端 (port ${PORT}) ──
  const server = spawn('node', ['server/index.cjs'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(PORT) },
  })
  allProcesses.push(server)

  server.stdout.on('data', (data) => {
    const text = data.toString()
    const lines = text.trim().split('\n')
    for (const line of lines) {
      const tag = `${COLORS.server}[${formatTime()}]${RESET}`
      if (line.includes('server running')) {
        backendReady = true
        console.log(`  ${tag} ${line}`)
        checkAllReady()
      } else if (line.trim()) {
        console.log(`  ${tag} ${line}`)
      }
    }
  })

  server.stderr.on('data', (data) => {
    const text = data.toString().trim()
    if (text) {
      console.error(`  ${COLORS.server}[ERR]${RESET} ${text}`)
    }
  })

  // ── 2. 启动 Desktop Vite 开发服务器 (port ${DESKTOP_PORT}) ──
  const viteProc = spawn('npx', ['vite', '--port', String(DESKTOP_PORT)], {
    cwd: resolve(__dirname, 'Desktop'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  })
  allProcesses.push(viteProc)

  viteProc.stdout.on('data', (data) => {
    const text = data.toString()
    const lines = text.split('\n')
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue

      if (line.includes('Local:') || line.includes('http://localhost:')) {
        desktopViteReady = true
        checkAllReady()
        const urlMatch = line.match(/(https?:\/\/[^\s]+)/)
        if (urlMatch) {
          console.log(`  ${COLORS.desktop}[desktop]${RESET} Vite dev server → ${BOLD}${urlMatch[1]}${RESET}`)
          continue
        }
      }

      if (line.includes('Port') || line.includes('localhost')) continue
      console.log(`  ${COLORS.desktop}[desktop]${RESET} ${line}`)
    }
  })

  viteProc.stderr.on('data', (data) => {
    const text = data.toString().trim()
    if (text) {
      process.stdout.write(`  ${COLORS.desktop}[desktop]${RESET} ${text}\n`)
    }
  })

  viteProc.on('close', (code) => {
    console.log(`  ${COLORS.desktop}[desktop]${RESET} 进程退出 (code: ${code})`)
  })

  // ── 全部就绪后显示汇总 ──
  let allReadyPrinted = false
  function checkAllReady() {
    if (allReadyPrinted) return
    if (!backendReady || !desktopViteReady) return

    allReadyPrinted = true
    console.log('')
    console.log(`  ${COLORS.desktop}Desktop${RESET}  → http://localhost:${DESKTOP_PORT}/`)
    console.log(`  ${COLORS.desktop}WebWord${RESET}  → http://localhost:${DESKTOP_PORT}/webword`)
    console.log(`  ${COLORS.desktop}Blog${RESET}     → http://localhost:${DESKTOP_PORT}/blog`)
    console.log(`  ${COLORS.server}Backend${RESET}   → http://localhost:${PORT} (API)`)
    console.log('')

    openBrowser(`http://localhost:${DESKTOP_PORT}`)
  }

  // ── 优雅退出 ──
  function cleanup() {
    for (const proc of allProcesses) {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM')
      }
    }
  }

  process.on('SIGINT', () => {
    console.log(`\n  ${BOLD}正在关闭所有进程...${RESET}`)
    cleanup()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    cleanup()
    process.exit(0)
  })
}

function openBrowser(url) {
  const platform = process.platform
  const cmd =
    platform === 'win32'
      ? `start ${url}`
      : platform === 'darwin'
        ? `open ${url}`
        : `xdg-open ${url}`
  exec(cmd, () => {})
}

start()
