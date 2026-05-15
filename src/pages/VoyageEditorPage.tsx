// ─────────────────────────────────────────────────────────────────────────────
// pages/VoyageEditorPage.tsx — Create or edit a voyage (spec §4)
//
// Mode is determined by the presence of :voyageId in the URL:
//   /voyages/new          → create
//   /voyages/:id/edit     → edit (pre-fills form from React Query)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { NAVY2, MUTED, WHITE, BORDER, FONT_DISPLAY, FONT_BODY, sty } from '@/constants'
import { useVoyage, useCreateVoyage, useUpdateVoyage, useDeleteVoyage } from '@/features/voyages/hooks'
import { fromDbVoyage, toDbVoyage } from '@/lib/converters'
import VoyageFormSection from '@/features/voyages/VoyageForm'
import { SkeletonCard } from '@/components/ui/skeleton'
import type { Voyage } from '@/types'
import { EMPTY_VOYAGE } from '@/types'
import { ArrowLeft, Trash2 } from 'lucide-react'

export default function VoyageEditorPage() {
  const navigate   = useNavigate()
  const { voyageId } = useParams<{ voyageId: string }>()
  const isEdit     = !!voyageId && voyageId !== 'new'

  // React Query
  const { data: existingRow, isLoading } = useVoyage(isEdit ? voyageId : null)
  const createVoyage = useCreateVoyage()
  const updateVoyage = useUpdateVoyage()
  const deleteVoyage = useDeleteVoyage()

  // Local form state — mirror the legacy Voyage shape (VoyageForm expects it)
  const [formData, setFormData] = useState<Voyage>(EMPTY_VOYAGE)
  const [saving,   setSaving]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Pre-fill from DB once loaded
  useEffect(() => {
    if (existingRow) setFormData(fromDbVoyage(existingRow))
  }, [existingRow])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isEdit && voyageId) {
        await updateVoyage.mutateAsync({ id: voyageId, ...toDbVoyage(formData) })
        navigate(`/voyages/${voyageId}`)
      } else {
        const newRow = await createVoyage.mutateAsync(toDbVoyage(formData))
        navigate(`/voyages/${newRow.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!voyageId) return
    await deleteVoyage.mutateAsync(voyageId)
    navigate('/voyages')
  }

  if (isEdit && isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(isEdit && voyageId ? `/voyages/${voyageId}` : '/voyages')}
            style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
            {isEdit ? 'Edit Voyage' : 'New Voyage'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {isEdit && (
            <motion.button
              onClick={() => setConfirmDelete(true)}
              whileTap={{ scale: 0.96 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: '#DC2626', fontFamily: FONT_BODY }}
            >
              <Trash2 size={14} /> Delete
            </motion.button>
          )}
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileTap={{ scale: 0.96 }}
            className="btn-primary"
            style={{ ...sty.btn, fontSize: 14, padding: '8px 22px', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Voyage'}
          </motion.button>
        </div>
      </div>

      {/* Form — reuses existing VoyageForm component */}
      <VoyageFormSection data={formData} onChange={setFormData} />

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: WHITE, borderRadius: 18, padding: '28px 28px 24px', maxWidth: 360, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>Delete this voyage?</h3>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: MUTED, lineHeight: 1.6, fontFamily: FONT_BODY }}>
                This will permanently delete the voyage and all its posts, daily logs, and journal data. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmDelete(false)}
                  style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}>
                  Cancel
                </button>
                <button onClick={handleDelete}
                  style={{ background: '#DC2626', color: WHITE, border: 'none', borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: FONT_BODY }}>
                  Yes, delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
