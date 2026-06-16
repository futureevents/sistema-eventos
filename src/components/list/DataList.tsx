'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  type ListConfig, type FieldDef, type Row, type OptionsMap, type SelectOption, parseISO,
} from './types'
import { type EmbedMap } from './load'
import { Breadcrumb, SpaceBadge, Avatar, EmptyState, dataLonga, useHiddenFields } from './kit'
import { Dropdown, StatusDot, SelectMenu, OptionPill, RowMenu } from './inline'
import { InlineField, displayLabel, groupKey, optionOf, isDerived } from './cells'
import { RichTextEditor } from './RichText'

type FilterState = Record<string, unknown>

export function DataList({ config, rows: rowsProp, options, embeds }: {
  config: ListConfig; rows: Row[]; options: OptionsMap; embeds: EmbedMap
}) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>(rowsProp)
  const [sel, setSel] = useState<string | null>(null)

  // Abre SlideOver se ?sel=id estiver na URL (vindo do FullRecord "Recolher")
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('sel')
    if (p) { setSel(p); router.replace(window.location.pathname, { scroll: false }) }
  }, []) // eslint-disable-line
  const [busca, setBusca] = useState('')
  const [groupBy, setGroupBy] = useState<string | null>(config.defaultGroupBy ?? config.statusField ?? null)
  const [filtros, setFiltros] = useState<FilterState>({})
  const [salvando, setSalvando] = useState<'idle' | 'saving' | 'saved'>('idle')
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function marcarSalvo() {
    setSalvando('saved')
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSalvando('idle'), 1600)
  }

  async function patch(id: string, partial: Record<string, unknown>) {
    // mantém relações embed coerentes (ex.: evento → cliente derivado)
    const augmented = { ...partial }
    for (const k of Object.keys(partial)) {
      const f = config.fields.find((x) => x.key === k)
      if (f?.type === 'relation' && f.relation?.embed) {
        const alias = k.replace(/_id$/, '')
        const newId = partial[k] as string | null
        augmented[alias] = newId ? (embeds[k]?.[newId] ?? null) : null
      }
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...augmented } : r)))
    setSalvando('saving')
    const { error } = await supabase.from(config.table).update(partial).eq('id', id)
    if (error) { setSalvando('idle'); return }
    marcarSalvo()
  }

  async function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
    if (sel === id) setSel(null)
    setSalvando('saving')
    const { error } = await supabase.from(config.table).delete().eq('id', id)
    if (error) { setSalvando('idle'); return }
    marcarSalvo()
  }

  const columns = useMemo(() => config.fields.filter((f) => f.column), [config])
  const groupable = useMemo(() => config.fields.filter((f) => f.groupable), [config])
  const filterable = useMemo(() => config.fields.filter((f) => f.filterable), [config])
  const grid = useMemo(() => columns.map((c) => c.column!.width).join(' ') + ' 30px', [columns])

  const filtradas = useMemo(() => aplicarFiltros(rows, busca, filtros, config), [rows, busca, filtros, config])
  const grupos = useMemo(() => agrupar(filtradas, groupBy ? config.fields.find((f) => f.key === groupBy) ?? null : null, options), [filtradas, groupBy, config, options])
  const nFiltros = contarFiltros(filtros)

  const aberto = sel ? rows.find((r) => r.id === sel) ?? null : null
  const addHref = `${config.basePath}/novo`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--fe-surface)' }}>
      <Breadcrumb space={config.space} segments={config.breadcrumb} />
      <Toolbar
        config={config} busca={busca} onBusca={setBusca}
        groupable={groupable} groupBy={groupBy} onGroupBy={setGroupBy}
        filterable={filterable} filtros={filtros} onFiltros={setFiltros} nFiltros={nFiltros}
        rows={rows} options={options} salvando={salvando} addHref={addHref} addLabel={config.addLabel ?? `Adicionar ${config.singular}`}
      />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rows.length === 0 ? (
          <EmptyState icon={config.emptyIcon ?? <DefaultEmptyIcon />} titulo={`Nenhum registro em ${config.plural}`} descricao={`Crie o primeiro ${config.singular.toLowerCase()} para começar.`} addHref={addHref} addLabel={config.addLabel ?? `Adicionar ${config.singular}`} />
        ) : (
          <>
            <Header columns={columns} grid={grid} config={config} />
            {grupos.map((g) => (
              <Grupo key={g.key} grupo={g} grid={grid} columns={columns} config={config} options={options} patch={patch} remove={remove} onAbrir={setSel} addHref={addHref} grouped={!!groupBy} />
            ))}
            {grupos.every((g) => g.itens.length === 0) && (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: 'var(--fe-text-muted)' }}>Nenhum registro corresponde aos filtros.</div>
            )}
            <div style={{ height: 40 }} />
          </>
        )}
      </div>

      {aberto && (
        <SlideOver key={aberto.id} row={aberto} config={config} options={options} patch={patch} remove={remove} onFechar={() => setSel(null)} />
      )}
    </div>
  )
}

