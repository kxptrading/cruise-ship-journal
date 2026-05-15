// ─────────────────────────────────────────────────────────────────────────────
// pages/PostComposerPage.tsx — Create a new post (/voyages/:id/posts/new)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NAVY2, MUTED, BORDER, FONT_DISPLAY, FONT_BODY, sty } from '@/constants'
import { useCreatePost } from '@/features/posts/hooks'
import PostEditorForm, { EMPTY_POST_FORM, type PostFormValues } from '@/features/posts/PostEditorForm'
import { ArrowLeft } from 'lucide-react'

export default function PostComposerPage() {
  const navigate          = useNavigate()
  const { voyageId }      = useParams<{ voyageId: string }>()
  const createPost        = useCreatePost()
  const [values, setValues] = useState<PostFormValues>(EMPTY_POST_FORM)
  const [saving, setSaving] = useState(false)

  const canSave = values.body.trim().length > 0

  const handleSave = async () => {
    if (!voyageId || !canSave) return
    setSaving(true)
    try {
      const post = await createPost.mutateAsync({
        voyage_id: voyageId,
        title:     values.title.trim() || undefined,
        body:      values.body.trim(),
        post_date: values.postDate || undefined,
        location:  values.location.trim() || undefined,
        audience:     values.audience,
        media_paths: values.mediaPaths,
      })
      navigate(`/voyages/${voyageId}/posts/${post.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(voyageId ? `/voyages/${voyageId}` : '/voyages')}
            style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
            New Post
          </h1>
        </div>
        <motion.button
          onClick={handleSave}
          disabled={!canSave || saving}
          whileTap={canSave ? { scale: 0.96 } : undefined}
          className="btn-primary"
          style={{ ...sty.btn, fontSize: 14, padding: '9px 24px', opacity: canSave && !saving ? 1 : 0.45, cursor: canSave && !saving ? 'pointer' : 'not-allowed' }}
        >
          {saving ? 'Saving…' : 'Save Post'}
        </motion.button>
      </div>
      <PostEditorForm values={values} onChange={setValues} />
    </div>
  )
}
