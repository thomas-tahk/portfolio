# Portfolio — vision

Written by the chief on 2026-10-25 from decisions already made (plan approved 2026-10-18, owner calls on 2026-10-24). **Not yet confirmed by the owner as a whole.**

## Intent
Thomas's real portfolio at https://thomas-tahk.github.io/portfolio/ — the page a hiring manager reads, plus a playable game version as a fun extra that shows he can build.

## Goals
- `/` is the hiring page: name, headline, about, featured work, more work, live recent work, experience, contact. Readable on a phone in under a minute.
- `/play/` is the game: explore the same content, kick things around, fun to poke at.
- One `content.json` feeds both.
- Either version reaches the other in one tap (owner, 2026-10-25).

## Non-goals
- No backend, database or paid service. Static GitHub Pages only.
- The game does not have to carry the intro or links; the plain page does (owner, 2026-10-24).

## Anti-goals
- Synthetic filler projects or inflated claims.
- A game that blocks a recruiter from finding the facts.

## Done-gate (proposed, needs his confirmation)
"A hiring manager opens the link on their phone and within a minute knows what I do, sees my best work, and can reach me — and the game is one tap away and fun to mess with."

## Assumptions
- ~~Assumption: the M3 variant layouts are still wanted.~~ Refuted by owner 2026-10-25: M3 and M4 dropped.
- **Assumption:** the game redesign (layout + visuals, issue #40) comes after M2 and starts with 3–4 mockups. Confirmed by owner 2026-10-24.
- ~~Assumption: the feed should hide this repo's own PRs.~~ Refuted 2026-10-25: owner is fine with them showing.

## Sources
- Plan: [docs/plan/2026-10-18-portfolio-plan.html](../plan/2026-10-18-portfolio-plan.html)
