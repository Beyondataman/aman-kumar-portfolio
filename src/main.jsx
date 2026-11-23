import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// self-hosted fonts (latin subsets) — no CDN needed, works offline and from file://
import '@fontsource/inter-tight/latin-800.css'
import '@fontsource/inter-tight/latin-900.css'
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-600.css'
import './styles/base.css'
import './styles/templates.css'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
