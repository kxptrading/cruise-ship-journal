// ─────────────────────────────────────────────────────────────────────────────
// sections/VoyageProfile.tsx — Multi-voyage manager
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import { NAVY, NAVY2, GOLD, WHITE, CREAM, BORDER, TEXT, MUTED, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Fld, Row2, Inp } from '../components/ui'
import { supabase } from '../lib/supabase'
import ImageCropper from '../components/ImageCropper'
import type { Voyage, VoyageListRow } from '../types'
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
          : <span style={{ fontSize: 26 }}>🚢</span>
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

interface NewVoyageFields {
  shipName:       string
  cruiseLine:     string
  departureDate:  string
  returnDate:     string
  totalNights:    string
}

interface NewVoyageFormProps {
  onCreate:  (partial: Record<string, unknown>) => Promise<void>
  onCancel:  () => void
}

function NewVoyageForm({ onCreate, onCancel }: NewVoyageFormProps) {
  const [fields, setFields] = useState<NewVoyageFields>({ shipName: '', cruiseLine: '', departureDate: '', returnDate: '', totalNights: '' })
  const [saving, setSaving] = useState<boolean>(false)

  const set = (f: keyof NewVoyageFields, v: string) => setFields(p => ({ ...p, [f]: v }))

  const handleCreate = async () => {
    if (!fields.shipName.trim()) return
    setSaving(true)
    await onCreate({
      ship_name:      fields.shipName.trim()   || null,
      cruise_line:    fields.cruiseLine.trim() || null,
      departure_date: fields.departureDate     || null,
      return_date:    fields.returnDate        || null,
      total_nights:   fields.totalNights ? parseInt(fields.totalNights, 10) : null,
    })
    setSaving(false)
  }

  return (
    <div style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginTop: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>New Voyage</div>
      <Fld label="Ship Name"><Inp value={fields.shipName} onChange={(v: string) => set('shipName', v)} placeholder="e.g. Wonder of the Seas" /></Fld>
      <Fld label="Cruise Line"><Inp value={fields.cruiseLine} onChange={(v: string) => set('cruiseLine', v)} placeholder="e.g. Royal Caribbean" /></Fld>
      <Row2>
        <Fld label="Departure Date" half><Inp type="date" value={fields.departureDate} onChange={(v: string) => set('departureDate', v)} /></Fld>
        <Fld label="Return Date" half><Inp type="date" value={fields.returnDate} onChange={(v: string) => set('returnDate', v)} /></Fld>
      </Row2>
      <Fld label="Total Nights"><Inp type="number" value={fields.totalNights} onChange={(v: string) => set('totalNights', v)} placeholder="e.g. 14" /></Fld>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={handleCreate} disabled={saving || !fields.shipName.trim()} style={{ ...sty.btn, fontSize: 13, padding: '9px 20px', opacity: saving || !fields.shipName.trim() ? 0.5 : 1, cursor: saving || !fields.shipName.trim() ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Creating…' : 'Create Voyage'}
        </button>
        <button onClick={onCancel} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: MUTED }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

interface Props {
  voyage:             Voyage
  allVoyages:         VoyageListRow[]
  voyageId:           string | null
  session:            Session | null
  onSwitch:           (id: string) => void
  onCreate:           (partial: Record<string, unknown>) => Promise<void>
  onCoverPhotoChange: (url: string | null) => void
}

export default function VoyageProfile({ voyage, allVoyages, voyageId, session, onSwitch, onCreate, onCoverPhotoChange }: Props) {
  const w       = useW()
  const cs      = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const fileRef = useRef<HTMLInputElement>(null)

  const [uploading,    setUploading]    = useState<boolean>(false)
  const [showNewForm,  setShowNewForm]  = useState<boolean>(false)
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

  const handleCreate = async (partial: Record<string, unknown>) => {
    await onCreate(partial)
    setShowNewForm(false)
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
                  {uploading ? 'Uploading…' : '📷 Change'}
                </button>
                <button onClick={handleRemoveCover} style={{ background: 'rgba(220,38,38,0.75)', color: WHITE, border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>Remove</button>
              </div>
            </>
          ) : (
            <div onClick={() => fileRef.current?.click()} style={{ padding: w < BP.mobile ? '40px 20px' : '56px 32px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🌅</div>
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
          {showNewForm ? (
            <NewVoyageForm onCreate={handleCreate} onCancel={() => setShowNewForm(false)} />
          ) : (
            <button onClick={() => setShowNewForm(true)} style={{ width: '100%', background: 'transparent', border: `2px dashed ${BORDER}`, borderRadius: 12, padding: '14px 20px', cursor: 'pointer', fontSize: 14, color: MUTED, fontFamily: 'inherit', fontWeight: 600, transition: 'border-color 0.15s' }}>
              + Plan a New Voyage
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
