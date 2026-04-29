// ─────────────────────────────────────────────────────────────────────────────
// main.jsx — Application entry point
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Mount the React tree into the #root div defined in index.html.
// StrictMode renders components twice in development to surface side-effects.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
