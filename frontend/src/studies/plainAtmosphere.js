// Throwaway: three compositions of the real portfolio with the chosen Seoraksan backdrop.
import { createElement, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Home from '../home/Home'
import '../home/home.css'
import './plainAtmosphere.css'

const descriptions = {
  editorial: 'Editorial: oversized name, open introduction, generous project rows.',
  split: 'Split profile: a persistent introduction beside a focused stream of work.',
  work: 'Work first: compact introduction, featured projects up front, biography below.',
}

function BackgroundStrength() {
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark')
  const [strength, setStrength] = useState(dark ? 30 : 35)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const nextDark = document.documentElement.dataset.theme === 'dark'
      setDark(nextDark)
      setStrength(nextDark ? 30 : 35)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    document.body.style.setProperty('--study-strength', strength / 100)
  }, [strength])
  return createElement('label', { className: 'strength-control' },
    `Background strength ${strength}%`,
    createElement('input', { type: 'range', min: 0, max: 100, value: strength,
      onChange: event => setStrength(Number(event.target.value)) }))
}

function chooseLayout(layout) {
  document.body.dataset.layout = layout
  document.querySelectorAll('[data-layout-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.layoutChoice === layout))
  })
  document.querySelector('.layout-description').textContent = descriptions[layout]
  const url = new URL(location.href)
  url.searchParams.set('variant', 'B')
  url.searchParams.set('layout', layout)
  history.replaceState(null, '', url)
}

document.querySelectorAll('[data-layout-choice]').forEach(button => {
  button.addEventListener('click', () => { chooseLayout(button.dataset.layoutChoice); scrollTo(0, 0) })
})
const requested = new URLSearchParams(location.search).get('layout')
chooseLayout(Object.hasOwn(descriptions, requested) ? requested : 'editorial')
createRoot(document.getElementById('home')).render(
  createElement(Home, { appearanceControls: createElement(BackgroundStrength) }),
)
