import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import App from './App.jsx'
import { IS_PREVIEW } from './content/previewMode.js'

// In the editor preview iframe only, lazy-load the postMessage bridge that feeds
// draft content into the store. Separate chunk → no cost for normal visitors.
if (IS_PREVIEW) {
  import('./content/previewBridge.js')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
