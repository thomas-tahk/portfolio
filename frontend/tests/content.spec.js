import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { sitePath } from './standardChecks.js'

const content = JSON.parse(readFileSync(new URL('../src/content.json', import.meta.url)))

const isText = (v) => typeof v === 'string' && v.trim() !== ''

test('content.json has every required field', () => {
  expect(isText(content.headline), 'headline').toBe(true)
  for (const key of ['name', 'text', 'photo']) expect(isText(content.about?.[key]), `about.${key}`).toBe(true)
  for (const key of ['email', 'github', 'linkedin']) expect(isText(content.contact?.[key]), `contact.${key}`).toBe(true)

  expect(content.skills?.length, 'skills').toBeGreaterThan(0)
  for (const c of content.skills) {
    expect(isText(c.name), 'skill category name').toBe(true)
    expect(c.skills?.length, `skills in ${c.name}`).toBeGreaterThan(0)
  }
  expect(content.experience?.length, 'experience').toBeGreaterThan(0)
  for (const e of content.experience) {
    for (const k of ['company', 'position', 'duration', 'description']) expect(isText(e[k]), `experience.${k}`).toBe(true)
  }

  expect(isText(content.feedRepos?.owner), 'feedRepos.owner').toBe(true)
  expect(content.feedRepos?.repos?.length, 'feedRepos.repos').toBeGreaterThan(0)

  expect(content.projects?.length, 'projects').toBeGreaterThan(0)
  const slugs = new Set()
  for (const p of content.projects) {
    for (const k of ['slug', 'name', 'oneLiner', 'description']) expect(isText(p[k]), `${p.slug}.${k}`).toBe(true)
    expect(['featured', 'more'], `${p.slug}.tier`).toContain(p.tier)
    expect(typeof p.hidden, `${p.slug}.hidden`).toBe('boolean')
    expect(Array.isArray(p.links), `${p.slug}.links`).toBe(true)
    for (const l of p.links) expect(isText(l.label) && /^https?:\/\//.test(l.url), `${p.slug} link`).toBe(true)
    if ('image' in p) expect(isText(p.image), `${p.slug}.image`).toBe(true)
    expect(slugs.has(p.slug), `duplicate slug ${p.slug}`).toBe(false)
    slugs.add(p.slug)
  }
})

test('game modals show content.json text and no hidden project', async ({ page }) => {
  await page.goto(sitePath('/play/'))
  await page.waitForFunction(() => typeof window.__openModal === 'function')

  await page.evaluate(() => window.__openModal('projects'))
  const projects = page.locator('.projects-modal')
  for (const p of content.projects.filter((p) => !p.hidden)) {
    await expect(projects.getByRole('heading', { name: p.name, exact: true })).toBeVisible()
    await expect(projects).toContainText(p.description)
  }
  for (const p of content.projects.filter((p) => p.hidden)) {
    await expect(projects).not.toContainText(p.name)
    await expect(projects).not.toContainText(p.description)
  }
  await page.evaluate(() => window.__openModal('projects', false))

  await page.evaluate(() => window.__openModal('about'))
  await expect(page.locator('.about-modal')).toContainText(content.about.text)
  await page.evaluate(() => window.__openModal('about', false))

  await page.evaluate(() => window.__openModal('experience'))
  const experience = page.locator('.modal').filter({ hasText: content.experience[0].company })
  for (const e of content.experience) await expect(experience).toContainText(e.description)
})
