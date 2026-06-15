'use client'

import Link from 'next/link'

export default function EventosPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 44,
          padding: '0 20px',
          borderBottom: '1px solid var(--fe-border-soft)',
          background: 'var(--fe-surface)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fe-text-muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--fe-text)' }}>Eventos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            style={{
              height: 28,
              padding: '0 12px',
              borderRadius: 'var(--fe-radius-md)',
              border: '1px solid var(--fe-border)',
              background: 'transparent',
              fontSize: 12.5,
              fontWeight: 500,
              color: 'var(--fe-text-soft)',
              cursor: 'pointer',
            }}
          >
            Compartilhar
          </button>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fe-text-muted)', padding: '0 4px' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="3" cy="7.5" r="1.2" fill="currentColor" />
              <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
              <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs + toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 40,
          padding: '0 20px',
          borderBottom: '1px solid var(--fe-border-soft)',
          background: 'var(--fe-surface)',
          flexShrink: 0,
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: '100%' }}>
          {['Lista', 'Quadro', 'Calendário'].map((tab, i) => (
            <button
              key={tab}
              style={{
                height: '100%',
                padding: '0 14px',
                border: 'none',
                borderBottom: i === 0 ? '2px solid var(--fe-black)' : '2px solid transparent',
                background: 'transparent',
                fontSize: 13,
                fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? 'var(--fe-black)' : 'var(--fe-text-muted)',
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
          <button style={{ height: '100%', padding: '0 10px', border: 'none', borderBottom: '2px solid transparent', background: 'transparent', fontSize: 13, color: 'var(--fe-text-faint)', cursor: 'pointer' }}>
            +
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {['Filtros', 'Ordenar', 'Agrupar'].map((label) => (
            <button
              key={label}
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 'var(--fe-radius-md)',
                border: 'none',
                background: 'transparent',
                fontSize: 12.5,
                fontWeight: 500,
                color: 'var(--fe-text-soft)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-warm-white)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              {label}
            </button>
          ))}
          <div style={{ width: 1, height: 18, background: 'var(--fe-border)', margin: '0 4px' }} />
          <Link
            href="/eventos/novo"
            style={{
              height: 28,
              padding: '0 12px',
              borderRadius: 'var(--fe-radius-md)',
              background: 'var(--fe-accent)',
              color: 'var(--fe-accent-dark)',
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            Novo evento
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--fe-surface)' }}>
        <EstadoVazio />
      </div>
    </div>
  )
}

function EstadoVazio() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 400,
        gap: 12,
        padding: 40,
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 14,
          background: 'var(--fe-warm-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
          <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 2V6M16 2V6M3 9H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 13H12M8 16.5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: '-0.02em',
            color: 'var(--fe-text-strong)',
            margin: '0 0 6px',
          }}
        >
          Nenhum evento cadastrado
        </p>
        <p style={{ fontSize: 13, color: 'var(--fe-text-muted)', maxWidth: 280, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Crie seu primeiro evento para começar a organizar a operação.
        </p>
      </div>
      <Link
        href="/eventos/novo"
        style={{
          marginTop: 4,
          height: 34,
          padding: '0 16px',
          borderRadius: 'var(--fe-radius-md)',
          background: 'var(--fe-accent)',
          color: 'var(--fe-accent-dark)',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        Criar evento
      </Link>
    </div>
  )
}
