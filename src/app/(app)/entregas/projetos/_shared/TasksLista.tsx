'use client'

import Link from 'next/link'
import {
  type TaskProjeto, type TipoTask,
  TIPO_META, PRIORIDADE_LABEL, PRIORIDADE_STYLE, STATUS_LABEL, STATUS_STYLE,
} from './types'

function formatarData(iso: string | null) {
  if (!iso) return null
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function nomeEvento(ev: { nome: string } | null) {
  return ev?.nome ?? null
}

export function TasksLista({
  tasks,
  tipo,
  membros,
}: {
  tasks: TaskProjeto[]
  tipo: TipoTask
  membros: { id: string; nome: string }[]
}) {
  const meta = TIPO_META[tipo]

  if (tasks.length === 0) return <EstadoVazio tipo={tipo} />

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 180px 150px 130px 110px',
          padding: '0 20px',
          height: 34,
          alignItems: 'center',
          borderBottom: '1px solid var(--fe-border-soft)',
          background: 'var(--fe-warm-white)',
        }}
      >
        {['Nome da task', 'Evento', 'Responsável', 'Data final', 'Prioridade'].map((h) => (
          <span key={h} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {h}
          </span>
        ))}
      </div>

      {tasks.map((t) => {
        const membro = membros.find((m) => m.id === t.responsavel_id)
        const pStyle = PRIORIDADE_STYLE[t.prioridade]
        return (
          <Link
            key={t.id}
            href={`/entregas/projetos/${meta.slug}/${t.id}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 180px 150px 130px 110px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', paddingRight: 16 }}>
              <StatusDot status={t.status} />
              <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fe-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.nome}
              </span>
            </div>

            <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nomeEvento(t.evento) ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}
            </span>

            <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {membro?.nome ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}
            </span>

            <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)' }}>
              {formatarData(t.data_fim) ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}
            </span>

            <span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 22,
                  padding: '0 8px',
                  borderRadius: 'var(--fe-radius-pill)',
                  background: pStyle.bg,
                  color: pStyle.color,
                  fontSize: 11.5,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {PRIORIDADE_LABEL[t.prioridade]}
              </span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}

function StatusDot({ status }: { status: keyof typeof STATUS_STYLE }) {
  const s = STATUS_STYLE[status]
  return (
    <span
      title={STATUS_LABEL[status]}
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: s.color,
        flexShrink: 0,
        opacity: 0.7,
      }}
    />
  )
}

function EstadoVazio({ tipo }: { tipo: TipoTask }) {
  const meta = TIPO_META[tipo]
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        gap: 12,
        padding: 40,
      }}
    >
      <div style={{ width: 54, height: 54, borderRadius: 14, background: 'var(--fe-warm-white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--fe-text-strong)', margin: '0 0 6px' }}>
          Nenhuma task em {meta.label}
        </p>
        <p style={{ fontSize: 13, color: 'var(--fe-text-muted)', maxWidth: 280, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Crie a primeira task para organizar as entregas do evento.
        </p>
      </div>
      <Link
        href={`/entregas/projetos/${meta.slug}/novo`}
        style={{
          marginTop: 4, height: 34, padding: '0 16px', borderRadius: 'var(--fe-radius-md)',
          background: 'var(--fe-accent)', color: 'var(--fe-accent-dark)', fontSize: 13, fontWeight: 600,
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        Nova task
      </Link>
    </div>
  )
}