// ─── Filtros (lógica) ─────────────────────────────────────────────────────────

function aplicarFiltros(rows: Row[], busca: string, filtros: FilterState, config: ListConfig): Row[] {
  const q = busca.trim().toLowerCase()
  const textCols = config.fields.filter((f) => ['text', 'email', 'tel'].includes(f.type))
  return rows.filter((row) => {
    if (q) {
      const hay = [String(row[config.titleField] ?? ''), ...textCols.map((f) => String(row[f.key] ?? ''))].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    for (const f of config.fields) {
      if (!f.filterable) continue
      const fv = filtros[f.key]
      if (fv == null) continue
      if (f.type === 'select') {
        const arr = fv as string[]
        if (arr.length && !arr.includes(String(row[f.key] ?? ''))) return false
      } else if (f.type === 'multiselect') {
        const arr = fv as string[]
        if (arr.length) { const cur = (row[f.key] as string[]) ?? []; if (!arr.some((x) => cur.includes(x))) return false }
      } else if (f.type === 'relation') {
        if (fv && row[f.key] !== fv) return false
      } else if (isDerived(f)) {
        if (fv && groupKey(f, row) !== fv) return false
      } else if (f.type === 'date') {
        const d = fv as { de: string | null; ate: string | null }
        const val = row[f.key] as string | null
        if (d.de && (!val || val < d.de)) return false
        if (d.ate && (!val || val > d.ate)) return false
      } else {
        const s = String(fv).trim().toLowerCase()
        if (s && !String(row[f.key] ?? '').toLowerCase().includes(s)) return false
      }
    }
    return true
  })
}

function contarFiltros(filtros: FilterState): number {
  let n = 0
  for (const v of Object.values(filtros)) {
    if (Array.isArray(v)) { if (v.length) n++ }
    else if (v && typeof v === 'object') { const d = v as { de?: string | null; ate?: string | null }; if (d.de || d.ate) n++ }
    else if (v) n++
  }
  return n
}

// ─── Agrupamento (lógica) ─────────────────────────────────────────────────────

type GrupoView = { key: string; itens: Row[]; option?: SelectOption; label?: string }

function dateBucket(iso: string | null): { ordem: number; key: string; label: string } {
  if (!iso) return { ordem: 5, key: 'sem', label: 'Sem data' }
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const dias = Math.round((parseISO(iso).getTime() - hoje.getTime()) / 86400000)
  if (dias < 0) return { ordem: 0, key: 'atrasada', label: 'Atrasadas' }
  if (dias === 0) return { ordem: 1, key: 'hoje', label: 'Hoje' }
  if (dias <= 7) return { ordem: 2, key: 'semana', label: 'Próximos 7 dias' }
  if (dias <= 30) return { ordem: 3, key: 'mes', label: 'Próximos 30 dias' }
  return { ordem: 4, key: 'depois', label: 'Mais tarde' }
}

function agrupar(rows: Row[], field: FieldDef | null, options: OptionsMap): GrupoView[] {
  if (!field) return [{ key: '__all', itens: rows }]

  if (field.type === 'select' && field.options) {
    const order = field.groupOrder ?? field.options.map((o) => o.value)
    const always = field.alwaysGroups ?? []
    return order.map((val) => {
      const itens = rows.filter((r) => String(r[field.key] ?? '') === val)
      return { key: val, itens, option: optionOf(field, val) }
    }).filter((g) => g.itens.length > 0 || always.includes(g.key))
  }

  if (field.type === 'date') {
    const buckets = new Map<string, { ordem: number; label: string; itens: Row[] }>()
    for (const r of rows) {
      const b = dateBucket((r[field.key] as string) ?? null)
      if (!buckets.has(b.key)) buckets.set(b.key, { ordem: b.ordem, label: b.label, itens: [] })
      buckets.get(b.key)!.itens.push(r)
    }
    return [...buckets.entries()].sort((a, b) => a[1].ordem - b[1].ordem).map(([key, v]) => ({ key, itens: v.itens, label: v.label }))
  }

  // relation / derived / text → agrupa por rótulo
  const map = new Map<string, { label: string; itens: Row[] }>()
  for (const r of rows) {
    const k = groupKey(field, r) ?? '__sem'
    const label = k === '__sem' ? `Sem ${field.label.toLowerCase()}` : (displayLabel(field, r, options) ?? k)
    if (!map.has(k)) map.set(k, { label, itens: [] })
    map.get(k)!.itens.push(r)
  }
  return [...map.entries()].sort((a, b) => {
    if (a[0] === '__sem') return 1
    if (b[0] === '__sem') return -1
    return a[1].label.localeCompare(b[1].label)
  }).map(([key, v]) => ({ key, itens: v.itens, label: v.label }))
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({
  config, busca, onBusca, groupable, groupBy, onGroupBy, filterable, filtros, onFiltros, nFiltros, rows, options, salvando, addHref, addLabel,
}: {
  config: ListConfig; busca: string; onBusca: (v: string) => void
  groupable: FieldDef[]; groupBy: string | null; onGroupBy: (k: string | null) => void
  filterable: FieldDef[]; filtros: FilterState; onFiltros: (f: FilterState) => void; nFiltros: number
  rows: Row[]; options: OptionsMap; salvando: 'idle' | 'saving' | 'saved'; addHref: string; addLabel: string
}) {
  const groupLabel = groupBy ? (config.fields.find((f) => f.key === groupBy)?.label ?? 'Nenhum') : 'Nenhum'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 14px 0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0, gap: 12, background: 'var(--fe-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <span style={{ height: '100%', padding: '0 12px', borderBottom: '2px solid var(--fe-black)', fontSize: 13, fontWeight: 600, color: 'var(--fe-black)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4H12M2 7H12M2 10H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          Lista
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <SaveIndicator estado={salvando} />
        {filterable.length > 0 && <FiltrosBtn filterable={filterable} filtros={filtros} onFiltros={onFiltros} n={nFiltros} rows={rows} options={options} />}
        {groupable.length > 0 && <AgruparBtn groupable={groupable} groupBy={groupBy} onGroupBy={onGroupBy} label={groupLabel} />}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', left: 9, opacity: 0.4, pointerEvents: 'none' }}><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" /><path d="M8 8L10.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          <input value={busca} onChange={(e) => onBusca(e.target.value)} placeholder="Buscar"
            style={{ height: 30, width: 150, padding: '0 10px 0 26px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 12.5, color: 'var(--fe-text)', outline: 'none' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--fe-accent)')} onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--fe-border)')} />
        </div>
        <Link href={addHref} style={{ height: 30, padding: '0 14px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: 'var(--fe-accent-dark)', fontSize: 12.5, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          {addLabel}
        </Link>
      </div>
    </div>
  )
}

function SaveIndicator({ estado }: { estado: 'idle' | 'saving' | 'saved' }) {
  if (estado === 'idle') return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--fe-text-muted)', marginRight: 2, whiteSpace: 'nowrap' }}>
      {estado === 'saving' ? (
        <><svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ animation: 'feSpin 0.7s linear infinite' }}><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.25" /><path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>Salvando…</>
      ) : (<><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="var(--fe-accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>Salvo</>)}
    </span>
  )
}

