'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type ListConfig } from './types'

interface ActivityRow {
  id: string
  type: 'created' | 'updated'
  actor: string
  payload: Record<string, { de: string | null; para: string | null }>
  criado_em: string
}

function horaRelativa(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fieldLabel(key: string, config: ListConfig): string {
  const f = config.fields.find((x) => x.key === key)
  if (f) return f.label
  const map: Record<string, string> = {
    nome: 'Nome', status: 'Status', descricao: 'Descrição', prioridade: 'Prioridade',
    prazo: 'Prazo', data_inicio: 'Início', responsavel_id: 'Responsável',
    evento_id: 'Evento', cliente_id: 'Cliente', fornecedor_id: 'Fornecedor',
  }
  return map[key] ?? key
}

function displayValue(val: string | null): string {
  if (val === null || val === '') return '—'
  if (val === 'true') return 'Sim'
  if (val === 'false') return 'Não'
  // ISO date
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    return new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return val
}

export function TaskActivity({ taskId, taskTable, config }: {
  taskId: string; taskTable: string; config: ListConfig
}) {
  const supabase = useRef(createClient()).current
  const [items, setItems] = useState<ActivityRow[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    supabase
      .from('task_activity')
      .select('*')
      .eq('task_table', taskTable)
      .eq('task_id', taskId)
      .order('criado_em', { ascending: false })
      .limit(50)
      .then(({ data }) => setItems((data ?? []) as ActivityRow[]))
  }, [supabase, taskId, taskTable])

  if (items.length === 0) return null

  const visible = open ? items : items.slice(0, 5)

  return (
    <div style={{ marginTop: 28 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 14 }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--fe-text-muted)' }}>
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M7 4.5V7.5L9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Histórico {items.length > 0 ? `(${items.length})` : ''}
        </span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--fe-icon)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
        {/* Linha vertical */}
        <div style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 1, background: 'var(--fe-border-soft)' }} />

        {visible.map((item) => (
          <ActivityItem key={item.id} item={item} config={config} />
        ))}
      </div>

      {items.length > 5 && (
        <button
          onClick={() => setOpen((v) => !v)}
          style={{ marginTop: 10, fontSize: 12, color: 'var(--fe-text-faint)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 0 0 26px', display: 'flex', alignItems: 'center', gap: 4 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fe-text-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fe-text-faint)')}
        >
          {open ? `Mostrar menos` : `Ver mais ${items.length - 5} registro${items.length - 5 > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  )
}

function ActivityItem({ item, config }: { item: ActivityRow; config: ListConfig }) {
  if (item.type === 'created') {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', position: 'relative' }}>
        <div style={{ width: 19, height: 19, borderRadius: '50%', background: 'var(--fe-accent-dim)', border: '1.5px solid var(--fe-accent)', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M5 2V8M2 5H8" stroke="var(--fe-accent)" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>
        <div style={{ paddingTop: 2 }}>
          <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)' }}>Task criada</span>
          <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', marginLeft: 8 }}>{horaRelativa(item.criado_em)}</span>
        </div>
      </div>
    )
  }

  const changes = Object.entries(item.payload)
  if (changes.length === 0) return null

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', position: 'relative' }}>
      <div style={{ width: 19, height: 19, borderRadius: '50%', background: 'var(--fe-surface)', border: '1.5px solid var(--fe-border)', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 5h7M6 2.5L8.5 5 6 7.5" stroke="var(--fe-text-muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div style={{ paddingTop: 2, minWidth: 0 }}>
        {changes.map(([key, { de, para }]) => (
          <div key={key} style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 500, color: 'var(--fe-text)' }}>{fieldLabel(key, config)}</span>
            {' '}alterado de{' '}
            <span style={{ background: 'var(--fe-border-soft)', borderRadius: 3, padding: '0 4px', fontSize: 12, fontFamily: 'monospace' }}>{displayValue(de)}</span>
            {' '}para{' '}
            <span style={{ background: 'var(--fe-accent-dim)', borderRadius: 3, padding: '0 4px', fontSize: 12, fontFamily: 'monospace', color: 'var(--fe-accent)' }}>{displayValue(para)}</span>
          </div>
        ))}
        <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)' }}>{horaRelativa(item.criado_em)}</span>
      </div>
    </div>
  )
}
