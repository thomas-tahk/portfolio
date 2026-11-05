# Thomas Tahk Portfolio

A developer portfolio with a browsable home page and a playable 2D version.

## Live site

- [Portfolio](https://thomas-tahk.github.io/portfolio/) — featured projects, experience, contact links, and a recent-work feed of merged GitHub pull requests from selected public repositories. Settings include dark mode, color palettes, and a QR code for the page.
- [Play the game](https://thomas-tahk.github.io/portfolio/play/) — explore a neon plaza, enter zones for projects, experience, and skills, and kick tech icons around. Move with WASD, arrow keys, mouse, or touch-and-hold. Press Space or tap to kick. Use **Reset plaza** to restore the starting positions.

## Development

```bash
cd frontend
npm ci
npm run dev
```

Open [the local portfolio](http://localhost:5173/portfolio/) or [the local game](http://localhost:5173/portfolio/play/).

Run `npm run build` from `frontend` to build both pages into `frontend/dist`. GitHub Actions deploys `main` to GitHub Pages.

## Project structure

- `frontend/src/home/` — portfolio home page
- `frontend/play/` — game entry page
- `frontend/src/content.json` — shared portfolio content
- `frontend/tests/` — Playwright tests
- `.github/workflows/` — checks and deployment workflows

The site uses React 19 and Vite. The game uses KAPLAY and Jotai.
