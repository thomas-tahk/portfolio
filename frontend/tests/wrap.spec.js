import { test, expect } from '@playwright/test'
import { sitePath } from './standardChecks.js'
import { LAYOUT } from '../src/constants.js'

const M = LAYOUT.map
const pos = (page) => page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))

async function openGame(page) {
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__player && window.__iconObjects && window.__iconObjects().length === 9)
}

// Start 100 units inside an edge (on the clear axis), hold the key past the edge, expect re-entry from the opposite side.
const EDGES = [
  { name: 'right', key: 'ArrowRight', start: { x: M.maxX - 100, y: 0 }, check: (p) => p.x < M.minX + 600 },
  { name: 'left', key: 'ArrowLeft', start: { x: M.minX + 100, y: 0 }, check: (p) => p.x > M.maxX - 600 },
  { name: 'bottom', key: 'ArrowDown', start: { x: 0, y: M.maxY - 100 }, check: (p) => p.y < M.minY + 600 },
  { name: 'top', key: 'ArrowUp', start: { x: 0, y: M.minY + 100 }, check: (p) => p.y > M.maxY - 600 },
]

for (const edge of EDGES) {
  test(`/play/ walking past the ${edge.name} edge re-enters from the opposite side, camera snaps`, async ({ page }) => {
    await openGame(page)
    await page.evaluate(({ x, y }) => { window.__player.pos.x = x; window.__player.pos.y = y }, edge.start)
    await page.waitForTimeout(1500) // camera settles on the start point
    await page.keyboard.down(edge.key)
    await page.waitForTimeout(450)
    await page.keyboard.up(edge.key)

    const p = await pos(page)
    expect(edge.check(p), `${edge.name}: player at ${p.x},${p.y}`).toBe(true)
    const cam = await page.evaluate(() => window.__cam())
    expect(Math.hypot(cam.x - p.x, cam.y - p.y), 'camera stays near the player (no sweep)').toBeLessThan(300)
  })
}

test('/play/ a kicked icon past an edge wraps to the opposite side', async ({ page }) => {
  await openGame(page)
  await page.evaluate((maxX) => {
    const logo = window.__iconObjects()[2]
    logo.pos.x = maxX - 20
    logo.drift.x = 600
  }, M.maxX)
  await page.waitForTimeout(500)
  const icon = (await page.evaluate(() => window.__icons()))[2]
  expect(icon.x, 'icon re-entered from the left').toBeLessThan(M.minX + 500)
})
