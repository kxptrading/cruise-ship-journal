// ─────────────────────────────────────────────────────────────────────────────
// features/posts/PostEngagement.tsx — reactions + comments for a spec post
//
// Used in two modes:
//   compact  — on the feed card: action bar + expandable inline comments.
//   full     — on the post detail page: reactions + the whole comment thread open.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { WHITE, BORDER, NAVY2, MUTED, TEXT, FONT_BODY } from '@/constants'
import { useUserId } from '@/context'
import RichText from '@/features/social/richText'
import MentionInput from '@/features/social/MentionInput'
import { useMentionPeople } from '@/features/social/useMentionPeople'
import {
  POST_REACTIONS, usePostReactions, useToggleReaction, usePostComments,
  useCommentCount, useAddComment, useDeleteComment,
} from './engagement'

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  if (h < 24) return `${h}h`
  if (d < 7)  return `${d}d`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Initials({ name, size = 26 }: { name: string; size?: number }) {
  const i = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'var(--t-primary-dk)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, fontFamily: FONT_BODY }}>
      {i}
    </div>
  )
}

interface Props {
  postId:    string
  voyageId?: string | null
  compact?:  boolean
}

export default function PostEngagement({ postId, voyageId, compact = false }: Props) {
  const userId = useUserId()
  const mentionPeople = useMentionPeople()
  const { data: reactions } = usePostReactions(postId)
  const toggleReaction = useToggleReaction(postId)
  const { data: count = 0 } = useCommentCount(postId)
  const addComment = useAddComment(postId, { voyageId })
  const deleteComment = useDeleteComment(postId)

  const [open, setOpen] = useState(!compact)      // comment thread open (always in full mode)
  const [picker, setPicker] = useState(false)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { data: comments = [] } = usePostComments(open ? postId : undefined)
  const commentCount = open ? comments.length : count

  const mine = reactions?.mine ?? null
  const total = reactions?.total ?? 0
  const summary = Object.entries(reactions?.counts ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e]) => e)

  const react = (emoji: string) => { setPicker(false); toggleReaction.mutate(emoji) }
  const submit = async () => {
    if (!text.trim()) return
    const body = text.trim()
    setText('')
    await addComment.mutateAsync(body)
    inputRef.current?.focus()
  }

  return (
    <div style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, padding: '10px 14px 12px', fontFamily: FONT_BODY }}>
      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => (mine ? react(mine) : setPicker(p => !p))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: mine ? 'rgba(201,162,39,0.12)' : 'transparent', border: `1px solid ${mine ? 'rgba(201,162,39,0.4)' : BORDER}`, borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontSize: 14, color: mine ? NAVY2 : MUTED, fontWeight: 600 }}
          >
            <span style={{ fontSize: 15 }}>{mine ?? '🤍'}</span>
            {total > 0 ? total : 'React'}
          </button>
          {picker && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setPicker(false)} />
              <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 41, display: 'flex', gap: 2, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '5px 7px', boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}>
                {POST_REACTIONS.map(r => (
                  <button key={r.id} onClick={() => react(r.emoji)} title={r.label}
                    style={{ background: mine === r.emoji ? 'rgba(201,162,39,0.16)' : 'none', border: 'none', borderRadius: '50%', width: 34, height: 34, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>
                    {r.emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {summary.length > 0 && (
          <span style={{ fontSize: 13, color: MUTED }}>{summary.join(' ')}</span>
        )}

        <button
          onClick={() => setOpen(o => !o)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontSize: 14, color: MUTED, fontWeight: 600, marginLeft: 'auto' }}
        >
          💬 {commentCount > 0 ? commentCount : ''} {compact && !open ? 'Comment' : ''}
        </button>
      </div>

      {/* Comment thread */}
      {open && (
        <div style={{ marginTop: 12 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
              <Initials name={c.authorName} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ background: '#F4F3EF', borderRadius: '4px 14px 14px 14px', padding: '7px 12px' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: NAVY2 }}>{c.authorName}</span>
                  <div style={{ fontSize: 13.5, color: TEXT, lineHeight: 1.5, marginTop: 2 }}>
                    <RichText text={c.body} people={mentionPeople} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 3, paddingLeft: 4 }}>
                  <span style={{ fontSize: 11, color: MUTED }}>{relTime(c.createdAt)}</span>
                  {c.userId === userId && (
                    <button onClick={() => deleteComment.mutate(c.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, color: MUTED }}>Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add a comment */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 4 }}>
            <MentionInput
              ref={inputRef}
              value={text}
              onChange={setText}
              onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              placeholder="Write a comment… @ to mention"
              rows={1}
              style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '8px 14px', fontSize: 13.5, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5, color: TEXT, background: WHITE, boxSizing: 'border-box', minWidth: 0, width: '100%' }}
            />
            <button onClick={submit} disabled={!text.trim()}
              style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: text.trim() ? 'var(--t-primary)' : BORDER, color: text.trim() ? '#fff' : MUTED, border: 'none', cursor: text.trim() ? 'pointer' : 'default', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
