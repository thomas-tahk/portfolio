import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { sitePath } from './standardChecks.js'

const content = JSON.parse(readFileSync(new URL('../src/content.json', import.meta.url)))

const SHOTS = '/private/tmp/claude-501/-Users-tnt-Projects/5d8dce11-24e7-471b-9a06-1e82b3c0f503/scratchpad'
for (const size of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`view switch works both ways at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size)
    await page.goto(sitePath('/'))
    if (size.width === 390) await page.screenshot({ path: `${SHOTS}/i56-home.png` })
    await page.getByRole('link', { name: 'Play the game version →' }).first().click()
    await expect(page).toHaveURL(/\/play\/$/)
    await expect(page.locator('canvas')).toBeVisible()
    if (size.width === 390) await page.screenshot({ path: `${SHOTS}/i56-play.png` })
    await page.getByRole('link', { name: '← Plain page' }).click()
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

  const game = page.getByRole('link', { name: /Play the game version/ }).first()
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
