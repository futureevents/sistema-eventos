'use client'

/**
 * View Quadro (kanban) do motor de Lists — estilo ClickUp.
 * Colunas = status da List (mesmo agrupamento da view Lista: só aparecem
 * status com tasks; List vazia mostra só o status inicial). Cards arrastáveis
 * entre colunas no desktop (HTML5 drag-and-drop); no toque, o status muda
 * pelo painel da task. Clique no card abre o slide-over.
 */

import { useRef, useState } from 'react'
import type { ListConfig, FieldDef, Row, OptionsMap, SelectOption } from './types'
import { Avatar, dataCurta } from './kit'
import { displayLabel, dueTone, optionOf } from './cells'

export type BoardGroup = { key: string; itens: Row[]; option?: SelectOption; label?: string }

export function Board({ grupos, config, options, statusField, patch, add, onAbrir, canEdit }: {
  grupos: BoardGroup[]
  config: ListConfig
  options: OptionsMap
  statusField: FieldDef
  patch: (id: string, p: Record<string, unknown>) => void
  add: (p: Record<string, unknown>) => Promise<boolean>
  onAbrir: (id: string) => void
  canEdit: boolean
}) {
  const dragId = useRef<string | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)

  const endField = config.endDateField ? config.fields.find((f) => f.key === config.endDateField) ?? null : null
  const assigneeField = config.assigneeField ? config.fields.find((f) => f.key === config.assigneeField) ?? null : null

  function drop(colKey: string) {
    const id = dragId.current
    dragId.current = null
    setOverCol(null)
    if (!id || !canEdit || colKey.startsWith('__')) return
    patch(id, { [statusField.key]: colKey })
  }

  return (
    <div className="fe-board" style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'hidden', background: 'var(--fe-warm-white)', borderTop: '1px solid var(--fe-border-soft)', display: 'flex', alignItems: 'stretch', gap: 12, padding: '14px 22px 16px' }}>
      {grupos.map((g) => (
        <Coluna
          key={g.key}
          grupo={g}
          config={config}
          statusField={statusField}
          endField={endField}
          assigneeField={assigneeField}
          options={options}
          onAbrir={onAbrir}
          canEdit={canEdit}
          add={add}
          highlight={overCol === g.key}
          onDragStartCard={(id) => { dragId.current = id }}
          onDragOverCol={(e) => { if (dragId.current) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverCol(g.key) } }}
          onDragLeaveCol={() => setOverCol((c) => (c === g.key ? null : c))}
          onDropCol={() => drop(g.key)}
        />
      ))}
      <div style={{ width: 10, flexShrink: 0 }} />
    </div>
  )
}

function Coluna({ grupo, config, statusField, endField, assigneeField, options, onAbrir, canEdit, add, highlight, onDragStartCard, onDragOverCol, onDragLeaveCol, onDropCol }: {
  grupo: BoardGroup
  config: ListConfig
  statusField: FieldDef
  endField: FieldDef | null
  assigneeField: FieldDef | null
  options: OptionsMap
  onAbrir: (id: string) => void
  canEdit: boolean
  add: (p: Record<string, unknown>) => Promise<boolean>
  highlight: boolean
  onDragStartCard: (id: string) => void
  onDragOverCol: (e: React.DragEvent) => void
  onDragLeaveCol: () => void
  onDropCol: () => void
}) {
  const opt = grupo.option
  const fill = opt?.dot ?? 'var(--fe-status-todo)'
  const podeCriar = canEdit && !grupo.key.startsWith('__')

  return (
    <div
      onDragOver={onDragOverCol}
      onDragLeave={onDragLeaveCol}
      onDrop={onDropCol}
      style={{ width: 'var(--fe-kanban-col)', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: 'var(--fe-radius-lg)', background: highlight ? 'var(--fe-accent-dim)' : 'transparent', outline: highlight ? '1.5px dashed var(--fe-accent)' : 'none', outlineOffset: -1, transition: 'background var(--fe-dur-fast)' }}
    >
      {/* Cabeçalho da coluna: pill sólida do status + contagem */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px 10px', flexShrink: 0 }}>
        {opt ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 11px', borderRadius: 'var(--fe-radius-pill)', background: fill, color: '#fff', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {opt.label}
          </span>
        ) : (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fe-text-strong)' }}>{grupo.label ?? 'Sem status'}</span>
        )}
        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12, color: 'var(--fe-text-muted)' }}>{grupo.itens.length}</span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, minHeight: 40, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '0 6px' }}>
        {grupo.itens.map((r) => (
          <Card key={r.id} row={r} config={config} statusField={statusField} endField={endField} assigneeField={assigneeField} options={options} onAbrir={onAbrir} canEdit={canEdit} onDragStartCard={onDragStartCard} />
        ))}
        {podeCriar && <AddCard onCreate={(nome) => add({ [config.titleField]: nome, [statusField.key]: grupo.key })} singular={config.singular} />}
      </div>
    </div>
  )
}

