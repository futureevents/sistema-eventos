'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  type ListConfig, type FieldDef, type Row, type OptionsMap, type SelectOption, type ViewPreset, parseISO,
} from './types'
import { type EmbedMap } from './load'
import { Breadcrumb, SpaceBadge, Avatar, EmptyState, dataCurta, dataLonga, useHiddenFields, useIsMobile } from './kit'
import { Dropdown, StatusDot, SelectMenu, RelationMenu, OptionPill, RowMenu } from './inline'
import { InlineField, displayLabel, groupKey, optionOf, isDerived, rangeSpecFor, dueTone } from './cells'
import { RichTextEditor } from './RichText'
import { QuickAddRow } from './QuickAdd'
import { TaskComments } from './TaskComments'
import { TaskAttachments } from './TaskAttachments'
import { TaskActivity } from './TaskActivity'
import { TaskChecklists } from './TaskChecklists'
import { ListEditProvider } from './perm-ctx'
import { CAPS_TOTAL, type Capacidades } from '@/lib/permissions/types'

type FilterState = Record<string, unknown>

export function DataList({ config, rows: rowsProp, options, embeds, caps = CAPS_TOTAL }: {
  config: ListConfig; rows: Row[]; options: OptionsMap; embeds: EmbedMap; caps?: Capacidades
}) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const mobile = useIsMobile()
  const [rows, setRows] = useState<Row[]>(rowsProp)
  const [sel, setSel] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Abre SlideOver se ?sel=id estiver na URL (vindo do FullRecord "Recolher")
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('sel')
    if (p) { setSel(p); router.replace(window.location.pathname, { scroll: false }) }
  }, []) // eslint-disable-line
  const [busca, setBusca] = useState('')
  const firstPreset = config.viewPresets?.[0]
  const [activeViewKey, setActiveViewKey] = useState<string | null>(firstPreset?.key ?? null)
  const [groupBy, setGroupBy] = useState<string | null>(firstPreset?.groupBy !== undefined ? (firstPreset.groupBy ?? null) : (config.defaultGroupBy ?? config.statusField ?? null))
  const [filtros, setFiltros] = useState<FilterState>(firstPreset?.filter ?? {})
  const [salvando, setSalvando] = useState<'idle' | 'saving' | 'saved'>('idle')
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tmpSeq = useRef(0)
  // Âncora p/ seleção em intervalo (shift+clique): último id clicado sem shift.
  const anchorRef = useRef<string | null>(null)

  function marcarSalvo() {
    setSalvando('saved')
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSalvando('idle'), 1600)
  }

  async function patch(id: string, partial: Record<string, unknown>) {
    if (!caps.canEdit) return
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

  async function add(partial: Record<string, unknown>): Promise<boolean> {
    if (!caps.canEdit) return false
    const payload: Record<string, unknown> = { ...partial }
    if (config.baseFilter) payload[config.baseFilter.col] = config.baseFilter.value
    if (config.baseFilterIn && payload[config.baseFilterIn.col] == null) payload[config.baseFilterIn.col] = config.baseFilterIn.values[0]

    // Resolve os embeds de relação (usados tanto na linha otimista quanto na real)
    function withEmbeds(base: Row): Row {
      const out = { ...base }
      for (const k of Object.keys(payload)) {
        const f = config.fields.find((x) => x.key === k)
        if (f?.type === 'relation' && f.relation?.embed) {
          const alias = k.replace(/_id$/, '')
          const newId = payload[k] as string | null
          out[alias] = newId ? (embeds[k]?.[newId] ?? null) : null
        }
      }
      return out
    }

    // Linha otimista: aparece na hora, com id temporário
    const tmpId = `tmp-${++tmpSeq.current}`
    const otimista = withEmbeds({ id: tmpId, criado_em: new Date().toISOString(), ...payload } as Row)
    setRows((prev) => [...prev, otimista])
    setSalvando('saving')

    const { data, error } = await supabase.from(config.table).insert(payload).select('*').single()
    if (error || !data) { setRows((prev) => prev.filter((r) => r.id !== tmpId)); setSalvando('idle'); return false }

    const novo = withEmbeds({ ...(data as Row) })
    setRows((prev) => prev.map((r) => (r.id === tmpId ? novo : r)))
    marcarSalvo()
    return true
  }

  async function patchMany(ids: string[], partial: Record<string, unknown>) {
    if (!caps.canEdit) return
    setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, ...partial } : r)))
    setSalvando('saving')
    const { error } = await supabase.from(config.table).update(partial).in('id', ids)
    if (error) { setSalvando('idle'); return }
    marcarSalvo()
  }

  async function remove(id: string) {
    if (!caps.canDelete) return
    setRows((prev) => prev.filter((r) => r.id !== id))
    if (sel === id) setSel(null)
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    setSalvando('saving')
    const { error } = await supabase.from(config.table).delete().eq('id', id)
    if (error) { setSalvando('idle'); return }
    marcarSalvo()
  }

  async function removeMany(ids: string[]) {
    if (!caps.canDelete) return
    setRows((prev) => prev.filter((r) => !ids.includes(r.id)))
    if (sel && ids.includes(sel)) setSel(null)
    setSelectedIds(new Set())
    setSalvando('saving')
    const { error } = await supabase.from(config.table).delete().in('id', ids)
    if (error) { setSalvando('idle'); return }
    marcarSalvo()
  }

  function toggleSelect(id: string, shift = false) {
    // Shift+clique: seleciona todas as linhas entre a âncora e o id clicado,
    // na ordem visível (atravessa grupos). Une à seleção atual (não remove).
    if (shift && anchorRef.current && anchorRef.current !== id) {
      const a = orderedIds.indexOf(anchorRef.current)
      const b = orderedIds.indexOf(id)
      if (a !== -1 && b !== -1) {
        const [lo, hi] = a < b ? [a, b] : [b, a]
        const range = orderedIds.slice(lo, hi + 1)
        setSelectedIds((prev) => new Set([...prev, ...range]))
        return
      }
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    anchorRef.current = id
  }

  function toggleSelectAll(visibleIds: string[]) {
    const allSelected = visibleIds.every((id) => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        visibleIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => new Set([...prev, ...visibleIds]))
    }
  }

  const columns = useMemo(() => config.fields.filter((f) => f.column), [config])
  const groupable = useMemo(() => config.fields.filter((f) => f.groupable), [config])
  const filterable = useMemo(() => config.fields.filter((f) => f.filterable), [config])
  // A coluna primária (nome) usa minmax(0,1fr) nas configs; com muitas colunas
  // fixas o piso 0 colapsa o nome p/ 0px. Garante um piso mínimo p/ o nome sempre
  // aparecer (o resto rola na horizontal).
  const grid = useMemo(() => '20px ' + columns.map((c) => {
    const w = c.column!.width
    return c.column!.primary && w.startsWith('minmax(0') ? w.replace('minmax(0', 'minmax(220px') : w
  }).join(' ') + ' 30px', [columns])

  const filtradas = useMemo(() => aplicarFiltros(rows, busca, filtros, config), [rows, busca, filtros, config])
  const groupByField = useMemo(() => (groupBy ? config.fields.find((f) => f.key === groupBy) ?? null : null), [groupBy, config])
  const grupos = useMemo(() => agrupar(filtradas, groupByField, options), [filtradas, groupByField, options])
  // Ordem visível achatada (todos os grupos em sequência) p/ o range do shift+clique.
  const orderedIds = useMemo(() => grupos.flatMap((g) => g.itens.map((r) => r.id)), [grupos])
  const nFiltros = contarFiltros(filtros)
  const visibleIds = useMemo(() => filtradas.map((r) => r.id), [filtradas])
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someSelected = visibleIds.some((id) => selectedIds.has(id))

  function applyView(preset: ViewPreset) {
    setActiveViewKey(preset.key)
    setFiltros(preset.filter ?? {})
    if (preset.groupBy !== undefined) setGroupBy(preset.groupBy ?? null)
    setBusca('')
  }

  const aberto = sel ? rows.find((r) => r.id === sel) ?? null : null
  const addHref = `${config.basePath}/novo`

  const selectedArr = useMemo(() => [...selectedIds], [selectedIds])

  return (
   <ListEditProvider caps={caps}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--fe-surface)' }}>
      {!config.hideBreadcrumb && <Breadcrumb space={config.space} segments={config.breadcrumb} />}
      {!caps.canEdit && <ReadOnlyBanner nivel={caps.canComment ? 'comentar' : 'ver'} />}
      <Toolbar
        config={config} busca={busca} onBusca={setBusca}
        groupable={groupable} groupBy={groupBy} onGroupBy={setGroupBy}
        filterable={filterable} filtros={filtros} onFiltros={setFiltros} nFiltros={nFiltros}
        rows={rows} options={options} salvando={salvando} addHref={addHref} addLabel={config.addLabel ?? `Adicionar ${config.singular}`}
        canCreate={caps.canEdit}
        viewPresets={config.viewPresets} activeViewKey={activeViewKey} onViewChange={applyView}
      />
      <div className="fe-list-pad" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="fe-list-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--fe-surface)', border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-xl)', boxShadow: 'var(--fe-shadow-card)', overflow: 'hidden' }}>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {rows.length === 0 && !(groupByField?.type === 'select' && groupByField.options) ? (
              <EmptyState icon={config.emptyIcon ?? <DefaultEmptyIcon />} titulo={`Nenhum registro em ${config.plural}`} descricao={`Crie o primeiro ${config.singular.toLowerCase()} para começar.`} addHref={addHref} addLabel={config.addLabel ?? `Adicionar ${config.singular}`} />
            ) : (
              <div style={{ minWidth: mobile ? 0 : 'var(--fe-list-min-w)' }}>
                {!groupBy && !mobile && <Header columns={columns} grid={grid} config={config} allSelected={allVisibleSelected} someSelected={someSelected} onToggleAll={() => toggleSelectAll(visibleIds)} />}
                {grupos.map((g, i) => (
                  <Grupo key={g.key} grupo={g} grid={grid} columns={columns} config={config} options={options} patch={patch} remove={remove} add={add} groupByField={groupByField} onAbrir={setSel} grouped={!!groupBy} first={i === 0} selectedIds={selectedIds} onToggle={toggleSelect} onToggleMany={toggleSelectAll} canEdit={caps.canEdit} canDelete={caps.canDelete} mobile={mobile} />
                ))}
                {rows.length > 0 && (busca.trim() !== '' || nFiltros > 0) && grupos.every((g) => g.itens.length === 0) && (
                  <div style={{ padding: '40px 24px', textAlign: 'center', fontSize: 13, color: 'var(--fe-text-muted)' }}>Nenhum registro corresponde aos filtros.</div>
                )}
                <div style={{ height: 24 }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {aberto && (
        <SlideOver key={aberto.id} row={aberto} config={config} options={options} patch={patch} remove={remove} onFechar={() => setSel(null)} caps={caps} />
      )}

      {selectedArr.length > 0 && (caps.canEdit || caps.canDelete) && (
        <BulkBar
          selectedIds={selectedArr}
          config={config}
          options={options}
          canEdit={caps.canEdit}
          canDelete={caps.canDelete}
          onPatch={(partial) => patchMany(selectedArr, partial)}
          onRemove={() => { if (confirm(`Excluir ${selectedArr.length} tarefa${selectedArr.length !== 1 ? 's' : ''}? Esta ação não pode ser desfeita.`)) removeMany(selectedArr) }}
          onClear={() => setSelectedIds(new Set())}
        />
      )}
    </div>
   </ListEditProvider>
  )
}

