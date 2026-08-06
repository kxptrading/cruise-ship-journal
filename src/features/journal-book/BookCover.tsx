// ─────────────────────────────────────────────────────────────────────────────
// features/journal-book/BookCover.tsx — the journal cover page
//
// Recreates the handoff "Cover": rotated wordmark, subtitle, a large rotated
// polaroid of the voyage cover photo, a dashed "BON VOYAGE" stamp, washi tape,
// a "this journal belongs to" line, and the striped footer band.
// ─────────────────────────────────────────────────────────────────────────────

import { BOOK, BOOK_FONT } from './tokens'
import { WashiTape } from './primitives'
import type { BookCover as BookCoverModel } from './mapping'

export default function BookCover({ cover }: { cover: BookCoverModel }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: BOOK.paper,
      backgroundImage: BOOK.grain, backgroundSize: BOOK.grainSize,
      fontFamily: BOOK_FONT.body, overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(204,107,73,0.06), transparent 30%)' }} />

      {/* Washi tape, top corners (gold + navy, on-brand) */}
      <WashiTape color="linear-gradient(135deg, rgba(201,162,39,0.9), rgba(201,162,39,0.65))" w={76} h={26} rotate={-7} style={{ top: 34, left: 44 }} />
      <WashiTape color="linear-gradient(135deg, rgba(27,58,92,0.8), rgba(27,58,92,0.55))" w={70} h={24} rotate={9} style={{ top: 40, right: 56 }} />

      {/* Wordmark + subtitle */}
      <div style={{ position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: BOOK_FONT.hand, fontWeight: 700, fontSize: 84, color: BOOK.terracotta, transform: 'rotate(-2deg)', lineHeight: 0.92 }}>
          {cover.title}
        </div>
        <div style={{ marginTop: 8, fontFamily: BOOK_FONT.body, fontWeight: 600, fontStyle: 'italic', letterSpacing: 1, color: BOOK.inkSoft, fontSize: 15 }}>
          {cover.subtitle}
        </div>
        {cover.dateRange && (
          <div style={{ marginTop: 6, fontFamily: BOOK_FONT.body, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: BOOK.olive }}>
            {cover.dateRange}
          </div>
        )}
      </div>

      {/* Cover polaroid */}
      <div style={{ position: 'absolute', top: 330, left: '50%', transform: 'translateX(-50%) rotate(-4deg)', background: BOOK.card, padding: '12px 12px 34px 12px', boxShadow: '0 8px 20px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.08)', width: 230 }}>
        {cover.photoUrl
          ? <img src={cover.photoUrl} alt="" style={{ display: 'block', width: '100%', height: 230, objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: 230, background: 'rgba(45,42,36,0.06)' }} />}
        <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontFamily: BOOK_FONT.hand, fontSize: 17, color: BOOK.inkSoft }}>
          my little life abroad
        </div>
      </div>

      {/* BON VOYAGE stamp */}
      <div style={{ position: 'absolute', top: 300, right: 40, width: 78, height: 78, borderRadius: '50%', border: `3px dotted ${BOOK.terracotta}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(11deg)', background: 'rgba(246,239,224,0.6)' }}>
        <div style={{ fontFamily: BOOK_FONT.hand, fontWeight: 700, fontSize: 14, color: BOOK.terracotta, textAlign: 'center', lineHeight: 1.15 }}>BON<br />VOYAGE</div>
      </div>

      {/* Belongs-to line */}
      <div style={{ position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: BOOK_FONT.body, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: BOOK.olive, marginBottom: 10 }}>
          this journal belongs to
        </div>
        {cover.owner
          ? <div style={{ fontFamily: BOOK_FONT.hand, fontWeight: 700, fontSize: 26, color: BOOK.ink }}>{cover.owner}</div>
          : <div style={{ width: 220, margin: '0 auto', borderBottom: `2px dashed ${BOOK.hairStrong}`, height: 26 }} />}
      </div>

      {/* Striped footer band */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, background: `repeating-linear-gradient(90deg, ${BOOK.terracotta} 0 16px, ${BOOK.mustard} 16px 32px)` }} />
    </div>
  )
}
