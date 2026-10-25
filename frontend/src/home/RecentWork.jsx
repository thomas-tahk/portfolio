import { useEffect, useState } from 'react'
import content from '../content.json'

const API = 'https://api.github.com'
const MAX_ITEMS = 5
const MAX_PAGES = 3
const CACHE_KEY = 'recent-work-v1'
const CACHE_MS = 10 * 60 * 1000

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

function readCache() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY))
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.items
  } catch {
    // storage unavailable or corrupt: fall through to a fresh fetch
  }
  return null
}

function writeCache(items) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items }))
  } catch {
    // storage unavailable: skip caching
  }
}

function isFeedMerge(event, allowedRepos) {
  return (
    event.type === 'PullRequestEvent' &&
    event.payload?.action === 'merged' &&
    allowedRepos.has(event.repo?.name?.toLowerCase())
  )
}

async function loadItems() {
  const { owner, repos } = content.feedRepos
  const allowed = new Set(repos.map((r) => `${owner}/${r}`.toLowerCase()))
  const found = []
  for (let page = 1; page <= MAX_PAGES && found.length < MAX_ITEMS; page++) {
    const events = await getJson(`${API}/users/${owner}/events/public?per_page=100&page=${page}`)
    found.push(...events.filter((e) => isFeedMerge(e, allowed)))
    if (events.length === 0) break
  }
  const newest = found.slice(0, MAX_ITEMS)
  return Promise.all(
    newest.map(async (e) => {
      const pr = await getJson(`${API}/repos/${e.repo.name}/pulls/${e.payload.number}`)
      return { id: e.id, repo: e.repo.name.split('/')[1], title: pr.title, url: pr.html_url, at: e.created_at }
    }),
  )
}

const DIVISIONS = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]

function relativeDate(iso, now = Date.now()) {
  const diff = new Date(iso).getTime() - now
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, ms] of DIVISIONS) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit)
  }
  return 'just now'
}

export default function RecentWork() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false
    const cached = readCache()
    if (cached) {
      setItems(cached)
      return
    }
    loadItems()
      .then((loaded) => {
        if (cancelled) return
        writeCache(loaded)
        setItems(loaded)
      })
      .catch(() => {
        // Any failure hides the section: no error text on a hiring page.
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (items.length === 0) return null
  return (
    <section aria-labelledby="recent-h">
      <h2 id="recent-h">Recent work</h2>
      <ul className="plain-list">
        {items.map((item) => (
          <li key={item.id} className="more-item">
            <h3>
              <a href={item.url}>{item.title}</a>
            </h3>
            <p className="meta">
              {item.repo} · merged <time dateTime={item.at}>{relativeDate(item.at)}</time>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
