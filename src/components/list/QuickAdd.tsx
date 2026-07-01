'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type ListConfig, type TaskTemplate } from './types'

function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Linha de criação inline estilo ClickUp: dentro da própria List, "+ Adicionar
 * tarefa" abre um editor na linha. Enter cria a task sem sair da página; digitar
 * `/` abre o menu de Modelos (config.templates) para pré-preencher a task.
 */
export function QuickAddRow({
  config, defaults, active, onActiveChange, onCreate, placeholder,
}: {
  config: ListConfig
  defaults?: Record<string, unknown>
  active: boolean
  onActiveChange: (v: boolean) => void
  onCreate: (partial: Record<string, unknown>) => Promise<boolean>
  placeholder?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [nome, setNome] = useState('')
  const [pending, setPending] = useState<Record<string, unknown> | null>(null)
  const [pendingLabel, setPendingLabel] = useState<string | null>(null)
  const [menuIdx, setMenuIdx] = useState(0)

  const templates = config.templates ?? []
  const slashFilter = nome.startsWith('/') && !nome.includes(' ') ? nome.slice(1) : null
  const slashOpen = slashFilter !== null
  const matches = useMemo(
    () => (slashFilter ? templates.filter((t) => norm(t.label).includes(norm(slashFilter))) : templates),
    [slashFilter, templates],
  )

  useEffect(() => { if (active) inputRef.current?.focus() }, [active])
  useEffect(() => { setMenuIdx(0) }, [slashFilter])

  function reset(close: boolean) {
    setNome(''); setPending(null); setPendingLabel(null)
    if (close) onActiveChange(false)
  }

  function applyTemplate(tpl: TaskTemplate) {
    const seed = typeof tpl.defaults[config.titleField] === 'string' ? (tpl.defaults[config.titleField] as string) : ''
    setNome(seed)
    setPending(tpl.defaults)
    setPendingLabel(tpl.label)
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
    })
  }

  function submit() {
    const titulo = nome.trim()
    if (!titulo || titulo.startsWith('/')) return
    const partial: Record<string, unknown> = { ...defaults, ...(pending ?? {}), [config.titleField]: titulo }
    // Limpa o campo na hora para criar várias tasks em sequência (Enter, Enter…).
    // onCreate é otimista: a linha já aparece e a persistência é reconciliada em segundo plano.
    setNome(''); setPending(null); setPendingLabel(null)
    requestAnimationFrame(() => inputRef.current?.focus())
    void onCreate(partial)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (slashOpen && matches.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMenuIdx((i) => (i + 1) % matches.length); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMenuIdx((i) => (i - 1 + matches.length) % matches.length); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); applyTemplate(matches[menuIdx]); return }
    }
    if (e.key === 'Enter') { e.preventDefault(); submit() }
    else if (e.key === 'Escape') {
      e.preventDefault()
      if (slashOpen) setNome('')
      else reset(true)
    }
  }

  if (!active) {
    return (
      <button
        className="fe-quickadd"
        onClick={() => onActiveChange(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 38, padding: '0 24px', border: 'none', borderBottom: '1px solid var(--fe-divider)', background: 'transparent', cursor: 'pointer', color: 'var(--fe-text-faint)', fontSize: 13, fontWeight: 500, textAlign: 'left' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--fe-warm-white)'; e.currentTarget.style.color = 'var(--fe-text-soft)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fe-text-faint)' }}
      >
        <PlusIcon />
        {placeholder ?? `Adicionar ${config.singular.toLowerCase()}`}
      </button>
    )
  }

  return (
    <div className="fe-quickadd" style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 46, padding: '0 24px', borderBottom: '1px solid var(--fe-divider)', background: 'var(--fe-warm-white)' }}>
      <span style={{ width: 16, display: 'inline-flex', justifyContent: 'center', color: 'var(--fe-accent)', flexShrink: 0 }}><PlusIcon /></span>
      <div style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {pendingLabel && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, fontSize: 11, fontWeight: 600, background: 'var(--fe-accent-dim)', color: 'var(--fe-accent)', padding: '2px 4px 2px 8px', borderRadius: 5 }}>
            {pendingLabel}
            <button onClick={() => { setPending(null); setPendingLabel(null); inputRef.current?.focus() }} title="Remover modelo" style={{ display: 'inline-flex', border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', padding: 2, borderRadius: 3 }}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            </button>
          </span>
        )}
        <input
          ref={inputRef}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => { if (!nome.trim()) reset(true) }}
          placeholder="Nome da task…  ( / para modelos )"
          style={{ flex: 1, minWidth: 0, height: 30, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--fe-text-md)', fontWeight: 500, color: 'var(--fe-text-strong)' }}
        />
        {slashOpen && (
          <TemplateMenu
            matches={matches}
            menuIdx={menuIdx}
            onPick={applyTemplate}
            onHover={setMenuIdx}
            hasTemplates={templates.length > 0}
          />
        )}
      </div>
      <span style={{ fontSize: 11, color: 'var(--fe-text-faint)', flexShrink: 0, whiteSpace: 'nowrap' }} className="fe-hide-sm">
        Enter para criar · Esc para sair
      </span>
    </div>
  )
}

function TemplateMenu({ matches, menuIdx, onPick, onHover, hasTemplates }: {
  matches: TaskTemplate[]; menuIdx: number; onPick: (t: TaskTemplate) => void; onHover: (i: number) => void; hasTemplates: boolean
}) {
  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 30, minWidth: 220, maxHeight: 280, overflowY: 'auto', background: 'var(--fe-surface)', border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-pop)', padding: 5 }}
    >
      <div style={{ padding: '4px 8px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Modelos</div>
      {!hasTemplates ? (
        <div style={{ padding: '6px 8px 8px', fontSize: 12.5, color: 'var(--fe-text-faint)' }}>Nenhum modelo nesta List.</div>
      ) : matches.length === 0 ? (
        <div style={{ padding: '6px 8px 8px', fontSize: 12.5, color: 'var(--fe-text-faint)' }}>Nenhum modelo corresponde.</div>
      ) : (
        matches.map((t, i) => (
          <button
            key={t.label}
            onClick={() => onPick(t)}
            onMouseEnter={() => onHover(i)}
            style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 8px', border: 'none', background: i === menuIdx ? 'var(--fe-accent-dim)' : 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: 'var(--fe-text)', textAlign: 'left' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, background: 'var(--fe-accent-dim)', color: 'var(--fe-accent)', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 2.5H8.5L11 5V11.5C11 11.8 10.8 12 10.5 12H3C2.7 12 2.5 11.8 2.5 11.5V3C2.5 2.7 2.7 2.5 3 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M8.5 2.5V5H11" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
            </span>
            <span style={{ fontWeight: 500 }}>{t.label}</span>
          </button>
        ))
      )}
    </div>
  )
}

function PlusIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
}
