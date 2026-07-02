// ─────────────────────────────────────────────────────────────────────────────
// features/social/useMentionPeople.ts — the @-mention people set
//
// Mentions are contacts-only: the source is the viewer's accepted contacts.
// Returned as the lightweight { id, name } shape used by RichText and MentionInput.
// Backed by useContacts() (React Query), so it's cached/deduped across the many
// components that render feed text.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import { useContacts } from '@/features/contacts/hooks'
import type { Person } from './richText'

export function useMentionPeople(): Person[] {
  const { data } = useContacts()
  return useMemo(
    () => (data?.accepted ?? [])
      .filter(c => c.displayName)
      .map(c => ({ id: c.userId, name: c.displayName })),
    [data],
  )
}
