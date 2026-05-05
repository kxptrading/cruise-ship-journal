// ─────────────────────────────────────────────────────────────────────────────
// profile/profileData.ts — Static seed data for the Profile page
//
// All data that isn't yet in the database lives here.
// To swap in live data: replace any array/object with an API call that returns
// the same shape and the component will render identically.
// ─────────────────────────────────────────────────────────────────────────────

import { TEAL, GOLD, NAVY, NAVY2, PLUM, ROSE } from '../../constants'

export interface PortPin {
  name:  string
  lat:   number
  lng:   number
  color: string
}

// ── Port pins (PassportMap) ────────────────────────────────────────────────────
// Equirectangular projection used in PassportMap:
//   x% = ((lng + 180) / 360) * 100
//   y% = ((85  - lat) / 170) * 100
export const PORTS: PortPin[] = [
  { name: 'Southampton', lat: 50.9,  lng:  -1.4,  color: TEAL  },
  { name: 'Málaga',      lat: 36.7,  lng:  -4.4,  color: TEAL  },
  { name: 'Barcelona',   lat: 41.4,  lng:   2.2,  color: TEAL  },
  { name: 'Santorini',   lat: 36.4,  lng:  25.5,  color: GOLD  },   // "today" accent
  { name: 'Mykonos',     lat: 37.4,  lng:  25.3,  color: NAVY  },
  { name: 'Dubrovnik',   lat: 42.6,  lng:  18.1,  color: NAVY  },
  { name: 'Naples',      lat: 40.8,  lng:  14.3,  color: NAVY  },
  { name: 'Cozumel',     lat: 20.5,  lng: -86.9,  color: PLUM  },
  { name: 'Nassau',      lat: 25.0,  lng: -77.4,  color: PLUM  },
  { name: 'Miami',       lat: 25.8,  lng: -80.2,  color: PLUM  },
  { name: 'St Thomas',   lat: 18.3,  lng: -64.9,  color: PLUM  },
  { name: 'Barbados',    lat: 13.1,  lng: -59.5,  color: PLUM  },
  { name: 'Reykjavík',   lat: 64.1,  lng: -21.9,  color: ROSE  },
  { name: 'Bergen',      lat: 60.4,  lng:   5.3,  color: ROSE  },
  { name: 'Venice',      lat: 45.4,  lng:  12.3,  color: NAVY  },
]

export const MAP_SUMMARY = '15 ports · 9 countries · 4 seas'

export interface Trait {
  name:  string
  sub:   string
  color: string
}

// ── Personality traits (Personality card) ─────────────────────────────────────
export const TRAITS: Trait[] = [
  { name: 'Balcony Lover',          sub: 'Sea views every morning, no exceptions',    color: GOLD  },
  { name: 'Excursion Maximalist',   sub: 'Every port, every adventure, every time',   color: ROSE  },
  { name: 'Formal Night Regular',   sub: 'Black tie? Already packed. Twice.',         color: PLUM  },
  { name: 'Trivia Enthusiast',      sub: 'Top of the leaderboard or it didn\'t happen', color: TEAL },
]

// Note: Badge definitions moved to Badges.tsx (computed live from journal data)

export interface CompanionRecord {
  initials: string
  name:     string
  relation: string
  voyages:  number
  color:    string
}

// ── Travel companions (Companions card) ───────────────────────────────────────
export const COMPANIONS: CompanionRecord[] = [
  { initials: 'JR', name: 'James Rivers',  relation: 'Husband',  voyages: 3, color: NAVY2 },
  { initials: 'LR', name: 'Lily Rivers',   relation: 'Daughter', voyages: 3, color: ROSE  },
  { initials: 'OR', name: 'Oscar Rivers',  relation: 'Son',      voyages: 2, color: TEAL  },
  { initials: 'MK', name: 'Maya Kim',      relation: 'Friend',   voyages: 1, color: PLUM  },
  { initials: 'TS', name: 'The Sullivans', relation: 'Friends',  voyages: 1, color: GOLD  },
]

export interface PreferenceItem {
  icon:  string
  key:   string
  value: string
}

// ── Preferences (Preferences card) ────────────────────────────────────────────
export const PREFERENCES: PreferenceItem[] = [
  { icon: '🛏️', key: 'Cabin preference',  value: 'Balcony · mid-ship'  },
  { icon: '🍽️', key: 'Dining time',       value: 'Late · 20:30'        },
  { icon: '🥗', key: 'Dietary',           value: 'Pescatarian'         },
  { icon: '💰', key: 'Default currency',  value: 'GBP (£)'             },
  { icon: '🛫', key: 'Home airport',      value: 'LHR'                 },
  { icon: '📏', key: 'Units',             value: 'Metric'              },
]

// Note: Settings rows moved to SettingsBlock.tsx — each action now has live
// handlers (PDF export, JSON download, privacy toggle, notification toggle)
// and no longer uses a static data array.