function Ghost({ children, icon, onClick, badge }: { children: React.ReactNode; icon: React.ReactNode; onClick?: (e: React.MouseEvent) => void; badge?: number }) {
  return (
    <button onClick={onClick} style={{ height: 30, padding: '0 10px', borderRadius: 'var(--fe-radius-md)', border: 'none', background: badge ? 'var(--fe-accent-dim)' : 'transparent', color: badge ? 'var(--fe-accent-dark)' : 'var(--fe-text-soft)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
      onMouseEnter={(e) => { if (!badge) e.currentTarget.style.background = 'var(--fe-warm-white)' }}
      onMouseLeave={(e) => { if (!badge) e.currentTarget.style.background = 'transparent' }}>
      {icon}{children}
      {badge ? <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--fe-accent)', color: 'var(--fe-accent-dark)', fontSize: 10.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span> : null}
    </button>
  )
}

function AgruparBtn({ groupable, groupBy, onGroupBy, label }: { groupable: FieldDef[]; groupBy: string | null; onGroupBy: (k: string | null) => void; label: string }) {
  const opcoes: { key: string | null; label: string }[] = [{ key: null, label: 'Nenhum' }, ...groupable.map((f) => ({ key: f.key, label: f.label }))]
  return (
    <Dropdown align="right" width={180} stopPropagation={false}
      trigger={({ toggle }) => (
        <Ghost onClick={toggle} icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="2" y="8" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="8" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2" /></svg>}>
          Agrupar: <span style={{ color: 'var(--fe-text)', fontWeight: 600, marginLeft: 3 }}>{label}</span>
        </Ghost>
      )}>
      {(close) => opcoes.map((o) => (
        <button key={o.key ?? '__none'} onClick={() => { close(); onGroupBy(o.key) }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '7px 8px', border: 'none', background: o.key === groupBy ? 'var(--fe-accent-dim)' : 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: 'var(--fe-text)' }}
          onMouseEnter={(e) => { if (o.key !== groupBy) e.currentTarget.style.background = 'var(--fe-hover)' }}
          onMouseLeave={(e) => { if (o.key !== groupBy) e.currentTarget.style.background = 'transparent' }}>
          {o.label}
          {o.key === groupBy && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="var(--fe-accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
      ))}
    </Dropdown>
  )
}

function FiltrosBtn({ filterable, filtros, onFiltros, n, rows, options }: { filterable: FieldDef[]; filtros: FilterState; onFiltros: (f: FilterState) => void; n: number; rows: Row[]; options: OptionsMap }) {
  const selStyle: React.CSSProperties = { width: '100%', height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 12.5, color: 'var(--fe-text)', outline: 'none' }
  const dateStyle: React.CSSProperties = { ...selStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }
  function setF(key: string, val: unknown) { onFiltros({ ...filtros, [key]: val }) }
  function toggleArr(key: string, v: string) { const cur = (filtros[key] as string[]) ?? []; setF(key, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]) }

  return (
    <Dropdown align="right" width={280} stopPropagation={false}
      trigger={({ toggle }) => (<Ghost onClick={toggle} badge={n} icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1.5 2.5H12.5L8.5 7.2V11L5.5 12.5V7.2L1.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>}>Filtros</Ghost>)}>
      {() => (
        <div style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 440, overflowY: 'auto' }}>
          {filterable.map((f) => (
            <FilterGroup key={f.key} label={f.label}>
              {f.type === 'select' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(f.options ?? []).map((o) => <Chip key={o.value} ativo={((filtros[f.key] as string[]) ?? []).includes(o.value)} onClick={() => toggleArr(f.key, o.value)}>{o.label}</Chip>)}
                </div>
              )}
              {f.type === 'multiselect' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(f.multiOptions ?? []).map((o) => <Chip key={o} ativo={((filtros[f.key] as string[]) ?? []).includes(o)} onClick={() => toggleArr(f.key, o)}>{o.split(' — ')[0]}</Chip>)}
                </div>
              )}
              {f.type === 'relation' && (
                <select value={(filtros[f.key] as string) ?? ''} onChange={(e) => setF(f.key, e.target.value || null)} style={selStyle}>
                  <option value="">Todos</option>
                  {(options[f.key] ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              )}
              {isDerived(f) && (
                <select value={(filtros[f.key] as string) ?? ''} onChange={(e) => setF(f.key, e.target.value || null)} style={selStyle}>
                  <option value="">Todos</option>
                  {distinctDerived(rows, f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
              {f.type === 'date' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="date" value={(filtros[f.key] as { de?: string } | undefined)?.de ?? ''} onChange={(e) => setF(f.key, { ...(filtros[f.key] as object ?? {}), de: e.target.value || null })} style={dateStyle} />
                  <span style={{ fontSize: 12, color: 'var(--fe-text-faint)' }}>até</span>
                  <input type="date" value={(filtros[f.key] as { ate?: string } | undefined)?.ate ?? ''} onChange={(e) => setF(f.key, { ...(filtros[f.key] as object ?? {}), ate: e.target.value || null })} style={dateStyle} />
                </div>
              )}
              {['text', 'email', 'tel'].includes(f.type) && (
                <input value={(filtros[f.key] as string) ?? ''} onChange={(e) => setF(f.key, e.target.value)} placeholder={`Filtrar ${f.label.toLowerCase()}`} style={selStyle} />
              )}
            </FilterGroup>
          ))}
          {n > 0 && <button onClick={() => onFiltros({})} style={{ height: 30, borderRadius: 6, border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, fontWeight: 500, color: 'var(--fe-text-soft)', cursor: 'pointer' }}>Limpar filtros</button>}
        </div>
      )}
    </Dropdown>
  )
}

