# Chief state
Updated: 2026-10-30
Phase: Game redesign direction approved; production implementation NOT started.
Branch: design/neon-plaza-handoff (prototype + this handoff; no production changes).
Design issue: https://github.com/thomas-tahk/portfolio/issues/40
Original references: https://claude.ai/artifact/CFMtyBfrtE7MWHDCgQkKVc (Claude sign-in required).
Approved: A Arcade Night aesthetic + C Overworld connected paths; NO houses, green checkerboard or fantasy village.
Approved composition: dark navy plaza, open low platforms with signs for Projects / Experience / Skills, quiet intersecting paths, kickable balls retained.
Lighting: bright near-white pink/cyan/gold neon cores, layered colored bloom, light spilling onto floor, raised platform edges and deep grounded shadows.
User rejected first thin-border version as flat / missing neon; lighting revision was substantially better. Do not regress to colored outlines alone.
Character: user rejected cyan block, original green fantasy sprite and toy-robot visor design.
Character accepted FOR NOW: original pixel human, visible face, swept dark hair, asymmetric streetwear jacket, dark trousers, boots, one cyan wrist light with localized glow. Not copied from a known character.
Approved visual source: frontend/neon-plaza-prototype.html; character: frontend/public/sprites/arcade-explorer-prototype.svg.
Preview: cd frontend && npm run dev -- --host 127.0.0.1 --port 5174; open http://127.0.0.1:5174/portfolio/neon-plaza-prototype.html.
Prototype imports real content.json; desktop signs open panels; phone panel toggles. Character = front-facing idle only; movement, physics, camera and responsive game behavior NOT implemented here.
Validation: inspected rendered preview; desktop destination panel opened/closed; prior layout checked at 1440px and 390px without horizontal overflow; latest art checked in narrow browser pane. No production test suite run for isolated visual study.
Next action: read this prototype, inspect current /play implementation, then plan and implement the approved design in the real game while preserving existing controls, balls, content, accessibility and plain page.
Do not ship prototype code as production unchanged; add directional walking frames for accepted human character and verify motion/readability in the real game.
Proposed implementation done-gate: on desktop and phone, walk through neon plaza, open real Projects, follow a real project link, close panel and kick a ball; validate original interactions remain functional.
Stale handoff corrected: https://github.com/thomas-tahk/portfolio/issues/74 is CLOSED and fixed on main; no remaining work there. No open PRs at initial check.
Dependency note: local node_modules lacks qrcode; Vite logs unresolved dependency for plain page, though isolated prototype works. Install lockfile dependencies before production verification; do not remove qrcode.
Waiting on user: no further design selection needed; character acceptable for now. Earlier vision done-gate unconfirmed; do not invent broader scope.
User is new to Codex; give exact UI steps and verify available tools. Terminal browser advice earlier was unreliable; desktop browser worked after sign-in.
Unrelated untracked .claude/ existed before this work; left untouched and excluded from handoff commit.
Production merge/deploy: not authorized by this handoff; leave implementation reviewable on branch/PR.
