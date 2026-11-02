import { test, expect } from '@playwright/test'
import { sitePath } from './standardChecks.js'
import { walkWithKeys, walkWithFinger, tapToKick } from './plazaJourney.js'

const resetPosition = (page) => page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))
const ballsHome = (page) => page.evaluate(() => window.__icons().every((ball) => ball.x === ball.startX && ball.y === ball.startY)
  && window.__iconObjects().every((ball) => ball.drift.x === 0 && ball.drift.y === 0))

for (const phone of [false, true]) {
  test.describe(phone ? 'phone reset' : 'desktop reset', () => {
    test.use(phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }
      : { viewport: { width: 1280, height: 800 } })

    test('walk, kick, reset restores player, camera and every ball; movement works again', async ({ page }) => {
      test.setTimeout(60000)
      await page.goto(sitePath('/play/') + '?test')
      await page.waitForFunction(() => window.__icons?.().length === 9)
      const reset = page.getByRole('button', { name: 'Reset plaza', exact: true })
      await expect(reset).toBeVisible()
      const walk = phone ? walkWithFinger : walkWithKeys
      const target = await page.evaluate(() => window.__icons()[0])
      const skills = await page.evaluate(() => window.__layout.zones.find((zone) => zone.name === 'skills'))
      await walk(page, { x: skills.x - skills.w / 2 - 200, y: target.startY })
      await walk(page, { x: target.startX, y: target.startY, ball: true, within: 115 })
      const before = await page.evaluate(() => window.__icons())
      if (phone) await tapToKick(page)
      else await page.keyboard.press('Space')
      await expect.poll(async () => (await page.evaluate(() => window.__icons())).some((ball, i) =>
        Math.hypot(ball.x - before[i].x, ball.y - before[i].y) > 20)).toBe(true)
      if (phone) await reset.tap()
      else await reset.click()
      await expect.poll(() => resetPosition(page)).toEqual({ x: 0, y: 0 })
      await expect.poll(() => ballsHome(page)).toBe(true)
      expect(await page.evaluate(() => window.__player.getCurAnim().name)).toBe('walk-down-idle')
      const camera = await page.evaluate(() => window.__cam())
      expect([camera.x, camera.y]).toEqual([0, 0])
      await page.waitForTimeout(250)
      expect(await resetPosition(page)).toEqual({ x: 0, y: 0 })
      expect(await page.evaluate(() => window.__player.getCurAnim().name)).toBe('walk-down-idle')
      await expect(page.locator('#game')).toBeFocused()
      if (phone) await walkWithFinger(page, { x: -200, y: 0 })
      else {
        await page.keyboard.down('ArrowLeft')
        await expect.poll(async () => (await resetPosition(page)).x).toBeLessThan(-40)
        await page.keyboard.up('ArrowLeft')
      }
      await reset.focus()
      await page.keyboard.press('Enter')
      await expect.poll(() => resetPosition(page)).toEqual({ x: 0, y: 0 })
      await expect.poll(() => ballsHome(page)).toBe(true)
    })
  })
}

test('tech icons start beside Skills and outside its panel trigger', async ({ page }) => {
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__icons?.().length === 9)
  const skills = await page.evaluate(() => window.__layout.zones.find((zone) => zone.name === 'skills'))
  for (const icon of await page.evaluate(() => window.__icons())) {
    expect(Math.hypot(icon.startX - skills.x, icon.startY - skills.y)).toBeLessThan(700)
    expect(icon.startY - 50).toBeGreaterThan(skills.y + skills.h / 2)
  }
})
