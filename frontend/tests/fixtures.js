import { test as base, expect } from '@playwright/test'

// Default stub for the GitHub API so no test spends the real (60/hour)
// unauthenticated rate limit. Specs that care register their own routes
// afterwards; Playwright uses the most recently registered matching route.
const events = [1, 2, 3].map((i) => ({
  id: `fx${i}`,
  type: 'PullRequestEvent',
  created_at: new Date(Date.now() - i * 3_600_000).toISOString(),
  repo: { name: 'thomas-tahk/portfolio' },
  payload: { action: 'merged', number: i },
}))

export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.route('https://api.github.com/**', (route) => {
      const { pathname } = new URL(route.request().url())
      const number = Number(pathname.split('/').pop())
      const body = pathname.includes('/events/public')
        ? events
        : { title: `Fixture change ${number}`, html_url: 'https://github.com/thomas-tahk/portfolio' }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    })
    await provide(page)
  },
})

export { expect }
