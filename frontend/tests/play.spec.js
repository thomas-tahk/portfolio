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

// Real touch input via CDP (what a phone sends). Test hooks are only used to read the player position.
test.describe('phone touch', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

  async function holdTouchAt(page, x, y, ms) {
    const cdp = await page.context().newCDPSession(page)
    const point = [{ x, y, id: 1 }]
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point })
    await page.waitForTimeout(ms)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }

  const playerPos = (page) => page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))

  test('/play/ touch-hold to the right of the player moves it right', async ({ page }) => {
    await page.goto(sitePath('/play/') + '?test')
    await page.waitForFunction(() => window.__player)
    const start = await playerPos(page)

    // camera is centred on the player, so the viewport centre is the player
    await holdTouchAt(page, 375 / 2 + 120, 812 / 2, 500)

    const end = await playerPos(page)
    expect(end.x, 'player x after touch-hold right').toBeGreaterThan(start.x)
  })

  test('/play/ touch-holding toward the About zone opens the About modal', async ({ page }) => {
    await page.goto(sitePath('/play/') + '?test')
    await page.waitForFunction(() => window.__player)

    // About zone spans 0.05h-0.25h above the spawn point (initGame.js). The player moves 700
    // units/s and walks straight through the zone (closing the modal), so release the touch
    // the moment the modal appears rather than timing a fixed hold.
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 375 / 2, y: 812 / 2 - 200, id: 1 }] })
    // waitForSelector is the assertion: it throws if the modal never opens
    await page.waitForSelector('.about-modal', { timeout: 3000 })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  })
})

// Phone modal behaviour: the player crosses a zone in ~0.3s, so a modal that closes on exit flashes and vanishes.
test.describe('phone modals stay open', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

  async function holdTouchAt(page, x, y, ms) {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] })
    await page.waitForTimeout(ms)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }

  test('/play/ About modal is still open after holding through the zone for 1.5s', async ({ page }) => {
    await page.goto(sitePath('/play/') + '?test')
    await page.waitForFunction(() => window.__player)

    await holdTouchAt(page, 375 / 2, 812 / 2 - 200, 1500)

    await expect(page.locator('.about-modal')).toBeVisible()
  })

  test('/play/ modal closes with its Close button, and input is frozen while it is open', async ({ page }) => {
    await page.goto(sitePath('/play/') + '?test')
    await page.waitForFunction(() => window.__player)
    await holdTouchAt(page, 375 / 2, 812 / 2 - 200, 1500)
    await expect(page.locator('.about-modal')).toBeVisible()

    const before = await page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))
    await page.keyboard.down('ArrowRight')
    await page.waitForTimeout(400)
    await page.keyboard.up('ArrowRight')
    const after = await page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))
    expect(after, 'player position while modal open').toEqual(before)

    await page.locator('.about-modal .modal-btn', { hasText: 'Close' }).tap()
    await expect(page.locator('.about-modal')).toHaveCount(0)
  })

  test('/play/ Escape and tapping outside dismiss a modal', async ({ page }) => {
    await page.goto(sitePath('/play/') + '?test')
    await page.waitForFunction(() => window.__openModal)

    await page.evaluate(() => window.__openModal('experience'))
    await expect(page.locator('.experience-modal')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.experience-modal')).toHaveCount(0)

    await page.evaluate(() => window.__openModal('experience'))
    await page.locator('.experience-modal').tap({ position: { x: 5, y: 5 } })
    await expect(page.locator('.experience-modal')).toHaveCount(0)
  })
})

test('/play/ test hooks only exist with ?test', async ({ page }) => {
  await page.goto(sitePath('/play/'))
  await page.waitForLoadState('networkidle')
  expect(await page.evaluate(() => typeof window.__openModal)).toBe('undefined')
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__player)
  expect(await page.evaluate(() => typeof window.__openModal)).toBe('function')
})