function ReadOnlyBanner({ nivel }: { nivel: 'ver' | 'comentar' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 22px', background: 'var(--fe-warm-white)', borderBottom: '1px solid var(--fe-border)', fontSize: 12.5, color: 'var(--fe-text-muted)' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
      {nivel === 'comentar'
        ? 'Acesso de comentário — você pode ver e comentar, mas não editar as tasks.'
        : 'Acesso de visualização — você pode ver, mas não editar as tasks.'}
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
    const grupos = order.map((val) => {
      const itens = rows.filter((r) => String(r[field.key] ?? '') === val)
      return { key: val, itens, option: optionOf(field, val) }
    })
    // Só aparecem os status que têm alguma task. Se nenhum tem, mostra apenas o
    // status inicial (primeiro da ordem) para a pessoa poder adicionar uma task.
    const comTasks = grupos.filter((g) => g.itens.length > 0)
    return comTasks.length > 0 ? comTasks : grupos.slice(0, 1)
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
  config, busca, onBusca, groupable, groupBy, onGroupBy, filterable, filtros, onFiltros, nFiltros, rows, options, salvando, addHref, addLabel, canCreate = true, viewPresets, activeViewKey, onViewChange,
}: {
  config: ListConfig; busca: string; onBusca: (v: string) => void
  groupable: FieldDef[]; groupBy: string | null; onGroupBy: (k: string | null) => void
  filterable: FieldDef[]; filtros: FilterState; onFiltros: (f: FilterState) => void; nFiltros: number
  rows: Row[]; options: OptionsMap; salvando: 'idle' | 'saving' | 'saved'; addHref: string; addLabel: string; canCreate?: boolean
  viewPresets?: ViewPreset[]; activeViewKey?: string | null; onViewChange?: (p: ViewPreset) => void
}) {
  const groupLabel = groupBy ? (config.fields.find((f) => f.key === groupBy)?.label ?? 'Nenhum') : 'Nenhum'
  return (
    <div className="fe-bar-pad fe-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 18px 0 22px', flexShrink: 0, gap: 12, background: 'var(--fe-surface)' }}>
      <div className="fe-toolbar-tabs" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {viewPresets && viewPresets.length > 0 ? (
          viewPresets.map((p) => {
            const active = p.key === activeViewKey
            return (
              <button key={p.key} onClick={() => onViewChange?.(p)}
                style={{ height: '100%', padding: '0 12px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: active ? '2px solid var(--fe-black)' : '2px solid transparent', fontSize: 13, fontWeight: active ? 600 : 500, color: active ? 'var(--fe-black)' : 'var(--fe-text-soft)', background: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                {p.label}
              </button>
            )
          })
        ) : (
          <span style={{ height: '100%', padding: '0 12px', borderBottom: '2px solid var(--fe-black)', fontSize: 13, fontWeight: 600, color: 'var(--fe-black)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4H12M2 7H12M2 10H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            Lista
          </span>
        )}
      </div>
      <div className="fe-toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <SaveIndicator estado={salvando} />
        {filterable.length > 0 && <FiltrosBtn filterable={filterable} filtros={filtros} onFiltros={onFiltros} n={nFiltros} rows={rows} options={options} />}
        {groupable.length > 0 && <AgruparBtn groupable={groupable} groupBy={groupBy} onGroupBy={onGroupBy} label={groupLabel} />}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', left: 9, opacity: 0.4, pointerEvents: 'none' }}><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" /><path d="M8 8L10.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          <input value={busca} onChange={(e) => onBusca(e.target.value)} placeholder="Buscar"
            style={{ height: 30, width: 'clamp(96px, 22vw, 150px)', minWidth: 0, padding: '0 10px 0 26px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 12.5, color: 'var(--fe-text)', outline: 'none' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--fe-accent)')} onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--fe-border)')} />
        </div>
        {canCreate && (
          <Link href={addHref} style={{ height: 30, padding: '0 14px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: 'var(--fe-accent-fg)', fontSize: 12.5, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            {addLabel}
          </Link>
        )}
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
      {badge ? <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--fe-accent)', color: 'var(--fe-accent-fg)', fontSize: 10.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span> : null}
    </button>
  )
}

function AgruparBtn({ groupable, groupBy, onGroupBy, label }: { groupable: FieldDef[]; groupBy: string | null; onGroupBy: (k: string | null) => void; label: string }) {
  const opcoes: { key: string | null; label: string }[] = [{ key: null, label: 'Nenhum' }, ...groupable.map((f) => ({ key: f.key, label: f.label }))]
  return (
    <Dropdown align="right" width={180} stopPropagation={false}
      trigger={({ toggle }) => (
        <Ghost onClick={toggle} icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="2" y="8" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="8" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2" /></svg>}>
          <span className="fe-hide-sm">Agrupar: <span style={{ color: 'var(--fe-text)', fontWeight: 600, marginLeft: 3 }}>{label}</span></span>
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
  const dateStyle: React.CSSProperties = { ...selStyle, fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12 }
  function setF(key: string, val: unknown) { onFiltros({ ...filtros, [key]: val }) }
  function toggleArr(key: string, v: string) { const cur = (filtros[key] as string[]) ?? []; setF(key, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]) }

  return (
    <Dropdown align="right" width={280} stopPropagation={false}
      trigger={({ toggle }) => (<Ghost onClick={toggle} badge={n} icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1.5 2.5H12.5L8.5 7.2V11L5.5 12.5V7.2L1.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>}><span className="fe-hide-sm">Filtros</span></Ghost>)}>
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
                  {f.options
                    ? f.options.map((o) => <Chip key={o.value} ativo={((filtros[f.key] as string[]) ?? []).includes(o.value)} onClick={() => toggleArr(f.key, o.value)}>{o.label}</Chip>)
                    : (f.multiOptions ?? []).map((o) => <Chip key={o} ativo={((filtros[f.key] as string[]) ?? []).includes(o)} onClick={() => toggleArr(f.key, o)}>{o.split(' — ')[0]}</Chip>)}
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

function Header({ columns, grid, config, allSelected, someSelected, onToggleAll }: {
  columns: FieldDef[]; grid: string; config: ListConfig
  allSelected: boolean; someSelected: boolean; onToggleAll: () => void
}) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'grid', gridTemplateColumns: grid, gap: 12, padding: '0 24px', height: 36, alignItems: 'center', background: 'var(--fe-surface)', borderBottom: '1px solid var(--fe-border)' }}>
      {/* Checkbox select-all */}
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={onToggleAll} />
      </span>
      {columns.map((c) => <span key={c.key} style={{ fontSize: 12, fontWeight: 600, color: 'var(--fe-text-muted)' }}>{c.column!.header ?? (c.column!.primary ? `Nome (${config.singular.toLowerCase()})` : c.label)}</span>)}
      <span />
    </div>
  )
}

// ─── Checkbox ────────────────────────────────────────────────────────────────

function Checkbox({ checked, indeterminate = false, onChange, visible = true, interactive = true }: {
  checked: boolean; indeterminate?: boolean; onChange: () => void; visible?: boolean; interactive?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      tabIndex={interactive ? undefined : -1}
      style={{
        width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--fe-accent)',
        opacity: visible || checked || indeterminate ? 1 : 0,
        transition: 'opacity 80ms',
        flexShrink: 0,
        pointerEvents: interactive ? undefined : 'none',
      }}
    />
  )
}

// ─── Grupo ─────────────────────────────────────────────────────────────────────

function Grupo({ grupo, grid, columns, config, options, patch, remove, add, groupByField, onAbrir, grouped, first, selectedIds, onToggle, onToggleMany, canEdit = true, canDelete = true, mobile = false }: {
  grupo: GrupoView; grid: string; columns: FieldDef[]; config: ListConfig; options: OptionsMap
  patch: (id: string, p: Record<string, unknown>) => void; remove: (id: string) => void
  add: (p: Record<string, unknown>) => Promise<boolean>; groupByField: FieldDef | null
  onAbrir: (id: string) => void; grouped: boolean; first?: boolean
  selectedIds: Set<string>; onToggle: (id: string, shift?: boolean) => void
  onToggleMany: (ids: string[]) => void
  canEdit?: boolean; canDelete?: boolean; mobile?: boolean
}) {
  const [aberto, setAberto] = useState(true)
  const [adicionando, setAdicionando] = useState(false)
  // Seleção do grupo inteiro (checkbox no header do grupo).
  const groupIds = grupo.itens.map((r) => r.id)
  const allGroupSel = groupIds.length > 0 && groupIds.every((id) => selectedIds.has(id))
  const someGroupSel = groupIds.some((id) => selectedIds.has(id))

  // Defaults da nova task ao criar dentro deste grupo (ex.: status do grupo).
  const groupDefaults = useMemo<Record<string, unknown> | undefined>(() => {
    if (groupByField?.type === 'select' && grupo.key && !grupo.key.startsWith('__')) return { [groupByField.key]: grupo.key }
    return undefined
  }, [groupByField, grupo.key])

  return (
    <div>
      {grouped && (
        <div className="fe-group-head" role="button" tabIndex={0} aria-expanded={aberto} aria-label={`${aberto ? 'Recolher' : 'Expandir'} grupo ${grupo.label ?? grupo.option?.label ?? ''}`.trim()} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, marginTop: first ? 6 : 24, padding: '0 24px', cursor: 'pointer', background: 'transparent' }}
          onClick={() => setAberto((v) => !v)}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); setAberto((v) => !v) } }}>
          <span style={{ width: 20, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 9 9" fill="none" style={{ transform: aberto ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform var(--fe-dur-fast) var(--fe-ease)', color: 'var(--fe-text-muted)' }}><path d="M3 1.5L6 4.5L3 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          {grupo.option ? <OptionPill opt={grupo.option} solid /> : <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fe-text-strong)' }}>{grupo.label}</span>}
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12, color: 'var(--fe-text-muted)' }}>{grupo.itens.length}</span>
          {canEdit && <button onClick={(e) => { e.stopPropagation(); setAberto(true); setAdicionando(true) }} style={{ marginLeft: 6, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 12.5, color: 'var(--fe-text-faint)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fe-text-soft)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fe-text-faint)')}>+ Adicionar</button>}
        </div>
      )}
      {grouped && aberto && !mobile && grupo.itens.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: grid, gap: 12, padding: '0 24px', height: 30, alignItems: 'center', borderBottom: '1px solid var(--fe-divider)' }}>
          <span onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Checkbox checked={allGroupSel} indeterminate={someGroupSel && !allGroupSel} onChange={() => onToggleMany(groupIds)} />
          </span>
          {columns.map((c) => <span key={c.key} style={{ fontSize: 12, fontWeight: 600, color: 'var(--fe-text-muted)' }}>{c.column!.header ?? (c.column!.primary ? `Nome (${config.singular.toLowerCase()})` : c.label)}</span>)}
          <span />
        </div>
      )}
      {aberto && grupo.itens.map((r) => (
        <RowLine key={r.id} row={r} grid={grid} columns={columns} config={config} options={options} patch={patch} remove={remove} onAbrir={onAbrir} selected={selectedIds.has(r.id)} onToggle={(shift) => onToggle(r.id, shift)} anySelected={selectedIds.size > 0} canDelete={canDelete} mobile={mobile} />
      ))}
      {aberto && canEdit && (
        <QuickAddRow config={config} defaults={groupDefaults} active={adicionando} onActiveChange={setAdicionando} onCreate={add} placeholder={grouped ? 'Adicionar task' : undefined} />
      )}
    </div>
  )
}

