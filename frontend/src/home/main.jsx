import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import Home from './Home'
import './home.css'
import './editorial.css'

createRoot(document.getElementById('home')).render(
  <StrictMode>
    <Home />
  </StrictMode>,
)
