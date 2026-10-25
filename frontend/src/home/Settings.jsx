import { useEffect, useRef, useState } from 'react'

const PALETTES = [
  { id: '', label: 'Current' },
  { id: 'ember', label: 'Ember' },
  { id: 'forest', label: 'Forest' },
  { id: 'grape', label: 'Grape' },
  { id: 'cherry', label: 'Cherry' },
]
const ROTATE_MS = 8000
const FADE_MS = 600
const REDUCED = '(prefers-reduced-motion: reduce)'

function store(key, value) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // storage blocked: the choice just won't persist
  }
}

function readStored(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia(REDUCED).matches)
  useEffect(() => {
    const mq = window.matchMedia(REDUCED)
    const update = () => setReduced(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

function applyPalette(id) {
  const root = document.documentElement
  if (id) root.dataset.palette = id
  else delete root.dataset.palette
  store('palette', id)
}

function fadeColours() {
  const root = document.documentElement
  root.dataset.fade = ''
  setTimeout(() => delete root.dataset.fade, FADE_MS + 50)
}

function Switch({ label, pressed, onClick, disabled, describedBy }) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onClick}
      aria-pressed={pressed}
      disabled={disabled}
      aria-describedby={describedBy}
    >
      {label}
      <span className="theme-track" aria-hidden="true">
        <span className="theme-knob" />
      </span>
    </button>
  )
}

function usePanel() {
  const [open, setOpen] = useState(false)
  const gear = useRef(null)
  const panel = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    panel.current.querySelector('button, input').focus()
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      gear.current.focus()
    }
    const onPointer = (e) => {
      if (panel.current.contains(e.target) || gear.current.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])
  return { open, setOpen, gear, panel }
}

export default function Settings() {
  const { open, setOpen, gear, panel } = usePanel()
  const reduced = useReducedMotion()
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  const [palette, setPalette] = useState(() => document.documentElement.dataset.palette || '')
  const [autoRotate, setAutoRotate] = useState(() => readStored('autorotate') === '1')
  const rotating = autoRotate && !reduced

  const choose = (id) => {
    applyPalette(id)
    setPalette(id)
  }
  const next = (animate) => {
    if (animate) fadeColours()
    const i = PALETTES.findIndex((p) => p.id === palette)
    choose(PALETTES[(i + 1) % PALETTES.length].id)
  }
  const toggleTheme = () => {
    const t = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = t
    store('theme', t)
    setTheme(t)
  }
  const toggleRotate = () => {
    store('autorotate', autoRotate ? '' : '1')
    setAutoRotate(!autoRotate)
  }

  const nextRef = useRef(next)
  nextRef.current = next
  useEffect(() => {
    if (!rotating) return undefined
    const id = setInterval(() => {
      if (!document.hidden) nextRef.current(true)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [rotating])

  return (
    <>
      <button
        ref={gear}
        type="button"
        className="gear"
        aria-label="Settings"
        aria-expanded={open}
        aria-controls="settings-panel"
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">⚙</span>
      </button>
      <div ref={panel} id="settings-panel" className="settings-panel" role="group" aria-label="Appearance settings" hidden={!open}>
        <Switch label="Dark mode" pressed={theme === 'dark'} onClick={toggleTheme} />
        <fieldset className="palette-options">
          <legend>Palette</legend>
          {PALETTES.map((p) => (
            <label key={p.id || 'current'}>
              <input type="radio" name="palette" checked={palette === p.id} onChange={() => choose(p.id)} />
              {p.label}
            </label>
          ))}
        </fieldset>
        <button type="button" className="btn" onClick={() => next(false)}>
          Next palette
        </button>
        <Switch
          label="Auto-rotate"
          pressed={autoRotate}
          onClick={toggleRotate}
          disabled={reduced}
          describedBy={reduced ? 'rotate-note' : undefined}
        />
        {reduced && (
          <p id="rotate-note" className="settings-note">
            Off because your device asks for reduced motion.
          </p>
        )}
      </div>
    </>
  )
}
