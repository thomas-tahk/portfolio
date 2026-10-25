import { test, expect } from '@playwright/test'
import { sitePath } from './standardChecks.js'

// End to end, the way a player does it: walk with real input, (optionally) visit Skills and close its popup, then kick with
// a real Space / a real touch tap. The test hooks are only used to READ state; they never move the player or fire a kick.
const KICKED = 2 // top-right icon of the 3x3 cluster
const icon = (page) => page.evaluate((i) => window.__icons()[i], KICKED)
const playerPos = (page) => page.evaluate(() => ({ x: window.__player.pos.x, y: window.__player.pos.y }))
const ICON = { x: -750, y: 500 } // start position of that icon
// Come at it from up-and-right (outside the Skills popup zone): the kick then flies down-left, between its neighbours.
const BESIDE_ICON = { x: ICON.x + 70, y: ICON.y - 70 } // phone: finger target
const APPROACH_START = { x: ICON.x + 200, y: ICON.y - 200 }
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

// Walk the player (8-way, like WASD) toward `goal`, steering every frame inside the page, and stop at the first frame it is within
// `within` of the goal (or `ring.within` of the ring centre, or once the `until` selector exists). A test process cannot do this:
// CI renders ~7 fps, so one frame is ~100 world units and timing key releases from outside overshoots at random.
// The keys are dispatched as document keydown/keyup events, which is exactly what Player.js listens to.
async function steer(page, goal, { within = 120, ring, until } = {}) {
  const arrived = await page.evaluate(({ goal, within, ring, until }) => new Promise((done) => {
    const held = new Set()
    const hold = (code, on) => {
      if (on === held.has(code)) return
      if (on) held.add(code); else held.delete(code)
      document.dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { code, bubbles: true }))
    }
    const finish = (ok) => { ['KeyA', 'KeyD', 'KeyW', 'KeyS'].forEach((c) => hold(c, false)); done(ok) }
    const t0 = performance.now()
    const tick = () => {
      const p = window.__player.pos
      const dx = goal.x - p.x, dy = goal.y - p.y
      const close = ring ? Math.hypot(p.x - ring.x, p.y - ring.y) <= ring.within : Math.hypot(dx, dy) <= within
      if (close || (until && document.querySelector(until))) return finish(true)
      if (performance.now() - t0 > 15000) return finish(false)
      hold('KeyA', dx < -8); hold('KeyD', dx > 8); hold('KeyW', dy < -8); hold('KeyS', dy > 8)
      requestAnimationFrame(tick)
    }
    tick()
  }), { goal, within, ring, until })
  expect(arrived, `player reached ${JSON.stringify(goal)}`).toBe(true)
  await page.waitForTimeout(300) // let the camera and icons settle
}

// Final approach: walk at the icon from up-and-right until it is inside kick reach (centre distance 70..125).
const approachIcon = async (page) => steer(page, { x: ICON.x, y: ICON.y }, { ring: { ...ICON, within: 125 } })

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
  await steer(page, { x: 0, y: APPROACH_START.y })
  await steer(page, APPROACH_START)
  await approachIcon(page)
  await page.keyboard.press('Space')
  await expectKicked(page, before, 'real Space')
})

test('/play/ visit Skills, click Close, walk to the icons, press Space: the icon is kicked', async ({ page }) => {
  await openGame(page)
  await steer(page, { x: -900, y: 0 })
  await steer(page, { x: -900, y: 400 }, { until: '.skills-modal' }) // walk into the Skills zone; the popup opens on contact
  await closeButton(page).click()
  await steer(page, { x: APPROACH_START.x, y: 160 }) // out of the zone to the right
  await steer(page, APPROACH_START)
  await approachIcon(page)
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
