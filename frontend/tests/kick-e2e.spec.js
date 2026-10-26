import { test, expect } from '@playwright/test'
import { sitePath } from './standardChecks.js'

// End to end, the way a player does it: real input for the last stretch of the walk, (optionally) visit Skills and close its
// popup, then kick with a real Space / a real touch tap. The test hooks READ state and never fire a kick. The one hook that
// writes is `teleport` (sets the player's position), used to skip long legs: see the comment above it.
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
  await page.waitForFunction(() => Math.hypot(window.__cam().x - window.__player.pos.x, window.__cam().y - window.__player.pos.y) < 5)
}

// Poll rather than sleep: a slow runner needs more wall-clock time for the icon to cover the same distance.
async function expectKicked(page, before, how) {
  await expect.poll(async () => {
    const after = await icon(page)
    return Math.hypot(after.x - before.x, after.y - before.y)
  }, { message: `icon moved after ${how}`, timeout: 10_000 }).toBeGreaterThan(20)
}

// Long walks are slow and fragile on a slow runner (CI renders ~7 fps): remote-driving the player over CDP means hundreds of
// round trips in a loop, and the 30s test timeout kills the page mid-loop ("cdpSession.send: Target ... has been closed").
// So tests teleport to just short of each leg and use real input only for the last few hundred units. (Kaplay also clamps dt
// at 0.25s, which slows the world below ~4 fps, but that is not what failed.) Full-length real walks are no longer covered.
// It also waits for the camera to catch up: a finger aims relative to the screen centre, which is the camera, not the player.
async function teleport(page, { x, y }) {
  await page.evaluate(([px, py]) => { window.__player.pos.x = px; window.__player.pos.y = py }, [x, y])
  await page.waitForFunction(([px, py]) => Math.hypot(window.__cam().x - px, window.__cam().y - py) < 5, [x, y])
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
}

// Final approach: walk at the icon from up-and-right until it is inside kick reach (centre distance 70..125).
const approachIcon = async (page) => steer(page, { x: ICON.x, y: ICON.y }, { ring: { ...ICON, within: 125 } })

// Phone: hold a real finger to the right of the player until it has visibly walked right, then lift it. A remote-controlled walk
// cannot be steered to a spot: at ~700 units/s a CDP round trip on a slow runner is hundreds of units of overshoot (into the
// Skills zone, whose popup then freezes input). So the finger proves walking works, and the caller teleports to the exact spot.
async function fingerWalkRight(page, cdp) {
  const start = await playerPos(page)
  const point = [{ x: 375 / 2 + 120, y: 812 / 2, id: 1 }]
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point })
    await expect.poll(async () => (await playerPos(page)).x - start.x, { message: 'finger walk moved the player right' }).toBeGreaterThan(50)
  } finally {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
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
  await teleport(page, { x: APPROACH_START.x + 50, y: APPROACH_START.y - 50 })
  await approachIcon(page)
  const before = await icon(page) // after the approach: walking up can nudge the icon, which must not count as the kick
  await page.keyboard.press('Space')
  await expectKicked(page, before, 'real Space')
})

test('/play/ visit Skills, click Close, walk to the icons, press Space: the icon is kicked', async ({ page }) => {
  await openGame(page)
  await teleport(page, { x: -900, y: 0 })
  await steer(page, { x: -900, y: 400 }, { until: '.skills-modal' }) // walk into the Skills zone; the popup opens on contact
  await closeButton(page).click()
  await steer(page, { x: -650, y: 175 }) // a short real walk out of the zone to the right: input works again after Close
  await teleport(page, { x: APPROACH_START.x + 50, y: APPROACH_START.y - 50 })
  await approachIcon(page)
  const before = await icon(page)
  await page.keyboard.press('Space')
  await expectKicked(page, before, 'Close + real Space')
})

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

  test('/play/ a tap after a long finger hold still kicks the icon', async ({ page }) => {
    await openGame(page)
    const cdp = await page.context().newCDPSession(page)
    await teleport(page, { x: BESIDE_ICON.x, y: BESIDE_ICON.y })
    await fingerWalkRight(page, cdp)
    await teleport(page, BESIDE_ICON)
    const before = await icon(page)
    await fingerTap(cdp)
    await expectKicked(page, before, 'real tap')
  })
})
