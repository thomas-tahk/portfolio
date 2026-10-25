// Frame-time benchmark for /play/ on an emulated phone.
// Usage: node scripts/perf.mjs [--dir <frontend dir>] [--port 4391] [--runs 3] [--cpu 4] [--secs 10] [--gpu soft|hw]
// Builds <dir> (default: cwd), serves it with `vite preview`, loads /play/ at 390x844 DPR3,
// throttles CPU, records requestAnimationFrame deltas for an idle phase then a walking phase.
// Emulation only: desktop Chromium + CDP CPU throttle, not a real phone GPU. Compare runs, not absolutes.
// <dir> needs node_modules installed. @playwright/test is imported from this repo's node_modules.
import { spawn, execSync } from 'node:child_process'
import { resolve } from 'node:path'
import process from 'node:process'
import { chromium } from '@playwright/test'

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d }
const dir = resolve(arg('dir', process.cwd()))
const port = Number(arg('port', 4391))
const runs = Number(arg('runs', 3))
const cpu = Number(arg('cpu', 4))
const secs = Number(arg('secs', 10))
// gpu=hw: real GPU with vsync/frame-rate limit off so frame time = real cost (default vsync caps at 16.7ms and hides it). gpu=soft: software raster, fill-rate bound, discriminates.
const gpu = arg('gpu', 'hw')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const stats = (a) => {
  const s = [...a].sort((x, y) => x - y)
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))]
  return { n: s.length, median: q(0.5), p95: q(0.95) }
}

async function waitForServer(url) {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).ok) return } catch { /* not up yet */ }
    await sleep(500)
  }
  throw new Error('server did not start')
}

async function measureOnce(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  await page.addInitScript(() => {
    window.__frames = []
    window.__phase = 'load'
    let last = 0
    const tick = (t) => { if (last) window.__frames.push([window.__phase, t - last]); last = t; requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  })
  await page.goto(`http://localhost:${port}/portfolio/play/`)
  await page.waitForSelector('canvas')
  await page.waitForTimeout(3000) // let assets load / settle
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  await page.evaluate(() => { window.__phase = 'idle' })
  await page.waitForTimeout(secs * 1000)
  await page.evaluate(() => { window.__phase = 'walk' })
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']
  const end = Date.now() + secs * 1000
  for (let i = 0; Date.now() < end; i++) {
    const key = keys[i % 4]
    await page.keyboard.down(key); await page.waitForTimeout(700); await page.keyboard.up(key)
  }
  const frames = await page.evaluate(() => window.__frames)
  await ctx.close()
  const by = (p) => stats(frames.filter(([ph]) => ph === p).map(([, d]) => d))
  return { idle: by('idle'), walk: by('walk') }
}

const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { cwd: dir, stdio: 'ignore' })
try {
  execSync('npx vite build', { cwd: dir, stdio: 'ignore' })
  await waitForServer(`http://localhost:${port}/portfolio/play/`)
  const browser = await chromium.launch({ args: gpu === 'soft' ? [] : ['--use-angle=metal', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] })
  const results = []
  for (let i = 0; i < runs; i++) results.push(await measureOnce(browser))
  await browser.close()
  const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)]
  console.log(`dir=${dir} cpu=${cpu}x gpu=${gpu} runs=${runs}`)
  for (const ph of ['idle', 'walk']) {
    for (const r of results) console.log(`  ${ph} run: n=${r[ph].n} median=${r[ph].median.toFixed(1)}ms p95=${r[ph].p95.toFixed(1)}ms`)
    console.log(`${ph.toUpperCase()} median-of-runs: median=${med(results.map((r) => r[ph].median)).toFixed(1)}ms p95=${med(results.map((r) => r[ph].p95)).toFixed(1)}ms`)
  }
} finally {
  server.kill()
}
