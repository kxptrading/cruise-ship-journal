// ─────────────────────────────────────────────────────────────────────────────
// components/ErrorBoundary.jsx — Top-level React error boundary
//
// Wraps the section router. If any section throws during render, this catches
// it and shows a friendly fallback instead of a blank screen.
// ─────────────────────────────────────────────────────────────────────────────

import { Component } from 'react'
import { NAVY, GOLD, CREAM, MUTED, WHITE, BORDER } from '../constants'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 300, padding: 32, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <div style={{
          background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`,
          padding: '36px 32px', maxWidth: 440, width: '100%', textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚓</div>
          <h2 style={{
            margin: '0 0 10px', fontFamily: 'Georgia, serif',
            fontSize: 22, color: NAVY,
          }}>
            Something went adrift
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
            This section ran into a problem. Your data is safe — try reloading the page.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              textAlign: 'left', fontSize: 11, color: '#B03060',
              background: '#FFF0F3', borderRadius: 8, padding: '12px 14px',
              overflow: 'auto', marginBottom: 24,
              border: '1px solid #FECACA',
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: NAVY, color: WHITE, border: 'none',
              borderRadius: 8, padding: '10px 24px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }
}
