'use client'

import { useState } from 'react'
import Link from 'next/link'

type TaskProjeto = {
  id: string
  nome: string
  tipo: string
  status: string
  prioridade: string
  data_fim: string | null
  criado_em: string
}

const STATUS_LABEL: Record<string, string> = {
  a_fazer: 'A fazer', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada',
}

const STATUS_COLOR: Record<string, string> = {
  a_fazer: 'var(--fe-status-todo)', em_andamento: 'var(--fe-status-prog)', concluida: 'var(--fe-status-done)', cancelada: 'var(--fe-prio-urgent)',
}

const PRIORIDADE_COLOR: Record<string, string> = {
  baixa: 'var(--fe-prio-low)', media: 'var(--fe-prio-normal)', alta: 'var(--fe-prio-high)', urgente: 'var(--fe-prio-urgent)',
}

const TIPO_LABEL: Record<string, string> = {
  pre_evento: 'Pré-evento', intra_evento: 'Intra-evento', pos_evento: 'Pós-evento',
}

const FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'a_fazer', label: 'A fazer' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'concluida', label: 'Concluídas' },
]

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function isOverdue(data_fim: string | null, status: string) {
  if (!data_fim || status === 'concluida') return false
  return new Date(data_fim) < new Date()
}

export function MinhasAtividadesClient({ tasksProjeto, userName }: {
  tasksProjeto: TaskProjeto[]
  userName: string
}) {
  const [filter, setFilter] = useState('todas')

  const filtered = filter === 'todas' ? tasksProjeto : tasksProjeto.filter(t => t.status === filter)

  const totalAtivas = tasksProjeto.filter(t => t.status !== 'concluida').length
  const totalConcluidas = tasksProjeto.filter(t => t.status === 'concluida').length
  const totalAtrasadas = tasksProjeto.filter(t => isOverdue(t.data_fim, t.status)).length

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fe-black)', margin: 0, marginBottom: 4 }}>
          Minhas atividades
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--fe-text-soft)', margin: 0 }}>
          Tudo que está atribuído a {userName} no sistema
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Ativas', value: totalAtivas, color: 'var(--fe-black)' },
          { label: 'Concluídas', value: totalConcluidas, color: 'var(--fe-status-done)' },
          { label: 'Atrasadas', value: totalAtrasadas, color: 'var(--fe-prio-urgent)' },
        ].map((s) => (
          <div key={s.label} style={{
            flex: 1, padding: '14px 16px', borderRadius: 'var(--fe-radius-md)',
            border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--fe-text-faint)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--fe-border)', marginBottom: 20 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 13.5, fontWeight: filter === f.key ? 600 : 400,
              color: filter === f.key ? 'var(--fe-black)' : 'var(--fe-text-soft)',
              borderBottom: filter === f.key ? '2px solid var(--fe-black)' : '2px solid transparent',
              marginBottom: -1, transition: 'color var(--fe-dur-fast)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list — Projetos */}
      {filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0', color: 'var(--fe-text-faint)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 13.5 }}>Nenhuma atividade encontrada</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((t) => {
            const overdue = isOverdue(t.data_fim, t.status)
            return (
              <Link
                key={t.id}
                href={`/entregas/projetos/pre-evento/${t.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 'var(--fe-radius-md)',
                  border: `1px solid ${overdue ? 'rgba(220,61,67,0.28)' : 'var(--fe-border)'}`,
                  background: overdue ? 'rgba(220,61,67,0.05)' : 'var(--fe-surface)',
                  textDecoration: 'none', transition: 'background var(--fe-dur-fast)',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = overdue ? 'rgba(220,61,67,0.05)' : 'var(--fe-surface)')}
              >
                {/* Status dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: STATUS_COLOR[t.status] ?? 'var(--fe-status-todo)', flexShrink: 0,
                }} />

                {/* Nome */}
                <span style={{
                  flex: 1, fontSize: 13.5, fontWeight: 500, color: 'var(--fe-text-strong)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textDecoration: t.status === 'concluida' ? 'line-through' : 'none',
                  opacity: t.status === 'concluida' ? 0.6 : 1,
                }}>
                  {t.nome}
                </span>

                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11.5, padding: '1px 7px', borderRadius: 20,
                    background: 'var(--fe-track)', color: 'var(--fe-text-faint)',
                  }}>
                    {TIPO_LABEL[t.tipo] ?? t.tipo}
                  </span>

                  {t.prioridade && t.prioridade !== 'media' && (
                    <span style={{
                      fontSize: 11.5, padding: '1px 7px', borderRadius: 20,
                      background: `color-mix(in srgb, ${PRIORIDADE_COLOR[t.prioridade]} 12%, transparent)`,
                      color: PRIORIDADE_COLOR[t.prioridade],
                      fontWeight: 600,
                    }}>
                      {t.prioridade}
                    </span>
                  )}

                  {t.data_fim && (
                    <span style={{
                      fontSize: 11.5, color: overdue ? 'var(--fe-prio-urgent)' : 'var(--fe-text-faint)',
                      fontWeight: overdue ? 600 : 400,
                    }}>
                      {overdue ? '⚠ ' : ''}{formatDate(t.data_fim)}
                    </span>
                  )}

                  <span style={{
                    fontSize: 11.5, padding: '1px 7px', borderRadius: 20,
                    background: STATUS_COLOR[t.status] + '20', color: STATUS_COLOR[t.status],
                    fontWeight: 500,
                  }}>
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
