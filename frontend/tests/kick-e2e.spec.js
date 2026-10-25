import { test, expect } from '@playwright/test'
import { sitePath } from './standardChecks.js'

// End to end, the way a player does it: walk with real input, (optionally) visit Skills and close its popup, then kick with
// a real Space / a real touch tap. The test hooks are only used to READ state; they never move the player or fire a kick.
const KICKED = 2 // top-right icon of the 3x3 cluster
const icon = (page) => page.evaluate((i) => window.__icons()[i], KICKED)
const playerPos = (page) => page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))
// Stand up-and-right of the icon (inside kick reach, outside the Skills popup zone): the kick then flies down-left,
// between its neighbours instead of into them.
// (The player's hitbox is 40x80 and the icon 100x100, so 85 apart on each axis is clear of touching and ~50 from the icon's edge.)
const BESIDE_ICON = { x: -750 + 72, y: 500 - 72 }
const closeButton = (page) => page.getByRole('button', { name: 'Close' })

async function openGame(page) {
  await page.goto(sitePath('/play/') + '?test')
  await page.waitForFunction(() => window.__icons && window.__icons().length === 9 && window.__player)
  await page.waitForTimeout(500)
}

async function expectKicked(page, before, how) {
  await page.waitForTimeout(300)
  const after = await icon(page)
  expect(Math.hypot(after.x - before.x, after.y - before.y), `icon moved after ${how}`).toBeGreaterThan(20)
}

// Walk one axis to `goal`: the key goes down for real, and is released on the exact frame the player crosses the goal.
// (Timing the release from the test process is hopeless on a slow CI machine: a slow frame is 100ms+ = 70+ px.)
// The release is a synthetic keyup, because Player.js tracks held keys from document keyup events.
async function keyWalkAxis(page, axis, goal) {
  const keys = axis === 'x' ? ['KeyA', 'KeyD'] : ['KeyW', 'KeyS']
  for (let i = 0; i < 8; i++) {
    const err = goal - (await playerPos(page))[axis]
    if (Math.abs(err) < 20) return
    const code = keys[err > 0 ? 1 : 0]
    await page.keyboard.down(code)
    await page.evaluate(({ axis, goal, code, up }) => new Promise((done) => {
      const tick = () => {
        const v = window.__player.pos[axis]
        if (up ? v >= goal : v <= goal) { document.dispatchEvent(new KeyboardEvent('keyup', { code })); done() } else requestAnimationFrame(tick)
      }
      tick()
    }), { axis, goal, code, up: err > 0 })
    await page.keyboard.up(code)
    await page.waitForTimeout(100)
  }
  throw new Error(`could not walk ${axis} to ${goal}`)
}

async function keyWalkTo(page, ...waypoints) {
  for (const w of waypoints) {
    if (w.x !== undefined) await keyWalkAxis(page, 'x', w.x)
    if (w.y !== undefined) await keyWalkAxis(page, 'y', w.y)
  }
  await page.waitForTimeout(300) // let the camera and icons settle
}

async function walkToSkillsPopupWithKeys(page) {
  await keyWalkTo(page, { x: -900 })
  await page.keyboard.down('KeyS') // walk into the Skills zone; the popup opens on contact
  await closeButton(page).waitFor()
  await page.keyboard.up('KeyS')
}

// Phone: hold a real finger down toward the goal, re-aimed each step, until the player arrives (or `stop()` is true).
async function fingerWalkTo(page, cdp, goal, stop = async () => false) {
  const centre = { x: 375 / 2, y: 812 / 2 }
  for (let i = 0; i < 300; i++) {
    const p = await playerPos(page)
    const dist = Math.hypot(goal.x - p.x, goal.y - p.y)
    if (dist < 25 || await stop()) break
    const point = [{ x: centre.x + ((goal.x - p.x) / dist) * 120, y: centre.y + ((goal.y - p.y) / dist) * 120, id: 1 }]
    await cdp.send('Input.dispatchTouchEvent', { type: i === 0 ? 'touchStart' : 'touchMove', touchPoints: point })
    await page.waitForTimeout(40)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(500) // a touchend after a long hold is not a tap; let it settle
}

// A short tap: both events sent without awaiting in between (each CDP round trip costs ~100ms, which would make it a hold).
async function fingerTap(cdp) {
  const point = [{ x: 375 / 2 + 100, y: 812 / 2 + 150, id: 1 }]
  await Promise.all([
    cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point }),
    cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }),
  ])
}

test('/play/ walk to the icons with the keyboard, press Space: the icon is kicked', async ({ page }) => {
  await openGame(page)
  const before = await icon(page)
  await keyWalkTo(page, { y: BESIDE_ICON.y }, { x: BESIDE_ICON.x })
  await page.keyboard.press('Space')
  await expectKicked(page, before, 'real Space')
})

test('/play/ visit Skills, click Close, walk to the icons, press Space: the icon is kicked', async ({ page }) => {
  await openGame(page)
  await walkToSkillsPopupWithKeys(page)
  await closeButton(page).click()
  await keyWalkTo(page, { x: BESIDE_ICON.x }, { y: BESIDE_ICON.y })
  const before = await icon(page)
  await page.keyboard.press('Space')
  await expectKicked(page, before, 'Close + real Space')
})

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

  test('/play/ walk to the icons with a finger, tap the canvas: the icon is kicked', async ({ page }) => {
    await openGame(page)
    const before = await icon(page)
    const cdp = await page.context().newCDPSession(page)
    await fingerWalkTo(page, cdp, BESIDE_ICON)
    await fingerTap(cdp)
    await expectKicked(page, before, 'real tap')
  })
})
