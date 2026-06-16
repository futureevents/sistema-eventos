'use client'

import Link from 'next/link'

type Fornecedor = {
  id: string
  nome: string
  responsavel: string | null
  categorias: string[]
  email: string | null
  whatsapp: string | null
}

export function FornecedoresLista({ fornecedores }: { fornecedores: Fornecedor[] }) {
  if (fornecedores.length === 0) {
    return <EstadoVazio />
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 220px 140px 140px',
          padding: '0 20px',
          height: 34,
          alignItems: 'center',
          borderBottom: '1px solid var(--fe-border-soft)',
          background: 'var(--fe-warm-white)',
        }}
      >
        {['Nome', 'Categorias', 'Responsável', 'WhatsApp'].map((h) => (
          <span key={h} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {h}
          </span>
        ))}
      </div>

      {fornecedores.map((f) => (
        <Link
          key={f.id}
          href={`/entregas/base-de-dados/fornecedores/${f.id}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 220px 140px 140px',
            padding: '0 20px',
            minHeight: 48,
            alignItems: 'center',
            borderBottom: '1px solid var(--fe-border-soft)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'background var(--fe-dur-fast)',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-warm-white)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fe-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 16 }}>
            {f.nome}
          </span>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px 0', paddingRight: 8 }}>
            {f.categorias.length > 0
              ? f.categorias.slice(0, 2).map((cat) => (
                  <span
                    key={cat}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 20,
                      padding: '0 7px',
                      borderRadius: 'var(--fe-radius-pill)',
                      background: 'var(--fe-status-todo-tint)',
                      color: 'var(--fe-status-todo-text)',
                      fontSize: 11,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 160,
                    }}
                  >
                    {cat}
                  </span>
                ))
              : <span style={{ color: 'var(--fe-text-faint)', fontSize: 12.5 }}>—</span>
            }
            {f.categorias.length > 2 && (
              <span style={{ fontSize: 11, color: 'var(--fe-text-faint)', alignSelf: 'center' }}>
                +{f.categorias.length - 2}
              </span>
            )}
          </div>

          <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.responsavel ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}
          </span>

          <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)' }}>
            {f.whatsapp ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}
          </span>
        </Link>
      ))}
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
          <rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--fe-text-strong)', margin: '0 0 6px' }}>
          Nenhum fornecedor cadastrado
        </p>
        <p style={{ fontSize: 13, color: 'var(--fe-text-muted)', maxWidth: 280, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Cadastre fornecedores para vinculá-los aos seus eventos.
        </p>
      </div>
      <Link
        href="/entregas/base-de-dados/fornecedores/novo"
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
        Cadastrar fornecedor
      </Link>
    </div>
  )
}
