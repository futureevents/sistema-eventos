'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

/**
 * Shell responsivo do app. Em ≥1024px a sidebar fica fixa em coluna; abaixo
 * disso ela vira uma gaveta off-canvas controlada pelo botão de menu da barra
 * móvel (some por CSS no desktop — ver globals.css, Parte 4 /adapt).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Fecha a gaveta ao navegar para outra rota.
  useEffect(() => { setMobileOpen(false) }, [pathname]) // eslint-disable-line react-hooks/set-state-in-effect

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--fe-surface)' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      {mobileOpen && <div className="fe-sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Barra móvel: só aparece abaixo de 1024px (display via CSS) */}
        <div
          className="fe-mobile-bar"
          style={{
            alignItems: 'center', gap: 10, height: 48, padding: '0 8px 0 6px',
            borderBottom: '1px solid var(--fe-border-soft)', background: 'var(--fe-surface)',
            position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            style={{ width: 40, height: 40, borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 7, background: 'var(--fe-accent)', color: '#fff', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '-0.3px' }}>FE</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fe-text-strong)' }}>Future Events</span>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
