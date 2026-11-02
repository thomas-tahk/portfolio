import { expect } from '@playwright/test'

export async function walkWithKeys(page, goal, until) {
  const arrived = await page.evaluate(({ goal, until }) => new Promise((resolve) => {
    const held = new Set()
    const hold = (code, active) => {
      if (active === held.has(code)) return
      if (active) held.add(code); else held.delete(code)
      document.dispatchEvent(new KeyboardEvent(active ? 'keydown' : 'keyup', { code, bubbles: true }))
    }
    const finish = (success) => {
      for (const code of held) hold(code, false)
      resolve(success)
    }
    const deadline = performance.now() + 12000
    const tick = () => {
      const { x, y } = window.__player.pos
      const targets = goal.ball ? window.__icons() : [goal]
      const close = targets.some((target) => Math.hypot(target.x - x, target.y - y) < (goal.within ?? 35))
      if (until ? document.querySelector(until) : close) return finish(true)
      if (performance.now() > deadline) return finish(false)
      hold('KeyA', x > goal.x + 10); hold('KeyD', x < goal.x - 10)
      hold('KeyW', y > goal.y + 10); hold('KeyS', y < goal.y - 10)
      requestAnimationFrame(tick)
    }
    tick()
  }), { goal, until })
  expect(arrived, 'walk reached destination').toBe(true)
}

async function fingerTarget(page, goal) {
  return page.evaluate(({ x, y }) => {
    const cam = window.__cam()
    const header = document.querySelector('.game-header').getBoundingClientRect()
    return { x: Math.max(16, Math.min(innerWidth - 16, innerWidth / 2 + (x - cam.x) * cam.zoom)),
      y: Math.max(header.bottom + 20, Math.min(innerHeight - 40, innerHeight / 2 + (y - cam.y) * cam.zoom)), id: 1 }
  }, goal)
}

function hasArrived({ goal, until }) {
  if (until) return !!document.querySelector(until)
  const player = window.__player.pos
  const targets = goal.ball ? window.__icons() : [goal]
  return targets.some((target) => Math.hypot(player.x - target.x, player.y - target.y) < (goal.within ?? 35))
}

export async function walkWithFinger(page, goal, until) {
  if (await page.evaluate(hasArrived, { goal, until })) return
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [await fingerTarget(page, goal)] })
  try {
    await expect.poll(async () => {
      const arrived = await page.evaluate(hasArrived, { goal, until })
      if (!arrived) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [await fingerTarget(page, goal)] })
      return arrived
    }, { timeout: 15000, intervals: [40, 60, 80] }).toBe(true)
  } finally {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await cdp.detach()
  }
}

export async function tapToKick(page) {
  const cdp = await page.context().newCDPSession(page)
  const point = [{ x: 200, y: 500, id: 1 }]
  await Promise.all([
    cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point }),
    cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }),
  ])
  await cdp.detach()
}
