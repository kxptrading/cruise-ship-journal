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

  blush: {
    id:    'blush',
    name:  'Blush',
    emoji: '🌷',
    vars: {
      '--t-primary':     '#DB7093',
      '--t-primary-dk':  '#C05674',
      '--t-primary-mid': '#CF6585',
      '--t-primary-lt':  '#F0B8C8',
      '--t-accent':      '#F59E0B',
      '--t-bg':          '#FFF0F5',
      '--t-btn-shadow':  'rgba(219,112,147,0.35)',
    },
  },

  sage: {
    id:    'sage',
    name:  'Sage',
    emoji: '🌿',
    vars: {
      '--t-primary':     '#7BAF8E',
      '--t-primary-dk':  '#537A64',
      '--t-primary-mid': '#6A9E7D',
      '--t-primary-lt':  '#AECFBA',
      '--t-accent':      '#F59E0B',
      '--t-bg':          '#F2F9F5',
      '--t-btn-shadow':  'rgba(123,175,142,0.35)',
    },
  },

  periwinkle: {
    id:    'periwinkle',
    name:  'Periwinkle',
    emoji: '🫐',
    vars: {
      '--t-primary':     '#8B9DC9',
      '--t-primary-dk':  '#6175A8',
      '--t-primary-mid': '#7889BC',
      '--t-primary-lt':  '#BAC4E0',
      '--t-accent':      '#F59E0B',
      '--t-bg':          '#F2F4FB',
      '--t-btn-shadow':  'rgba(139,157,201,0.35)',
    },
  },

  peach: {
    id:    'peach',
    name:  'Peach',
    emoji: '🍑',
    vars: {
      '--t-primary':     '#E8956D',
      '--t-primary-dk':  '#C46E47',
      '--t-primary-mid': '#D88060',
      '--t-primary-lt':  '#F5BFA4',
      '--t-accent':      '#FBBF24',
      '--t-bg':          '#FFF7F2',
      '--t-btn-shadow':  'rgba(232,149,109,0.35)',
    },
  },

  tangerine: {
    id:    'tangerine',
    name:  'Tangerine',
    emoji: '🍊',
    vars: {
      '--t-primary':     '#EA580C',
      '--t-primary-dk':  '#9A3412',
      '--t-primary-mid': '#C2410C',
      '--t-primary-lt':  '#FB923C',
      '--t-accent':      '#FBBF24',
      '--t-bg':          '#FFF7ED',
      '--t-btn-shadow':  'rgba(234,88,12,0.35)',
    },
  },

  terracotta: {
    id:    'terracotta',
    name:  'Terracotta',
    emoji: '🏺',
    vars: {
      '--t-primary':     '#C2693A',
      '--t-primary-dk':  '#8C3A1A',
      '--t-primary-mid': '#A8552C',
      '--t-primary-lt':  '#E09A72',
      '--t-accent':      '#FBBF24',
      '--t-bg':          '#FDF3EE',
      '--t-btn-shadow':  'rgba(194,105,58,0.35)',
    },
  },

  bubblegum: {
    id:    'bubblegum',
    name:  'Bubblegum',
    emoji: '🩷',
    vars: {
      '--t-primary':     '#F472B6',
      '--t-primary-dk':  '#BE185D',
      '--t-primary-mid': '#EC4899',
      '--t-primary-lt':  '#FBCFE8',
      '--t-accent':      '#FBBF24',
      '--t-bg':          '#FDF2F8',
      '--t-btn-shadow':  'rgba(244,114,182,0.35)',
    },
  },

  forest: {
    id:    'forest',
    name:  'Forest',
    emoji: '🌲',
    vars: {
      '--t-primary':     '#16A34A',
      '--t-primary-dk':  '#14532D',
      '--t-primary-mid': '#15803D',
      '--t-primary-lt':  '#86EFAC',
      '--t-accent':      '#FBBF24',
      '--t-bg':          '#F0FDF4',
      '--t-btn-shadow':  'rgba(22,163,74,0.35)',
    },
  },

  gold: {
    id:    'gold',
    name:  'Gold',
    emoji: '✨',
    vars: {
      '--t-primary':     '#D97706',
      '--t-primary-dk':  '#92400E',
      '--t-primary-mid': '#B45309',
      '--t-primary-lt':  '#FCD34D',
      '--t-accent':      '#F59E0B',
      '--t-bg':          '#FFFBEB',
      '--t-btn-shadow':  'rgba(217,119,6,0.35)',
    },
  },

  lemon: {
    id:    'lemon',
    name:  'Lemon',
    emoji: '🍋',
    vars: {
      '--t-primary':     '#CA8A04',
      '--t-primary-dk':  '#713F12',
      '--t-primary-mid': '#A16207',
      '--t-primary-lt':  '#FDE047',
      '--t-accent':      '#D97706',
      '--t-bg':          '#FEFCE8',
      '--t-btn-shadow':  'rgba(202,138,4,0.35)',
    },
  },

  amber: {
    id:    'amber',
    name:  'Amber',
    emoji: '🟡',
    vars: {
      '--t-primary':     '#F59E0B',
      '--t-primary-dk':  '#B45309',
      '--t-primary-mid': '#D97706',
      '--t-primary-lt':  '#FDE68A',
      '--t-accent':      '#EF4444',
      '--t-bg':          '#FFFBEB',
      '--t-btn-shadow':  'rgba(245,158,11,0.35)',
    },
  },

  saffron: {
    id:    'saffron',
    name:  'Saffron',
    emoji: '🌻',
    vars: {
      '--t-primary':     '#EAB308',
      '--t-primary-dk':  '#854D0E',
      '--t-primary-mid': '#CA8A04',
      '--t-primary-lt':  '#FEF08A',
      '--t-accent':      '#F97316',
      '--t-bg':          '#FEFCE8',
      '--t-btn-shadow':  'rgba(234,179,8,0.35)',
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
