'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type ListConfig } from './types'

interface EventoRow {
  id: string
  nome: string
  status: string
  data_realizacao_inicio: string | null
  local: string | null
}

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  em_planejamento: 'Em planejamento',
  pre_producao: 'Pré-produção',
  producao: 'Em produção',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  backlog: 'var(--fe-text-muted)',
  em_planejamento: '#3E63DD',
  pre_producao: '#3E63DD',
  producao: '#7C66DC',
  realizado: 'var(--fe-status-done)',
  cancelado: '#DC3D43',
}

function EventCard({ evento, onRemove }: { evento: EventoRow; onRemove?: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border-soft)', background: hovered ? 'var(--fe-border-soft)' : 'var(--fe-surface)', transition: 'background 100ms' }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[evento.status] ?? 'var(--fe-text-muted)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fe-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evento.nome}</div>
        <div style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', display: 'flex', gap: 8 }}>
          <span>{STATUS_LABEL[evento.status] ?? evento.status}</span>
          {evento.data_realizacao_inicio && <span>· {new Date(evento.data_realizacao_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
          {evento.local && <span>· {evento.local}</span>}
        </div>
      </div>
      {onRemove && hovered && (
        <button onClick={onRemove} title="Desvincular" style={{ width: 22, height: 22, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--fe-prio-urgent)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
          <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      )}
    </div>
  )
}

/* ── Cliente: mostra eventos que já têm este cliente ── */
function ClienteEventos({ rowId }: { rowId: string }) {
  const supabase = useRef(createClient()).current
  const [eventos, setEventos] = useState<EventoRow[]>([])

  useEffect(() => {
    supabase
      .from('evento')
      .select('id, nome, status, data_realizacao_inicio, local')
      .eq('cliente_id', rowId)
      .order('data_realizacao_inicio', { ascending: false })
      .then(({ data }) => setEventos((data ?? []) as EventoRow[]))
  }, [supabase, rowId])

  return (
    <Section title="Eventos" count={eventos.length} icon="calendar">
      {eventos.length === 0
        ? <p style={{ fontSize: 13, color: 'var(--fe-text-faint)', margin: 0 }}>Nenhum evento vinculado a este cliente.</p>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{eventos.map((e) => <EventCard key={e.id} evento={e} />)}</div>
      }
    </Section>
  )
}

/* ── Fornecedor: mostra eventos via evento_fornecedor + permite vincular ── */
function FornecedorEventos({ rowId }: { rowId: string }) {
  const supabase = useRef(createClient()).current
  const [eventos, setEventos] = useState<EventoRow[]>([])
  const [todos, setTodos] = useState<EventoRow[]>([])
  const [picking, setPicking] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('evento_fornecedor')
      .select('evento:evento_id(id, nome, status, data_realizacao_inicio, local)')
      .eq('fornecedor_id', rowId)
      .then(({ data }) => {
        const list = (data ?? []).map((r: Record<string, unknown>) => r['evento'] as EventoRow).filter(Boolean)
        setEventos(list)
      })
  }, [supabase, rowId])

  async function openPicker() {
    const { data } = await supabase
      .from('evento')
      .select('id, nome, status, data_realizacao_inicio, local')
      .order('nome')
    setTodos((data ?? []) as EventoRow[])
    setPicking(true)
    setSearch('')
  }

  async function vincular(evento: EventoRow) {
    await supabase.from('evento_fornecedor').insert({ evento_id: evento.id, fornecedor_id: rowId })
    setEventos((prev) => [evento, ...prev])
    setPicking(false)
  }

  async function desvincular(eventoId: string) {
    await supabase.from('evento_fornecedor').delete().eq('evento_id', eventoId).eq('fornecedor_id', rowId)
    setEventos((prev) => prev.filter((e) => e.id !== eventoId))
  }

  const vinculadosIds = new Set(eventos.map((e) => e.id))
  const filtrados = todos.filter((e) => !vinculadosIds.has(e.id) && e.nome.toLowerCase().includes(search.toLowerCase()))

  return (
    <Section title="Eventos" count={eventos.length} icon="calendar"
      action={<button onClick={openPicker} style={{ fontSize: 12, color: 'var(--fe-accent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>+ Vincular evento</button>}
    >
      {eventos.length === 0
        ? <p style={{ fontSize: 13, color: 'var(--fe-text-faint)', margin: 0 }}>Nenhum evento vinculado a este fornecedor.</p>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{eventos.map((e) => <EventCard key={e.id} evento={e} onRemove={() => desvincular(e.id)} />)}</div>
      }

      {picking && (
        <div style={{ marginTop: 10, border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-surface)', overflow: 'hidden' }}>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar evento…"
            style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: 'none', borderBottom: '1px solid var(--fe-divider)', outline: 'none', background: 'transparent', boxSizing: 'border-box' }}
          />
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtrados.length === 0
              ? <p style={{ fontSize: 13, color: 'var(--fe-text-faint)', padding: '10px 12px', margin: 0 }}>Nenhum evento disponível.</p>
              : filtrados.map((e) => (
                <button key={e.id} onClick={() => vincular(e)} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={(el) => (el.currentTarget.style.background = 'var(--fe-border-soft)')}
                  onMouseLeave={(el) => (el.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[e.status] ?? 'var(--fe-text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--fe-text)' }}>{e.nome}</span>
                </button>
              ))
            }
          </div>
          <div style={{ padding: '6px 10px', borderTop: '1px solid var(--fe-divider)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setPicking(false)} style={{ fontSize: 12, color: 'var(--fe-text-faint)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>Cancelar</button>
          </div>
        </div>
      )}
    </Section>
  )
}

/* ── Wrapper genérico que decide o que renderizar ── */
export function TaskRelationships({ config, rowId }: { config: ListConfig; rowId: string }) {
  if (config.table === 'cliente') return <ClienteEventos rowId={rowId} />
  if (config.table === 'fornecedor') return <FornecedorEventos rowId={rowId} />
  return null
}

function Section({ title, count, icon, action, children }: {
  title: string; count: number; icon: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <CalendarIcon />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title} {count > 0 ? `(${count})` : ''}
        </span>
        {action && <span style={{ marginLeft: 'auto' }}>{action}</span>}
      </div>
      {children}
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--fe-text-muted)', flexShrink: 0 }}>
      <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 6H12.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 1.5V3.5M9.5 1.5V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
