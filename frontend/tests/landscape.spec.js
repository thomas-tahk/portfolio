import { test, expect, devices } from '@playwright/test'
import { sitePath } from './standardChecks.js'

const PORTRAIT = { width: 390, height: 844 }
const LANDSCAPE = { width: 844, height: 390 }

test.use({ ...devices['Pixel 7'], viewport: PORTRAIT })

// Canvas must fill the viewport and the player (camera centre) must be on screen, inside the canvas.
async function expectFilled(page, size) {
  await expect.poll(() => page.evaluate(() => window.innerWidth), { message: 'viewport width' }).toBe(size.width)
  await page.waitForTimeout(400)
  const g = await page.evaluate(() => {
    const r = document.getElementById('game').getBoundingClientRect()
    const cam = window.__cam()
    const p = window.__player.pos
    return {
      canvas: { x: r.x, y: r.y, w: r.width, h: r.height },
      screen: { x: r.x + r.width / 2 + (p.x - cam.x) * cam.zoom, y: r.y + r.height / 2 + (p.y - cam.y) * cam.zoom },
      scrollWidth: document.documentElement.scrollWidth,
    }
  })
  const { canvas: c, screen: s } = g
  expect(c.w, 'canvas width').toBeGreaterThanOrEqual(size.width - 2)
  expect(c.h, 'canvas height').toBeGreaterThanOrEqual(size.height - 2)
  expect(s.x, 'player x on screen').toBeGreaterThanOrEqual(0)
  expect(s.x).toBeLessThanOrEqual(size.width)
  expect(s.y, 'player y on screen').toBeGreaterThanOrEqual(0)
  expect(s.y).toBeLessThanOrEqual(size.height)
  expect(s.x, 'player inside canvas x').toBeGreaterThanOrEqual(c.x)
  expect(s.x).toBeLessThanOrEqual(c.x + c.w)
  expect(s.y, 'player inside canvas y').toBeGreaterThanOrEqual(c.y)
  expect(s.y).toBeLessThanOrEqual(c.y + c.h)
  expect(g.scrollWidth, 'no horizontal scroll').toBeLessThanOrEqual(size.width)
}

async function open(page) {
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__player)
}

async function rotate(page, size) {
  await page.setViewportSize(size)
  await page.evaluate(() => window.dispatchEvent(new Event('orientationchange')))
}

const shot = (page, name) => process.env.SHOTS && page.screenshot({ path: `${process.env.SHOTS}/${name}.png` })

test('/play/ fills a phone loaded in landscape', async ({ page }) => {
  await page.setViewportSize(LANDSCAPE)
  await open(page)
  await shot(page, 'load-844x390')
  await expectFilled(page, LANDSCAPE)
})

test('/play/ fills the screen after rotating portrait to landscape and back', async ({ page }) => {
  await open(page)
  await expectFilled(page, PORTRAIT)
  await rotate(page, LANDSCAPE)
  await shot(page, 'rotate-844x390')
  await expectFilled(page, LANDSCAPE)
  await rotate(page, PORTRAIT)
  await shot(page, 'rotate-back-390x844')
  await expectFilled(page, PORTRAIT)
})
