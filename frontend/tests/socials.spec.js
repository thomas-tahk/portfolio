import { test, expect } from '@playwright/test'
import { sitePath } from './standardChecks.js'

const SHOTS = process.env.SHOT_DIR // optional: save screenshots for review

async function openGame(page) {
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => {
    try { return window.__socials().length === 3 && window.__socials().every((s) => s.logo.w > 1) } catch { return false } // throws until sprites load
  })
  await page.waitForTimeout(500)
}

async function expectLogosOnCircles(page) {
  for (const { key, circle, logo } of await page.evaluate(() => window.__socials())) {
    expect(Math.hypot(logo.x - circle.x, logo.y - circle.y), `${key} logo centred on its circle`).toBeLessThan(1)
    expect(Math.max(logo.w, logo.h), `${key} logo fits inside its circle`).toBeLessThanOrEqual(circle.r * 2 * 0.8)
    expect(Math.max(logo.w, logo.h), `${key} logo is big enough to read`).toBeGreaterThan(circle.r)
  }
}

// Walk up past About (x=140 keeps clear of its popup) to the social row (steering in the page, like WASD) so the screenshot shows what a player sees.
async function walkToSocials(page) {
  await page.evaluate(() => new Promise((done) => {
    const held = new Set()
    const hold = (code, on) => {
      if (on === held.has(code)) return
      if (on) held.add(code); else held.delete(code)
      document.dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { code, bubbles: true }))
    }
    const tick = () => {
      const p = window.__player.pos
      if (p.y <= -800) { ['KeyW', 'KeyA', 'KeyD'].forEach((c) => hold(c, false)); return done() }
      hold('KeyW', true); hold('KeyA', p.x > 150); hold('KeyD', p.x < 130)
      requestAnimationFrame(tick)
    }
    tick()
  }))
  await page.waitForTimeout(600)
}

test('/play/ social logos sit centred on their trigger circles', async ({ page }) => {
  await openGame(page)
  await expectLogosOnCircles(page)
  if (SHOTS) { await walkToSocials(page); await page.screenshot({ path: `${SHOTS}-desktop.png` }) }
})

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

  test('/play/ social logos sit centred on their trigger circles', async ({ page }) => {
    await openGame(page)
    await expectLogosOnCircles(page)
    if (SHOTS) { await walkToSocials(page); await page.screenshot({ path: `${SHOTS}-phone.png` }) }
  })
})
