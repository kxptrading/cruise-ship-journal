import { NAVY2, GOLD, WHITE } from '../constants'
import { NAV } from '../constants'
import { SvgIcon } from './ui'

const CLOSE_PATH = 'M18 6L6 18M6 6l12 12'

export default function Sidebar({ section, onNav, isOverlay, isOpen, onClose }) {
  return (
    <>
      {isOverlay && isOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }}
        />
      )}

      <aside style={{
        width: 240, background: NAVY2, flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        ...(isOverlay ? {
          position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(-240px)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.35)' : 'none',
        } : {}),
      }}>

        {/* Header */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: GOLD, fontFamily: 'Georgia,serif', letterSpacing: '0.03em' }}>
              ⚓ CRUISE LOG
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
              A Journal for Every Voyage
            </div>
          </div>
          {isOverlay && (
            <button onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 8, marginTop: 2 }}>
              <SvgIcon d={CLOSE_PATH} size={16} color="rgba(255,255,255,0.5)" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}>
          {NAV.map(({ id, label, icon }) => {
            const active = section === id
            return (
              <button key={id} onClick={() => onNav(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                  padding: '11px 18px',
                  background: active ? 'rgba(201,162,39,0.1)' : 'transparent',
                  color: active ? GOLD : 'rgba(255,255,255,0.62)',
                  border: 'none',
                  borderLeft: `3px solid ${active ? GOLD : 'transparent'}`,
                  cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: active ? 600 : 400,
                  transition: 'background 0.15s',
                }}>
                <SvgIcon d={icon} size={15} color={active ? GOLD : 'rgba(255,255,255,0.35)'} />
                {label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 10, color: 'rgba(255,255,255,0.18)', textAlign: 'center', letterSpacing: '0.05em' }}>
          DATA SAVED LOCALLY
        </div>
      </aside>
    </>
  )
}
