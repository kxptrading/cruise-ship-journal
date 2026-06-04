// ─────────────────────────────────────────────────────────────────────────────
// main.tsx — Application entry point
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import App from './App'
import './index.css'

// Lock to portrait on Android PWA (installed to home screen).
// screen.orientation.lock() requires the app to be running in standalone
// mode — it silently fails in a regular browser tab and on iOS Safari
// (Apple does not expose this API regardless of install state).
if (typeof screen !== 'undefined' && screen.orientation?.lock) {
  screen.orientation.lock('portrait').catch(() => { /* unsupported — ignore */ })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
