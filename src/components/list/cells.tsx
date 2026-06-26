'use client'

import { type FieldDef, type Row, type OptionsMap, type SelectOption } from './types'
import { Avatar, Tag, dataCurta, Dash } from './kit'
import {
  Dropdown, CalendarPopover, SelectMenu, RelationMenu, MultiMenu, TextInline,
  OptionPill, FlagInline,
} from './inline'

// ─── Leitura de valores ───────────────────────────────────────────────────────

export function isDerived(f: FieldDef): boolean { return !!f.valuePath }

export function rawValue(f: FieldDef, row: Row): unknown {
  if (f.valuePath) return f.valuePath(row)
  return row[f.key]
}

export function optionOf(f: FieldDef, value: string | null): SelectOption | undefined {
  if (!value || !f.options) return undefined
  return f.options.find((o) => o.value === value)
}

/** Rótulo legível p/ exibição e agrupamento. */
export function displayLabel(f: FieldDef, row: Row, options: OptionsMap): string | null {
  if (f.valuePath) return f.labelPath ? f.labelPath(row) : (f.valuePath(row) ?? null)
  const v = row[f.key]
  if (v == null || v === '') return null
  switch (f.type) {
    case 'select': return optionOf(f, String(v))?.label ?? String(v)
    case 'relation': {
      const opt = options[f.key]?.find((o) => o.id === v)
      if (opt) return opt.label
      const emb = row[f.key.replace(/_id$/, '')] as { [k: string]: unknown } | null
      return emb && f.relation ? String(emb[f.relation.labelField] ?? '') || null : null
    }
    case 'date': return dataCurta(String(v))
    case 'multiselect': {
      if (!Array.isArray(v) || v.length === 0) return null
      const arr = v as string[]
      return f.options ? arr.map((x) => optionOf(f, x)?.label ?? x).join(', ') : arr.join(', ')
    }
    default: return String(v)
  }
}

/** Chave de grupo (null = "sem"). */
export function groupKey(f: FieldDef, row: Row): string | null {
  if (f.valuePath) return f.valuePath(row)
  const v = row[f.key]
  if (v == null || v === '') return null
  return String(v)
}

// ─── Célula / valor editável inline ───────────────────────────────────────────

const cellBtn: React.CSSProperties = { width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '4px 6px', margin: '0 -6px', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }

function HoverBtn({ children, onClick, title }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} style={cellBtn}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      {children}
    </button>
  )
}

