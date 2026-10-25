import { useState } from 'react'

function saveTheme(theme) {
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // storage blocked: the choice just won't persist
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  const next = theme === 'dark' ? 'light' : 'dark'
  const toggle = () => {
    document.documentElement.dataset.theme = next
    saveTheme(next)
    setTheme(next)
  }
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-pressed={theme === 'dark'}>
      Dark mode
      <span className="theme-track" aria-hidden="true">
        <span className="theme-knob" />
      </span>
    </button>
  )
}
