// ─────────────────────────────────────────────────────────────────────────────
// features/posts/templates.ts — One-tap log templates
//
// Shared between the full post composer (PostEditorForm) and the dashboard
// QuickComposer so the "beat the blank page" starting points stay identical.
// Each fills the body with a light prompt skeleton the user edits in place.
// ─────────────────────────────────────────────────────────────────────────────

export interface PostTemplate {
  id:    string
  label: string
  emoji: string
  title: string   // applied by PostEditorForm when the title is empty; ignored by QuickComposer
  body:  string
}

export const POST_TEMPLATES: PostTemplate[] = [
  { id: 'sea',    label: 'Sea Day',      emoji: '☀️', title: 'Sea Day',
    body: 'A day at sea.\n\nHow we spent it: \nBest meal: \nFavourite moment: ' },
  { id: 'port',   label: 'Port Day',     emoji: '⚓', title: 'Port Day',
    body: 'Ashore today.\n\nWhere we explored: \nWhat we ate: \nThe highlight: ' },
  { id: 'formal', label: 'Formal Night', emoji: '🥂', title: 'Formal Night',
    body: 'Formal night on board.\n\nWhat we wore: \nDinner: \nThe evening: ' },
]