export function InlineField({
  field, row, options, patch, variant = 'cell', onOpenChange,
}: {
  field: FieldDef
  row: Row
  options: OptionsMap
  patch: (partial: Record<string, unknown>) => void
  variant?: 'cell' | 'panel'
  onOpenChange?: (open: boolean) => void
}) {
  const editable = field.editable !== false && !isDerived(field)
  const muted = 'var(--fe-text)'

  // Derivado / não editável → só exibe
  if (!editable) {
    const lbl = displayLabel(field, row, options)
    return <span style={{ fontSize: variant === 'cell' ? 12.5 : 13, color: lbl ? muted : 'var(--fe-text-faint)' }}>{lbl ?? '—'}</span>
  }

  switch (field.type) {
    case 'text': case 'email': case 'tel':
      return <TextInline value={(row[field.key] as string) ?? null} type={field.type === 'text' ? 'text' : field.type} placeholder={field.placeholder ?? '—'} dense={variant === 'cell'} onChange={(v) => patch({ [field.key]: v })} />

    case 'date': {
      const iso = (row[field.key] as string) ?? null
      return (
        <Dropdown align="left" width={252} fill={variant === 'cell'} onOpenChange={onOpenChange}
          trigger={({ toggle }) => (
            <HoverBtn onClick={toggle} title={`Alterar ${field.label.toLowerCase()}`}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: variant === 'cell' ? 12.5 : 13, color: iso ? muted : 'var(--fe-text-faint)', whiteSpace: 'nowrap' }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.85, flexShrink: 0 }}><rect x="2" y="2.8" width="10" height="9.2" rx="1.6" stroke="currentColor" strokeWidth="1.2" /><path d="M2 5.2H12M4.6 1.6V3.4M9.4 1.6V3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                {iso ? dataCurta(iso) : (field.placeholder ?? '—')}
              </span>
            </HoverBtn>
          )}>
          {(close) => <CalendarPopover value={iso} onChange={(v) => patch({ [field.key]: v })} onClose={close} />}
        </Dropdown>
      )
    }

    case 'select': {
      const value = (row[field.key] as string) ?? ''
      const opt = optionOf(field, value)
      const display = field.column?.display === 'flag' ? 'flag' : 'pill'
      return (
        <SelectMenu options={field.options ?? []} value={value} display={display} fill={variant === 'cell'} onChange={(v) => patch({ [field.key]: v })}>
          {({ toggle }) => (
            <HoverBtn onClick={toggle} title={`Alterar ${field.label.toLowerCase()}`}>
              {opt ? (display === 'flag' ? <FlagInline color={opt.flag ?? opt.dot ?? 'var(--fe-text-muted)'} label={opt.label} /> : <OptionPill opt={opt} chevron={variant === 'panel'} />) : <span style={{ color: 'var(--fe-text-faint)', fontSize: 12.5 }}>—</span>}
            </HoverBtn>
          )}
        </SelectMenu>
      )
    }

    case 'relation': {
      const value = (row[field.key] as string) ?? null
      const lbl = displayLabel(field, row, options)
      const isAvatar = field.column?.display === 'avatar'
      return (
        <RelationMenu options={options[field.key] ?? []} value={value} semLabel={`Sem ${field.label.toLowerCase()}`} fill={!isAvatar} onChange={(id) => patch({ [field.key]: id })}>
          {({ toggle }) => (
            isAvatar ? (
              <button onClick={toggle} title={`Alterar ${field.label.toLowerCase()}`} style={{ border: 'none', background: 'transparent', padding: 2, borderRadius: '50%', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Avatar nome={lbl} size={variant === 'cell' ? 24 : 22} />
                {variant === 'panel' && <span style={{ fontSize: 13, color: lbl ? 'var(--fe-text)' : 'var(--fe-text-faint)' }}>{lbl ?? `Sem ${field.label.toLowerCase()}`}</span>}
              </button>
            ) : (
              <HoverBtn onClick={toggle} title={`Alterar ${field.label.toLowerCase()}`}>
                <span style={{ fontSize: variant === 'cell' ? 12.5 : 13, color: lbl ? muted : 'var(--fe-text-faint)', textAlign: 'left', overflow: variant === 'cell' ? 'hidden' : 'visible', textOverflow: 'ellipsis', whiteSpace: variant === 'cell' ? 'nowrap' : 'normal', wordBreak: 'break-word' }}>{lbl ?? '—'}</span>
              </HoverBtn>
            )
          )}
        </RelationMenu>
      )
    }

    case 'multiselect': {
      // Defensivo: aceita array ou valor único legado (pré-migração enum→text[]).
      const raw = row[field.key]
      const arr: string[] = Array.isArray(raw) ? (raw as string[]) : raw != null && raw !== '' ? [String(raw)] : []
      const colored = field.options
      return (
        <MultiMenu options={field.multiOptions ?? []} colored={colored} value={arr} fill={variant === 'cell'} onChange={(v) => patch({ [field.key]: v })}>
          {({ toggle }) => (
            <HoverBtn onClick={toggle} title={`Alterar ${field.label.toLowerCase()}`}>
              {arr.length === 0 ? <span style={{ color: 'var(--fe-text-faint)', fontSize: 12.5 }}>—</span> : (
                <span style={{ display: 'inline-flex', gap: 5, flexWrap: variant === 'panel' ? 'wrap' : 'nowrap', overflow: 'hidden' }}>
                  {arr.slice(0, variant === 'panel' ? 99 : 2).map((t) => {
                    const opt = colored?.find((o) => o.value === t)
                    return opt
                      ? <span key={t} style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 9px', borderRadius: 'var(--fe-radius-sm)', background: opt.bg ?? 'var(--fe-track)', color: opt.text ?? 'var(--fe-text-soft)', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>{opt.label}</span>
                      : <Tag key={t} label={t.split(' — ')[0]} />
                  })}
                  {variant === 'cell' && arr.length > 2 && <span style={{ fontSize: 11, color: 'var(--fe-text-muted)' }}>+{arr.length - 2}</span>}
                </span>
              )}
            </HoverBtn>
          )}
        </MultiMenu>
      )
    }

    default:
      return <Dash />
  }
}
