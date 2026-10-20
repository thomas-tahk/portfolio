import { expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import viteConfig from '../vite.config.js'

const BASE = viteConfig.base ?? '/'
const MOBILE = { width: 375, height: 812 }

/** Site path -> path under the build's base: '/' -> '/<base>/' */
export function sitePath(path) {
  return BASE.replace(/\/$/, '') + path
}

async function checkLink(request, url) {
  const external = !url.startsWith('http://localhost')
  const attempts = external ? 3 : 1
  let status = 0
  for (let i = 0; i < attempts; i++) {
    try {
      status = (await request.get(url, { maxRedirects: 5, timeout: 15_000 })).status()
    } catch {
      status = 0
    }
    if (status >= 200 && status < 400) return
  }
  if (external && status === 403) {
    console.warn(`WARNING: skipped ${url} (403 to bots)`)
    return
  }
  throw new Error(`Broken link ${url} (status ${status})`)
}

/**
 * Standard checks for one page: 200 + no console errors, no horizontal
 * scroll at 375x812, all links 2xx/3xx, no serious/critical axe violations.
 *
 * knownAxeFailures: axe rule ids to tolerate. Every entry needs a comment
 * pointing at the issue that fixes it.
 */
export async function standardChecks(page, path, { knownAxeFailures = [] } = {}) {
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))

  await page.setViewportSize(MOBILE)
  const response = await page.goto(sitePath(path))
  expect(response.status(), 'HTTP status').toBe(200)
  await page.waitForLoadState('networkidle')
  expect(errors, 'console errors').toEqual([])

  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, 'horizontal scroll at 375px').toBeLessThanOrEqual(innerWidth)

  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.href))
  const urls = [...new Set(hrefs)].filter((u) => /^https?:/.test(u))
  for (const url of urls) await checkLink(page.request, url)

  const { violations } = await new AxeBuilder({ page }).analyze()
  const blocking = violations.filter(
    (v) => ['serious', 'critical'].includes(v.impact) && !knownAxeFailures.includes(v.id),
  )
  expect(
    blocking.map((v) => `${v.id} (${v.impact}): ${v.help}`),
    'axe serious/critical violations',
  ).toEqual([])
}
