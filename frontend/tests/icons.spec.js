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

// Poll rather than sleep: a slow runner needs more wall-clock time for a kicked icon to cover the same distance.
const expectIconMoved = (page, from) => expect.poll(async () => {
  const now = (await icons(page))[KICKED]
  return Math.hypot(now.x - from.x, now.y - from.y)
}, { message: 'icon moved', timeout: 10_000 }).toBeGreaterThan(20)

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
  await expectIconMoved(page, first)

  // Stopped = two samples a moment apart agree. Poll: how long the slowdown takes depends on the runner's frame rate.
  await expect.poll(async () => {
    const a = (await icons(page))[KICKED]
    await page.waitForTimeout(300)
    const b = (await icons(page))[KICKED]
    return [b.x === a.x, b.y === a.y]
  }, { message: 'icon has stopped', timeout: 15_000 }).toEqual([true, true])
})

test('/play/ Space far from every icon kicks nothing', async ({ page }) => {
  await openGame(page)
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
  for (const i of await icons(page)) expect([i.x, i.y]).toEqual([i.startX, i.startY])
})

test('/play/ closing the Skills popup puts every icon back', async ({ page }) => {
  await openGame(page)
  await standBesideFirstIcon(page)
  await page.keyboard.press('Space')
  await expect.poll(async () => (await icons(page))[KICKED].x, { message: 'icon moved before reset' }).not.toBe((await icons(page))[KICKED].startX)

  await page.evaluate(() => window.__openModal('skills', true))
  await page.evaluate(() => window.__openModal('skills', false))
  await page.waitForTimeout(200)
  for (const i of await icons(page)) expect([i.x, i.y], `${i.name} back at start`).toEqual([i.startX, i.startY])
})

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

  // Both events are sent without awaiting in between: each CDP round trip costs ~100ms+, which would make a "tap" look like a hold.
  async function cdpTap(page) {
    const cdp = await page.context().newCDPSession(page)
    const point = [{ x: 375 / 2 + 100, y: 812 / 2 + 150, id: 1 }]
    await Promise.all([
      cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point }),
      cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }),
    ])
  }

  test('/play/ a short tap next to an icon kicks it and does not walk the player', async ({ page }) => {
    await openGame(page)
    const first = await standBesideFirstIcon(page)
    const before = await playerPos(page)

    await cdpTap(page)
    await expectIconMoved(page, first)

    const after = await playerPos(page)
    expect(Math.hypot(after.x - before.x, after.y - before.y), 'player walked').toBeLessThan(15)
  })
})
