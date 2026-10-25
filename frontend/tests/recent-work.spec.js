import { test, expect } from './fixtures.js'
import { sitePath, standardChecks } from './standardChecks.js'

const EVENTS_URL = '**/api.github.com/users/thomas-tahk/events/public*'
const PULL_URL = '**/api.github.com/repos/thomas-tahk/*/pulls/*'
const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000).toISOString()

function mergedEvent(i, repo = 'knowflow') {
  return {
    id: String(i),
    type: 'PullRequestEvent',
    created_at: hoursAgo(i),
    repo: { name: `thomas-tahk/${repo}` },
    payload: { action: 'merged', number: i, pull_request: { number: i } },
  }
}

const json = (route, body, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

async function mockFeed(page, events) {
  await page.route(EVENTS_URL, (route) => json(route, events))
  await page.route(PULL_URL, (route) => {
    const number = Number(new URL(route.request().url()).pathname.split('/').pop())
    return json(route, { title: `Merged change ${number}`, html_url: 'https://github.com/thomas-tahk/portfolio/pull/52' })
  })
}

const section = (page) => page.getByRole('heading', { name: 'Recent work' })

test('recent work shows the newest 5 merged PRs with titles, skipping other events and repos', async ({ page }) => {
  const events = [
    { id: 'x', type: 'PushEvent', created_at: hoursAgo(0), repo: { name: 'thomas-tahk/knowflow' }, payload: {} },
    mergedEvent(50, 'not-in-feed'),
    ...[1, 2, 3, 4, 5, 6, 7].map((i) => mergedEvent(i, i === 2 ? 'Dormant' : 'knowflow')),
  ]
  await mockFeed(page, events)
  await page.goto(sitePath('/'))

  await expect(section(page)).toBeVisible()
  const items = page.locator('section[aria-labelledby="recent-h"] li')
  await expect(items).toHaveCount(5)
  for (const n of [1, 2, 3, 4, 5]) await expect(page.getByRole('link', { name: `Merged change ${n}` })).toBeVisible()
  await expect(page.getByText('Merged change 6')).toHaveCount(0)
  await expect(page.getByText('Merged change 50')).toHaveCount(0)
  await expect(items.nth(0)).toContainText('knowflow')
  await expect(items.nth(0)).toContainText('1 hour ago')
  await expect(items.nth(1)).toContainText('Dormant')
})

test('recent work passes the standard checks with a feed showing', async ({ page }) => {
  await mockFeed(page, [mergedEvent(1), mergedEvent(2)])
  await standardChecks(page, '/')
  await expect(section(page)).toBeVisible()
})

test('recent work is absent when there are no matching items', async ({ page }) => {
  await mockFeed(page, [mergedEvent(1, 'not-in-feed')])
  await page.goto(sitePath('/'))
  await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible()
  await expect(section(page)).toHaveCount(0)
})

test('recent work is absent on a 403 rate limit', async ({ page }) => {
  await page.route(EVENTS_URL, (route) => json(route, { message: 'rate limit exceeded' }, 403))
  await page.goto(sitePath('/'))
  await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible()
  await expect(section(page)).toHaveCount(0)
  await expect(page.getByText(/rate limit|error/i)).toHaveCount(0)
})

test('recent work is absent when a pull request lookup fails', async ({ page }) => {
  await page.route(EVENTS_URL, (route) => json(route, [mergedEvent(1)]))
  await page.route(PULL_URL, (route) => json(route, {}, 403))
  await page.goto(sitePath('/'))
  await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible()
  await expect(section(page)).toHaveCount(0)
})

test('recent work is absent on a network error', async ({ page }) => {
  await page.route(EVENTS_URL, (route) => route.abort())
  await page.goto(sitePath('/'))
  await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible()
  await expect(section(page)).toHaveCount(0)
})

test('recent work is cached in sessionStorage so a reload makes no new requests', async ({ page }) => {
  await mockFeed(page, [mergedEvent(1)])
  await page.goto(sitePath('/'))
  await expect(section(page)).toBeVisible()

  let requests = 0
  await page.route('**/api.github.com/**', (route) => {
    requests++
    return route.abort()
  })
  await page.reload()
  await expect(section(page)).toBeVisible()
  expect(requests).toBe(0)
})

function pagedFeed(pages) {
  const requests = []
  const handler = (route) => {
    const page = Number(new URL(route.request().url()).searchParams.get('page') ?? 1)
    requests.push(page)
    const body = pages[page - 1]
    return body === 'error' ? json(route, { message: 'boom' }, 500) : json(route, body ?? [])
  }
  return { requests, handler }
}

test('recent work reads page 2 when page 1 has fewer than 5 merges', async ({ page }) => {
  const feed = pagedFeed([[mergedEvent(1), mergedEvent(2)], [mergedEvent(3), mergedEvent(4), mergedEvent(5)]])
  await page.route(EVENTS_URL, feed.handler)
  await page.goto(sitePath('/'))
  await expect(page.locator('section[aria-labelledby="recent-h"] li')).toHaveCount(5)
  expect(feed.requests).toEqual([1, 2])
})

test('recent work makes one events request when page 1 has 5 merges', async ({ page }) => {
  const feed = pagedFeed([[1, 2, 3, 4, 5].map((i) => mergedEvent(i))])
  await page.route(EVENTS_URL, feed.handler)
  await page.goto(sitePath('/'))
  await expect(page.locator('section[aria-labelledby="recent-h"] li')).toHaveCount(5)
  expect(feed.requests).toEqual([1])
})

test('recent work is hidden when page 2 fails, even if page 1 had merges', async ({ page }) => {
  const feed = pagedFeed([[mergedEvent(1)], 'error'])
  await page.route(EVENTS_URL, feed.handler)
  await page.goto(sitePath('/'))
  await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible()
  await expect(section(page)).toHaveCount(0)
  expect(feed.requests).toEqual([1, 2])
})
