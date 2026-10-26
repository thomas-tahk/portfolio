import { test, expect } from '@playwright/test'
import { sitePath } from './standardChecks.js'

const MODALS = ['about', 'projects', 'experience', 'skills', 'email', 'social']
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 1280, height: 800 },
]

for (const viewport of VIEWPORTS) {
  test.describe(`compact popups at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport })

    for (const name of MODALS) {
      test(`${name} modal fits the viewport`, async ({ page }) => {
        await page.goto(sitePath('/play/') + '?test')
        await page.waitForFunction(() => window.__openModal)
        // At 1280 the avatar can start inside a section and auto-open its modal; start from a clean slate.
        await page.evaluate((all) => all.forEach((n) => window.__openModal(n, false)), MODALS)
        await page.evaluate((n) => window.__openModal(n, true), name)

        const box = page.locator('.modal-content')
        await expect(box).toBeVisible()
        const b = await box.boundingBox()
        expect(b.x, 'left edge').toBeGreaterThanOrEqual(0)
        expect(b.x + b.width, 'right edge').toBeLessThanOrEqual(viewport.width)

        const close = page.locator('.modal-content > .modal-btn-container .modal-btn').last()
        const c = await close.boundingBox()
        expect(c.y + c.height, 'close button bottom').toBeLessThanOrEqual(viewport.height)
        expect(c.x + c.width, 'close button right').toBeLessThanOrEqual(viewport.width)
        expect(c.height, 'tap target height').toBeGreaterThanOrEqual(44)

        const fontPx = await box
          .locator('p, span')
          .first()
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
        expect(fontPx, 'body font-size').toBeLessThanOrEqual(17)
        if (viewport.width > 600) expect(b.width, 'desktop width').toBeLessThanOrEqual(520)
      })
    }
  })
}

test('/play/ plain-version pill is covered by popups and reachable by Tab at 390x844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__openModal)
  const pill = page.getByRole('link', { name: '← Plain version' })
  const p = await pill.boundingBox()
  const centre = { x: p.x + p.width / 2, y: p.y + p.height / 2 }
  for (const name of ['skills', 'experience']) {
    await page.evaluate((all) => all.forEach((n) => window.__openModal(n, false)), MODALS)
    await page.evaluate((n) => window.__openModal(n, true), name)
    const pillOnTop = await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.plain-page-link'), centre)
    expect(pillOnTop, `pill on top of ${name} popup`).toBe(false)
  }
  await page.evaluate((all) => all.forEach((n) => window.__openModal(n, false)), MODALS)
  await page.locator('#game').focus()
  await page.keyboard.press('Tab') // canvas is last in the page: leaves to the browser chrome
  await page.keyboard.press('Tab')
  await expect(pill).toBeFocused()
})
