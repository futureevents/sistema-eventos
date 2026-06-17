'use client'

import { useState, useMemo, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NAV, type NavSpace, type NavFolder } from '@/lib/nav'

export function Sidebar() {
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
      style={{
        width: 'var(--fe-sidebar-w)',
        minWidth: 'var(--fe-sidebar-w)',
        background: 'var(--fe-sidebar)',
        borderRight: '1px solid var(--fe-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
      }}
    >
      {/* Workspace header */}
      <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid var(--fe-border)', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '6px 8px',
            borderRadius: 'var(--fe-radius-md)',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'var(--fe-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--fe-accent)', fontWeight: 800, fontSize: 11 }}>
              FE
            </span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fe-text-strong)', flex: 1 }}>
            Future Events
          </span>
        </div>
      </div>

      {/* Busca */}
      <div style={{ padding: '8px 12px', flexShrink: 0 }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            width: '100%',
            height: 30,
            padding: '0 10px',
            borderRadius: 'var(--fe-radius-md)',
            border: '1px solid var(--fe-border)',
            background: '#EFEDE7',
            cursor: 'pointer',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.45 }}>
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 8L10.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 12.5, color: 'var(--fe-text-faint)', flex: 1, textAlign: 'left' }}>Buscar…</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--fe-text-faint)', background: 'var(--fe-track)', padding: '1px 5px', borderRadius: 4 }}>⌘K</span>
        </button>
      </div>

      {/* Atalhos pessoais */}
      <div style={{ padding: '2px 8px 6px', flexShrink: 0 }}>
        <QuickLink href="/inbox" label="Inbox" pathname={pathname}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </QuickLink>
        <QuickLink href="/updates" label="Updates do dia" pathname={pathname}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </QuickLink>
        <QuickLink href="/minhas-atividades" label="Minhas atividades" pathname={pathname}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </QuickLink>
      </div>

      {/* Divisor */}
      <div style={{ height: 1, background: 'var(--fe-border)', margin: '0 12px 4px', flexShrink: 0 }} />

      {/* Nav: Spaces */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0 16px' }}>
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
      </nav>

      {/* Rodapé */}
      <div style={{ borderTop: '1px solid var(--fe-border)', padding: '8px 12px', flexShrink: 0 }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '7px 8px',
            borderRadius: 'var(--fe-radius-md)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--fe-text-soft)',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#6E56CF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 600,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            FE
          </div>
          <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>Sair</span>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ opacity: 0.35 }}>
            <path d="M8.5 2.5L11 5L8.5 7.5M11 5H5M5 2H2.5V11H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
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
    <div style={{ marginBottom: 2 }}>
      {/* Space header */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '5px 16px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: 0,
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <svg
          width="9" height="9" viewBox="0 0 9 9" fill="none"
          style={{
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform var(--fe-dur-fast) var(--fe-ease)',
            color: 'var(--fe-text-faint)',
            flexShrink: 0,
          }}
        >
          <path d="M3 1.5L6 4.5L3 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: space.color, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fe-text)' }}>
          {space.label}
        </span>
      </button>

      {/* Folders */}
      {isOpen && (
        <div>
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
  const isFolderActive = folder.href ? (pathname === folder.href) : false
  return (
    <div>
      {/* Folder row: chevron toggles lista, nome navega */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: 32,
          background: isFolderActive ? 'var(--fe-accent-dim)' : 'transparent',
          boxShadow: isFolderActive ? 'inset 2px 0 0 var(--fe-accent)' : 'none',
        }}
      >
        {/* Chevron: só toggle */}
        <button
          onClick={onToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 32,
            flexShrink: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            paddingLeft: 28,
            color: 'var(--fe-text-faint)',
          }}
        >
          <svg
            width="9" height="9" viewBox="0 0 9 9" fill="none"
            style={{
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform var(--fe-dur-fast) var(--fe-ease)',
              flexShrink: 0,
            }}
          >
            <path d="M3 1.5L6 4.5L3 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Ícone de pasta: sempre toggle */}
        <button
          onClick={onToggle}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 32, flexShrink: 0, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--fe-text-soft)' }}
        >
          <svg width="14" height="14" viewBox="0 0 13 13" fill="none" style={{ opacity: 0.85 }}>
            <path d="M1.5 3.5C1.5 2.95 1.95 2.5 2.5 2.5H5L6.5 4H10.5C11.05 4 11.5 4.45 11.5 5V10C11.5 10.55 11.05 11 10.5 11H2.5C1.95 11 1.5 10.55 1.5 10V3.5Z" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        {/* Nome: navega se tiver href, senão toggle */}
        {folder.href ? (
          <Link
            href={folder.href}
            style={{ display: 'flex', alignItems: 'center', flex: 1, height: 32, padding: '0 8px 0 4px', textDecoration: 'none', overflow: 'hidden' }}
            onMouseEnter={(e) => !isFolderActive && ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
            onMouseLeave={(e) => !isFolderActive && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <span style={{ fontSize: 15, fontWeight: isFolderActive ? 600 : 500, color: isFolderActive ? 'var(--fe-black)' : 'var(--fe-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {folder.label}
            </span>
          </Link>
        ) : (
          <button
            onClick={onToggle}
            style={{ display: 'flex', alignItems: 'center', flex: 1, height: 32, padding: '0 8px 0 4px', border: 'none', background: 'transparent', cursor: 'pointer', overflow: 'hidden' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--fe-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {folder.label}
            </span>
          </button>
        )}
      </div>

      {/* Lists */}
      {isOpen && (
        <div>
          {folder.lists.map((list) => {
            const isActive = pathname === list.href || pathname.startsWith(list.href + '/')
            return (
              <Link
                key={list.slug}
                href={list.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 32,
                  padding: '0 8px 0 46px',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--fe-black)' : 'var(--fe-text-soft)',
                  background: isActive ? 'var(--fe-accent-dim)' : 'transparent',
                  boxShadow: isActive ? 'inset 2px 0 0 var(--fe-accent)' : 'none',
                  textDecoration: 'none',
                  transition: 'background var(--fe-dur-fast)',
                  borderRadius: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => !isActive && ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
                onMouseLeave={(e) => !isActive && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                {/* List icon */}
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.75, flexShrink: 0 }}>
                  <path d="M2 3.5H10M2 6H10M2 8.5H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {list.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function QuickLink({ href, label, pathname, children }: { href: string; label: string; pathname: string; children: ReactNode }) {
  const isActive = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        height: 30, padding: '0 8px', borderRadius: 'var(--fe-radius-md)',
        textDecoration: 'none',
        background: isActive ? 'var(--fe-accent-dim)' : 'transparent',
        boxShadow: isActive ? 'inset 2px 0 0 var(--fe-accent)' : 'none',
        color: isActive ? 'var(--fe-black)' : 'var(--fe-text-soft)',
      }}
      onMouseEnter={(e) => !isActive && ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
      onMouseLeave={(e) => !isActive && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <span style={{ opacity: isActive ? 0.9 : 0.6, display: 'flex', alignItems: 'center' }}>{children}</span>
      <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400 }}>{label}</span>
    </Link>
  )
}
