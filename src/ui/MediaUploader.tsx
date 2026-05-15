// ─────────────────────────────────────────────────────────────────────────────
// ui/MediaUploader.tsx — Drag-drop multi-file photo uploader
//
// Usage:
//   <MediaUploader
//     paths={formValues.mediaPaths}
//     userId={userId}
//     onAdd={path => setValues(v => ({ ...v, mediaPaths: [...v.mediaPaths, path] }))}
//     onRemove={path => setValues(v => ({ ...v, mediaPaths: v.mediaPaths.filter(p => p !== path) }))}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WHITE, BORDER, MUTED, NAVY2, FONT_BODY } from '@/constants'
import { uploadPostMedia, deletePostMedia, publicUrl } from '@/features/posts/mediaStorage'
import { ImagePlus, X, Loader2 } from 'lucide-react'

interface UploadingFile {
  id:       string
  name:     string
  preview:  string
  progress: number      // 0-100
  error?:   string
}

interface Props {
  paths:    string[]
  userId:   string | null
  onAdd:    (path: string) => void
  onRemove: (path: string) => void
  maxFiles?: number
}

export default function MediaUploader({ paths, userId, onAdd, onRemove, maxFiles = 10 }: Props) {
  const [uploading,  setUploading]  = useState<UploadingFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    if (!userId) return
    const imageFiles = files.filter(f => f.type.startsWith('image/')).slice(0, maxFiles - paths.length)
    if (!imageFiles.length) return

    const newUploading: UploadingFile[] = imageFiles.map(f => ({
      id:       crypto.randomUUID(),
      name:     f.name,
      preview:  URL.createObjectURL(f),
      progress: 0,
    }))
    setUploading(prev => [...prev, ...newUploading])

    await Promise.all(imageFiles.map(async (file, i) => {
      const id = newUploading[i].id
      try {
        // Simulate progress (Supabase storage doesn't expose upload progress)
        setUploading(prev => prev.map(u => u.id === id ? { ...u, progress: 40 } : u))
        const result = await uploadPostMedia(file, userId)
        setUploading(prev => prev.map(u => u.id === id ? { ...u, progress: 100 } : u))
        onAdd(result.path)
        // Clean up preview URL and remove from uploading list after a tick
        await new Promise(r => setTimeout(r, 500))
        URL.revokeObjectURL(newUploading[i].preview)
        setUploading(prev => prev.filter(u => u.id !== id))
      } catch (err) {
        URL.revokeObjectURL(newUploading[i].preview)
        setUploading(prev => prev.map(u => u.id === id ? { ...u, error: 'Upload failed', progress: 0 } : u))
        setTimeout(() => setUploading(prev => prev.filter(u => u.id !== id)), 2500)
      }
    }))
  }, [userId, paths.length, maxFiles, onAdd])

  const handleRemove = async (path: string) => {
    onRemove(path)
    try { await deletePostMedia(path) } catch { /* non-fatal */ }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }, [handleFiles])

  const canAdd = paths.length + uploading.length < maxFiles

  return (
    <div>
      {/* Upload zone */}
      {canAdd && (
        <motion.div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          animate={{ borderColor: isDragOver ? 'var(--t-primary)' : BORDER, background: isDragOver ? 'var(--t-bg)' : WHITE }}
          style={{ border: `2px dashed ${BORDER}`, borderRadius: 12, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', marginBottom: (paths.length + uploading.length) > 0 ? 12 : 0 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <ImagePlus size={28} color={isDragOver ? 'var(--t-primary)' : MUTED} strokeWidth={1.5} />
            <div style={{ fontSize: 13, fontWeight: 600, color: isDragOver ? 'var(--t-primary)' : NAVY2, fontFamily: FONT_BODY }}>
              {isDragOver ? 'Drop to upload' : 'Add photos'}
            </div>
            <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
              Drag and drop or click to browse · {maxFiles - paths.length - uploading.length} remaining
            </div>
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => { if (e.target.files) handleFiles(Array.from(e.target.files)); e.target.value = '' }} />
        </motion.div>
      )}

      {/* Thumbnails: uploaded + uploading */}
      {(paths.length > 0 || uploading.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {/* Confirmed uploads */}
          {paths.map(path => (
            <div key={path} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
              <img src={publicUrl(path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button
                onClick={() => handleRemove(path)}
                style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* In-progress uploads */}
          <AnimatePresence>
            {uploading.map(u => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}
              >
                <img src={u.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.55 }} />
                {/* Progress overlay */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', gap: 6 }}>
                  {u.error ? (
                    <span style={{ fontSize: 10, color: '#FCA5A5', fontFamily: FONT_BODY, fontWeight: 700, textAlign: 'center', padding: '0 4px' }}>Failed</span>
                  ) : (
                    <>
                      <Loader2 size={18} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} />
                      <div style={{ width: '60%', height: 3, background: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${u.progress}%`, background: '#fff', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
