'use client'

import { useState } from 'react'

type Activity = {
  id: string
  task_id: string
  task_table: string
  actor: string
  type: string
  payload: Record<string, unknown>
  criado_em: string
}

type Task = {
  id: string
  nome: string
  tipo: string
  status: string
  atualizado_em: string
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function activityLabel(a: Activity) {
  if (a.type === 'created') return 'criou uma task'
  const keys = Object.keys(a.payload)
  if (keys.includes('status')) {
    const statusMap: Record<string, string> = {
      a_fazer: 'A fazer', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada',
    }
    const para = (a.payload.status as { para: string })?.para
    return `alterou status para "${statusMap[para] ?? para}"`
  }
  if (keys.length === 0) return 'atualizou uma task'
  return `atualizou ${keys.join(', ')}`
}

function tableLabel(t: string) {
  const map: Record<string, string> = {
    task_projeto: 'Projetos', evento: 'Eventos', cliente: 'Clientes', fornecedor: 'Fornecedores',
  }
  return map[t] ?? t
}

function tipoLabel(t: string) {
  const map: Record<string, string> = { pre_evento: 'Pré-evento', intra_evento: 'Intra-evento', pos_evento: 'Pós-evento' }
  return map[t] ?? t
}

const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

export function UpdatesClient({ activities, concluded, userName }: {
  activities: Activity[]
  concluded: Task[]
  userName: string
}) {
  const [tab, setTab] = useState<'atividades' | 'concluidas'>('atividades')

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'atividades', label: 'Atividades do dia' },
    { key: 'concluidas', label: 'Tarefas realizadas' },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fe-black)', margin: 0, marginBottom: 4 }}>
          Updates do dia
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--fe-text-soft)', margin: 0, textTransform: 'capitalize' }}>
          {todayLabel}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--fe-border)', marginBottom: 24 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 14px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13.5,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--fe-black)' : 'var(--fe-text-soft)',
              borderBottom: tab === t.key ? '2px solid var(--fe-black)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color var(--fe-dur-fast)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Atividades do dia */}
      {tab === 'atividades' && (
        <div>
          {activities.length === 0 ? (
            <Empty label="Nenhuma atividade registrada hoje" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activities.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '10px 14px', borderRadius: 'var(--fe-radius-md)',
                    border: '1px solid var(--fe-border)', background: 'var(--fe-surface)',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#6E56CF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: 1,
                  }}>
                    {a.actor.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fe-text-strong)' }}>{a.actor}</span>
                      <span style={{ fontSize: 13, color: 'var(--fe-text-soft)' }}>{activityLabel(a)}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', padding: '1px 6px', background: 'var(--fe-track)', borderRadius: 20 }}>
                        {tableLabel(a.task_table)}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', flexShrink: 0 }}>
                    {formatTime(a.criado_em)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Tarefas realizadas */}
      {tab === 'concluidas' && (
        <div>
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent-dim)', border: '1px solid var(--fe-border)' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--fe-text-soft)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--fe-black)' }}>Em breve:</strong> essas tarefas serão usadas pela IA para gerar um resumo automático para envio no WhatsApp dos clientes.
            </p>
          </div>

          {concluded.length === 0 ? (
            <Empty label={`Nenhuma tarefa concluída hoje por ${userName}`} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {concluded.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 'var(--fe-radius-md)',
                    border: '1px solid var(--fe-border)', background: 'var(--fe-surface)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#22c55e' }}>
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13.5, color: 'var(--fe-text-strong)', fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.nome}
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', flexShrink: 0, padding: '1px 6px', background: 'var(--fe-track)', borderRadius: 20 }}>
                    {tipoLabel(t.tipo)}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', flexShrink: 0 }}>
                    {formatTime(t.atualizado_em)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0', color: 'var(--fe-text-faint)' }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: 13.5 }}>{label}</span>
    </div>
  )
}