function distinctDerived(rows: Row[], f: FieldDef): { value: string; label: string }[] {
  const map = new Map<string, string>()
  for (const r of rows) { const v = f.valuePath!(r); if (v) map.set(v, f.labelPath ? (f.labelPath(r) ?? v) : v) }
  return [...map.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {children}
    </div>
  )
}

function Chip({ children, ativo, onClick }: { children: React.ReactNode; ativo: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ height: 26, padding: '0 10px', borderRadius: 'var(--fe-radius-pill)', border: `1px solid ${ativo ? 'var(--fe-accent)' : 'var(--fe-border)'}`, background: ativo ? 'var(--fe-accent-dim)' : 'transparent', color: ativo ? 'var(--fe-accent-dark)' : 'var(--fe-text-soft)', fontSize: 12, fontWeight: ativo ? 600 : 500, cursor: 'pointer' }}>{children}</button>
  )
}

// ─── Cabeçalho de colunas ─────────────────────────────────────────────────────

function Header({ columns, grid, config }: { columns: FieldDef[]; grid: string; config: ListConfig }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'grid', gridTemplateColumns: grid, gap: 12, padding: '0 20px 0 48px', height: 34, alignItems: 'center', background: 'var(--fe-surface)', borderBottom: '1px solid var(--fe-border)' }}>
      {columns.map((c) => <span key={c.key} style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.column!.header ?? (c.column!.primary ? `Nome (${config.singular.toLowerCase()})` : c.label)}</span>)}
      <span />
    </div>
  )
}

