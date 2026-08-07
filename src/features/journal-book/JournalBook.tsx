// ─────────────────────────────────────────────────────────────────────────────
// features/journal-book/JournalBook.tsx — full-screen book viewer overlay
//
// Renders the mapped Book as a page-flip "book": cover + one page per logged day.
// Mounted in a portal over the app. Scales the fixed 576×864 page box to fit the
// viewport, and navigates with prev/next buttons, arrow keys, and swipe. The
// book-open intro + page-turn motion live here (Framer Motion, reduced-motion
// aware via the app-level MotionConfig).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useVoyageBook } from './hooks'
import { PAGE_W, PAGE_H, BOOK, BOOK_FONT } from './tokens'
import BookCover from './BookCover'
import BookDayPage from './BookDayPage'

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return size
}

export default function JournalBook({ voyageId, onClose }: { voyageId: string; onClose: () => void }) {
  const { data: book, isLoading, error } = useVoyageBook(voyageId)
  const { w: vw, h: vh } = useViewport()
  const reduce = useReducedMotion()

  const [index, setIndex] = useState(0)     // 0 = cover, 1..N = day pages
  const [dir, setDir] = useState(1)         // flip direction for the transition

  const total = book ? book.days.length + 1 : 1
  const go = (next: number) => {
    if (next < 0 || next >= total) return
    setDir(next > index ? 1 : -1)
    setIndex(next)
  }

  // Keyboard: ←/→ flip, Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(index + 1)
      else if (e.key === 'ArrowLeft') go(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, total]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scale the 576×864 page to fit, leaving room for controls/padding. Allow it
  // to grow past 1× on large screens so the (roomier) layout has space to breathe.
  const scale = Math.min((vw - 40) / PAGE_W, (vh - 120) / PAGE_H, 1.35)
  const boxW = PAGE_W * scale
  const boxH = PAGE_H * scale

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voyage journal"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(28,25,20,0.82)', backdropFilter: 'blur(3px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
      }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close journal"
        style={{ position: 'fixed', top: 18, right: 18, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={20} />
      </button>

      {/* The book page (stop propagation so clicks inside don't close). The
          intro "opens" the book: it scales up and swings on its spine (rotateY)
          before settling — the voyage-book animation. Reduced motion → fade. */}
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, rotateY: -22, transformPerspective: 1600 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotateY: 0, transformPerspective: 1600 }}
        transition={{ duration: reduce ? 0.2 : 0.6, ease: [0.2, 0.7, 0.3, 1] }}
        style={{ position: 'relative', width: boxW, height: boxH, boxShadow: '0 24px 70px rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden', background: BOOK.paper, transformOrigin: 'left center' }}
      >
        {isLoading && <CenterNote><Loader2 size={22} className="animate-spin" /> Opening your journal…</CenterNote>}
        {error && <CenterNote>Couldn’t load this journal.</CenterNote>}
        {book && book.days.length === 0 && index === 0 && null /* cover still shows */}

        {book && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.div
                key={index}
                custom={dir}
                initial={reduce ? { opacity: 0 } : { rotateY: dir > 0 ? 35 : -35, opacity: 0, transformPerspective: 1400 }}
                animate={reduce ? { opacity: 1 } : { rotateY: 0, opacity: 1, transformPerspective: 1400 }}
                exit={reduce ? { opacity: 0 } : { rotateY: dir > 0 ? -35 : 35, opacity: 0, transformPerspective: 1400 }}
                transition={{ duration: reduce ? 0.2 : 0.45, ease: [0.22, 0.61, 0.36, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.14}
                onDragEnd={(_e, info) => {
                  if (info.offset.x < -70) go(index + 1)
                  else if (info.offset.x > 70) go(index - 1)
                }}
                style={{ position: 'absolute', inset: 0, transformOrigin: dir > 0 ? 'left center' : 'right center' }}
              >
                {/* Scale wrapper: fixed 576×864 coordinate box scaled to fit */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                  {index === 0
                    ? <BookCover cover={book.cover} />
                    : <BookDayPage day={book.days[index - 1]} pageNumber={index + 1} />}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Controls — or an empty-state note when the voyage has no logged days */}
      {book && book.days.length === 0 && (
        <div onClick={e => e.stopPropagation()} style={{ fontFamily: BOOK_FONT.body, fontSize: 13, color: 'rgba(255,255,255,0.82)', textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
          No journal entries yet — log a day in this voyage and it’ll fill your book.
        </div>
      )}
      {book && book.days.length > 0 && (
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <NavBtn dir="prev" disabled={index === 0} onClick={() => go(index - 1)} />
          <span style={{ fontFamily: BOOK_FONT.body, fontSize: 12, letterSpacing: 1, color: 'rgba(255,255,255,0.75)', minWidth: 74, textAlign: 'center' }}>
            {index === 0 ? 'COVER' : `${index} / ${book.days.length}`}
          </span>
          <NavBtn dir="next" disabled={index >= total - 1} onClick={() => go(index + 1)} />
        </div>
      )}
    </div>
  )

  return createPortal(content, document.body)
}

function NavBtn({ dir, disabled, onClick }: { dir: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous page' : 'Next page'}
      style={{
        width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: disabled ? 'rgba(255,255,255,0.08)' : BOOK.mustard, color: disabled ? 'rgba(255,255,255,0.3)' : BOOK.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {dir === 'prev' ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
    </button>
  )
}

function CenterNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: BOOK_FONT.body, fontSize: 14, color: BOOK.inkSoft }}>
      {children}
    </div>
  )
}
