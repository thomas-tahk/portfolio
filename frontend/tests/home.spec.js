import { test, expect } from './fixtures.js'
import { readFileSync } from 'node:fs'
import { sitePath } from './standardChecks.js'

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
  const SHOTS = process.env.SHOT_DIR

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