// ─── Grupo ─────────────────────────────────────────────────────────────────────

function Grupo({ grupo, grid, columns, config, options, patch, remove, onAbrir, addHref, grouped }: {
  grupo: GrupoView; grid: string; columns: FieldDef[]; config: ListConfig; options: OptionsMap
  patch: (id: string, p: Record<string, unknown>) => void; remove: (id: string) => void; onAbrir: (id: string) => void; addHref: string; grouped: boolean
}) {
  const [aberto, setAberto] = useState(true)
  return (
    <div>
      {grouped && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 20px', cursor: 'pointer', borderBottom: '1px solid var(--fe-border-soft)', background: 'var(--fe-warm-white)' }} onClick={() => setAberto((v) => !v)}>
          <svg width="10" height="10" viewBox="0 0 9 9" fill="none" style={{ transform: aberto ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform var(--fe-dur-fast) var(--fe-ease)', color: 'var(--fe-text-muted)' }}><path d="M3 1.5L6 4.5L3 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {grupo.option ? <OptionPill opt={grupo.option} /> : <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fe-text-strong)' }}>{grupo.label}</span>}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--fe-text-muted)' }}>{grupo.itens.length}</span>
          <Link href={addHref} onClick={(e) => e.stopPropagation()} style={{ marginLeft: 6, fontSize: 12.5, color: 'var(--fe-text-faint)', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fe-text-soft)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fe-text-faint)')}>+ Adicionar</Link>
        </div>
      )}
      {aberto && grupo.itens.map((r) => (
        <RowLine key={r.id} row={r} grid={grid} columns={columns} config={config} options={options} patch={patch} remove={remove} onAbrir={onAbrir} />
      ))}
      {aberto && grouped && grupo.itens.length === 0 && (
        <div style={{ padding: '0 20px 0 48px', height: 38, display: 'flex', alignItems: 'center', fontSize: 12.5, color: 'var(--fe-text-faint)', borderBottom: '1px solid var(--fe-border-soft)' }}>Nenhum registro</div>
      )}
    </div>
  )
}

