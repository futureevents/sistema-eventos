'use client'

import { useState, useMemo, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NAV, type NavSpace, type NavFolder } from '@/lib/nav'

export function Sidebar({ mobileOpen = false, onClose, collapsed = false, onToggleCollapse }: { mobileOpen?: boolean; onClose?: () => void; collapsed?: boolean; onToggleCollapse?: () => void } = {}) {
  const pathname = usePathname()
  const router = useRouter()

  const initialOpenSpaces = useMemo(() => {
    const set = new Set<string>()
    for (const space of NAV) {
      for (const folder of space.folders) {
        for (const list of folder.lists) {
          if (pathname.startsWith(list.href)) {
            set.add(space.slug)
          }
        }
      }
    }
    if (set.size === 0) set.add('entregas')
    return set
  }, [pathname])

  const initialOpenFolders = useMemo(() => {
    const set = new Set<string>()
    for (const space of NAV) {
      for (const folder of space.folders) {
        for (const list of folder.lists) {
          if (pathname.startsWith(list.href)) {
            set.add(`${space.slug}/${folder.slug}`)
          }
        }
      }
    }
    if (set.size === 0) set.add('entregas/base-de-dados')
    return set
  }, [pathname])

  const [openSpaces, setOpenSpaces] = useState<Set<string>>(initialOpenSpaces)
  const [openFolders, setOpenFolders] = useState<Set<string>>(initialOpenFolders)

  function toggleSpace(slug: string) {
    setOpenSpaces((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  function toggleFolder(key: string) {
    setOpenFolders((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={`fe-sidebar${mobileOpen ? ' fe-sidebar-open' : ''}`}
      style={{
        background: 'var(--fe-sidebar)',
        borderRight: '1px solid var(--fe-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: collapsed ? 56 : undefined,
        minWidth: collapsed ? 56 : undefined,
        maxWidth: collapsed ? 56 : undefined,
        transition: 'width var(--fe-dur-fast) var(--fe-ease), min-width var(--fe-dur-fast) var(--fe-ease), max-width var(--fe-dur-fast) var(--fe-ease)',
      }}
    >
      {/* Fechar gaveta (só na barra móvel) */}
      <button
        onClick={onClose}
        aria-label="Fechar menu"
        className="fe-mobile-only"
        style={{ position: 'absolute', top: 14, right: 10, width: 32, height: 32, borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-muted)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>

      {/* Workspace switcher */}
      <div style={{ margin: '14px 12px 6px', height: 52, display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0, position: 'relative' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '0 10px',
            height: 52,
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--fe-radius-lg)',
            cursor: 'pointer',
            textAlign: 'left',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <span
            style={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: 9,
              background: 'var(--fe-accent)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '-0.3px',
            }}
          >
            FE
          </span>
          {!collapsed && (
            <>
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--fe-text-strong)', lineHeight: 1.2 }}>Future Events</span>
                <span style={{ fontSize: 12, color: 'var(--fe-text-muted)', lineHeight: 1.3 }}>Workspace</span>
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fe-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </>
          )}
        </button>
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            title="Recolher sidebar"
            aria-label="Recolher sidebar"
            style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', color: 'var(--fe-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, flexShrink: 0 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--fe-text-strong)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--fe-surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--fe-text-muted)' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        )}
      </div>

      {/* Busca */}
      {collapsed ? (
        <div style={{ padding: '8px 0 10px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <button
            title="Buscar (⌘K)"
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', cursor: 'pointer' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--fe-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </button>
        </div>
      ) : (
        <div style={{ padding: '8px 12px 10px', flexShrink: 0 }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              height: 38,
              padding: '0 11px',
              borderRadius: 'var(--fe-radius-md)',
              border: '1px solid var(--fe-border)',
              background: 'var(--fe-surface)',
              cursor: 'pointer',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--fe-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <span style={{ flex: 1, fontSize: 13.5, color: 'var(--fe-text-muted)', textAlign: 'left' }}>Buscar</span>
            <kbd style={{ fontFamily: 'inherit', fontSize: 11, color: 'var(--fe-text-muted)', background: 'var(--fe-track)', border: '1px solid var(--fe-border)', borderRadius: 5, padding: '1px 6px' }}>⌘K</kbd>
          </button>
        </div>
      )}

      {/* Scroll area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: collapsed ? '6px 0 12px' : '6px 10px 12px' }}>
        {collapsed ? (
          /* Modo recolhido: ícones centralizados */
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <CollapsedIconLink href="/inbox" label="Inbox" pathname={pathname}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            </CollapsedIconLink>
            <CollapsedIconLink href="/updates" label="Updates do dia" pathname={pathname}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </CollapsedIconLink>
            <CollapsedIconLink href="/minhas-atividades" label="Minhas atividades" pathname={pathname}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CollapsedIconLink>
            <div style={{ width: 24, height: 1, background: 'var(--fe-border)', margin: '10px 0' }} />
            {NAV.map((space) => (
              <CollapsedIconLink key={space.slug} href={space.folders[0]?.lists[0]?.href ?? '#'} label={space.label} pathname={pathname}>
                <span style={{ width: 20, height: 20, borderRadius: 5, background: space.color, color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {space.label[0]}
                </span>
              </CollapsedIconLink>
            ))}
            {/* Botão expandir no modo recolhido */}
            <button
              onClick={onToggleCollapse}
              title="Expandir sidebar"
              aria-label="Expandir sidebar"
              style={{ marginTop: 4, width: 36, height: 36, borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </nav>
        ) : (
          <>
            {/* Atalhos pessoais */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <QuickLink href="/inbox" label="Inbox" pathname={pathname}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
              </QuickLink>
              <QuickLink href="/updates" label="Updates do dia" pathname={pathname}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </QuickLink>
              <QuickLink href="/minhas-atividades" label="Minhas atividades" pathname={pathname}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </QuickLink>
            </nav>

            {/* Espaços label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 10px 8px' }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--fe-text-muted)', textTransform: 'uppercase' }}>Espaços</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--fe-icon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </div>

            {/* Spaces */}
            {NAV.map((space) => (
              <SpaceSection
                key={space.slug}
                space={space}
                isOpen={openSpaces.has(space.slug)}
                onToggle={() => toggleSpace(space.slug)}
                openFolders={openFolders}
                onToggleFolder={toggleFolder}
                pathname={pathname}
              />
            ))}
          </>
        )}
      </div>

      {/* Rodapé: usuário */}
      {collapsed ? (
        <div style={{ borderTop: '1px solid var(--fe-border)', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {(() => {
            const isConfigActive = pathname === '/configuracoes' || pathname.startsWith('/configuracoes/')
            return (
              <Link
                href="/configuracoes"
                title="Configurações"
                aria-label="Configurações"
                style={{ width: 36, height: 36, borderRadius: 'var(--fe-radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isConfigActive ? 'var(--fe-accent-dim)' : 'transparent', color: isConfigActive ? 'var(--fe-accent)' : 'var(--fe-text-muted)' }}
                onMouseEnter={(e) => !isConfigActive && ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
                onMouseLeave={(e) => !isConfigActive && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              </Link>
            )
          })()}
          <button
            onClick={handleLogout}
            title="Sair"
            style={{ width: 36, height: 36, border: 'none', background: 'transparent', borderRadius: 'var(--fe-radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--fe-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          </button>
        </div>
      ) : (
        <div style={{ borderTop: '1px solid var(--fe-border)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: '50%', background: '#6B59C9', color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>FE</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fe-text-strong)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Future Events</div>
            <div style={{ fontSize: 11.5, color: 'var(--fe-text-muted)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Workspace</div>
          </div>
          {(() => {
            const isConfigActive = pathname === '/configuracoes' || pathname.startsWith('/configuracoes/')
            return (
              <Link
                href="/configuracoes"
                title="Configurações"
                aria-label="Configurações"
                aria-current={isConfigActive ? 'page' : undefined}
                style={{ width: 28, height: 28, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isConfigActive ? 'var(--fe-accent-dim)' : 'transparent', color: isConfigActive ? 'var(--fe-accent)' : 'var(--fe-text-muted)' }}
                onMouseEnter={(e) => !isConfigActive && ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
                onMouseLeave={(e) => !isConfigActive && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              </Link>
            )
          })()}
          <button
            onClick={handleLogout}
            title="Sair"
            style={{ width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--fe-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          </button>
        </div>
      )}
    </aside>
  )
}

function SpaceSection({
  space,
  isOpen,
  onToggle,
  openFolders,
  onToggleFolder,
  pathname,
}: {
  space: NavSpace
  isOpen: boolean
  onToggle: () => void
  openFolders: Set<string>
  onToggleFolder: (key: string) => void
  pathname: string
}) {
  return (
    <div>
      {/* Space row */}
      <button
        onClick={onToggle}
        className="fe-nav-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          height: 38,
          padding: '0 10px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: 'var(--fe-radius-md)',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fe-text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform var(--fe-dur-fast) var(--fe-ease)', flexShrink: 0 }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: 5, background: space.color, color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {space.label[0]}
        </span>
        <span style={{ fontSize: 'var(--fe-text-md)', color: isOpen ? 'var(--fe-text-strong)' : 'var(--fe-text)', fontWeight: isOpen ? 600 : 500 }}>{space.label}</span>
      </button>

      {/* Folders */}
      {isOpen && (
        <div style={{ marginLeft: 14, paddingLeft: 8, borderLeft: '1px solid var(--fe-border)' }}>
          {space.folders.map((folder) => {
            const folderKey = `${space.slug}/${folder.slug}`
            const isFolderOpen = openFolders.has(folderKey)
            return (
              <FolderSection
                key={folder.slug}
                folder={folder}
                folderKey={folderKey}
                isOpen={isFolderOpen}
                onToggle={() => onToggleFolder(folderKey)}
                pathname={pathname}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function FolderSection({
  folder,
  isOpen,
  onToggle,
  pathname,
}: {
  folder: NavFolder
  folderKey: string
  isOpen: boolean
  onToggle: () => void
  pathname: string
}) {
  const isFolderActive = folder.href ? pathname === folder.href : false
  return (
    <div>
      {/* Folder row: chevron + ícone togglam; nome navega se tiver href */}
      <div
        className="fe-nav-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          height: 38,
          padding: '0 10px 0 4px',
          borderRadius: 'var(--fe-radius-md)',
          background: isFolderActive ? 'var(--fe-accent-dim)' : 'transparent',
        }}
      >
        <button
          onClick={onToggle}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 38, flexShrink: 0, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--fe-text-muted)' }}
        >
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform var(--fe-dur-fast) var(--fe-ease)' }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button
          onClick={onToggle}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 38, flexShrink: 0, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--fe-text-soft)' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z" />
          </svg>
        </button>
        {folder.href ? (
          <Link
            href={folder.href}
            style={{ display: 'flex', alignItems: 'center', flex: 1, height: 38, padding: '0 6px', textDecoration: 'none', overflow: 'hidden', borderRadius: 'var(--fe-radius-md)' }}
          >
            <span style={{ fontSize: 'var(--fe-text-md)', fontWeight: isFolderActive ? 600 : 500, color: isFolderActive ? 'var(--fe-accent-dark)' : 'var(--fe-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {folder.label}
            </span>
          </Link>
        ) : (
          <button
            onClick={onToggle}
            style={{ display: 'flex', alignItems: 'center', flex: 1, height: 38, padding: '0 6px', border: 'none', background: 'transparent', cursor: 'pointer', overflow: 'hidden' }}
          >
            <span style={{ fontSize: 'var(--fe-text-md)', fontWeight: 500, color: 'var(--fe-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {folder.label}
            </span>
          </button>
        )}
      </div>

      {/* Lists */}
      {isOpen && (
        <div style={{ marginLeft: 14, paddingLeft: 8, borderLeft: '1px solid var(--fe-border)', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {folder.lists.map((list) => {
            const isActive = pathname === list.href || pathname.startsWith(list.href + '/')
            return <ListNavLink key={list.slug} href={list.href} label={list.label} isActive={isActive} />
          })}
        </div>
      )}
    </div>
  )
}

// Link de List com prefetch no hover: ao passar o mouse, busca os dados completos
// da List (prefetch={true}) para que o clique seja instantâneo. Só dispara na
// intenção (hover), evitando prefazer todas as Lists de uma vez.
function ListNavLink({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  const [prefetchOn, setPrefetchOn] = useState(false)
  return (
    <Link
      href={href}
      prefetch={prefetchOn ? true : false}
      className="fe-nav-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 38,
        padding: '0 10px',
        borderRadius: 'var(--fe-radius-md)',
        fontSize: 'var(--fe-text-md)',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? 'var(--fe-accent-dark)' : 'var(--fe-text-soft)',
        background: isActive ? 'var(--fe-accent-dim)' : 'transparent',
        textDecoration: 'none',
        transition: 'background var(--fe-dur-fast)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { setPrefetchOn(true); if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)' }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={isActive ? 'var(--fe-accent)' : 'var(--fe-text-muted)'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </Link>
  )
}

function CollapsedIconLink({ href, label, pathname, children }: { href: string; label: string; pathname: string; children: ReactNode }) {
  const isActive = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      style={{
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--fe-radius-md)', textDecoration: 'none',
        background: isActive ? 'var(--fe-accent-dim)' : 'transparent',
        color: isActive ? 'var(--fe-accent)' : 'var(--fe-text-soft)',
      }}
      onMouseEnter={(e) => !isActive && ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
      onMouseLeave={(e) => !isActive && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      {children}
    </Link>
  )
}

function QuickLink({ href, label, pathname, children }: { href: string; label: string; pathname: string; children: ReactNode }) {
  const isActive = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className="fe-nav-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        height: 38, padding: '0 10px', borderRadius: 'var(--fe-radius-md)',
        textDecoration: 'none',
        background: isActive ? 'var(--fe-accent-dim)' : 'transparent',
        color: isActive ? 'var(--fe-accent-dark)' : 'var(--fe-text-soft)',
        fontSize: 'var(--fe-text-md)',
        fontWeight: isActive ? 600 : 400,
      }}
      onMouseEnter={(e) => !isActive && ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
      onMouseLeave={(e) => !isActive && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <span style={{ display: 'flex', alignItems: 'center', color: isActive ? 'var(--fe-accent)' : 'currentColor' }}>{children}</span>
      <span style={{ flex: 1 }}>{label}</span>
    </Link>
  )
}
