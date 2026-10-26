import { test, expect } from './fixtures.js'
import { readFileSync } from 'node:fs'
import { sitePath } from './standardChecks.js'
import AxeBuilder from '@axe-core/playwright'
import jsQR from 'jsqr'

const content = JSON.parse(readFileSync(new URL('../src/content.json', import.meta.url)))

const SHOTS = process.env.SHOT_DIR // optional: save screenshots for review
for (const size of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`view switch works both ways at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size)
    await page.goto(sitePath('/'))
    if (SHOTS && size.width === 390) await page.screenshot({ path: `${SHOTS}/i56-home.png` })
    const top = page.locator('.view-switch').getByRole('link', { name: 'Game version →' })
    await expect(top).toBeInViewport()
    await top.click()
    await expect(page).toHaveURL(/\/play\/$/)
    await expect(page.locator('canvas')).toBeVisible()
    if (SHOTS && size.width === 390) await page.screenshot({ path: `${SHOTS}/i56-play.png` })
    await page.getByRole('link', { name: '← Plain version' }).click()
    await expect(page).toHaveURL(sitePath('/'))
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
}

test('front page lists visible projects, no hidden ones, and links to the game', async ({ page }) => {
  await page.goto(sitePath('/'))
  const main = page.locator('main')

  await expect(page.getByRole('heading', { level: 1, name: content.about.name })).toBeVisible()
  await expect(main).toContainText(content.headline)
  await expect(main).toContainText(content.about.text)

  for (const p of content.projects.filter((p) => !p.hidden)) {
    await expect(main.getByRole('heading', { name: p.name, exact: true })).toBeVisible()
  }
  for (const p of content.projects.filter((p) => p.hidden)) {
    await expect(main).not.toContainText(p.name)
    await expect(main).not.toContainText(p.oneLiner)
  }

  for (const e of content.experience) await expect(main).toContainText(e.company)

  const game = page.locator('.game-link').getByRole('link', { name: /Game version/ })
  await expect(game).toHaveAttribute('href', sitePath('/play/'))
  await game.click()
  await expect(page).toHaveURL(new RegExp(sitePath('/play/') + '$'))
})

test('projects with an image show it, and it loads', async ({ page }) => {
  await page.goto(sitePath('/'))
  const withImage = content.projects.filter((p) => !p.hidden && p.image)
  expect(withImage.length).toBeGreaterThan(0)
  for (const p of withImage) {
    const img = page.getByRole('img', { name: new RegExp(p.name) })
    await img.scrollIntoViewIfNeeded()
    await expect(img).toBeVisible()
    expect(await img.evaluate((el) => el.complete && el.naturalWidth > 0), `${p.slug} image loaded`).toBe(true)
  }
})

test('copy email button copies the address', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(sitePath('/'))
  await page.getByRole('button', { name: 'Copy email' }).click()
  await expect(page.getByRole('status')).toContainText('copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(content.contact.email)
})

test.describe('theme toggle', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })
  const bg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  test('toggles, persists across reload, axe clean in both themes', async ({ page }) => {
    const AxeBuilder = (await import('@axe-core/playwright')).default
    await page.goto(sitePath('/'))
    expect(await bg(page)).toBe('rgb(255, 255, 255)')
    const axe = async () => {
      const { violations } = await new AxeBuilder({ page }).analyze()
      return violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => v.id)
    }
    expect(await axe()).toEqual([])
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/i57-light.png` })

    await page.getByRole('button', { name: 'Settings' }).click()
    const toggle = page.getByRole('button', { name: 'Dark mode' })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(await bg(page)).toBe('rgb(10, 14, 26)')
    expect(await axe()).toEqual([])
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/i57-dark.png` })

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await bg(page)).toBe('rgb(10, 14, 26)')

    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Dark mode' }).click()
    expect(await bg(page)).toBe('rgb(255, 255, 255)')
  })

  test('stored theme applies before app JS runs (no flash)', async ({ page }) => {
    await page.route('**/assets/main-*.js', (route) => route.abort())
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
    await page.goto(sitePath('/'))
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('#home')).toBeEmpty()
    expect(await bg(page)).toBe('rgb(10, 14, 26)')
  })

  test('default follows system dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto(sitePath('/'))
    expect(await bg(page)).toBe('rgb(10, 14, 26)')
  })
})

test.describe('settings panel', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })
  const ORDER = ['Royal', 'Ember', 'Forest', 'Grape', 'Cherry']
  const gear = (page) => page.getByRole('button', { name: 'Settings' })
  const open = async (page) => {
    await gear(page).click()
    await expect(page.getByRole('button', { name: 'Next palette' })).toBeVisible()
  }
  const palette = (page) => page.locator('html').getAttribute('data-palette')
  const checked = (page) => page.getByRole('radio', { checked: true })

  test('no palette attribute or panel on first visit; default is Royal', async ({ page }) => {
    await page.goto(sitePath('/'))
    await expect(gear(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('button', { name: 'Next palette' })).toBeHidden()
    expect(await palette(page)).toBeNull()
    await open(page)
    await expect(checked(page)).toHaveAccessibleName('Royal')
  })

  for (const size of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    test(`panel is axe clean in light and dark at ${size.width}px`, async ({ page }) => {
      const AxeBuilder = (await import('@axe-core/playwright')).default
      await page.setViewportSize(size)
      await page.goto(sitePath('/'))
      await open(page)
      for (const theme of ['light', 'dark']) {
        const toggle = page.getByRole('button', { name: 'Dark mode' })
        if ((await toggle.getAttribute('aria-pressed')) !== String(theme === 'dark')) await toggle.click()
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        const { violations } = await new AxeBuilder({ page }).analyze()
        const bad = violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => v.id)
        expect(bad, theme).toEqual([])
        if (SHOTS) await page.screenshot({ path: `${SHOTS}/panel-${size.width}-${theme}.png` })
      }
    })
  }

  test('each palette x light/dark is axe clean with the panel open', async ({ page }) => {
    const AxeBuilder = (await import('@axe-core/playwright')).default
    await page.goto(sitePath('/'))
    await open(page)
    for (const name of ORDER) {
      await page.getByRole('radio', { name }).check()
      for (const theme of ['light', 'dark']) {
        const toggle = page.getByRole('button', { name: 'Dark mode' })
        if ((await toggle.getAttribute('aria-pressed')) !== String(theme === 'dark')) await toggle.click()
        const { violations } = await new AxeBuilder({ page }).analyze()
        const bad = violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => v.id)
        expect(bad, `${name} ${theme}`).toEqual([])
      }
    }
  })

  test('Next palette cycles Royal > Ember > Forest > Grape > Cherry > Royal', async ({ page }) => {
    await page.goto(sitePath('/'))
    await open(page)
    for (const name of [...ORDER.slice(1), 'Royal']) {
      await page.getByRole('button', { name: 'Next palette' }).click()
      await expect(checked(page)).toHaveAccessibleName(name)
      if (name === 'Royal') expect(await palette(page)).toBeNull()
      else expect(await palette(page)).toBe(name.toLowerCase())
    }
  })

  test('every option survives a reload (inline script list matches the panel)', async ({ page }) => {
    await page.goto(sitePath('/'))
    await open(page)
    for (const name of ORDER) {
      await page.getByRole('radio', { name }).check()
      await page.reload()
      await open(page)
      await expect(checked(page)).toHaveAccessibleName(name)
      if (name === 'Royal') expect(await palette(page)).toBeNull()
      else expect(await palette(page)).toBe(name.toLowerCase())
    }
  })

  test('theme, palette and auto-rotate persist; ?palette= is ignored', async ({ page }) => {
    await page.goto(sitePath('/') + '?palette=cherry')
    expect(await palette(page)).toBeNull()
    await open(page)
    await page.getByRole('radio', { name: 'Grape' }).check()
    await page.getByRole('button', { name: 'Dark mode' }).click()
    await page.getByRole('button', { name: 'Auto-rotate' }).click()
    await page.goto(sitePath('/'))
    await open(page)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(checked(page)).toHaveAccessibleName('Grape')
    await expect(page.getByRole('button', { name: 'Auto-rotate' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('auto-rotate steps every ~8s, stops when off, pauses while hidden', async ({ page }) => {
    await page.clock.install()
    await page.goto(sitePath('/'))
    await open(page)
    const rotate = page.getByRole('button', { name: 'Auto-rotate' })
    await expect(rotate).toHaveAttribute('aria-pressed', 'false')
    await page.clock.runFor(20_000)
    expect(await palette(page)).toBeNull()

    await rotate.click()
    await page.clock.runFor(8_100)
    expect(await palette(page)).toBe('ember')
    await page.clock.runFor(8_000)
    expect(await palette(page)).toBe('forest')

    await page.evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }))
    await page.clock.runFor(24_000)
    expect(await palette(page)).toBe('forest')
    await page.evaluate(() => delete document.hidden)
    await page.clock.runFor(8_100)
    expect(await palette(page)).toBe('grape')

    await rotate.click()
    await page.clock.runFor(24_000)
    expect(await palette(page)).toBe('grape')
  })

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' })
    test('auto-rotate is disabled with a reason and never steps', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('autorotate', '1'))
      await page.clock.install()
      await page.goto(sitePath('/'))
      await open(page)
      const rotate = page.getByRole('button', { name: 'Auto-rotate' })
      await expect(rotate).toBeDisabled()
      await expect(rotate).toHaveAttribute('aria-pressed', 'false')
      await expect(rotate).toHaveAccessibleDescription(/reduced motion/)
      await page.clock.runFor(30_000)
      expect(await palette(page)).toBeNull()
    })
  })

  test('Esc closes and returns focus to the gear; focus moves in on open', async ({ page }) => {
    await page.goto(sitePath('/'))
    await gear(page).focus()
    await page.keyboard.press('Enter')
    await expect(gear(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('button', { name: 'Dark mode' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(gear(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(gear(page)).toBeFocused()
  })

  test('tapping outside closes the panel', async ({ page }) => {
    await page.goto(sitePath('/'))
    await open(page)
    await page.mouse.click(5, 800)
    await expect(gear(page)).toHaveAttribute('aria-expanded', 'false')
  })

  test('Tab out of the panel closes it; tap outside returns focus to the gear', async ({ page }) => {
    await page.goto(sitePath('/'))
    await open(page)
    await page.getByRole('button', { name: 'Auto-rotate' }).focus()
    await page.keyboard.press('Tab')
    await expect(gear(page)).toHaveAttribute('aria-expanded', 'false')
    await open(page)
    await page.mouse.click(5, 800)
    await expect(gear(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(gear(page)).toBeFocused()
  })

  test('stored palette applies before app JS runs (no flash)', async ({ page }) => {
    await page.route('**/assets/main-*.js', (route) => route.abort())
    await page.addInitScript(() => localStorage.setItem('palette', 'ember'))
    await page.goto(sitePath('/'))
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'ember')
    await expect(page.locator('#home')).toBeEmpty()
  })

  test('top bar controls are 44px+ and nothing scrolls sideways at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(sitePath('/'))
    await open(page)
    const h = await page.locator('.view-switch > button, .view-switch > a').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))
    expect(Math.min(...h)).toBeGreaterThanOrEqual(44)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const g = await gear(page).boundingBox()
    const link = await page.locator('.view-switch').getByRole('link', { name: 'Game version →' }).boundingBox()
    expect(link.x - (g.x + g.width)).toBeLessThan(16)
    const box = await page.locator('#settings-panel').boundingBox()
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(320)
  })

  test('h1 does not break mid-word at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(sitePath('/'))
    const h1 = page.getByRole('heading', { level: 1 })
    // every word must sit on exactly one line (a mid-word break gives it two rects)
    const wordLines = await h1.evaluate((el) => {
      const text = el.firstChild
      const out = []
      for (const m of text.data.matchAll(/\S+/g)) {
        const r = document.createRange()
        r.setStart(text, m.index)
        r.setEnd(text, m.index + m[0].length)
        out.push(new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size)
      }
      return out
    })
    expect(wordLines).toEqual([1, 1])
    expect(await h1.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    expect(await h1.innerText()).toBe('Thomas Tahk')
  })
})

test.describe('QR code dialog', () => {
  test.use({ viewport: { width: 390, height: 844 } })
  const gear = (page) => page.getByRole('button', { name: 'Settings' })
  const show = (page) => page.getByRole('button', { name: 'Show QR code' })
  const openQr = async (page) => {
    await gear(page).click()
    await show(page).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  }
  const pixels = (page) =>
    page.evaluate(async () => {
      const img = document.querySelector('.qr-image')
      await img.decode()
      const c = document.createElement('canvas')
      c.width = c.height = 600
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0, 600, 600)
      return [...ctx.getImageData(0, 0, 600, 600).data]
    })

  for (const scheme of ['light', 'dark']) {
    test(`shows a scannable QR for this page and passes axe (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto(sitePath('/#section'))
      await openQr(page)
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByRole('img')).toBeVisible()
      const url = page.url().split('#')[0]
      await expect(dialog.locator('.qr-url')).toHaveText(url)

      const box = await dialog.getByRole('img').boundingBox()
      expect(box.width).toBeGreaterThanOrEqual(240)
      const code = jsQR(Uint8ClampedArray.from(await pixels(page)), 600, 600)
      expect(code?.data).toBe(url)

      const { violations } = await new AxeBuilder({ page }).analyze()
      expect(violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => v.id)).toEqual([])

      const dir = process.env.SHOT_DIR
      if (dir && scheme === 'light') await page.screenshot({ path: `${dir}/qr-390-light.png` })
      if (dir && scheme === 'dark') {
        await page.setViewportSize({ width: 1280, height: 800 })
        await page.screenshot({ path: `${dir}/qr-1280-dark.png` })
      }
    })
  }

  test('qrcode loads only on tap, and a failed load still shows the URL', async ({ page }) => {
    const loaded = []
    page.on('request', (r) => /assets\/browser-.*\.js/.test(r.url()) && loaded.push(r.url()))
    await page.route('**/assets/browser-*.js', (route) => route.abort())
    await page.goto(sitePath('/'))
    expect(loaded).toEqual([])
    await openQr(page)
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('alert')).toContainText('Could not make the QR code')
    await expect(dialog.locator('.qr-url')).toHaveText(page.url())
    await expect(dialog.getByRole('img')).toHaveCount(0)
  })

  test('Esc and the close button dismiss it and focus returns to the opener', async ({ page }) => {
    await page.goto(sitePath('/'))
    await openQr(page)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(show(page)).toBeFocused()

    await show(page).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(show(page)).toBeFocused()
  })
})
