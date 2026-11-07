# Chief state
Updated: 2026-11-07
Vision: [README](../../README.md)
Phase: Plain-page design exploration on `codex/portfolio-weekend-handoff`.
Next action: Run the Editorial preview, then show three heading treatments for feedback. Try a smaller sans-serif name, a headline-led introduction, and a name with portrait. Keep the rest of Editorial comparable.
Waiting on him: Heading and portrait crop feedback after the previews. Production integration follows his design approval.
Preview from `frontend`: `npm ci && npm run dev -- --host 127.0.0.1 --port 5176`. [Open Editorial](http://127.0.0.1:5176/portfolio/plain-atmosphere-prototype.html?variant=B&layout=editorial).
Design decisions: Seoraksan selected. The bottom bar compares Editorial (preferred), Split profile, and Work first with the same photo. The user found parallax underwhelming. The existing top gear houses background strength (35% light, 30% dark).
Open design choices: Oversized Editorial heading disliked. Arched portrait crop provisional. Project lists use text and links without screenshots; headshot retained.
Study entry: [plain-atmosphere-prototype.html](../../frontend/plain-atmosphere-prototype.html). [Photo attribution](../../frontend/public/studies/ATTRIBUTION.md).
Feed config: Replaced Dormant, kb-helper, and plot-plan with broodwar-archive, shows-for-us, and amugonna. Feed still shows merged PR activity.
Already on main: [neon plaza](https://github.com/thomas-tahk/portfolio/pull/77), [README refresh](https://github.com/thomas-tahk/portfolio/commit/df17c66e36e778a2bc2398f03093e5aa01cab060), and [15 larger skill icons](https://github.com/thomas-tahk/portfolio/pull/79).
Handoff validation: ESLint and all 103 Playwright tests passed. The dev preview loaded the Seoraksan photo, switched all three layouts, and showed the theme defaults at 375px and 1280px.
