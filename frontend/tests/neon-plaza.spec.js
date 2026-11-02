import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { sitePath } from './standardChecks.js'
import { walkWithKeys, walkWithFinger, tapToKick } from './plazaJourney.js'

const content = JSON.parse(readFileSync(new URL('../src/content.json', import.meta.url)))

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 667, height: 375 }, { width: 568, height: 320 }, { width: 480, height: 320 }, { width: 320, height: 320 }]) {
  test(`neon plaza has three destinations and persistent real links at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto(sitePath('/play/') + '?test')
    await page.waitForFunction(() => window.__layout)
    expect(await page.evaluate(() => window.__layout.zones.map((z) => z.name).sort()))
      .toEqual(['experience', 'projects', 'skills'])
    const header = page.getByRole('banner')
    await expect(header).toContainText(content.about.name)
    await expect(header.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', content.contact.github)
    await expect(header.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', content.contact.linkedin)
    await expect(header.getByRole('link', { name: 'Email', exact: true })).toHaveAttribute('href', `mailto:${content.contact.email}`)
    const layout = await page.evaluate(() => ({ zones: window.__layout.zones, camera: window.__cam() }))
    for (const zone of layout.zones) {
      const centre = viewport.width / 2 + (zone.x - layout.camera.x) * layout.camera.zoom
      expect(centre - zone.w / 2 * layout.camera.zoom, `${zone.name} left edge`).toBeGreaterThanOrEqual(0)
      expect(centre + zone.w / 2 * layout.camera.zoom, `${zone.name} right edge`).toBeLessThanOrEqual(viewport.width)
    }
    const box = await header.boundingBox()
    for (const zone of layout.zones) {
      const labelTop = viewport.height / 2 + (zone.y - 170 - layout.camera.y) * layout.camera.zoom - 8
      expect(labelTop, `${zone.name} label below header`).toBeGreaterThan(box.y + box.height)
    }
    expect(box.width).toBeLessThanOrEqual(viewport.width)
    expect(box.height).toBeLessThan(viewport.height * 0.22)
  })
}

test('header keyboard navigation does not walk or kick the player', async ({ page }) => {
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__player)
  await page.getByRole('link', { name: 'GitHub', exact: true }).focus()
  const start = await page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(250)
  await page.keyboard.up('ArrowRight')
  expect(await page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))).toEqual(start)
})

for (const phone of [false, true]) {
  test.describe(phone ? 'phone acceptance' : 'desktop acceptance', () => {
    test.use(phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }
      : { viewport: { width: 1280, height: 800 } })

    test('walk from spawn, visit Projects, follow a real link, close, walk to a ball and kick', async ({ page }) => {
      test.setTimeout(60000)
      await page.goto(sitePath('/play/') + '?test')
      await page.waitForFunction(() => window.__icons?.().length === 9)
      const walk = phone ? walkWithFinger : walkWithKeys
      const projects = await page.evaluate(() => window.__layout.zones.find((z) => z.name === 'projects'))
      await walk(page, projects, '.projects-modal')
      const projectLink = content.projects.find((p) => !p.hidden).links[0].url
      const popupPromise = page.waitForEvent('popup')
      await page.locator('.project-link-btn').first().click()
      const popup = await popupPromise
      await expect(popup).toHaveURL(projectLink, { timeout: 15000 })
      await popup.waitForLoadState('domcontentloaded')
      await expect(popup).toHaveTitle(/knowflow/i)
      await popup.close()
      await page.getByRole('button', { name: 'Close', exact: true }).click()
      await expect(page.locator('.projects-modal')).toHaveCount(0)
      await page.locator('#game').focus()
      await walk(page, { x: projects.x, y: 220 })
      const icon = await page.evaluate(() => window.__icons()[2])
      await walk(page, { x: icon.x, y: icon.y, within: 115, ball: true })
      const before = await page.evaluate(() => window.__icons())
      const distance = await page.evaluate(() => Math.min(...window.__icons().map(({ x, y }) =>
        Math.hypot(window.__player.pos.x - x, window.__player.pos.y - y))))
      expect(distance, 'walk finishes inside kick reach').toBeLessThan(130)
      if (phone) await tapToKick(page)
      else await page.keyboard.press('Space')
      await expect.poll(async () => {
        const after = await page.evaluate(() => window.__icons())
        return after.some((ball, i) => Math.hypot(ball.x - before[i].x, ball.y - before[i].y) > 20)
      }).toBe(true)
      await page.getByRole('link', { name: '← Plain version' }).click()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  })
}

test('reduced motion stops lane markings', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__icons?.().length === 9)
  await page.waitForTimeout(300)
  const canvas = page.locator('#game')
  const first = await canvas.screenshot()
  await page.waitForTimeout(300)
  expect(await canvas.screenshot()).toEqual(first)
})


test('releasing a canvas drag over the header stops walking', async ({ page }) => {
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__player)
  await page.mouse.move(900, 400)
  await page.mouse.down()
  await page.waitForTimeout(150)
  await page.mouse.move(450, 30)
  await page.mouse.up()
  await page.waitForTimeout(150)
  const position = await page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))
  await page.waitForTimeout(350)
  expect(await page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))).toEqual(position)
})
