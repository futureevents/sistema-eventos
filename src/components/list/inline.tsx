'use client'

import { useEffect, useRef, useState } from 'react'
import { type SelectOption, type OptionsMap, toISODate, parseISO } from './types'
import { Pill } from './kit'

// ─── Dropdown / Popover ancorado ──────────────────────────────────────────────

export function Dropdown({
  trigger, children, align = 'left', width, onOpenChange, stopPropagation = true, fill = false,
}: {
  trigger: (props: { open: boolean; toggle: (e: React.MouseEvent) => void }) => React.ReactNode
  children: (close: () => void) => React.ReactNode
  align?: 'left' | 'right'
  width?: number
  onOpenChange?: (open: boolean) => void
  stopPropagation?: boolean
  fill?: boolean    // preenche a célula (em vez de encolher ao conteúdo) p/ o ellipsis truncar certo
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => { onOpenChange?.(open) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const toggle = (e: React.MouseEvent) => { if (stopPropagation) e.stopPropagation(); setOpen((v) => !v) }
  const close = () => setOpen(false)

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: fill ? 'flex' : 'inline-flex', flex: fill ? '1 1 auto' : undefined, width: fill ? '100%' : undefined, minWidth: 0, maxWidth: '100%' }}>
      {trigger({ open, toggle })}
      {open && (
        <div onClick={(e) => stopPropagation && e.stopPropagation()}
          style={{ position: 'absolute', top: 'calc(100% + 5px)', zIndex: 40, [align]: 0, minWidth: width ?? 180, width, background: 'var(--fe-surface)', border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-pop)', padding: 5 } as React.CSSProperties}>
          {children(close)}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ children, onClick, ativo = false }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; ativo?: boolean }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', border: 'none', background: ativo ? 'var(--fe-accent-dim)' : 'transparent', borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'var(--fe-text)' }}
      onMouseEnter={(e) => { if (!ativo) e.currentTarget.style.background = 'var(--fe-hover)' }}
      onMouseLeave={(e) => { if (!ativo) e.currentTarget.style.background = 'transparent' }}>
      {children}
    </button>
  )
}

// ─── Pills / flags a partir de SelectOption ───────────────────────────────────

export function OptionPill({ opt, chevron = false }: { opt: SelectOption; chevron?: boolean }) {
  return <Pill label={opt.label} dot={opt.dot} bg={opt.bg ?? 'var(--fe-status-todo-tint)'} text={opt.text ?? 'var(--fe-status-todo-text)'} chevron={chevron} />
}

export function FlagInline({ color, label }: { color: string; label?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
        <path d="M3 1.5V11.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M3 2H9.5L8 4.25L9.5 6.5H3" fill={color} stroke={color} strokeWidth="0.6" strokeLinejoin="round" />
      </svg>
      {label && <span style={{ fontSize: 12.5, fontWeight: 500, color }}>{label}</span>}
    </span>
  )
}

// ─── Boinha de status (dot) + dropdown ────────────────────────────────────────

