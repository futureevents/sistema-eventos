'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type ListConfig, type OptionsMap, type FieldDef } from './types'
import { SpaceBadge, inputStyle, accentBtn } from './kit'
import { MultiMenu } from './inline'
import { RichTextEditor } from './RichText'
import { isDerived } from './cells'

export function NewRecordForm({ config, options }: { config: ListConfig; options: OptionsMap }) {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = { [config.titleField]: '' }
    for (const f of config.fields) {
      if (isDerived(f) || f.key === config.titleField) continue
      if (f.type === 'multiselect') init[f.key] = []
      else if (f.type === 'select') init[f.key] = f.options?.[0]?.value ?? ''
      else init[f.key] = ''
    }
    if (config.descriptionField) init[config.descriptionField] = ''
    return init
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [editorKey, setEditorKey] = useState(0)

  function applyTemplate(tpl: import('./types').TaskTemplate) {
    setForm((prev) => ({ ...prev, ...tpl.defaults }))
    setEditorKey((k) => k + 1)
  }

  const formFields = config.fields.filter((f) => !isDerived(f) && f.key !== config.titleField && f.key !== config.descriptionField && f.type !== 'richtext')

  function set(key: string, v: unknown) { setForm((p) => ({ ...p, [key]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const titulo = String(form[config.titleField] ?? '').trim()
    if (!titulo) { setErro(`O campo ${primaryLabel(config)} é obrigatório.`); return }
    setSalvando(true); setErro(null)
    const payload: Record<string, unknown> = { [config.titleField]: titulo }
    if (config.baseFilter) payload[config.baseFilter.col] = config.baseFilter.value
    for (const f of formFields) {
      const v = form[f.key]
      if (f.type === 'multiselect') payload[f.key] = v ?? []
      else if (f.type === 'select') payload[f.key] = v || (f.options?.[0]?.value ?? null)
      else payload[f.key] = (typeof v === 'string' ? v.trim() : v) || null
    }
    if (config.descriptionField) payload[config.descriptionField] = (form[config.descriptionField] as string) || null
    const supabase = createClient()
    const { data, error } = await supabase.from(config.table).insert(payload).select('id').single()
    if (error) { setErro(error.message); setSalvando(false); return }
    router.push(`${config.basePath}/${data.id}`); router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 46, padding: '0 18px', borderBottom: '1px solid var(--fe-border-soft)', background: 'var(--fe-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--fe-text-muted)' }}>
          <SpaceBadge space={config.space} size={18} />
          <Link href={config.basePath} style={{ color: 'var(--fe-text-muted)', textDecoration: 'none' }}>{config.breadcrumb[config.breadcrumb.length - 1]}</Link>
          <span style={{ color: 'var(--fe-icon)' }}>/</span>
          <span style={{ fontWeight: 600, color: 'var(--fe-text-strong)' }}>Novo {config.singular.toLowerCase()}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={config.basePath} style={{ height: 32, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, fontWeight: 500, color: 'var(--fe-text-soft)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Cancelar</Link>
          <button form="novo-registro" type="submit" disabled={salvando} style={accentBtn(salvando)}>{salvando ? 'Salvando…' : `Criar ${config.singular.toLowerCase()}`}</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
        <form id="novo-registro" onSubmit={submit} style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {config.templates && config.templates.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fe-text-muted)', flexShrink: 0 }}>Usar modelo:</span>
              {config.templates.map((tpl) => (
                <button key={tpl.label} type="button" onClick={() => applyTemplate(tpl)} style={{ height: 28, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-accent)', background: 'var(--fe-accent-dim)', color: 'var(--fe-accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {tpl.label}
                </button>
              ))}
            </div>
          )}
          {erro && <div style={{ padding: '10px 14px', borderRadius: 'var(--fe-radius-md)', background: 'rgba(220,61,67,0.08)', color: 'var(--fe-prio-urgent)', fontSize: 13 }}>{erro}</div>}
          <Field label={primaryLabel(config)} required>
            <input type="text" value={String(form[config.titleField] ?? '')} onChange={(e) => set(config.titleField, e.target.value)} style={inputStyle} autoFocus />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {formFields.map((f) => <Field key={f.key} label={f.label}><FormInput field={f} value={form[f.key]} onChange={(v) => set(f.key, v)} options={options} /></Field>)}
          </div>
          {config.descriptionField && <Field label="Descrição"><RichTextEditor key={editorKey} value={String(form[config.descriptionField] ?? '')} onChange={(html) => set(config.descriptionField!, html)} /></Field>}
        </form>
      </div>
    </div>
  )
}

function FormInput({ field, value, onChange, options }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; options: OptionsMap }) {
  if (field.type === 'select') {
    return <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} style={inputStyle}>{(field.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
  }
  if (field.type === 'relation') {
    return <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} style={inputStyle}><option value="">Sem {field.label.toLowerCase()}</option>{(options[field.key] ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
  }
  if (field.type === 'date') return <input type="date" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
  if (field.type === 'multiselect') {
    const arr = (value as string[]) ?? []
    return (
      <MultiMenu options={field.multiOptions ?? []} value={arr} onChange={onChange}>
        {({ toggle }) => (
          <button type="button" onClick={toggle} style={{ ...inputStyle, height: 'auto', minHeight: 36, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5, padding: '6px 10px' }}>
            {arr.length === 0 ? <span style={{ color: 'var(--fe-text-faint)' }}>Selecionar…</span> : arr.map((t) => <span key={t} style={{ fontSize: 11, fontWeight: 600, background: 'var(--fe-accent-dim)', color: 'var(--fe-accent)', padding: '2px 8px', borderRadius: 4 }}>{t.split(' — ')[0]}</span>)}
          </button>
        )}
      </MultiMenu>
    )
  }
  return <input type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
}

function primaryLabel(config: ListConfig): string {
  const pf = config.fields.find((f) => f.column?.primary)
  return pf?.label ?? 'Nome'
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-soft)' }}>{label}{required && <span style={{ color: 'var(--fe-prio-urgent)', marginLeft: 2 }}>*</span>}</label>
      {children}
    </div>
  )
}
