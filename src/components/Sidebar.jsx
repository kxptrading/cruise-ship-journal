import { NAVY2, GOLD, WHITE } from '../constants'
import { NAV } from '../constants'
import { SvgIcon } from './ui'

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
        width: 220, background: NAVY2, flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        ...(isOverlay ? {
          position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(-220px)',
          transition: 'transform 0.25s ease',
        } : {}),
      }}>
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: GOLD, fontFamily: 'Georgia,serif', letterSpacing: '0.03em' }}>
            ⚓ CRUISE LOG
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
            A Journal for Every Voyage
          </div>
        </div>

        <nav style={{ flex: 1, paddingTop: 10, paddingBottom: 10 }}>
          {NAV.map(({ id, label, icon }) => {
            const active = section === id
            return (
              <button key={id} onClick={() => onNav(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                  padding: '9px 18px',
                  background: active ? 'rgba(201,162,39,0.1)' : 'transparent',
                  color: active ? GOLD : 'rgba(255,255,255,0.62)',
                  border: 'none',
                  borderLeft: `3px solid ${active ? GOLD : 'transparent'}`,
                  cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: active ? 600 : 400,
                }}>
                <SvgIcon d={icon} size={14} color={active ? GOLD : 'rgba(255,255,255,0.35)'} />
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