function Card({ row, config, statusField, endField, assigneeField, options, onAbrir, canEdit, onDragStartCard }: {
  row: Row
  config: ListConfig
  statusField: FieldDef
  endField: FieldDef | null
  assigneeField: FieldDef | null
  options: OptionsMap
  onAbrir: (id: string) => void
  canEdit: boolean
  onDragStartCard: (id: string) => void
}) {
  const titulo = String(row[config.titleField] ?? '')
  const concluida = !!optionOf(statusField, String(row[statusField.key] ?? ''))?.done
  const endIso = endField ? ((row[endField.key] as string | null) ?? null) : null
  const assignee = assigneeField ? displayLabel(assigneeField, row, options) : null
  const temMeta = !!endIso || !!assignee

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Abrir ${titulo || 'registro sem título'}`}
      draggable={canEdit}
      onDragStart={(e) => { onDragStartCard(String(row.id)); e.dataTransfer.effectAllowed = 'move' }}
      onClick={() => onAbrir(String(row.id))}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrir(String(row.id)) } }}
      style={{ background: 'var(--fe-surface)', border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-card)', padding: '10px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: temMeta ? 8 : 0, transition: 'box-shadow var(--fe-dur-fast), border-color var(--fe-dur-fast)' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--fe-shadow-card-hover)'; e.currentTarget.style.borderColor = '#DFE1E6' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--fe-shadow-card)'; e.currentTarget.style.borderColor = 'var(--fe-border)' }}
    >
      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fe-text-strong)', lineHeight: 1.4, opacity: concluida ? 0.55 : 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {titulo || <span style={{ color: 'var(--fe-text-faint)' }}>Sem título</span>}
      </span>
      {temMeta && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {endIso && (
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11.5, color: dueTone(endIso, concluida) ?? 'var(--fe-text-muted)', whiteSpace: 'nowrap' }}>
              {dataCurta(endIso)}
            </span>
          )}
          <span style={{ flex: 1 }} />
          {assignee && <Avatar nome={assignee} size={20} />}
        </span>
      )}
    </div>
  )
}

function AddCard({ onCreate, singular }: { onCreate: (nome: string) => void; singular: string }) {
  const [ativo, setAtivo] = useState(false)
  const [nome, setNome] = useState('')

  function submit() {
    const t = nome.trim()
    if (!t) return
    setNome('')
    onCreate(t)
  }

  if (!ativo) {
    return (
      <button
        onClick={() => setAtivo(true)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, flexShrink: 0, border: '1px dashed var(--fe-border)', borderRadius: 'var(--fe-radius-lg)', background: 'transparent', color: 'var(--fe-text-faint)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', marginBottom: 2 }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fe-text-soft)'; e.currentTarget.style.borderColor = 'var(--fe-text-faint)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fe-text-faint)'; e.currentTarget.style.borderColor = 'var(--fe-border)' }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
        Adicionar {singular.toLowerCase()}
      </button>
    )
  }

  return (
    <div style={{ background: 'var(--fe-surface)', border: '1px solid var(--fe-accent)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-card)', padding: '8px 10px', flexShrink: 0, marginBottom: 2 }}>
      <input
        autoFocus
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); submit() }
          else if (e.key === 'Escape') { e.preventDefault(); setNome(''); setAtivo(false) }
        }}
        onBlur={() => { if (!nome.trim()) setAtivo(false) }}
        placeholder="Nome da task…"
        style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, fontWeight: 500, color: 'var(--fe-text-strong)' }}
      />
    </div>
  )
}
