'use client'

import Link from 'next/link'

type Cliente = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  whatsapp: string | null
  empresa: string | null
  cnpj_cpf: string | null
}

export function ClientesLista({ clientes }: { clientes: Cliente[] }) {
  if (clientes.length === 0) {
    return <EstadoVazio />
  }

  return (
    <div>
      {/* Cabeçalho da tabela */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 160px 130px 130px 130px',
          padding: '0 20px',
          height: 34,
          alignItems: 'center',
          borderBottom: '1px solid var(--fe-border-soft)',
          background: 'var(--fe-warm-white)',
        }}
      >
        {['Nome', 'Empresa', 'CNPJ/CPF', 'WhatsApp', 'Telefone'].map((h) => (
          <span key={h} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Linhas */}
      {clientes.map((c) => (
        <Link
          key={c.id}
          href={`/comercial/gestao-de-clientes/clientes/${c.id}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 160px 130px 130px 130px',
            padding: '0 20px',
            height: 48,
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
            {c.nome}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.empresa ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.cnpj_cpf ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.whatsapp ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)' }}>
            {c.telefone ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}
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
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--fe-text-strong)', margin: '0 0 6px' }}>
          Nenhum cliente cadastrado
        </p>
        <p style={{ fontSize: 13, color: 'var(--fe-text-muted)', maxWidth: 280, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Adicione o primeiro cliente para começar a organizar o comercial.
        </p>
      </div>
      <Link
        href="/comercial/gestao-de-clientes/clientes/novo"
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
        Criar cliente
      </Link>
    </div>
  )
}
