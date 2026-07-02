'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { type SelectOption, type OptionsMap, toISODate, parseISO, hasTime } from './types'
import { Pill, dataCurta } from './kit'
import { useListEditable } from './perm-ctx'

// ─── Dropdown / Popover ancorado ──────────────────────────────────────────────

export function Dropdown({
  trigger, children, align = 'left', width, onOpenChange, stopPropagation = true, fill = false, portal = false,
}: {
  trigger: (props: { open: boolean; toggle: (e: React.MouseEvent) => void }) => React.ReactNode
  children: (close: () => void) => React.ReactNode
  align?: 'left' | 'right'
  width?: number
  onOpenChange?: (open: boolean) => void
  stopPropagation?: boolean
  fill?: boolean    // preenche a célula (em vez de encolher ao conteúdo) p/ o ellipsis truncar certo
  portal?: boolean  // renderiza no body (position: fixed) — p/ popovers largos dentro de contêineres que cortam (ex.: painel lateral)
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  // Posição efetiva: vira a borda quando o popover estouraria a viewport, para
  // não ficar cortado (e exigir rolagem) perto da direita/baixo da tela.
  const [pos, setPos] = useState<{ align: 'left' | 'right'; up: boolean }>({ align, up: false })
  // Posição fixa (modo portal), calculada a partir do trigger e clampada na viewport.
  const [fixed, setFixed] = useState<{ top: number; left: number } | null>(null)
  useEffect(() => { onOpenChange?.(open) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (wrapRef.current?.contains(t) || popRef.current?.contains(t)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  // Mede o popover já renderizado e decide a posição (antes da pintura).
  useLayoutEffect(() => {
    if (!open) { setPos({ align, up: false }); setFixed(null); return }
    const wrap = wrapRef.current, pop = popRef.current
    if (!wrap || !pop) return
    const w = wrap.getBoundingClientRect()
    const pw = pop.offsetWidth, ph = pop.offsetHeight
    const m = 8
    if (portal) {
      let left = align === 'left' ? w.left : w.right - pw
      left = Math.max(m, Math.min(left, window.innerWidth - m - pw))
      let top = w.bottom + 5
      if (top + ph > window.innerHeight - m && w.top - ph - 5 > m) top = w.top - ph - 5
      top = Math.max(m, Math.min(top, window.innerHeight - m - ph))
      setFixed({ top, left })
      return
    }
    let a: 'left' | 'right' = align
    if (align === 'left' && w.left + pw > window.innerWidth - m) a = 'right'
    else if (align === 'right' && w.right - pw < m) a = 'left'
    const up = w.bottom + 5 + ph > window.innerHeight - m && w.top - ph - 5 > m
    setPos({ align: a, up })
  }, [open, align, width, portal])

  const toggle = (e: React.MouseEvent) => { if (stopPropagation) e.stopPropagation(); setOpen((v) => !v) }
  const close = () => setOpen(false)

  const popStyle: React.CSSProperties = portal
    ? { position: 'fixed', top: fixed?.top ?? -9999, left: fixed?.left ?? -9999, zIndex: 90, minWidth: width ?? 180, width, maxHeight: 'calc(100vh - 24px)', overflowY: 'auto', background: 'var(--fe-surface)', border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-pop)', padding: 5 }
    : { position: 'absolute', [pos.up ? 'bottom' : 'top']: 'calc(100% + 5px)', zIndex: 40, [pos.align]: 0, minWidth: width ?? 180, width, maxHeight: 'calc(100vh - 24px)', overflowY: 'auto', background: 'var(--fe-surface)', border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-pop)', padding: 5 } as React.CSSProperties

  const popNode = open ? (
    <div ref={popRef} onClick={(e) => stopPropagation && e.stopPropagation()} style={popStyle}>
      {children(close)}
    </div>
  ) : null

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: fill ? 'flex' : 'inline-flex', flex: fill ? '1 1 auto' : undefined, width: fill ? '100%' : undefined, minWidth: 0, maxWidth: '100%' }}>
      {trigger({ open, toggle })}
      {portal && popNode && typeof document !== 'undefined' ? createPortal(popNode, document.body) : popNode}
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

export function OptionPill({ opt, chevron = false, solid = false }: { opt: SelectOption; chevron?: boolean; solid?: boolean }) {
  return <Pill label={opt.label} dot={opt.dot} bg={opt.bg ?? 'var(--fe-status-todo-tint)'} text={opt.text ?? 'var(--fe-status-todo-text)'} chevron={chevron} solid={solid} done={opt.done} />
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
  const canEdit = useListEditable()
  const opt = options.find((o) => o.value === value)
  const done = !!opt?.done
  const dot = opt?.dot ?? 'var(--fe-status-todo)'
  // Progresso 0..1: enche o quadradinho aos poucos conforme o status avança até "concluído".
  const curIdx = options.findIndex((o) => o.value === value)
  const doneIdx = options.findIndex((o) => o.done)
  const denom = doneIdx > 0 ? doneIdx : Math.max(options.length - 1, 1)
  const frac = done ? 1 : curIdx <= 0 ? 0 : Math.min(curIdx / denom, 1)
  // Somente-leitura: dot estático, sem dropdown.
  if (!canEdit) {
    return (
      <span aria-label="Status" style={{ width: size, height: size, flexShrink: 0, borderRadius: 4, border: `2px solid ${dot}`, background: 'transparent', position: 'relative', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {frac > 0 && <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${frac * 100}%`, background: dot }} />}
        {done && <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 12 12" fill="none" style={{ position: 'relative' }}><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
    )
  }
  return (
    <Dropdown align="left" width={190}
      trigger={({ toggle }) => (
        <button onClick={toggle} title="Alterar status" aria-label="Alterar status"
          style={{ width: size, height: size, flexShrink: 0, borderRadius: 4, cursor: 'pointer', padding: 0, border: `2px solid ${dot}`, background: 'transparent', position: 'relative', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {frac > 0 && <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${frac * 100}%`, background: dot, transition: 'height var(--fe-dur-fast) var(--fe-ease)' }} />}
          {done && <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 12 12" fill="none" style={{ position: 'relative' }}><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
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
      style={{ width: '100%', height: dense ? 30 : 36, padding: '0 6px', margin: '0 -6px', border: '1px solid transparent', borderRadius: 6, background: 'transparent', fontSize: dense ? 13 : 14, color: v ? 'var(--fe-text)' : 'var(--fe-text-faint)', outline: 'none', transition: 'border-color var(--fe-dur-fast), background var(--fe-dur-fast)' }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--fe-accent)'; e.currentTarget.style.background = 'var(--fe-surface)' }}
      onMouseEnter={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = 'var(--fe-hover)' }}
      onMouseLeave={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = 'transparent' }} />
  )
}

// ─── Dinheiro (BRL) inline editável ──────────────────────────────────────────

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function MoneyInline({ value, onChange, dense = false }: {
  value: number | null
  onChange: (v: number | null) => void
  dense?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [prev, setPrev] = useState(value)
  const [v, setV] = useState(() => value != null ? fmtBRL(value) : '')

  // sincroniza com valor externo (mesmo padrão de TextInline)
  if (value !== prev) { setPrev(value); setV(value != null ? fmtBRL(value) : '') }

  function commit() {
    // pt-BR: '.' = separador de milhar, ',' = decimal
    const clean = v.trim().replace(/\./g, '').replace(',', '.')
    const n = parseFloat(clean)
    const newVal = !clean || isNaN(n) ? null : Math.round(n * 100) / 100
    if (newVal !== value) onChange(newVal)
    setV(newVal != null ? fmtBRL(newVal) : '')
  }

  return (
    <input
      ref={ref}
      value={v}
      type="text"
      inputMode="decimal"
      placeholder="—"
      onChange={(e) => setV(e.target.value)}
      onClick={(e) => { e.stopPropagation(); ref.current?.select() }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') ref.current?.blur()
        if (e.key === 'Escape') { setV(value != null ? fmtBRL(value) : ''); ref.current?.blur() }
      }}
      style={{ width: '100%', height: dense ? 30 : 36, padding: '0 6px', margin: '0 -6px', border: '1px solid transparent', borderRadius: 6, background: 'transparent', fontSize: dense ? 13 : 14, color: v ? 'var(--fe-text)' : 'var(--fe-text-faint)', outline: 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums', transition: 'border-color var(--fe-dur-fast), background var(--fe-dur-fast)' }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--fe-accent)'; e.currentTarget.style.background = 'var(--fe-surface)' }}
      onMouseEnter={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = 'var(--fe-hover)' }}
      onMouseLeave={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = 'transparent' }}
    />
  )
}

// ─── Calendário (popover de data) ─────────────────────────────────────────────

const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES_LONGOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function CalendarPopover({ value, onChange, onClose, withTime = false }: { value: string | null; onChange: (iso: string | null) => void; onClose: () => void; withTime?: boolean }) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const sel = value ? parseISO(value) : null

  // timeOn: o usuário optou por incluir horário neste valor. Todo calendário oferece
  // a opção de adicionar OU NÃO hora. Inicia ligado se o valor já tem hora; para um
  // valor novo, segue o default da List (field.withTime), p.ex. Data da reunião.
  const [timeOn, setTimeOn] = useState<boolean>(() => value ? hasTime(value) : withTime)

  // pendingDate: data clicada mas ainda não confirmada (usada quando há horário).
  // Sem horário, o clique no dia confirma imediatamente.
  const [pendingDate, setPendingDate] = useState<string | null>(() => sel ? toISODate(sel) : null)
  const [hh, setHh] = useState(() => sel ? sel.getHours() : new Date().getHours())
  const [mm, setMm] = useState(() => sel ? sel.getMinutes() : 0)

  const [cursor, setCursor] = useState(() => { const d = sel ?? new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const ano = cursor.getFullYear(), mes = cursor.getMonth()
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const celulas: (Date | null)[] = []
  for (let i = 0; i < primeiroDia; i++) celulas.push(null)
  for (let d = 1; d <= diasNoMes; d++) celulas.push(new Date(ano, mes, d))
  const navBtn: React.CSSProperties = { width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }

  function confirmar(date: string, h: number, m: number) {
    const pad = (n: number) => String(n).padStart(2, '0')
    // Sem horário grava só o dia (00:00); com horário grava o timestamp escolhido.
    onChange(timeOn ? `${date}T${pad(h)}:${pad(m)}:00` : date)
    onClose()
  }

  function ativarHora() {
    const base = new Date()
    setTimeOn(true)
    setPendingDate((prev) => prev ?? (sel ? toISODate(sel) : toISODate(hoje)))
    if (!sel || !hasTime(value)) { setHh(base.getHours()); setMm(base.getMinutes()) }
  }

  function clampNum(n: number, min: number, max: number) { return isNaN(n) ? min : Math.min(max, Math.max(min, n)) }

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
          const isSel = timeOn ? pendingDate === iso : (sel && toISODate(sel) === iso)
          const isHoje = toISODate(hoje) === iso
          return (
            <button key={i} onClick={(e) => {
              e.stopPropagation()
              if (timeOn) { setPendingDate(iso) }
              else { confirmar(iso, hh, mm) }
            }}
              style={{ height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: isSel ? 700 : isHoje ? 600 : 400, background: isSel ? 'var(--fe-accent)' : 'transparent', color: isSel ? 'var(--fe-accent-fg)' : isHoje ? 'var(--fe-accent-dark)' : 'var(--fe-text)', boxShadow: isHoje && !isSel ? 'inset 0 0 0 1px var(--fe-accent)' : 'none' }}
              onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'var(--fe-hover)' }}
              onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent' }}>
              {d.getDate()}
            </button>
          )
        })}
      </div>

      {/* Adicionar horário — toda agenda permite incluir OU NÃO uma hora */}
      {!timeOn && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--fe-divider)' }}>
          <button onClick={(e) => { e.stopPropagation(); ativarHora() }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 30, padding: '0 6px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 4V7.2L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Adicionar horário
          </button>
        </div>
      )}

      {/* Seleção de hora — quando o usuário optou por incluir horário */}
      {timeOn && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--fe-divider)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 8px' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--fe-text-muted)' }}>
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 4V7.2L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 12, color: 'var(--fe-text-soft)', fontWeight: 500 }}>Horário</span>
            <button onClick={(e) => { e.stopPropagation(); setTimeOn(false) }} title="Remover horário"
              style={{ width: 18, height: 18, borderRadius: 4, border: 'none', background: 'transparent', color: 'var(--fe-text-faint)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--fe-hover)'; e.currentTarget.style.color = 'var(--fe-prio-urgent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fe-text-faint)' }}>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
              <input
                type="text" inputMode="numeric" value={String(hh).padStart(2, '0')} onClick={(e) => e.stopPropagation()}
                onChange={(e) => setHh(clampNum(parseInt(e.target.value.replace(/\D/g, ''), 10), 0, 23))}
                style={{ width: 36, height: 26, textAlign: 'center', border: '1px solid var(--fe-border)', borderRadius: 5, background: 'var(--fe-surface)', fontSize: 12.5, fontVariantNumeric: 'tabular-nums', outline: 'none' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--fe-accent)'; e.currentTarget.select() }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--fe-border)' }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fe-text-muted)' }}>:</span>
              <input
                type="text" inputMode="numeric" value={String(mm).padStart(2, '0')} onClick={(e) => e.stopPropagation()}
                onChange={(e) => setMm(clampNum(parseInt(e.target.value.replace(/\D/g, ''), 10), 0, 59))}
                style={{ width: 36, height: 26, textAlign: 'center', border: '1px solid var(--fe-border)', borderRadius: 5, background: 'var(--fe-surface)', fontSize: 12.5, fontVariantNumeric: 'tabular-nums', outline: 'none' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--fe-accent)'; e.currentTarget.select() }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--fe-border)' }}
              />
            </div>
          </div>
          {pendingDate && (
            <button
              onClick={(e) => { e.stopPropagation(); confirmar(pendingDate, hh, mm) }}
              style={{ width: '100%', height: 30, borderRadius: 6, border: 'none', background: 'var(--fe-accent)', color: 'var(--fe-accent-fg)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', marginBottom: 4 }}>
              Confirmar
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: timeOn ? 4 : 8, paddingTop: timeOn ? 4 : 8, borderTop: timeOn ? 'none' : '1px solid var(--fe-divider)' }}>
        <button onClick={(e) => {
          e.stopPropagation()
          if (timeOn) { setPendingDate(toISODate(hoje)) }
          else { confirmar(toISODate(hoje), hh, mm) }
        }} style={{ fontSize: 12, fontWeight: 600, color: 'var(--fe-accent-dark)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>Hoje</button>
        {value && <button onClick={(e) => { e.stopPropagation(); onChange(null); onClose() }} style={{ fontSize: 12, fontWeight: 500, color: 'var(--fe-prio-urgent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>Remover data</button>}
      </div>
    </div>
  )
}

// ─── Calendário duplo — data inicial + vencimento (estilo ClickUp) ───────────

/** Par início/vencimento de uma List: o popover edita os dois campos juntos. */
export type DateRangeSpec = {
  startKey: string
  endKey: string
  startLabel: string
  endLabel: string
  startWithTime?: boolean
  endWithTime?: boolean
}

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const pad2 = (n: number) => String(n).padStart(2, '0')

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }

function DateChip({ label, value, active, onFocus, onClear }: {
  label: string; value: string | null; active: boolean; onFocus: () => void; onClear: () => void
}) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onFocus() }} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFocus() } }}
      style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 9px', borderRadius: 8, cursor: 'pointer', background: active ? 'var(--fe-surface)' : 'var(--fe-track)', border: `1px solid ${active ? 'var(--fe-accent)' : 'transparent'}`, boxShadow: active ? '0 0 0 1px var(--fe-accent)' : 'none', transition: 'border-color var(--fe-dur-fast), box-shadow var(--fe-dur-fast)' }}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: value ? 'var(--fe-text-soft)' : 'var(--fe-text-faint)' }}><rect x="2" y="2.8" width="10" height="9.2" rx="1.6" stroke="currentColor" strokeWidth="1.2" /><path d="M2 5.2H12M4.6 1.6V3.4M9.4 1.6V3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: value ? 500 : 400, color: value ? 'var(--fe-text)' : 'var(--fe-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {value ? dataCurta(value) : label}
      </span>
      {value && (
        <button onClick={(e) => { e.stopPropagation(); onClear() }} title={`Remover ${label.toLowerCase()}`} aria-label={`Remover ${label.toLowerCase()}`}
          style={{ width: 16, height: 16, flexShrink: 0, borderRadius: 4, border: 'none', background: 'transparent', color: 'var(--fe-text-faint)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--fe-hover)'; e.currentTarget.style.color = 'var(--fe-text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fe-text-faint)' }}>
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        </button>
      )}
    </div>
  )
}

