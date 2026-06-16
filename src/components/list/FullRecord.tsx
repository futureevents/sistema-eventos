'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type ListConfig, type Row, type OptionsMap } from './types'
import { type EmbedMap } from './load'
import { SpaceBadge, dataLonga, useHiddenFields } from './kit'
import { SelectMenu, OptionPill } from './inline'
import { InlineField, optionOf } from './cells'
import { RichTextEditor } from './RichText'

export function FullRecord({ config, row: rowProp, options, embeds }: {
  config: ListConfig; row: Row; options: OptionsMap; embeds: EmbedMap
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [row, setRow] = useState<Row>(rowProp)
  const [salvando, setSalvando] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [excluindo, setExcluindo] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const statusField = config.statusField ? config.fields.find((f) => f.key === config.statusField) : null
  const detailFields = config.fields.filter((f) => (f.inPanel ?? (!f.column?.primary && f.type !== 'richtext')) && f.key !== config.titleField && f.key !== config.descriptionField)
  const descField = config.descriptionField ? config.fields.find((f) => f.key === config.descriptionField) : null

  const { hidden, toggle: toggleField, reset: showAllFields } = useHiddenFields(config.table)
  const [hoveredField, setHoveredField] = useState<string | null>(null)
  const visibleFields = detailFields.filter((f) => !hidden.has(f.key))

  function marcarSalvo() { setSalvando('saved'); if (savedTimer.current) clearTimeout(savedTimer.current); savedTimer.current = setTimeout(() => setSalvando('idle'), 1600) }

  async function patch(partial: Record<string, unknown>) {
    const augmented = { ...partial }
    for (const k of Object.keys(partial)) {
      const f = config.fields.find((x) => x.key === k)
      if (f?.type === 'relation' && f.relation?.embed) {
        const alias = k.replace(/_id$/, ''); const newId = partial[k] as string | null
        augmented[alias] = newId ? (embeds[k]?.[newId] ?? null) : null
      }
    }
    setRow((p) => ({ ...p, ...augmented }))
    setSalvando('saving')
    const { error } = await supabase.from(config.table).update(partial).eq('id', row.id)
    if (error) { setSalvando('idle'); return }
    marcarSalvo()
  }

  const [nome, setNome] = useState(String(row[config.titleField] ?? ''))
  const nomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function onNome(v: string) { setNome(v); if (nomeTimer.current) clearTimeout(nomeTimer.current); nomeTimer.current = setTimeout(() => { if (v.trim() !== String(row[config.titleField] ?? '')) patch({ [config.titleField]: v.trim() }) }, 600) }
  const descTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function onDesc(html: string) { if (descTimer.current) clearTimeout(descTimer.current); descTimer.current = setTimeout(() => patch({ [config.descriptionField!]: html }), 600) }

  const doneOpt = statusField?.options?.find((o) => o.done)
  const openOpt = statusField?.options?.find((o) => !o.done)
  const concluida = statusField ? !!optionOf(statusField, String(row[config.statusField!] ?? ''))?.done : false

  async function excluir() {
    if (!confirm('Excluir este registro?')) return
    setExcluindo(true)
    await supabase.from(config.table).delete().eq('id', row.id)
    router.push(config.basePath); router.refresh()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'var(--fe-warm-white)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 50, padding: '0 16px 0 22px', borderBottom: '1px solid var(--fe-border-soft)', background: 'var(--fe-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fe-text-muted)', minWidth: 0 }}>
          <SpaceBadge space={config.space} />
          {config.breadcrumb.map((s, i) => {
            const last = i === config.breadcrumb.length - 1
            return <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ color: last ? undefined : 'var(--fe-text-muted)' }}>{i === config.breadcrumb.length - 1 ? <Link href={config.basePath} style={{ color: 'var(--fe-text-muted)', textDecoration: 'none' }}>{s}</Link> : s}</span><span style={{ color: 'var(--fe-text-faint)' }}>/</span></span>
          })}
          <span style={{ fontWeight: 600, color: 'var(--fe-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row[config.titleField] ?? '')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SaveIndicator estado={salvando} />
          <Link href={config.basePath} style={{ height: 32, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, fontWeight: 500, color: 'var(--fe-text)', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5.5 2H2V5.5M2 2L6 6M8.5 12H12V8.5M12 12L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>Recolher
          </Link>
          <Link href={config.basePath} title="Fechar" style={{ width: 32, height: 32, borderRadius: 'var(--fe-radius-md)', background: 'transparent', color: 'var(--fe-text-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg></Link>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 32px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 332px', gap: 36, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>
            {statusField && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                {doneOpt && openOpt && (
                  <button onClick={() => patch({ [config.statusField!]: concluida ? openOpt.value : doneOpt.value })} style={{ height: 34, padding: '0 14px', borderRadius: 'var(--fe-radius-md)', border: `1px solid ${concluida ? 'var(--fe-accent)' : 'var(--fe-border)'}`, background: concluida ? 'var(--fe-accent-dim)' : 'transparent', color: concluida ? 'var(--fe-status-done-text)' : 'var(--fe-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M3 7.2L5.8 9.8L11 4" stroke={concluida ? 'var(--fe-accent)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>{concluida ? 'Reabrir' : `Marcar ${doneOpt.label.toLowerCase()}`}
                  </button>
                )}
                <SelectMenu options={statusField.options ?? []} value={String(row[config.statusField!] ?? '')} onChange={(v) => patch({ [config.statusField!]: v })}>
                  {({ toggle }) => { const opt = optionOf(statusField, String(row[config.statusField!] ?? '')); return <button onClick={toggle} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>{opt ? <OptionPill opt={opt} chevron /> : <span style={{ fontSize: 13, color: 'var(--fe-text-faint)' }}>Status</span>}</button> }}
                </SelectMenu>
              </div>
            )}

            <textarea value={nome} onChange={(e) => onNome(e.target.value)} rows={1} placeholder={config.titlePlaceholder ?? 'Sem título'}
              onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }}
              style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.14, letterSpacing: '-0.03em', color: 'var(--fe-text-strong)', margin: '0 0 24px', padding: 0, overflow: 'hidden' }} />

            {descField ? <RichTextEditor key={row.id} value={(row[config.descriptionField!] as string) ?? null} onChange={onDesc} minHeight={200} /> : null}

            <div style={{ marginTop: 20 }}>
              <button type="button" onClick={excluir} disabled={excluindo} style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fe-prio-urgent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5H11.5M5 3.5V2.5C5 2.2 5.2 2 5.5 2H8.5C8.8 2 9 2.2 9 2.5V3.5M3.5 3.5L4 11.5C4 11.8 4.2 12 4.5 12H9.5C9.8 12 10 11.8 10 11.5L10.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>{excluindo ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>

          <aside style={{ position: 'sticky', top: 0, background: 'var(--fe-surface)', border: '1px solid var(--fe-border-soft)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-card)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--fe-divider)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Detalhes</span>
            </div>

            {/* Campos visíveis */}
            <div style={{ padding: '4px 18px 14px' }}>
              {visibleFields.map((f, i) => (
                <div
                  key={f.key}
                  onMouseEnter={() => setHoveredField(f.key)}
                  onMouseLeave={() => setHoveredField(null)}
                  style={{ display: 'grid', gridTemplateColumns: '104px 1fr 20px', alignItems: 'center', minHeight: 40, borderBottom: i === visibleFields.length - 1 ? 'none' : '1px solid var(--fe-divider)' }}
                >
                  <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)' }}>{f.label}</span>
                  <span style={{ minWidth: 0 }}><InlineField field={f} row={row} options={options} patch={patch} variant="panel" /></span>
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
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--fe-divider)' }}><span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)' }}>Criado em {dataLonga(String(row.criado_em).slice(0, 10))}</span></div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function SaveIndicator({ estado }: { estado: 'idle' | 'saving' | 'saved' }) {
  if (estado === 'idle') return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--fe-text-muted)', whiteSpace: 'nowrap' }}>
      {estado === 'saving' ? (<><svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ animation: 'feSpin 0.7s linear infinite' }}><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.25" /><path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>Salvando…</>) : (<><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="var(--fe-accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>Salvo</>)}
    </span>
  )
}
