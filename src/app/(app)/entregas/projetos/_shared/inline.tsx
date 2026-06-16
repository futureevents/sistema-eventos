'use client'

import { useEffect, useRef, useState } from 'react'
import {
  type StatusTask, type PrioridadeTask, type Membro, type EventoOpcao,
  STATUS_ORDER, PRIORIDADE_ORDER, STATUS_PILL,
} from './types'
import { Avatar, StatusPill, PriorityFlag, dataCurta } from './ui'

// ─── Datas (helpers locais, sem fuso) ─────────────────────────────────────────

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(iso: string): Date {
  return new Date(iso + 'T00:00:00')
}

// ─── Dropdown / Popover ancorado ──────────────────────────────────────────────

export function Dropdown({
  trigger, children, align = 'left', width, onOpenChange, stopPropagation = true,
}: {
  trigger: (props: { open: boolean; toggle: (e: React.MouseEvent) => void }) => React.ReactNode
  children: (close: () => void) => React.ReactNode
  align?: 'left' | 'right'
  width?: number
  onOpenChange?: (open: boolean) => void
  stopPropagation?: boolean
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => { onOpenChange?.(open) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const toggle = (e: React.MouseEvent) => { if (stopPropagation) e.stopPropagation(); setOpen((v) => !v) }
  const close = () => setOpen(false)

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
      {trigger({ open, toggle })}
      {open && (
        <div
          onClick={(e) => stopPropagation && e.stopPropagation()}
          style={{
            position: 'absolute', top: 'calc(100% + 5px)', zIndex: 40,
            [align]: 0, minWidth: width ?? 180, width,
            background: 'var(--fe-surface)', border: '1px solid var(--fe-border)',
            borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-pop)', padding: 5,
          } as React.CSSProperties}
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}

function MenuItem({ children, onClick, ativo = false }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; ativo?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px',
        border: 'none', background: ativo ? 'var(--fe-accent-dim)' : 'transparent', borderRadius: 6,
        cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'var(--fe-text)',
      }}
      onMouseEnter={(e) => { if (!ativo) e.currentTarget.style.background = 'var(--fe-hover)' }}
      onMouseLeave={(e) => { if (!ativo) e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

// ─── Status: dot clicável + dropdown ──────────────────────────────────────────

export function StatusDotSelect({
  status, onChange, size = 18,
}: { status: StatusTask; onChange: (s: StatusTask) => void; size?: number }) {
  const concluida = status === 'concluida'
  const s = STATUS_PILL[status]
  return (
    <Dropdown
      align="left"
      width={188}
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          title="Alterar status"
          style={{
            width: size, height: size, flexShrink: 0, borderRadius: '50%', cursor: 'pointer', padding: 0,
            border: concluida ? 'none' : `2px solid ${s.dot}`,
            background: concluida ? 'var(--fe-accent)' : 'transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'transform var(--fe-dur-fast)',
          }}
        >
          {concluida && (
            <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </button>
      )}
    >
      {(close) => STATUS_ORDER.map((st) => (
        <MenuItem key={st} ativo={st === status} onClick={(e) => { e.stopPropagation(); close(); onChange(st) }}>
          <StatusPill status={st} />
        </MenuItem>
      ))}
    </Dropdown>
  )
}

// ─── Status: pill clicável + dropdown (painel/detalhe) ────────────────────────

export function StatusPillSelect({ status, onChange }: { status: StatusTask; onChange: (s: StatusTask) => void }) {
  return (
    <Dropdown align="left" width={188}
      trigger={({ toggle }) => (
        <button onClick={toggle} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
          <StatusPill status={status} chevron />
        </button>
      )}>
      {(close) => STATUS_ORDER.map((st) => (
        <MenuItem key={st} ativo={st === status} onClick={(e) => { e.stopPropagation(); close(); onChange(st) }}>
          <StatusPill status={st} />
        </MenuItem>
      ))}
    </Dropdown>
  )
}

// ─── Calendário (popover de prazo) ───────────────────────────────────────────

const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES_LONGOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function CalendarPopover({ value, onChange, onClose }: { value: string | null; onChange: (iso: string | null) => void; onClose: () => void }) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const sel = value ? parseISO(value) : null
  const [cursor, setCursor] = useState(() => { const d = sel ?? new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })

  const ano = cursor.getFullYear(), mes = cursor.getMonth()
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const celulas: (Date | null)[] = []
  for (let i = 0; i < primeiroDia; i++) celulas.push(null)
  for (let d = 1; d <= diasNoMes; d++) celulas.push(new Date(ano, mes, d))

  const navBtn: React.CSSProperties = { width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }

  return (
    <div style={{ width: 252, padding: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px 8px' }}>
        <button style={navBtn} onClick={(e) => { e.stopPropagation(); setCursor(new Date(ano, mes - 1, 1)) }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-strong)' }}>{MESES_LONGOS[mes]} {ano}</span>
        <button style={navBtn} onClick={(e) => { e.stopPropagation(); setCursor(new Date(ano, mes + 1, 1)) }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, marginBottom: 2 }}>
        {DOW.map((d, i) => <span key={i} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--fe-text-faint)', textAlign: 'center', height: 22, lineHeight: '22px' }}>{d}</span>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
        {celulas.map((d, i) => {
          if (!d) return <span key={i} />
          const iso = toISODate(d)
          const isSel = sel && toISODate(sel) === iso
          const isHoje = toISODate(hoje) === iso
          return (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onChange(iso); onClose() }}
              style={{
                height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12.5,
                fontWeight: isSel ? 700 : isHoje ? 600 : 400,
                background: isSel ? 'var(--fe-accent)' : 'transparent',
                color: isSel ? 'var(--fe-accent-dark)' : isHoje ? 'var(--fe-accent-dark)' : 'var(--fe-text)',
                boxShadow: isHoje && !isSel ? 'inset 0 0 0 1px var(--fe-accent)' : 'none',
              }}
              onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'var(--fe-hover)' }}
              onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--fe-divider)' }}>
        <button onClick={(e) => { e.stopPropagation(); onChange(toISODate(hoje)); onClose() }} style={{ fontSize: 12, fontWeight: 600, color: 'var(--fe-accent-dark)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>Hoje</button>
        {value && (
          <button onClick={(e) => { e.stopPropagation(); onChange(null); onClose() }} style={{ fontSize: 12, fontWeight: 500, color: 'var(--fe-prio-urgent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>Remover prazo</button>
        )}
      </div>
    </div>
  )
}

// ─── Picker de Evento ─────────────────────────────────────────────────────────

export function EventoSelect({ eventos, value, onChange, children }: {
  eventos: EventoOpcao[]
  value: string | null
  onChange: (id: string | null) => void
  children: (props: { toggle: (e: React.MouseEvent) => void }) => React.ReactNode
}) {
  const [busca, setBusca] = useState('')
  const filtrados = busca.trim() ? eventos.filter((e) => e.nome.toLowerCase().includes(busca.trim().toLowerCase())) : eventos
  return (
    <Dropdown align="left" width={240} onOpenChange={(o) => { if (!o) setBusca('') }}
      trigger={({ toggle }) => children({ toggle })}>
      {(close) => (
        <div>
          <input
            autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar evento"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', height: 30, padding: '0 9px', marginBottom: 4, borderRadius: 6, border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 12.5, outline: 'none' }}
          />
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            <MenuItem ativo={!value} onClick={(e) => { e.stopPropagation(); close(); onChange(null) }}>
              <span style={{ color: 'var(--fe-text-faint)' }}>Sem evento</span>
            </MenuItem>
            {filtrados.map((ev) => (
              <MenuItem key={ev.id} ativo={ev.id === value} onClick={(e) => { e.stopPropagation(); close(); onChange(ev.id) }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.nome}
                  {ev.cliente_nome && <span style={{ color: 'var(--fe-text-faint)', marginLeft: 6, fontSize: 11.5 }}>· {ev.cliente_nome}</span>}
                </span>
              </MenuItem>
            ))}
            {filtrados.length === 0 && <div style={{ padding: '8px', fontSize: 12, color: 'var(--fe-text-faint)' }}>Nenhum evento</div>}
          </div>
        </div>
      )}
    </Dropdown>
  )
}

// ─── Picker de Responsável ────────────────────────────────────────────────────

export function ResponsavelSelect({ membros, value, onChange, children }: {
  membros: Membro[]
  value: string | null
  onChange: (id: string | null) => void
  children: (props: { toggle: (e: React.MouseEvent) => void }) => React.ReactNode
}) {
  return (
    <Dropdown align="left" width={210} trigger={({ toggle }) => children({ toggle })}>
      {(close) => (
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          <MenuItem ativo={!value} onClick={(e) => { e.stopPropagation(); close(); onChange(null) }}>
            <Avatar nome={null} id={null} size={22} /><span style={{ color: 'var(--fe-text-faint)' }}>Sem responsável</span>
          </MenuItem>
          {membros.map((m) => (
            <MenuItem key={m.id} ativo={m.id === value} onClick={(e) => { e.stopPropagation(); close(); onChange(m.id) }}>
              <Avatar nome={m.nome} id={m.id} size={22} /><span>{m.nome}</span>
            </MenuItem>
          ))}
        </div>
      )}
    </Dropdown>
  )
}

// ─── Picker de Prioridade ─────────────────────────────────────────────────────

export function PrioridadeSelect({ value, onChange, children }: {
  value: PrioridadeTask
  onChange: (p: PrioridadeTask) => void
  children: (props: { toggle: (e: React.MouseEvent) => void }) => React.ReactNode
}) {
  return (
    <Dropdown align="left" width={172} trigger={({ toggle }) => children({ toggle })}>
      {(close) => PRIORIDADE_ORDER.map((p) => (
        <MenuItem key={p} ativo={p === value} onClick={(e) => { e.stopPropagation(); close(); onChange(p) }}>
          <PriorityFlag prioridade={p} label />
        </MenuItem>
      ))}
    </Dropdown>
  )
}

// ─── Menu "mais" (excluir, etc.) ──────────────────────────────────────────────

export function RowMenu({ onExcluir }: { onExcluir: () => void }) {
  return (
    <Dropdown align="right" width={160}
      trigger={({ toggle }) => (
        <button onClick={toggle} title="Mais" className="fe-row-menu-btn"
          style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--fe-text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><circle cx="3.5" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="12.5" cy="8" r="1.3" /></svg>
        </button>
      )}>
      {(close) => (
        <MenuItem onClick={(e) => { e.stopPropagation(); close(); onExcluir() }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--fe-prio-urgent)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5H11.5M5 3.5V2.5C5 2.2 5.2 2 5.5 2H8.5C8.8 2 9 2.2 9 2.5V3.5M3.5 3.5L4 11.5C4 11.8 4.2 12 4.5 12H9.5C9.8 12 10 11.8 10 11.5L10.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Excluir tarefa
          </span>
        </MenuItem>
      )}
    </Dropdown>
  )
}

// util re-export para conveniência
export { dataCurta }