function RowLine({ row, grid, columns, config, options, patch, remove, onAbrir }: {
  row: Row; grid: string; columns: FieldDef[]; config: ListConfig; options: OptionsMap
  patch: (id: string, p: Record<string, unknown>) => void; remove: (id: string) => void; onAbrir: (id: string) => void
}) {
  const [pop, setPop] = useState(false)
  const statusField = config.statusField ? config.fields.find((f) => f.key === config.statusField) : null
  const titulo = String(row[config.titleField] ?? '')
  const doneOpt = statusField ? optionOf(statusField, String(row[config.statusField!] ?? '')) : undefined
  const concluida = !!doneOpt?.done

  return (
    <div className="fe-row" style={{ display: 'grid', gridTemplateColumns: grid, gap: 12, alignItems: 'center', minHeight: 46, padding: '0 20px', borderBottom: '1px solid var(--fe-border-soft)', cursor: 'pointer', transition: 'background var(--fe-dur-fast)', background: 'var(--fe-surface)' }}
      onClick={() => { if (!pop) onAbrir(row.id) }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-warm-white)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--fe-surface)')}>
      {columns.map((f) => (
        <span key={f.key} onClick={(e) => { if (!f.column!.primary) e.stopPropagation() }} style={{ minWidth: 0, display: 'flex', alignItems: 'center' }}>
          {f.column!.primary ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              {statusField && <span onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex' }}><StatusDot options={statusField.options ?? []} value={String(row[config.statusField!] ?? '')} onChange={(v) => patch(row.id, { [config.statusField!]: v })} /></span>}
              {config.titleAvatar && <Avatar nome={titulo || null} size={24} />}
              <span style={{ fontSize: 13.5, fontWeight: 500, color: concluida ? 'var(--fe-text-muted)' : 'var(--fe-text-strong)', textDecoration: concluida ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titulo || <span style={{ color: 'var(--fe-text-faint)' }}>Sem título</span>}</span>
            </div>
          ) : (
            <InlineField field={f} row={row} options={options} patch={(p) => patch(row.id, p)} variant="cell" onOpenChange={setPop} />
          )}
        </span>
      ))}
      <span className="fe-row-actions" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', justifyContent: 'flex-end' }}>
        <RowMenu onExcluir={() => { if (confirm(`Excluir "${titulo}"?`)) remove(row.id) }} />
      </span>
    </div>
  )
}

// ─── Slide-over ─────────────────────────────────────────────────────────────────

