import { test, expect } from '@playwright/test'
import { sitePath } from './standardChecks.js'
import { zoomForScreen } from '../src/constants.js'

// Load view: camera starts on the player at the origin, so world (x, y) lands at centre + (x, y) * zoom.
test('/play/ at 1280x800 all four section labels and part of the tech icons are on screen on load', async ({ page }) => {
  const size = { width: 1280, height: 800 }
  await page.setViewportSize(size)
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__layout && window.__icons().length > 0)
  const { zones } = await page.evaluate(() => window.__layout)
  const zoom = zoomForScreen(size.width, size.height)
  const toScreen = (x, y) => ({ x: size.width / 2 + x * zoom, y: size.height / 2 + y * zoom })
  const inView = (p) => p.x >= 0 && p.x <= size.width && p.y >= 0 && p.y <= size.height

  // label sits 150 world units above its zone; allow half a label (210 wide, 40 tall) around that point
  for (const name of ['about', 'skills', 'experience', 'projects']) {
    const z = zones.find((s) => s.name === name)
    for (const [dx, dy] of [[-210, -40], [210, -40], [-210, 40], [210, 40]]) {
      expect(inView(toScreen(z.x + dx, z.y - 150 + dy)), `${name} label corner ${dx},${dy}`).toBe(true)
    }
  }
  const icons = await page.evaluate(() => window.__icons())
  expect(icons.some((i) => inView(toScreen(i.x, i.y))), 'some tech icon on screen').toBe(true)
})

test.describe('phone HUD', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

  test('/play/ controls hint is small and dismisses with the close button', async ({ page }) => {
    await page.goto(sitePath('/play/') + '?test')
    const hint = page.locator('.controls-message')
    await expect(hint).toBeVisible()
    const h = await hint.boundingBox()

    expect(h.height, 'hint height vs viewport').toBeLessThanOrEqual(812 * 0.25)

    await page.getByRole('button', { name: 'Dismiss controls hint' }).click()
    await expect(hint).toHaveCount(0)
  })

  test('/play/ controls hint hides after the first key press', async ({ page }) => {
    await page.goto(sitePath('/play/') + '?test')
    await expect(page.locator('.controls-message')).toBeVisible()
    await page.keyboard.down('ArrowRight')
    await page.keyboard.up('ArrowRight')
    await expect(page.locator('.controls-message')).toHaveCount(0)
  })
})
