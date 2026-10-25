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