function SlideOver({ row, config, options, patch, remove, onFechar }: {
  row: Row; config: ListConfig; options: OptionsMap
  patch: (id: string, p: Record<string, unknown>) => void; remove: (id: string) => void; onFechar: () => void
}) {
  const statusField = config.statusField ? config.fields.find((f) => f.key === config.statusField) : null
  const allPanelFields = config.fields.filter((f) => (f.inPanel ?? (!f.column?.primary && f.type !== 'richtext')) && f.key !== config.titleField && f.key !== config.descriptionField && f.key !== config.statusField)
  const descField = config.descriptionField ? config.fields.find((f) => f.key === config.descriptionField) : null

  const { hidden, toggle: toggleField, reset: showAllFields } = useHiddenFields(config.table)
  const [hoveredField, setHoveredField] = useState<string | null>(null)
  const panelFields = allPanelFields.filter((f) => !hidden.has(f.key))

  const [nome, setNome] = useState(String(row[config.titleField] ?? ''))
  const nomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function onNome(v: string) {
    setNome(v)
    if (nomeTimer.current) clearTimeout(nomeTimer.current)
    nomeTimer.current = setTimeout(() => { if (v.trim() !== String(row[config.titleField] ?? '')) patch(row.id, { [config.titleField]: v.trim() }) }, 600)
  }
  const descTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function onDesc(html: string) { if (descTimer.current) clearTimeout(descTimer.current); descTimer.current = setTimeout(() => patch(row.id, { [config.descriptionField!]: html }), 600) }

  const doneOpt = statusField?.options?.find((o) => o.done)
  const openOpt = statusField?.options?.find((o) => !o.done)
  const concluida = statusField ? !!optionOf(statusField, String(row[config.statusField!] ?? ''))?.done : false

  return (
    <>
      <div className="fe-fade-in" onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'var(--fe-backdrop)', zIndex: 60 }} />
      <aside className="fe-slide-in" style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'var(--fe-panel-w)', maxWidth: '92vw', background: 'var(--fe-surface)', boxShadow: 'var(--fe-shadow-panel)', zIndex: 61, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 46, padding: '0 12px 0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--fe-text-muted)' }}>
            <SpaceBadge space={config.space} size={17} />
            <span style={{ color: 'var(--fe-text-soft)', fontWeight: 500 }}>{config.breadcrumb[config.breadcrumb.length - 1]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link href={`${config.basePath}/${row.id}`} title="Expandir" style={iconBtn}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 2H12V5.5M12 2L8 6M5.5 12H2V8.5M2 12L6 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
            <Dropdown align="right" width={160} trigger={({ toggle }) => <button onClick={toggle} title="Mais" style={iconBtn as React.CSSProperties}>⋯</button>}>
              {(close) => (
                <button onClick={() => { close(); if (confirm(`Excluir "${String(row[config.titleField] ?? '')}"?`)) remove(row.id) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: 'var(--fe-prio-urgent)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5H11.5M5 3.5V2.5C5 2.2 5.2 2 5.5 2H8.5C8.8 2 9 2.2 9 2.5V3.5M3.5 3.5L4 11.5C4 11.8 4.2 12 4.5 12H9.5C9.8 12 10 11.8 10 11.5L10.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>Excluir
                </button>
              )}
            </Dropdown>
            <button onClick={onFechar} title="Fechar" style={iconBtn as React.CSSProperties}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {statusField && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              {doneOpt && openOpt && (
                <button onClick={() => patch(row.id, { [config.statusField!]: concluida ? openOpt.value : doneOpt.value })}
                  style={{ height: 32, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: `1px solid ${concluida ? 'var(--fe-accent)' : 'var(--fe-border)'}`, background: concluida ? 'var(--fe-accent-dim)' : 'transparent', color: concluida ? 'var(--fe-status-done-text)' : 'var(--fe-text)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.2L5.8 9.8L11 4" stroke={concluida ? 'var(--fe-accent)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {concluida ? 'Reabrir' : `Marcar ${doneOpt.label.toLowerCase()}`}
                </button>
              )}
              <SelectMenu options={statusField.options ?? []} value={String(row[config.statusField!] ?? '')} onChange={(v) => patch(row.id, { [config.statusField!]: v })}>
                {({ toggle }) => {
                  const opt = optionOf(statusField, String(row[config.statusField!] ?? ''))
                  return <button onClick={toggle} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>{opt ? <OptionPill opt={opt} chevron /> : <span style={{ fontSize: 12.5, color: 'var(--fe-text-faint)' }}>Status</span>}</button>
                }}
              </SelectMenu>
            </div>
          )}

          <textarea value={nome} onChange={(e) => onNome(e.target.value)} rows={1} placeholder={config.titlePlaceholder ?? 'Sem título'}
            onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }}
            style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 25, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--fe-text-strong)', margin: '0 0 20px', padding: 0, overflow: 'hidden' }} />

          <div style={{ marginBottom: descField ? 22 : 0 }}>
            {/* Campos visíveis */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {panelFields.map((f) => (
                <div
                  key={f.key}
                  onMouseEnter={() => setHoveredField(f.key)}
                  onMouseLeave={() => setHoveredField(null)}
                  style={{ display: 'grid', gridTemplateColumns: '140px 1fr 20px', alignItems: 'center', minHeight: 40 }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--fe-text-muted)' }}>{f.panelIcon}{f.label}</span>
                  <span style={{ minWidth: 0 }}><InlineField field={f} row={row} options={options} patch={(p) => patch(row.id, p)} variant="panel" /></span>
                  <button
                    onClick={() => toggleField(f.key)}
                    title="Ocultar campo"
                    style={{ width: 18, height: 18, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hoveredField === f.key ? 0.45 : 0, color: 'var(--fe-text-muted)', transition: 'opacity 100ms', padding: 0 }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </div>
              ))}
              {hidden.size > 0 && (
                <button
                  onClick={showAllFields}
                  style={{ marginTop: 6, fontSize: 12, color: 'var(--fe-text-faint)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fe-text-muted)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fe-text-faint)')}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1.5 6C1.5 6 3 2.5 6 2.5C9 2.5 10.5 6 10.5 6C10.5 6 9 9.5 6 9.5C3 9.5 1.5 6 1.5 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2" /></svg>
                  Mostrar {hidden.size} campo{hidden.size > 1 ? 's' : ''} oculto{hidden.size > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>

          {descField && (
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--fe-text-muted)', marginBottom: 8 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5H11.5M2.5 7H11.5M2.5 10.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                Descrição
              </span>
              <RichTextEditor key={row.id} value={(row[config.descriptionField!] as string) ?? null} onChange={onDesc} />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

const iconBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 16 }

function DefaultEmptyIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
}

// dataLonga re-export p/ conveniência das páginas de detalhe
export { dataLonga }
