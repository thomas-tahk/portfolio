import { test, expect } from '@playwright/test'
import { sitePath } from './standardChecks.js'

const playerX = (page) => page.evaluate(() => window.__player.pos.x)

async function openGame(page) {
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__player)
}

// Holds ArrowRight, then loses focus without keyup ever arriving (what tabbing away does).
async function holdThenLoseFocus(page, loseFocus) {
  await openGame(page)
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(300)
  await page.evaluate(loseFocus)
  await page.waitForTimeout(150)
  return playerX(page)
}

const LOSE_FOCUS = {
  'window blur': () => window.dispatchEvent(new Event('blur')),
  'tab hidden': () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  },
}

for (const [name, loseFocus] of Object.entries(LOSE_FOCUS)) {
  test(`/play/ held key stops on ${name}, and the opposite key alone then moves normally`, async ({ page }) => {
    const stoppedAt = await holdThenLoseFocus(page, loseFocus)
    await page.waitForTimeout(400)
    expect(await playerX(page), 'player kept running after focus loss').toBeCloseTo(stoppedAt, 0)

    // coming back to the tab: nothing is held until the user presses again
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.waitForTimeout(150)
    await page.keyboard.down('ArrowLeft')
    await page.waitForTimeout(300)
    await page.keyboard.up('ArrowLeft')
    expect(await playerX(page), 'ArrowLeft alone moves left').toBeLessThan(stoppedAt - 50)
  })
}

test('/play/ held mouse stops on window blur', async ({ page }) => {
  await openGame(page)
  const box = await page.locator('canvas#game').boundingBox()
  await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(300)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.waitForTimeout(150)
  const stoppedAt = await playerX(page)
  await page.waitForTimeout(400)
  expect(await playerX(page), 'player kept walking toward the held mouse').toBeCloseTo(stoppedAt, 0)
})
