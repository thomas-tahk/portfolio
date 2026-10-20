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
