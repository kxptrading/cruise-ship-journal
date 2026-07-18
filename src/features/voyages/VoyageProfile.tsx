// ─────────────────────────────────────────────────────────────────────────────
// sections/VoyageProfile.tsx — Multi-voyage manager
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import { NAVY, NAVY2, GOLD, WHITE, CREAM, BORDER, TEXT, MUTED, BP, sty } from '@/constants'
import FE from '@/components/FE'
import { useW } from '@/context'
import { PgHdr, Fld, Row2, Inp } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import ImageCropper from '@/components/ImageCropper'
import type { Voyage, VoyageListRow } from '@/types'
import type { Session } from '@supabase/supabase-js'

const COVER_ASPECT = 840 / 220

interface VoyageCardProps {
  voyage:   VoyageListRow
  isActive: boolean
  onSwitch: (id: string) => void
}

function VoyageCard({ voyage, isActive, onSwitch }: VoyageCardProps) {
  const nights    = voyage.total_nights
  const dateRange = [voyage.departure_date, voyage.return_date].filter(Boolean).join(' → ')

  const today  = new Date(); today.setHours(0, 0, 0, 0)
  const dep    = voyage.departure_date ? new Date(voyage.departure_date + 'T00:00:00') : null
  const ret    = voyage.return_date    ? new Date(voyage.return_date    + 'T00:00:00') : null
  const status = dep && ret
    ? (today < dep ? 'upcoming' : today <= ret ? 'sailing' : 'past')
    : 'no-dates'

  const STATUS_STYLE: Record<string, { label: string; bg: string; border: string; color: string }> = {
    sailing:   { label: 'SAILING NOW', bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' },
    upcoming:  { label: 'UPCOMING',    bg: '#EFF6FF', border: '#93C5FD', color: '#1D4ED8' },
    past:      { label: 'PAST',        bg: '#F3F4F6', border: '#D1D5DB', color: '#6B7280' },
    'no-dates':{ label: 'SELECTED',    bg: GOLD + '20', border: GOLD + '40', color: GOLD  },
  }
  const pill = STATUS_STYLE[status]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: isActive ? NAVY + '08' : WHITE, border: `2px solid ${isActive ? NAVY : BORDER}`, borderRadius: 12, padding: '14px 16px', transition: 'border-color 0.15s' }}>
      <div style={{ width: 64, height: 64, borderRadius: 10, flexShrink: 0, overflow: 'hidden', background: voyage.cover_photo_url ? 'transparent' : NAVY2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {voyage.cover_photo_url
          ? <img src={voyage.cover_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <FE emoji="🚢" size={26} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {voyage.ship_name || 'Unnamed Voyage'}
        </div>
        {voyage.cruise_line && <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>{voyage.cruise_line}</div>}
        {(dateRange || nights) && (
          <div style={{ fontSize: 12, color: MUTED }}>
            {dateRange}{dateRange && nights ? ' · ' : ''}{nights ? `${nights} nights` : ''}
          </div>
        )}
      </div>
      {isActive ? (
        <div style={{ background: pill.bg, border: `1px solid ${pill.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: pill.color, flexShrink: 0, letterSpacing: '0.04em' }}>
          {pill.label}
        </div>
      ) : (
        <button onClick={() => onSwitch(voyage.id)} style={{ background: NAVY, color: WHITE, border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          Switch →
        </button>
      )}
    </div>
  )
}

// The inline "new voyage" form was removed when voyage creation became
// pass-gated: the "+ Plan a New Voyage" button now routes to /voyages/new (the
// gated editor) via the onCreate prop.

interface Props {
  voyage:             Voyage
  allVoyages:         VoyageListRow[]
  voyageId:           string | null
  session:            Session | null
  onSwitch:           (id: string) => void
  onCreate:           () => void   // routes to the pass-gated editor (/voyages/new)
  onCoverPhotoChange: (url: string | null) => void
}

export default function VoyageProfile({ voyage, allVoyages, voyageId, session, onSwitch, onCreate, onCoverPhotoChange }: Props) {
  const w       = useW()
  const cs      = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const fileRef = useRef<HTMLInputElement>(null)

  const [uploading,    setUploading]    = useState<boolean>(false)
  const [uploadError,  setUploadError]  = useState<string>('')
  const [cropFile,     setCropFile]     = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) setCropFile(file)
  }

  const handleCropConfirm = async (blob: Blob | null) => {
    setCropFile(null)
    if (!blob || !voyageId || !session?.user?.id) return

    setUploading(true)
    setUploadError('')

    const path = `${session.user.id}/${voyageId}/cover.jpg`
    const { error: uploadErr } = await supabase.storage.from('voyage-covers').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

    if (uploadErr) {
      setUploadError('Upload failed — please try again.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('voyage-covers').getPublicUrl(path)
    const freshUrl = `${publicUrl}?t=${Date.now()}`

    await supabase.from('voyages').update({ cover_photo_url: freshUrl }).eq('id', voyageId)
    onCoverPhotoChange(freshUrl)
    setUploading(false)
  }

  const handleRemoveCover = async () => {
    await supabase.from('voyages').update({ cover_photo_url: null }).eq('id', voyageId)
    onCoverPhotoChange(null)
  }

  const currentCover = voyage.coverPhotoUrl

  return (
    <div>
      <PgHdr icon="🗂️" title="My Voyages" sub="Switch between cruises or plan a new voyage" />

      <div style={cs}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          Cover Photo — {voyage.shipName || 'Active Voyage'}
        </div>

        <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', border: `2px dashed ${currentCover ? 'transparent' : BORDER}`, background: currentCover ? 'transparent' : CREAM, marginBottom: 14, position: 'relative' }}>
          {currentCover ? (
            <>
              <img src={currentCover} alt="Voyage cover" style={{ width: '100%', height: w < BP.mobile ? 180 : 240, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 8 }}>
                <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ background: 'rgba(0,0,0,0.6)', color: WHITE, border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
                  {uploading ? 'Uploading…' : <><FE emoji="📷" size={12} /> Change</>}
                </button>
                <button onClick={handleRemoveCover} style={{ background: 'rgba(220,38,38,0.75)', color: WHITE, border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>Remove</button>
              </div>
            </>
          ) : (
            <div onClick={() => fileRef.current?.click()} style={{ padding: w < BP.mobile ? '40px 20px' : '56px 32px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ marginBottom: 10 }}><FE emoji="🌅" size={36} /></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Add a Cover Photo</div>
              <div style={{ fontSize: 13, color: MUTED }}>{uploading ? 'Uploading…' : 'Upload a photo of your ship or first port'}</div>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />

        {cropFile && (
          <ImageCropper file={cropFile} aspect={COVER_ASPECT} label="cover photo" onConfirm={handleCropConfirm} onCancel={() => setCropFile(null)} />
        )}

        {uploadError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginTop: 8 }}>{uploadError}</div>
        )}
      </div>

      <div style={cs}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          All Voyages ({allVoyages.length})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allVoyages.map(v => (
            <VoyageCard key={v.id} voyage={v} isActive={v.id === voyageId} onSwitch={onSwitch} />
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <button onClick={() => onCreate()} style={{ width: '100%', background: 'transparent', border: `2px dashed ${BORDER}`, borderRadius: 12, padding: '14px 20px', cursor: 'pointer', fontSize: 14, color: MUTED, fontFamily: 'inherit', fontWeight: 600, transition: 'border-color 0.15s' }}>
            + Plan a New Voyage
          </button>
        </div>
      </div>
    </div>
  )
}
