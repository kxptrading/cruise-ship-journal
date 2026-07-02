// ─────────────────────────────────────────────────────────────────────────────
// features/posts/PostEditorForm.tsx — Shared create/edit form for posts
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react'
import { WHITE, BORDER, TEXT, MUTED, NAVY, FONT_BODY, sty } from '@/constants'
import AudienceSelector from './AudienceSelector'
import MediaUploader from '@/ui/MediaUploader'
import FE from '@/components/FE'
import { useUserId } from '@/context'
import { POST_TEMPLATES, type PostTemplate } from './templates'
import MentionInput from '../social/MentionInput'
import type { Audience } from '@/types/models'

export interface PostFormValues {
  title:       string
  body:        string
  postDate:    string
  location:    string
  audience:    Audience
  mediaPaths:  string[]
}

export const EMPTY_POST_FORM: PostFormValues = {
  title:       '',
  body:        '',
  postDate:    new Date().toISOString().split('T')[0],
  location:    '',
  audience:    'private',
  mediaPaths:  [],
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
  const userId = useUserId()
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const set = <K extends keyof PostFormValues>(k: K, v: PostFormValues[K]) =>
    onChange({ ...values, [k]: v })

  const applyTemplate = (t: PostTemplate) => {
    onChange({ ...values, title: values.title.trim() || t.title, body: t.body })
    // Focus the body and drop the cursor at the end so they can start typing.
    requestAnimationFrame(() => {
      const el = bodyRef.current
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
    })
  }

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

      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: FONT_BODY }}>
          What happened? *
        </label>
        {/* Template chips — only while the body is blank, so they never overwrite
            existing text or show up when editing a saved post. */}
        {!values.body.trim() && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, alignSelf: 'center' }}>
              Start from a template:
            </span>
            {POST_TEMPLATES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 999,
                  padding: '5px 12px', cursor: 'pointer',
                  fontSize: 13, fontFamily: FONT_BODY, color: NAVY, fontWeight: 600,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
              >
                <FE emoji={t.emoji} size={14} /> {t.label}
              </button>
            ))}
          </div>
        )}
        <MentionInput
          ref={bodyRef}
          value={values.body}
          onChange={v => set('body', v)}
          placeholder="Write about your day — highlights, experiences, discoveries…  Use @ to mention a contact, # for tags"
          rows={7}
          style={{ ...sty.inp, resize: 'vertical', lineHeight: 1.7, width: '100%' }}
        />
      </div>

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

      {/* Photos */}
      {field('Photos',
        <MediaUploader
          paths={values.mediaPaths}
          userId={userId}
          onAdd={path => set('mediaPaths', [...values.mediaPaths, path])}
          onRemove={path => set('mediaPaths', values.mediaPaths.filter(p => p !== path))}
        />
      )}

      {/* Audience */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
        <AudienceSelector value={values.audience} onChange={a => set('audience', a)} />
      </div>

    </div>
  )
}