export function StatusDot({ options, value, onChange, size = 14 }: { options: SelectOption[]; value: string; onChange: (v: string) => void; size?: number }) {
  const opt = options.find((o) => o.value === value)
  const done = !!opt?.done
  const dot = opt?.dot ?? 'var(--fe-status-todo)'
  return (
    <Dropdown align="left" width={190}
      trigger={({ toggle }) => (
        <button onClick={toggle} title="Alterar status" aria-label="Alterar status"
          style={{ width: size, height: size, flexShrink: 0, borderRadius: 4, cursor: 'pointer', padding: 0, border: done ? 'none' : `2px solid ${dot}`, background: done ? (opt?.dot ?? 'var(--fe-accent)') : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {done && <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
      )}>
      {(close) => options.map((o) => (
        <MenuItem key={o.value} ativo={o.value === value} onClick={(e) => { e.stopPropagation(); close(); onChange(o.value) }}>
          <OptionPill opt={o} />
        </MenuItem>
      ))}
    </Dropdown>
  )
}

// ─── Select genérico (pill/flag) com trigger ──────────────────────────────────

export function SelectMenu({ options, value, onChange, display = 'pill', children, fill = false }: {
  options: SelectOption[]
  value: string
  onChange: (v: string) => void
  display?: 'pill' | 'flag'
  children: (props: { toggle: (e: React.MouseEvent) => void }) => React.ReactNode
  fill?: boolean
}) {
  return (
    <Dropdown align="left" width={188} fill={fill} trigger={({ toggle }) => children({ toggle })}>
      {(close) => options.map((o) => (
        <MenuItem key={o.value} ativo={o.value === value} onClick={(e) => { e.stopPropagation(); close(); onChange(o.value) }}>
          {display === 'flag' ? <FlagInline color={o.flag ?? o.dot ?? 'var(--fe-text-muted)'} label={o.label} /> : <OptionPill opt={o} />}
        </MenuItem>
      ))}
    </Dropdown>
  )
}

// ─── Relation (FK) com busca ──────────────────────────────────────────────────

export function RelationMenu({ options, value, onChange, semLabel, children, fill = false }: {
  options: OptionsMap[string]
  value: string | null
  onChange: (id: string | null) => void
  semLabel: string
  children: (props: { toggle: (e: React.MouseEvent) => void }) => React.ReactNode
  fill?: boolean
}) {
  const [busca, setBusca] = useState('')
  const filtrados = busca.trim() ? options.filter((o) => o.label.toLowerCase().includes(busca.trim().toLowerCase())) : options
  return (
    <Dropdown align="left" width={240} fill={fill} onOpenChange={(o) => { if (!o) setBusca('') }} trigger={({ toggle }) => children({ toggle })}>
      {(close) => (
        <div>
          <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', height: 30, padding: '0 9px', marginBottom: 4, borderRadius: 6, border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 12.5, outline: 'none' }} />
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            <MenuItem ativo={!value} onClick={(e) => { e.stopPropagation(); close(); onChange(null) }}><span style={{ color: 'var(--fe-text-faint)' }}>{semLabel}</span></MenuItem>
            {filtrados.map((o) => (
              <MenuItem key={o.id} ativo={o.id === value} onClick={(e) => { e.stopPropagation(); close(); onChange(o.id) }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
              </MenuItem>
            ))}
            {filtrados.length === 0 && <div style={{ padding: 8, fontSize: 12, color: 'var(--fe-text-faint)' }}>Nenhum resultado</div>}
          </div>
        </div>
      )}
    </Dropdown>
  )
}

// ─── Multiselect (array de strings) ───────────────────────────────────────────

export function MultiMenu({ options, colored, value, onChange, children, fill = false }: {
  options: readonly string[]
  colored?: SelectOption[]              // se presente, opções coloridas (value/label/cor) em vez de strings simples
  value: string[]
  onChange: (v: string[]) => void
  children: (props: { toggle: (e: React.MouseEvent) => void }) => React.ReactNode
  fill?: boolean
}) {
  const [busca, setBusca] = useState('')
  const items: { value: string; label: string; opt?: SelectOption }[] = colored
    ? colored.map((o) => ({ value: o.value, label: o.label, opt: o }))
    : options.map((s) => ({ value: s, label: s }))
  const filtrados = busca.trim() ? items.filter((o) => o.label.toLowerCase().includes(busca.trim().toLowerCase())) : items
  function toggle(opt: string) { onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt]) }
  return (
    <Dropdown align="left" width={260} fill={fill} onOpenChange={(o) => { if (!o) setBusca('') }} trigger={({ toggle: t }) => children({ toggle: t })}>
      {() => (
        <div>
          <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', height: 30, padding: '0 9px', marginBottom: 4, borderRadius: 6, border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 12.5, outline: 'none' }} />
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {filtrados.map((o) => {
              const on = value.includes(o.value)
              return (
                <button key={o.value} onClick={(e) => { e.stopPropagation(); toggle(o.value) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontSize: 12.5, color: 'var(--fe-text)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ width: 15, height: 15, flexShrink: 0, borderRadius: 4, border: `1.5px solid ${on ? 'var(--fe-accent)' : 'var(--fe-border)'}`, background: on ? 'var(--fe-accent)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  {o.opt ? <OptionPill opt={o.opt} /> : <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>}
                </button>
              )
            })}
            {filtrados.length === 0 && <div style={{ padding: 8, fontSize: 12, color: 'var(--fe-text-faint)' }}>Nenhum resultado</div>}
          </div>
        </div>
      )}
    </Dropdown>
  )
}

// ─── Texto inline editável ────────────────────────────────────────────────────

export function TextInline({ value, onChange, placeholder = '—', type = 'text', dense = false }: {
  value: string | null
  onChange: (v: string | null) => void
  placeholder?: string
  type?: 'text' | 'email' | 'tel'
  dense?: boolean
}) {
  const [v, setV] = useState(value ?? '')
  const [prev, setPrev] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  // sincroniza com o valor externo sem effect (padrão "ajustar estado na renderização")
  if (value !== prev) { setPrev(value); setV(value ?? '') }
  // lê o valor vivo do DOM no blur (robusto contra batching de estado)
  function commit() { const nv = (ref.current?.value ?? '').trim(); if (nv !== (value ?? '')) onChange(nv || null) }
  return (
    <input ref={ref} value={v} type={type} placeholder={placeholder}
      onChange={(e) => setV(e.target.value)} onClick={(e) => e.stopPropagation()}
      onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') ref.current?.blur(); if (e.key === 'Escape') { setV(value ?? ''); ref.current?.blur() } }}
      style={{ width: '100%', height: dense ? 30 : 36, padding: '0 6px', margin: '0 -6px', border: '1px solid transparent', borderRadius: 6, background: 'transparent', fontSize: dense ? 12.5 : 14, color: v ? 'var(--fe-text)' : 'var(--fe-text-faint)', outline: 'none', transition: 'border-color var(--fe-dur-fast), background var(--fe-dur-fast)' }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--fe-accent)'; e.currentTarget.style.background = 'var(--fe-surface)' }}
      onMouseEnter={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = 'var(--fe-hover)' }}
      onMouseLeave={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = 'transparent' }} />
  )
}

// ─── Calendário (popover de data) ─────────────────────────────────────────────

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
        <button style={navBtn} aria-label="Mês anterior" onClick={(e) => { e.stopPropagation(); setCursor(new Date(ano, mes - 1, 1)) }}><svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-strong)' }}>{MESES_LONGOS[mes]} {ano}</span>
        <button style={navBtn} aria-label="Próximo mês" onClick={(e) => { e.stopPropagation(); setCursor(new Date(ano, mes + 1, 1)) }}><svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
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
            <button key={i} onClick={(e) => { e.stopPropagation(); onChange(iso); onClose() }}
              style={{ height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: isSel ? 700 : isHoje ? 600 : 400, background: isSel ? 'var(--fe-accent)' : 'transparent', color: isSel ? 'var(--fe-accent-fg)' : isHoje ? 'var(--fe-accent-dark)' : 'var(--fe-text)', boxShadow: isHoje && !isSel ? 'inset 0 0 0 1px var(--fe-accent)' : 'none' }}
              onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'var(--fe-hover)' }}
              onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent' }}>
              {d.getDate()}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--fe-divider)' }}>
        <button onClick={(e) => { e.stopPropagation(); onChange(toISODate(hoje)); onClose() }} style={{ fontSize: 12, fontWeight: 600, color: 'var(--fe-accent-dark)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>Hoje</button>
        {value && <button onClick={(e) => { e.stopPropagation(); onChange(null); onClose() }} style={{ fontSize: 12, fontWeight: 500, color: 'var(--fe-prio-urgent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>Remover data</button>}
      </div>
    </div>
  )
}

// ─── Menu de linha (excluir) ──────────────────────────────────────────────────

export function RowMenu({ onExcluir }: { onExcluir: () => void }) {
  return (
    <Dropdown align="right" width={160}
      trigger={({ toggle }) => (
        <button onClick={toggle} title="Mais" aria-label="Mais ações" style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--fe-text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><circle cx="3.5" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="12.5" cy="8" r="1.3" /></svg>
        </button>
      )}>
      {(close) => (
        <MenuItem onClick={(e) => { e.stopPropagation(); close(); onExcluir() }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--fe-prio-urgent)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5H11.5M5 3.5V2.5C5 2.2 5.2 2 5.5 2H8.5C8.8 2 9 2.2 9 2.5V3.5M3.5 3.5L4 11.5C4 11.8 4.2 12 4.5 12H9.5C9.8 12 10 11.8 10 11.5L10.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Excluir
          </span>
        </MenuItem>
      )}
    </Dropdown>
  )
}
