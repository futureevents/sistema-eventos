'use client'

import Link from 'next/link'

type StatusEvento = 'backlog' | 'em_aberto' | 'em_execucao' | 'realizado' | 'encerrado' | 'cancelado'

type Evento = {
  id: string
  nome: string
  status: StatusEvento
  local: string | null
  data_realizacao_inicio: string | null
  data_realizacao_fim: string | null
  // Supabase pode retornar array ou objeto dependendo da relação
  cliente: { nome: string } | { nome: string }[] | null
}

const STATUS_LABEL: Record<StatusEvento, string> = {
  backlog: 'Backlog',
  em_aberto: 'Em aberto',
  em_execucao: 'Em execução',
  realizado: 'Realizado',
  encerrado: 'Encerrado',
  cancelado: 'Cancelado',
}

const STATUS_STYLE: Record<StatusEvento, { bg: string; color: string }> = {
  backlog:      { bg: 'var(--fe-status-todo-tint)',   color: 'var(--fe-status-todo-text)' },
  em_aberto:    { bg: 'var(--fe-status-prog-tint)',   color: 'var(--fe-status-prog-text)' },
  em_execucao:  { bg: 'var(--fe-status-review-tint)', color: 'var(--fe-status-review-text)' },
  realizado:    { bg: 'var(--fe-status-done-tint)',   color: 'var(--fe-status-done-text)' },
  encerrado:    { bg: 'var(--fe-status-todo-tint)',   color: 'var(--fe-status-todo-text)' },
  cancelado:    { bg: 'rgba(239,68,68,0.10)',         color: '#DC2626' },
}

function nomeCliente(c: { nome: string } | { nome: string }[] | null): string | null {
  if (!c) return null
  if (Array.isArray(c)) return c[0]?.nome ?? null
  return c.nome
}

function formatarData(iso: string | null) {
  if (!iso) return null
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function EventosLista({ eventos }: { eventos: Evento[] }) {
  if (eventos.length === 0) {
    return <EstadoVazio />
  }

  return (
    <div>
      {/* Cabeçalho da tabela */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 130px 140px 160px',
          padding: '0 20px',
          height: 34,
          alignItems: 'center',
          borderBottom: '1px solid var(--fe-border-soft)',
          background: 'var(--fe-warm-white)',
        }}
      >
        {['Nome', 'Status', 'Realização', 'Cliente'].map((h) => (
          <span key={h} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Linhas */}
      {eventos.map((ev) => (
        <Link
          key={ev.id}
          href={`/eventos/${ev.id}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 130px 140px 160px',
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
            {ev.nome}
          </span>

          <span>
            <StatusBadge status={ev.status} />
          </span>

          <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)' }}>
            {ev.data_realizacao_inicio
              ? formatarData(ev.data_realizacao_inicio)
              : <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}
          </span>

          <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nomeCliente(ev.cliente) ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}
          </span>
        </Link>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: StatusEvento }) {
  const s = STATUS_STYLE[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 22,
        padding: '0 8px',
        borderRadius: 'var(--fe-radius-pill)',
        background: s.bg,
        color: s.color,
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABEL[status]}
    </span>
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
        <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--fe-text-strong)', margin: '0 0 6px' }}>
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
