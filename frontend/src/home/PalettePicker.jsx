import { useState } from 'react'

const PALETTES = [
  { id: '', label: 'Current (blue / yellow)' },
  { id: 'ember', label: 'Ember' },
  { id: 'forest', label: 'Forest' },
  { id: 'grape', label: 'Grape' },
  { id: 'cherry', label: 'Cherry' },
]

function savePalette(id) {
  try {
    if (id) localStorage.setItem('palette', id)
    else localStorage.removeItem('palette')
  } catch {
    // storage blocked: the choice just won't persist
  }
}

// A ?palette= in the URL beats the stored choice on load, so keep it in step.
function keepUrlInSync(id) {
  const url = new URL(location.href)
  if (!url.searchParams.has('palette')) return
  url.searchParams.set('palette', id || 'current')
  history.replaceState(null, '', url)
}

export default function PalettePicker() {
  const [palette, setPalette] = useState(() => document.documentElement.dataset.palette || '')
  const change = (e) => {
    const id = e.target.value
    if (id) document.documentElement.dataset.palette = id
    else delete document.documentElement.dataset.palette
    savePalette(id)
    keepUrlInSync(id)
    setPalette(id)
  }
  return (
    <label className="palette-picker">
      Palette
      <select value={palette} onChange={change}>
        {PALETTES.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </label>
  )
}
