// ─────────────────────────────────────────────────────────────────────────────
// main.jsx — Application entry point
//
// Mounts the React app and polyfills window.storage so any legacy code that
// targets Claude's artifact renderer API still works unchanged when the app
// runs locally. The actual data layer used by sections is db in storage.js —
// this polyfill is only here for backwards compatibility.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ---------------------------------------------------------------------------
// window.storage polyfill
// In Claude's artifact renderer, window.storage is a built-in async key/value
// store. Here we replicate the same API using localStorage so the app works
// identically when running locally.
// ---------------------------------------------------------------------------
window.storage = {
  get: (key) => {
    return new Promise((resolve) => {
      const value = localStorage.getItem(key)
      if (value === null) {
        resolve(null)
      } else {
        resolve({ key, value })
      }
    })
  },
  set: (key, value) => {
    return new Promise((resolve) => {
      localStorage.setItem(key, value)
      resolve({ key, value })
    })
  },
  delete: (key) => {
    return new Promise((resolve) => {
      localStorage.removeItem(key)
      resolve({ key, deleted: true })
    })
  },
  list: (prefix = '') => {
    return new Promise((resolve) => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix))
      resolve({ keys, prefix })
    })
  },
}

// Mount the React tree into the #root div defined in index.html.
// StrictMode renders components twice in development to surface side-effects.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
