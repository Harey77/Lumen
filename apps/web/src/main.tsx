import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource/atkinson-hyperlegible/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-700.css'
import '@fontsource/big-shoulders-display/latin-800'
import '@fontsource/fraunces/latin-600.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/pages.css'
import './styles/site.css'
import './styles/lab.css'
import { App } from './App'
import { stripUtm } from './lib/utm'

// Campaign tags are removed before anything renders and are never stored (D-012).
const clean = stripUtm(location.href)
if (clean) history.replaceState(history.state, '', clean)

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
