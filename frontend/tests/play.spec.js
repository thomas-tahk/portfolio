import { test, expect } from '@playwright/test'
import { standardChecks, sitePath } from './standardChecks.js'

test('/play/ passes standard checks', async ({ page }) => {
  await standardChecks(page, '/play/')
})

test('/play/ has the game canvas and no failed asset requests', async ({ page }) => {
  const failed = []
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
  page.on('requestfailed', (r) => failed.push(`failed ${r.url()}`))

  await page.goto(sitePath('/play/'))
  await expect(page.locator('canvas#game')).toBeVisible()
  await page.waitForLoadState('networkidle')

  expect(failed, 'failed requests').toEqual([])
})

test('/play/ arrow keys move the player', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__player)
  const start = await page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))

  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(500)
  await page.keyboard.up('ArrowRight')

  const end = await page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))
  expect(end.x, 'player x after holding ArrowRight').toBeGreaterThan(start.x)
})
