import { test, expect } from '@playwright/test'
import { sitePath } from './standardChecks.js'

const icons = (page) => page.evaluate(() => window.__icons())
const playerPos = (page) => page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))

async function openGame(page) {
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__icons && window.__icons().length === 9 && window.__player)
}

// Top-right icon of the 3x3 cluster: nothing to its right or above, so a kick away from the player is unobstructed.
const KICKED = 2

// Put the player just right of that icon (outside the Skills zone, so no modal opens). Returns the icon.
async function standBesideFirstIcon(page) {
  const first = (await icons(page))[KICKED]
  await page.evaluate(({ x, y }) => { window.__player.pos.x = x + 90; window.__player.pos.y = y }, { x: first.x, y: first.y })
  await page.waitForTimeout(200)
  return first
}

test('/play/ tech icons exist on load at their start positions', async ({ page }) => {
  await openGame(page)
  const list = await icons(page)
  expect(list).toHaveLength(9)
  for (const i of list) expect([i.x, i.y], `${i.name} at start`).toEqual([i.startX, i.startY])
})

test('/play/ Space next to an icon kicks it, and it slows to a stop', async ({ page }) => {
  await openGame(page)
  const first = await standBesideFirstIcon(page)

  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
  const moving = (await icons(page))[KICKED]
  expect(Math.hypot(moving.x - first.x, moving.y - first.y), 'icon moved').toBeGreaterThan(20)

  await page.waitForTimeout(2500)
  const a = (await icons(page))[KICKED]
  await page.waitForTimeout(300)
  const b = (await icons(page))[KICKED]
  expect([b.x, b.y], 'icon has stopped').toEqual([a.x, a.y])
})

test('/play/ Space far from every icon kicks nothing', async ({ page }) => {
  await openGame(page)
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
  for (const i of await icons(page)) expect([i.x, i.y]).toEqual([i.startX, i.startY])
})

test('/play/ Reset icons puts every icon back', async ({ page }) => {
  await openGame(page)
  await standBesideFirstIcon(page)
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
  const kicked = (await icons(page))[KICKED]
  expect(kicked.x, 'icon moved before reset').not.toBe(kicked.startX)

  const button = page.getByRole('button', { name: 'Reset icons' })
  expect((await button.boundingBox()).height, 'tap target height').toBeGreaterThanOrEqual(44)
  await button.click()
  await page.waitForTimeout(200)
  for (const i of await icons(page)) expect([i.x, i.y], `${i.name} back at start`).toEqual([i.startX, i.startY])
})

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

  async function cdpTouch(page, ms) {
    const cdp = await page.context().newCDPSession(page)
    const point = [{ x: 375 / 2 + 100, y: 812 / 2 + 150, id: 1 }]
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point })
    await page.waitForTimeout(ms)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }

  test('/play/ a short tap next to an icon kicks it and does not walk the player', async ({ page }) => {
    await openGame(page)
    const first = await standBesideFirstIcon(page)
    const before = await playerPos(page)

    await cdpTouch(page, 0)
    await page.waitForTimeout(400)

    const icon = (await icons(page))[KICKED]
    expect(Math.hypot(icon.x - first.x, icon.y - first.y), 'icon moved').toBeGreaterThan(20)
    const after = await playerPos(page)
    expect(Math.hypot(after.x - before.x, after.y - before.y), 'player walked').toBeLessThan(15)
  })

  test('/play/ Reset icons button is fully on screen and tappable at 375px', async ({ page }) => {
    await openGame(page)
    const box = await page.getByRole('button', { name: 'Reset icons' }).boundingBox()
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(375)
    expect(box.height).toBeGreaterThanOrEqual(44)
  })
})