export function DateRangePopover({ start, end, focus, startLabel, endLabel, startWithTime = false, endWithTime = false, onChange }: {
  start: string | null
  end: string | null
  focus: 'start' | 'end'
  startLabel: string
  endLabel: string
  startWithTime?: boolean
  endWithTime?: boolean
  onChange: (changes: { start?: string | null; end?: string | null }) => void
}) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const [focused, setFocused] = useState<'start' | 'end'>(focus)
  const valores = { start, end }
  const focusedVal = valores[focused]

  // Horário opcional por campo (regra system-wide: toda data pode incluir OU NÃO hora)
  const [timeOn, setTimeOn] = useState<{ start: boolean; end: boolean }>(() => ({
    start: start ? hasTime(start) : startWithTime,
    end: end ? hasTime(end) : endWithTime,
  }))
  const [time, setTime] = useState<{ start: { h: number; m: number }; end: { h: number; m: number } }>(() => {
    const de = (v: string | null) => { const d = v ? parseISO(v) : null; return d && v && hasTime(v) ? { h: d.getHours(), m: d.getMinutes() } : { h: new Date().getHours(), m: 0 } }
    return { start: de(start), end: de(end) }
  })

  const [cursor, setCursor] = useState(() => { const base = valores[focus] ? parseISO(valores[focus]!) : new Date(); return new Date(base.getFullYear(), base.getMonth(), 1) })
  const ano = cursor.getFullYear(), mes = cursor.getMonth()
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const celulas: (Date | null)[] = []
  for (let i = 0; i < primeiroDia; i++) celulas.push(null)
  for (let d = 1; d <= diasNoMes; d++) celulas.push(new Date(ano, mes, d))

  const sDia = start ? toISODate(parseISO(start)) : null
  const eDia = end ? toISODate(parseISO(end)) : null

  function montar(which: 'start' | 'end', dia: string, t?: { h: number; m: number }) {
    const tt = t ?? time[which]
    return timeOn[which] ? `${dia}T${pad2(tt.h)}:${pad2(tt.m)}:00` : dia
  }

  function escolherDia(dia: string) {
    const changes: { start?: string | null; end?: string | null } = { [focused]: montar(focused, dia) }
    // Estilo ClickUp: se a escolha inverte a ordem, a outra data acompanha (mesmo dia)
    const outro = focused === 'start' ? eDia : sDia
    if (outro && ((focused === 'start' && dia > outro) || (focused === 'end' && dia < outro))) {
      changes[focused === 'start' ? 'end' : 'start'] = montar(focused === 'start' ? 'end' : 'start', dia)
    }
    onChange(changes)
    // Depois da data inicial o foco avança para o vencimento
    if (focused === 'start') setFocused('end')
  }

  function focar(which: 'start' | 'end') {
    setFocused(which)
    const v = valores[which]
    if (v) { const d = parseISO(v); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)) }
  }

  function ativarHora() {
    const agora = new Date()
    const t = { h: agora.getHours(), m: agora.getMinutes() }
    setTimeOn((p) => ({ ...p, [focused]: true }))
    setTime((p) => ({ ...p, [focused]: t }))
    if (focusedVal) onChange({ [focused]: `${toISODate(parseISO(focusedVal))}T${pad2(t.h)}:${pad2(t.m)}:00` })
  }

  function removerHora() {
    setTimeOn((p) => ({ ...p, [focused]: false }))
    if (focusedVal) onChange({ [focused]: toISODate(parseISO(focusedVal)) })
  }

  function mudarHora(parte: 'h' | 'm', valor: number) {
    const max = parte === 'h' ? 23 : 59
    const n = isNaN(valor) ? 0 : Math.min(max, Math.max(0, valor))
    const t = { ...time[focused], [parte]: n }
    setTime((p) => ({ ...p, [focused]: t }))
    return t
  }

  function commitHora(t: { h: number; m: number }) {
    if (focusedVal) onChange({ [focused]: `${toISODate(parseISO(focusedVal))}T${pad2(t.h)}:${pad2(t.m)}:00` })
  }

  // Atalhos rápidos (coluna esquerda, estilo ClickUp)
  const dow = hoje.getDay()
  const ateSab = (6 - dow + 7) % 7
  const ateSeg = ((1 - dow + 7) % 7) || 7
  const atalhos: { label: string; d: Date }[] = [
    { label: 'Hoje', d: hoje },
    { label: 'Amanhã', d: addDays(hoje, 1) },
    { label: 'Este final de semana', d: addDays(hoje, ateSab) },
    { label: 'Semana que vem', d: addDays(hoje, ateSeg) },
    { label: 'Próximo final de semana', d: addDays(hoje, ateSab + 7) },
    { label: '2 semanas', d: addDays(hoje, 14) },
    { label: '4 semanas', d: addDays(hoje, 28) },
  ]
  const dica = (d: Date) => {
    const diff = Math.round((d.getTime() - hoje.getTime()) / 86400000)
    return diff < 7 ? DIAS_CURTOS[d.getDay()] : `${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`
  }

  const navBtn: React.CSSProperties = { width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }

  return (
    <div className="fe-daterange" style={{ width: 448, padding: 4 }}>
      {/* Data inicial antes, vencimento ao lado */}
      <div style={{ display: 'flex', gap: 8, padding: '2px 2px 10px' }}>
        <DateChip label={startLabel} value={start} active={focused === 'start'} onFocus={() => focar('start')} onClear={() => onChange({ start: null })} />
        <DateChip label={endLabel} value={end} active={focused === 'end'} onFocus={() => focar('end')} onClear={() => onChange({ end: null })} />
      </div>

      <div style={{ display: 'flex', borderTop: '1px solid var(--fe-divider)' }}>
        {/* Atalhos rápidos */}
        <div className="fe-daterange-shortcuts" style={{ width: 178, flexShrink: 0, padding: '8px 8px 8px 2px', borderRight: '1px solid var(--fe-divider)', display: 'flex', flexDirection: 'column' }}>
          {atalhos.map((a) => (
            <button key={a.label} onClick={(e) => { e.stopPropagation(); escolherDia(toISODate(a.d)) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 28, padding: '0 8px', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: 12.5, color: 'var(--fe-text)', whiteSpace: 'nowrap' }}>{a.label}</span>
              <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', whiteSpace: 'nowrap' }}>{dica(a.d)}</span>
            </button>
          ))}
        </div>

        {/* Calendário */}
        <div style={{ flex: 1, minWidth: 0, padding: '8px 2px 4px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px 6px' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-strong)' }}>{MESES_LONGOS[mes]} {ano}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <button onClick={(e) => { e.stopPropagation(); setCursor(new Date(hoje.getFullYear(), hoje.getMonth(), 1)) }}
                style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fe-text-soft)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 5 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>Hoje</button>
              <button style={navBtn} aria-label="Mês anterior" onClick={(e) => { e.stopPropagation(); setCursor(new Date(ano, mes - 1, 1)) }}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 7.5L6 4L9.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
              <button style={navBtn} aria-label="Próximo mês" onClick={(e) => { e.stopPropagation(); setCursor(new Date(ano, mes + 1, 1)) }}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 2 }}>
            {DOW.map((d, i) => <span key={i} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--fe-text-faint)', textAlign: 'center', height: 20, lineHeight: '20px' }}>{d}</span>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', rowGap: 1 }}>
            {celulas.map((d, i) => {
              if (!d) return <span key={i} />
              const iso = toISODate(d)
              const isStart = iso === sDia
              const isEnd = iso === eDia
              const ponta = isStart || isEnd
              // Faixa do intervalo entre início e vencimento (comparação lexicográfica de ISO)
              const naFaixa = !!sDia && !!eDia && iso > sDia && iso < eDia
              const isHoje = toISODate(hoje) === iso
              const raio = naFaixa ? 0 : (sDia && eDia && sDia !== eDia && ponta) ? (isStart ? '6px 0 0 6px' : '0 6px 6px 0') : 6
              return (
                <button key={i} onClick={(e) => { e.stopPropagation(); escolherDia(iso) }}
                  style={{ height: 28, borderRadius: raio, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: ponta ? 700 : isHoje ? 600 : 400, background: ponta ? 'var(--fe-accent)' : naFaixa ? 'var(--fe-accent-dim)' : 'transparent', color: ponta ? 'var(--fe-accent-fg)' : isHoje ? 'var(--fe-accent-dark)' : 'var(--fe-text)', boxShadow: isHoje && !ponta && !naFaixa ? 'inset 0 0 0 1px var(--fe-accent)' : 'none', padding: 0 }}
                  onMouseEnter={(e) => { if (!ponta && !naFaixa) e.currentTarget.style.background = 'var(--fe-hover)' }}
                  onMouseLeave={(e) => { if (!ponta && !naFaixa) e.currentTarget.style.background = 'transparent' }}>
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Horário opcional do campo em foco — sempre visível; sem data ainda, a hora
          escolhida entra junto quando o dia for clicado */}
      {(
        <div style={{ marginTop: 4, paddingTop: 6, borderTop: '1px solid var(--fe-divider)' }}>
          {!timeOn[focused] ? (
            <button onClick={(e) => { e.stopPropagation(); ativarHora() }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 30, padding: '0 8px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" /><path d="M7 4V7.2L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Adicionar horário ({focused === 'start' ? startLabel.toLowerCase() : endLabel.toLowerCase()})
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 8px 4px' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--fe-text-muted)' }}><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" /><path d="M7 4V7.2L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span style={{ fontSize: 12, color: 'var(--fe-text-soft)', fontWeight: 500 }}>Horário ({focused === 'start' ? startLabel.toLowerCase() : endLabel.toLowerCase()})</span>
              <button onClick={(e) => { e.stopPropagation(); removerHora() }} title="Remover horário"
                style={{ width: 18, height: 18, borderRadius: 4, border: 'none', background: 'transparent', color: 'var(--fe-text-faint)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--fe-hover)'; e.currentTarget.style.color = 'var(--fe-prio-urgent)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fe-text-faint)' }}>
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
              </button>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                <input type="text" inputMode="numeric" value={pad2(time[focused].h)} onClick={(e) => e.stopPropagation()}
                  onChange={(e) => mudarHora('h', parseInt(e.target.value.replace(/\D/g, ''), 10))}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--fe-border)'; commitHora(time[focused]) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                  style={{ width: 36, height: 26, textAlign: 'center', border: '1px solid var(--fe-border)', borderRadius: 5, background: 'var(--fe-surface)', fontSize: 12.5, fontVariantNumeric: 'tabular-nums', outline: 'none' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--fe-accent)'; e.currentTarget.select() }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fe-text-muted)' }}>:</span>
                <input type="text" inputMode="numeric" value={pad2(time[focused].m)} onClick={(e) => e.stopPropagation()}
                  onChange={(e) => mudarHora('m', parseInt(e.target.value.replace(/\D/g, ''), 10))}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--fe-border)'; commitHora(time[focused]) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                  style={{ width: 36, height: 26, textAlign: 'center', border: '1px solid var(--fe-border)', borderRadius: 5, background: 'var(--fe-surface)', fontSize: 12.5, fontVariantNumeric: 'tabular-nums', outline: 'none' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--fe-accent)'; e.currentTarget.select() }} />
              </div>
            </div>
          )}
        </div>
      )}
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
