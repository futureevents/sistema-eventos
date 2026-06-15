'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type NavItem = {
  label: string
  href: string
  icon: string
}

const navItems: NavItem[] = [
  { label: 'Eventos', href: '/eventos', icon: '◈' },
  { label: 'Clientes', href: '/clientes', icon: '◎' },
  { label: 'Fornecedores', href: '/fornecedores', icon: '◉' },
  { label: 'Playbook', href: '/playbook', icon: '◧' },
]

const operacaoItems: NavItem[] = [
  { label: 'Todas as tarefas', href: '/operacao/tarefas', icon: '▣' },
  { label: 'Minha semana', href: '/operacao/semana', icon: '▤' },
  { label: 'Atrasadas', href: '/operacao/atrasadas', icon: '▥' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [operacaoAberta, setOperacaoAberta] = useState(true)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

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
      <div
        style={{
          padding: '14px 12px 10px',
          borderBottom: '1px solid var(--fe-border)',
        }}
      >
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '6px 8px',
            borderRadius: 'var(--fe-radius-md)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
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
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fe-text-strong)', flex: 1, textAlign: 'left' }}>
            Future Events
          </span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.4 }}>
            <path d="M3.5 5.5L7 9L10.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Busca */}
      <div style={{ padding: '8px 12px' }}>
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

      {/* Nav principal */}
      <nav style={{ padding: '4px 8px', flex: 1, overflowY: 'auto' }}>
        {/* Seção principal */}
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        {/* Divisória */}
        <div style={{ height: 1, background: 'var(--fe-divider)', margin: '8px 4px' }} />

        {/* Operação */}
        <button
          onClick={() => setOperacaoAberta(!operacaoAberta)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            width: '100%',
            padding: '4px 8px',
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--fe-text-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: 'var(--fe-radius-md)',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{ transform: operacaoAberta ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform var(--fe-dur-fast) var(--fe-ease)' }}
          >
            <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Operação
        </button>

        {operacaoAberta && (
          <div style={{ marginTop: 2 }}>
            {operacaoItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} indent />
            ))}
          </div>
        )}
      </nav>

      {/* Rodapé */}
      <div
        style={{
          borderTop: '1px solid var(--fe-border)',
          padding: '8px 12px',
        }}
      >
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

function NavLink({ item, active, indent = false }: { item: NavItem; active: boolean; indent?: boolean }) {
  return (
    <Link
      href={item.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        height: 30,
        padding: `0 8px 0 ${indent ? 22 : 8}px`,
        borderRadius: 'var(--fe-radius-md)',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? 'var(--fe-black)' : 'var(--fe-text-soft)',
        background: active ? 'var(--fe-accent-dim)' : 'transparent',
        boxShadow: active ? 'inset 2px 0 0 var(--fe-accent)' : 'none',
        textDecoration: 'none',
        transition: 'background var(--fe-dur-fast)',
        marginBottom: 1,
      }}
      onMouseEnter={(e) => !active && ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
      onMouseLeave={(e) => !active && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <span style={{ fontSize: 12, opacity: active ? 0.8 : 0.45, width: 14, textAlign: 'center' }}>{item.icon}</span>
      {item.label}
    </Link>
  )
}
