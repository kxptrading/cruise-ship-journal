// ─────────────────────────────────────────────────────────────────────────────
// themes.js — Theme definitions
//
// Each theme supplies CSS variable values that get applied to :root.
// Adding a new theme only requires a new entry here — no component changes.
// ─────────────────────────────────────────────────────────────────────────────

export const THEMES = {
  ocean: {
    id:    'ocean',
    name:  'Ocean Blue',
    emoji: '🌊',
    vars: {
      '--t-primary':     '#0EA5E9',
      '--t-primary-dk':  '#0369A1',
      '--t-primary-mid': '#0284C7',
      '--t-primary-lt':  '#38BDF8',
      '--t-accent':      '#F59E0B',
      '--t-bg':          '#F8F9FA',
      '--t-btn-shadow':  'rgba(14,165,233,0.35)',
    },
  },

  rose: {
    id:    'rose',
    name:  'Rose Pink',
    emoji: '🌸',
    vars: {
      '--t-primary':     '#EC4899',
      '--t-primary-dk':  '#BE185D',
      '--t-primary-mid': '#DB2777',
      '--t-primary-lt':  '#F9A8D4',
      '--t-accent':      '#F59E0B',
      '--t-bg':          '#FFF0F7',
      '--t-btn-shadow':  'rgba(236,72,153,0.35)',
    },
  },

  emerald: {
    id:    'emerald',
    name:  'Emerald',
    emoji: '🌿',
    vars: {
      '--t-primary':     '#059669',
      '--t-primary-dk':  '#065F46',
      '--t-primary-mid': '#10B981',
      '--t-primary-lt':  '#6EE7B7',
      '--t-accent':      '#F59E0B',
      '--t-bg':          '#F0FDF9',
      '--t-btn-shadow':  'rgba(5,150,105,0.35)',
    },
  },

  sunset: {
    id:    'sunset',
    name:  'Sunset',
    emoji: '🌅',
    vars: {
      '--t-primary':     '#F97316',
      '--t-primary-dk':  '#C2410C',
      '--t-primary-mid': '#EA580C',
      '--t-primary-lt':  '#FDBA74',
      '--t-accent':      '#FBBF24',
      '--t-bg':          '#FFF7ED',
      '--t-btn-shadow':  'rgba(249,115,22,0.35)',
    },
  },

  violet: {
    id:    'violet',
    name:  'Violet',
    emoji: '💜',
    vars: {
      '--t-primary':     '#7C3AED',
      '--t-primary-dk':  '#5B21B6',
      '--t-primary-mid': '#6D28D9',
      '--t-primary-lt':  '#C4B5FD',
      '--t-accent':      '#F59E0B',
      '--t-bg':          '#F5F3FF',
      '--t-btn-shadow':  'rgba(124,58,237,0.35)',
    },
  },

  coral: {
    id:    'coral',
    name:  'Coral',
    emoji: '🪸',
    vars: {
      '--t-primary':     '#F43F5E',
      '--t-primary-dk':  '#BE123C',
      '--t-primary-mid': '#E11D48',
      '--t-primary-lt':  '#FDA4AF',
      '--t-accent':      '#FBBF24',
      '--t-bg':          '#FFF1F2',
      '--t-btn-shadow':  'rgba(244,63,94,0.35)',
    },
  },

  indigo: {
    id:    'indigo',
    name:  'Indigo',
    emoji: '🔷',
    vars: {
      '--t-primary':     '#4F46E5',
      '--t-primary-dk':  '#3730A3',
      '--t-primary-mid': '#4338CA',
      '--t-primary-lt':  '#A5B4FC',
      '--t-accent':      '#F59E0B',
      '--t-bg':          '#EEF2FF',
      '--t-btn-shadow':  'rgba(79,70,229,0.35)',
    },
  },

  teal: {
    id:    'teal',
    name:  'Teal',
    emoji: '🐚',
    vars: {
      '--t-primary':     '#0D9488',
      '--t-primary-dk':  '#0F766E',
      '--t-primary-mid': '#14B8A6',
      '--t-primary-lt':  '#5EEAD4',
      '--t-accent':      '#FBBF24',
      '--t-bg':          '#F0FDFA',
      '--t-btn-shadow':  'rgba(13,148,136,0.35)',
    },
  },
}

// Apply a theme's CSS variables to :root
export function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES.ocean
  const root  = document.documentElement
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
  localStorage.setItem('csj-theme', themeId)
}

// Read persisted theme (or fall back to ocean)
export function getSavedTheme() {
  return localStorage.getItem('csj-theme') || 'ocean'
}
