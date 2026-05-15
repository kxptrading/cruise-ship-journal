// ─────────────────────────────────────────────────────────────────────────────
// features/posts/PostEditorForm.tsx — Shared create/edit form for posts
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, BORDER, TEXT, MUTED, FONT_BODY, sty } from '@/constants'
import AudienceSelector from './AudienceSelector'
import type { Audience } from '@/types/models'

export interface PostFormValues {
  title:    string
  body:     string
  postDate: string
  location: string
  audience: Audience
}

export const EMPTY_POST_FORM: PostFormValues = {
  title:    '',
  body:     '',
  postDate: new Date().toISOString().split('T')[0],
  location: '',
  audience: 'private',
}

interface Props {
  values:   PostFormValues
  onChange: (v: PostFormValues) => void
}

const field = (label: string, child: React.ReactNode) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: FONT_BODY }}>
      {label}
    </label>
    {child}
  </div>
)

export default function PostEditorForm({ values, onChange }: Props) {
  const set = <K extends keyof PostFormValues>(k: K, v: PostFormValues[K]) =>
    onChange({ ...values, [k]: v })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {field('Title (optional)',
        <input
          value={values.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Give this entry a title…"
          style={{ ...sty.inp }}
        />
      )}

      {field('What happened? *',
        <textarea
          value={values.body}
          onChange={e => set('body', e.target.value)}
          placeholder="Write about your day — highlights, experiences, discoveries…"
          rows={7}
          style={{ ...sty.inp, resize: 'vertical', lineHeight: 1.7 }}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {field('Date',
          <input
            type="date"
            value={values.postDate}
            onChange={e => set('postDate', e.target.value)}
            style={{ ...sty.inp }}
          />
        )}
        {field('Location (optional)',
          <input
            value={values.location}
            onChange={e => set('location', e.target.value)}
            placeholder="Port or place"
            style={{ ...sty.inp }}
          />
        )}
      </div>

      {/* Audience */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
        <AudienceSelector value={values.audience} onChange={a => set('audience', a)} />
      </div>

    </div>
  )
}