function RowLine({ row, grid, columns, config, options, patch, remove, onAbrir, selected, onToggle, anySelected, canDelete = true, mobile = false }: {
  row: Row; grid: string; columns: FieldDef[]; config: ListConfig; options: OptionsMap
  patch: (id: string, p: Record<string, unknown>) => void; remove: (id: string) => void; onAbrir: (id: string) => void
  selected: boolean; onToggle: (shift: boolean) => void; anySelected: boolean; canDelete?: boolean; mobile?: boolean
}) {
  const [pop, setPop] = useState(false)
  const [hovered, setHovered] = useState(false)
  const statusField = config.statusField ? config.fields.find((f) => f.key === config.statusField) : null
  const titulo = String(row[config.titleField] ?? '')
  const doneOpt = statusField ? optionOf(statusField, String(row[config.statusField!] ?? '')) : undefined
  const concluida = !!doneOpt?.done
  const primaryCol = columns.find((f) => f.column!.primary)?.column
  const twoLine = !!primaryCol?.subtitle

  // Celular: linha compacta em coluna única (sem grid nem rolagem horizontal) —
  // título + meta (subtítulo, vencimento colorido, responsável), estilo app do ClickUp.
  if (mobile) {
    const endField = config.endDateField ? config.fields.find((f) => f.key === config.endDateField) ?? null : null
    const assigneeField = config.assigneeField ? config.fields.find((f) => f.key === config.assigneeField) ?? null : null
    const endIso = endField ? ((row[endField.key] as string | null) ?? null) : null
    const assignee = assigneeField ? displayLabel(assigneeField, row, options) : null
    const subtitle = twoLine ? primaryCol!.subtitle!(row) : null
    const meta: React.ReactNode[] = []
    if (subtitle) meta.push(<span key="sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{subtitle}</span>)
    if (endIso) meta.push(<span key="due" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12, color: dueTone(endIso, concluida) ?? 'var(--fe-text-muted)', flexShrink: 0 }}>{dataCurta(endIso)}</span>)
    if (assignee) meta.push(<span key="who" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, minWidth: 0 }}><Avatar nome={assignee} size={16} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assignee}</span></span>)

    return (
      <div className="fe-row" role="button" tabIndex={0} aria-label={`Abrir ${titulo || 'registro sem título'}`}
        style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '11px 16px', borderBottom: '1px solid var(--fe-divider)', cursor: 'pointer', background: selected ? 'var(--fe-accent-dim)' : 'var(--fe-surface)', boxShadow: selected ? 'inset 2px 0 0 var(--fe-accent)' : 'none' }}
        onClick={() => { if (!pop) onAbrir(row.id) }}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); if (!pop) onAbrir(row.id) } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          {statusField && (
            <span onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              <StatusDot options={statusField.options ?? []} value={String(row[config.statusField!] ?? '')} onChange={(v) => patch(row.id, { [config.statusField!]: v })} />
            </span>
          )}
          {config.titleAvatar && <Avatar nome={titulo || null} size={24} />}
          <span style={{ fontSize: 'var(--fe-text-md)', fontWeight: 500, color: 'var(--fe-text-strong)', opacity: concluida ? 0.5 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
            {titulo || <span style={{ color: 'var(--fe-text-faint)' }}>Sem título</span>}
          </span>
        </div>
        {meta.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: statusField ? 23 : 0, fontSize: 'var(--fe-text-sm)', color: 'var(--fe-text-muted)', minWidth: 0 }}>
            {meta}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fe-row" role="button" tabIndex={0} aria-label={`Abrir ${titulo || 'registro sem título'}`}
      style={{ display: 'grid', gridTemplateColumns: grid, gap: 12, alignItems: 'center', minHeight: twoLine ? 58 : 46, padding: '0 24px', borderBottom: '1px solid var(--fe-divider)', cursor: 'pointer', transition: 'background var(--fe-dur-fast), box-shadow var(--fe-dur-fast)', boxShadow: selected ? 'inset 2px 0 0 var(--fe-accent)' : 'none', background: selected ? 'var(--fe-accent-dim)' : 'var(--fe-surface)' }}
      onClick={(e) => { if (e.shiftKey) { e.preventDefault(); onToggle(true) } else if (!pop) onAbrir(row.id) }}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); if (!pop) onAbrir(row.id) } }}
      onMouseEnter={(e) => { setHovered(true); if (!selected) { e.currentTarget.style.background = 'var(--fe-warm-white)'; e.currentTarget.style.boxShadow = 'inset 2px 0 0 var(--fe-accent)' } }}
      onMouseLeave={(e) => { setHovered(false); if (!selected) { e.currentTarget.style.background = 'var(--fe-surface)'; e.currentTarget.style.boxShadow = 'none' } }}>
      {/* Checkbox — span captura shiftKey (range); o input é só visual */}
      <span onClick={(e) => { e.stopPropagation(); onToggle(e.shiftKey) }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <Checkbox checked={selected} onChange={() => {}} interactive={false} visible={hovered || selected || anySelected} />
      </span>
      {columns.map((f) => (
        <span key={f.key} onClick={(e) => { if (!f.column!.primary) e.stopPropagation() }} style={{ minWidth: 0, display: 'flex', alignItems: 'center' }}>
          {f.column!.primary ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {statusField && <span onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}><StatusDot options={statusField.options ?? []} value={String(row[config.statusField!] ?? '')} onChange={(v) => patch(row.id, { [config.statusField!]: v })} /></span>}
              {config.titleAvatar && <Avatar nome={titulo || null} size={twoLine ? 30 : 24} />}
              {twoLine ? (
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 1 }}>
                  <span style={{ fontSize: 'var(--fe-text-md)', fontWeight: 500, color: 'var(--fe-text-strong)', opacity: concluida ? 0.5 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{titulo || <span style={{ color: 'var(--fe-text-faint)' }}>Sem título</span>}</span>
                  {(() => { const sub = primaryCol!.subtitle!(row); return sub ? <span style={{ fontSize: 'var(--fe-text-sm)', color: 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{sub}</span> : null })()}
                </div>
              ) : (
                <span style={{ fontSize: 'var(--fe-text-md)', fontWeight: 500, color: 'var(--fe-text-strong)', opacity: concluida ? 0.5 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titulo || <span style={{ color: 'var(--fe-text-faint)' }}>Sem título</span>}</span>
              )}
            </div>
          ) : (
            <InlineField field={f} row={row} options={options} patch={(p) => patch(row.id, p)} variant="cell" onOpenChange={setPop}
              range={f.type === 'date' ? rangeSpecFor(config, f) : undefined}
              dateColor={f.type === 'date' && f.key === config.endDateField ? dueTone(row[f.key] as string | null, concluida) : undefined} />
          )}
        </span>
      ))}
      <span className="fe-row-actions" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', justifyContent: 'flex-end' }}>
        {canDelete && <RowMenu onExcluir={() => { if (confirm(`Excluir "${titulo}"?`)) remove(row.id) }} />}
      </span>
    </div>
  )
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

function BulkBar({ selectedIds, config, options, onPatch, onRemove, onClear, canEdit = true, canDelete = true }: {
  selectedIds: string[]
  config: ListConfig
  options: OptionsMap
  onPatch: (partial: Record<string, unknown>) => void
  onRemove: () => void
  onClear: () => void
  canEdit?: boolean
  canDelete?: boolean
}) {
  const n = selectedIds.length
  const statusField = config.statusField ? config.fields.find((f) => f.key === config.statusField) : null
  const assigneeField = config.assigneeField ? config.fields.find((f) => f.key === config.assigneeField) ?? null : null
  const assigneeOptions = assigneeField ? (options[assigneeField.key] ?? []) : []
  // Acesso rápido inline: até 3 colunas select/date (exceto status e responsável).
  const actionFields = config.fields.filter((f) =>
    (f.type === 'select' || f.type === 'date') &&
    f.key !== config.statusField &&
    f.key !== config.assigneeField &&
    (f.column || f.inPanel)
  ).slice(0, 3)
  // Demais custom fields editáveis da List (qualquer tipo), acessíveis via "Campos".
  const inlineKeys = new Set([config.statusField, config.assigneeField, config.titleField, ...actionFields.map((f) => f.key)].filter(Boolean) as string[])
  const moreFields = config.fields.filter((f) =>
    f.editable !== false && !isDerived(f) && f.type !== 'richtext' && !inlineKeys.has(f.key)
  )

  const bulkBtnStyle: React.CSSProperties = {
    height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.88)',
    fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
  }

  const panelStyle: React.CSSProperties = {
    position: 'absolute', bottom: 'calc(100% + 8px)', zIndex: 40,
    background: 'var(--fe-surface)', border: '1px solid var(--fe-border)',
    borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-pop)', padding: 5,
    minWidth: 180,
  }

  return (
    <div className="fe-bulkbar" style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 90, animation: 'feBulkIn 180ms var(--fe-ease) both' }}>
      <div className="fe-bulkbar-inner" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', height: 50, background: '#1a1a2e', borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>

        {/* Contador + limpar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 8px 0 4px', marginRight: 4, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
            {n} selecionada{n !== 1 ? 's' : ''}
          </span>
          <button onClick={onClear} title="Cancelar seleção"
            style={{ width: 20, height: 20, borderRadius: 5, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 1.5L7.5 7.5M7.5 1.5L1.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Status */}
        {canEdit && statusField && (
          <BulkDropdown
            label={<><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" /><path d="M4 6.2L5.5 7.5L8 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>Status</>}
            btnStyle={bulkBtnStyle}
            panelStyle={panelStyle}
          >
            {(close) => (statusField.options ?? []).map((o) => {
              const opt = o as SelectOption
              return (
                <button key={opt.value}
                  onClick={() => { close(); onPatch({ [config.statusField!]: opt.value }) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: 'var(--fe-text)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <OptionPill opt={opt} />
                </button>
              )
            })}
          </BulkDropdown>
        )}

        {/* Responsável */}
        {canEdit && assigneeField && (
          <RelationMenu options={assigneeOptions} value={null} semLabel={`Sem ${assigneeField.label.toLowerCase()}`}
            onChange={(id) => onPatch({ [assigneeField.key]: id })}>
            {({ toggle }) => (
              <button onClick={toggle} style={bulkBtnStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
                <PersonGlyph />{assigneeField.label}
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ opacity: 0.6 }}><path d="M2 3.5L4.5 6L7 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </RelationMenu>
        )}

        {/* Campos select adicionais */}
        {canEdit && actionFields.map((f) => f.type === 'select' ? (
          <BulkDropdown
            key={f.key}
            label={<>{f.label}</>}
            btnStyle={bulkBtnStyle}
            panelStyle={panelStyle}
          >
            {(close) => (f.options ?? []).map((o) => (
              <button key={o.value}
                onClick={() => { close(); onPatch({ [f.key]: o.value }) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: 'var(--fe-text)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <OptionPill opt={o} />
              </button>
            ))}
          </BulkDropdown>
        ) : f.type === 'date' ? (
          <BulkDropdown
            key={f.key}
            label={<><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="2.5" width="9" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M1.5 5.5H10.5M4 1.5V3.5M8 1.5V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>{f.label}</>}
            btnStyle={bulkBtnStyle}
            panelStyle={{ ...panelStyle, minWidth: 220, padding: 12 }}
          >
            {(close) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</span>
                <input type="date"
                  style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 13, color: 'var(--fe-text)', outline: 'none', fontFamily: 'var(--font-geist-mono), monospace' }}
                  onChange={(e) => { if (e.target.value) { close(); onPatch({ [f.key]: e.target.value }) } }} />
              </div>
            )}
          </BulkDropdown>
        ) : null)}

        {/* Demais custom fields da List */}
        {canEdit && moreFields.length > 0 && (
          <BulkDropdown
            label={<><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 3.5H10.5M1.5 6H10.5M1.5 8.5H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><circle cx="4" cy="3.5" r="1.3" fill="var(--fe-surface,#1a1a2e)" stroke="currentColor" strokeWidth="1.1" /><circle cx="8" cy="6" r="1.3" fill="var(--fe-surface,#1a1a2e)" stroke="currentColor" strokeWidth="1.1" /><circle cx="5" cy="8.5" r="1.3" fill="var(--fe-surface,#1a1a2e)" stroke="currentColor" strokeWidth="1.1" /></svg>Campos</>}
            btnStyle={bulkBtnStyle}
            panelStyle={{ ...panelStyle, minWidth: 268, maxWidth: 320, maxHeight: 'min(56vh, 480px)', overflowY: 'auto', padding: 6 }}
          >
            {() => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {moreFields.map((f) => (
                  <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '5px 7px', borderRadius: 6 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{f.label}</span>
                    <span style={{ minWidth: 0, textAlign: 'right' }}>
                      <InlineField field={f} row={{ id: '' }} options={options} patch={(p) => onPatch(p)} variant="panel" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </BulkDropdown>
        )}

        {canDelete && <>
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

          {/* Excluir */}
          <button
            onClick={onRemove}
            style={{ ...bulkBtnStyle, color: '#ff7b7b', border: '1px solid rgba(255,100,100,0.25)', background: 'rgba(255,80,80,0.1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,80,80,0.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,80,80,0.1)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3H10M4.5 3V2C4.5 1.7 4.7 1.5 5 1.5H7C7.3 1.5 7.5 1.7 7.5 2V3M3 3L3.5 9.5C3.5 9.8 3.7 10 4 10H8C8.3 10 8.5 9.8 8.5 9.5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Excluir
          </button>
        </>}
      </div>
    </div>
  )
}

function BulkDropdown({ label, btnStyle, panelStyle, children }: {
  label: React.ReactNode
  btnStyle: React.CSSProperties
  panelStyle: React.CSSProperties
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button onClick={() => setOpen((v) => !v)} style={btnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
        {label}
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ opacity: 0.6 }}><path d="M2 3.5L4.5 6L7 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div style={panelStyle}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

// ─── Slide-over ─────────────────────────────────────────────────────────────────

function SlideOver({ row, config, options, patch, remove, onFechar, caps = CAPS_TOTAL }: {
  row: Row; config: ListConfig; options: OptionsMap
  patch: (id: string, p: Record<string, unknown>) => void; remove: (id: string) => void; onFechar: () => void
  caps?: Capacidades
}) {
  const statusField = config.statusField ? config.fields.find((f) => f.key === config.statusField) : null
  const allPanelFields = config.fields.filter((f) => (f.inPanel ?? (!f.column?.primary && f.type !== 'richtext')) && f.key !== config.titleField && f.key !== config.descriptionField && f.key !== config.statusField)
  const descField = config.descriptionField ? config.fields.find((f) => f.key === config.descriptionField) : null

  const { hidden, toggle: toggleField, reset: showAllFields } = useHiddenFields(config.table)
  const [hoveredField, setHoveredField] = useState<string | null>(null)
  const panelFields = allPanelFields.filter((f) => !hidden.has(f.key))
  // Datas logo abaixo do nome; demais campos abaixo da descrição (estilo ClickUp).
  const startField = config.startDateField ? config.fields.find((f) => f.key === config.startDateField) ?? null : null
  const endField = config.endDateField ? config.fields.find((f) => f.key === config.endDateField) ?? null : null
  const assigneeField = config.assigneeField ? config.fields.find((f) => f.key === config.assigneeField) ?? null : null
  const customPanelFields = panelFields.filter((f) => f.key !== config.startDateField && f.key !== config.endDateField && f.key !== config.assigneeField)

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

  // Fecha o painel ao pressionar Esc.
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onFechar])

  return (
    <>
      <div className="fe-fade-in" onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'var(--fe-backdrop)', zIndex: 60 }} />
      <aside className="fe-slide-in fe-panel fe-vh-full" style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'var(--fe-panel-w)', maxWidth: '92vw', background: 'var(--fe-surface)', boxShadow: 'var(--fe-shadow-panel)', zIndex: 61, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, padding: '0 14px 0 22px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fe-text-muted)' }}>
            <SpaceBadge space={config.space} size={18} />
            <span style={{ color: 'var(--fe-text-soft)', fontWeight: 500 }}>{config.breadcrumb[config.breadcrumb.length - 1]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link href={`${config.rowBasePath?.(row) ?? config.basePath}/${row.id}`} title="Expandir" aria-label="Expandir em tela cheia" style={iconBtn}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 2H12V5.5M12 2L8 6M5.5 12H2V8.5M2 12L6 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
            {caps.canDelete && (
              <Dropdown align="right" width={160} trigger={({ toggle }) => <button onClick={toggle} title="Mais" aria-label="Mais ações" style={iconBtn as React.CSSProperties}>⋯</button>}>
                {(close) => (
                  <button onClick={() => { close(); if (confirm(`Excluir "${String(row[config.titleField] ?? '')}"?`)) remove(row.id) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: 'var(--fe-prio-urgent)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5H11.5M5 3.5V2.5C5 2.2 5.2 2 5.5 2H8.5C8.8 2 9 2.2 9 2.5V3.5M3.5 3.5L4 11.5C4 11.8 4.2 12 4.5 12H9.5C9.8 12 10 11.8 10 11.5L10.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>Excluir
                  </button>
                )}
              </Dropdown>
            )}
            <button onClick={onFechar} title="Fechar" aria-label="Fechar painel" style={iconBtn as React.CSSProperties}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg></button>
          </div>
        </div>

        <div className="fe-panel-body" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {statusField && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              {caps.canEdit ? (
                <>
                  {doneOpt && openOpt && (
                    <button onClick={() => patch(row.id, { [config.statusField!]: concluida ? openOpt.value : doneOpt.value })}
                      style={{ height: 36, padding: '0 15px', borderRadius: 'var(--fe-radius-md)', border: `1px solid ${concluida ? 'var(--fe-accent)' : 'var(--fe-border)'}`, background: concluida ? 'var(--fe-accent-dim)' : 'transparent', color: concluida ? 'var(--fe-status-done-text)' : 'var(--fe-text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M3 7.2L5.8 9.8L11 4" stroke={concluida ? 'var(--fe-accent)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {concluida ? 'Reabrir' : `Marcar ${doneOpt.label.toLowerCase()}`}
                    </button>
                  )}
                  <SelectMenu options={statusField.options ?? []} value={String(row[config.statusField!] ?? '')} onChange={(v) => patch(row.id, { [config.statusField!]: v })}>
                    {({ toggle }) => {
                      const opt = optionOf(statusField, String(row[config.statusField!] ?? ''))
                      return <button onClick={toggle} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>{opt ? <OptionPill opt={opt} chevron /> : <span style={{ fontSize: 12.5, color: 'var(--fe-text-faint)' }}>Status</span>}</button>
                    }}
                  </SelectMenu>
                </>
              ) : (() => {
                const opt = optionOf(statusField, String(row[config.statusField!] ?? ''))
                return opt ? <OptionPill opt={opt} /> : null
              })()}
            </div>
          )}

          <textarea className="fe-panel-title" value={nome} onChange={(e) => onNome(e.target.value)} rows={1} placeholder={config.titlePlaceholder ?? 'Sem título'} readOnly={!caps.canEdit}
            onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }}
            style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-geist), sans-serif', fontWeight: 600, fontSize: 27, lineHeight: 1.22, letterSpacing: '-0.015em', color: 'var(--fe-text-strong)', margin: '0 0 26px', padding: 0, overflow: 'hidden', cursor: caps.canEdit ? 'text' : 'default' }} />

          {/* Responsável + datas — empilhados verticalmente sob o nome (menos poluição) */}
          {(assigneeField || startField || endField) && (
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: descField ? 26 : 4 }}>
              {assigneeField && (
                <div style={{ display: 'grid', gridTemplateColumns: 'var(--fe-prop-label) minmax(0,1fr)', alignItems: 'center', minHeight: 42 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 'var(--fe-text-base)', color: 'var(--fe-text-muted)' }}><PersonGlyph />{assigneeField.label}</span>
                  <span style={{ minWidth: 0 }}><InlineField field={assigneeField} row={row} options={options} patch={(p) => patch(row.id, p)} variant="panel" /></span>
                </div>
              )}
              {startField && (
                <div style={{ display: 'grid', gridTemplateColumns: 'var(--fe-prop-label) minmax(0,1fr)', alignItems: 'center', minHeight: 42 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 'var(--fe-text-base)', color: 'var(--fe-text-muted)' }}><DateGlyph />{startField.label}</span>
                  <span style={{ minWidth: 0 }}><InlineField field={startField} row={row} options={options} patch={(p) => patch(row.id, p)} variant="panel" range={rangeSpecFor(config, startField)} /></span>
                </div>
              )}
              {endField && (
                <div style={{ display: 'grid', gridTemplateColumns: 'var(--fe-prop-label) minmax(0,1fr)', alignItems: 'center', minHeight: 42 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 'var(--fe-text-base)', color: 'var(--fe-text-muted)' }}><DateGlyph />{endField.label}</span>
                  <span style={{ minWidth: 0 }}><InlineField field={endField} row={row} options={options} patch={(p) => patch(row.id, p)} variant="panel" range={rangeSpecFor(config, endField)} /></span>
                </div>
              )}
            </div>
          )}

          {descField && (
            <div style={{ marginBottom: 30 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 'var(--fe-text-base)', color: 'var(--fe-text-muted)', marginBottom: 10 }}>
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5H11.5M2.5 7H11.5M2.5 10.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                Descrição
              </span>
              {caps.canEdit ? (
                <RichTextEditor key={row.id} value={(row[config.descriptionField!] as string) ?? null} onChange={onDesc} />
              ) : (
                (() => {
                  const html = (row[config.descriptionField!] as string) ?? ''
                  return html.trim()
                    ? <div className="fe-rich-content" style={{ fontSize: 14, color: 'var(--fe-text)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: html }} />
                    : <span style={{ fontSize: 14, color: 'var(--fe-text-faint)' }}>Sem descrição.</span>
                })()
              )}
            </div>
          )}

          {/* Custom fields — abaixo da descrição (estilo ClickUp) */}
          {(customPanelFields.length > 0 || hidden.size > 0) && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 'var(--fe-text-xs)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fe-text-muted)', marginBottom: 6 }}>Campos</div>
              {customPanelFields.map((f) => (
                <div
                  key={f.key}
                  onMouseEnter={() => setHoveredField(f.key)}
                  onMouseLeave={() => setHoveredField(null)}
                  style={{ display: 'grid', gridTemplateColumns: 'var(--fe-prop-label) 1fr 20px', alignItems: 'center', minHeight: 44 }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 'var(--fe-text-base)', color: 'var(--fe-text-muted)' }}>{f.panelIcon}{f.label}</span>
                  <span style={{ minWidth: 0 }}><InlineField field={f} row={row} options={options} patch={(p) => patch(row.id, p)} variant="panel" /></span>
                  <button
                    onClick={() => toggleField(f.key)}
                    title="Ocultar campo"
                    aria-label={`Ocultar campo ${f.label}`}
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
          )}

          <TaskChecklists taskId={String(row.id)} taskTable={config.table} />
          <TaskAttachments taskId={String(row.id)} taskTable={config.table} />
          <TaskActivity taskId={String(row.id)} taskTable={config.table} config={config} />
          <TaskComments taskId={String(row.id)} taskTable={config.table} />
        </div>
      </aside>
    </>
  )
}

const iconBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 16 }

function DefaultEmptyIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
}

function DateGlyph() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
}

function PersonGlyph() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}

// dataLonga re-export p/ conveniência das páginas de detalhe
export { dataLonga }
