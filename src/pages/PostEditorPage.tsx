// ─────────────────────────────────────────────────────────────────────────────
// pages/PostEditorPage.tsx — Edit an existing post (/voyages/:id/posts/:postId/edit)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { NAVY2, MUTED, WHITE, BORDER, FONT_DISPLAY, FONT_BODY, sty } from '@/constants'
import { usePost, useUpdatePost } from '@/features/posts/hooks'
import PostEditorForm, { EMPTY_POST_FORM, type PostFormValues } from '@/features/posts/PostEditorForm'
import EditConfirmBanner from '@/features/posts/EditConfirmBanner'
import { SkeletonCard } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'

export default function PostEditorPage() {
  const navigate              = useNavigate()
  const { voyageId, postId }  = useParams<{ voyageId: string; postId: string }>()
  const { data: post, isLoading } = usePost(postId)
  const updatePost            = useUpdatePost()
  const [values, setValues]   = useState<PostFormValues>(EMPTY_POST_FORM)
  const [saving, setSaving]   = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    if (post) {
      setValues({
        title:    post.title    ?? '',
        body:     post.body     ?? '',
        postDate: post.post_date ?? '',
        location: post.location  ?? '',
        audience:    post.audience,
        mediaPaths: post.media_paths ?? [],
      })
    }
  }, [post])

  const showBanner = post && post.audience !== 'private' && !bannerDismissed

  const handleSave = async () => {
    if (!postId || !values.body.trim()) return
    setSaving(true)
    try {
      await updatePost.mutateAsync({
        id:        postId,
        title:     values.title.trim()    || null,
        body:      values.body.trim(),
        post_date: values.postDate        || null,
        location:  values.location.trim() || null,
        audience:     values.audience,
        media_paths: values.mediaPaths,
      })
      navigate(`/voyages/${voyageId}/posts/${postId}`)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><SkeletonCard /><SkeletonCard /></div>

  return (
    <div>
      <AnimatePresence>
        {showBanner && (
          <EditConfirmBanner
            audience={post.audience}
            onDismiss={() => setBannerDismissed(true)}
            onChangeAudience={a => setValues(v => ({ ...v, audience: a }))}
          />
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(`/voyages/${voyageId}/posts/${postId}`)}
            style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>Edit Post</h1>
        </div>
        <motion.button
          onClick={handleSave}
          disabled={!values.body.trim() || saving}
          whileTap={{ scale: 0.96 }}
          className="btn-primary"
          style={{ ...sty.btn, fontSize: 14, padding: '9px 24px', opacity: values.body.trim() && !saving ? 1 : 0.45 }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </motion.button>
      </div>

      <PostEditorForm values={values} onChange={setValues} />
    </div>
  )
}
