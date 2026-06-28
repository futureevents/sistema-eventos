import { createClient } from '@/lib/supabase/server'
import { type ListConfig, type Row, type OptionsMap, type FieldDef } from './types'

export type EmbedMap = Record<string, Record<string, Record<string, unknown>>>

function relAlias(fk: string) { return fk.replace(/_id$/, '') }

function buildSelect(config: ListConfig): string {
  const parts = new Set<string>(['id', config.titleField, 'criado_em'])
  if (config.descriptionField) parts.add(config.descriptionField)
  for (const f of config.fields) {
    if (f.valuePath) continue
    if (f.type === 'relation' && f.relation) {
      parts.add(f.key)
      if (f.relation.embed) {
        const extra = f.relation.extraSelect ? `, ${f.relation.extraSelect}` : ''
        parts.add(`${relAlias(f.key)}:${f.key}(${f.relation.labelField}${extra})`)
      }
    } else {
      parts.add(f.key)
    }
  }
  return [...parts].join(', ')
}

function normalizeEmbed(v: unknown): Record<string, unknown> | null {
  const obj = (Array.isArray(v) ? (v[0] ?? null) : v) as Record<string, unknown> | null
  if (obj) {
    for (const k of Object.keys(obj)) {
      if (Array.isArray(obj[k])) obj[k] = (obj[k] as unknown[])[0] ?? null
    }
  }
  return obj
}

function normalizeRow(config: ListConfig, r: Record<string, unknown>): Row {
  const out: Record<string, unknown> = { ...r }
  for (const f of config.fields) {
    if (f.type === 'relation' && f.relation?.embed) {
      out[relAlias(f.key)] = normalizeEmbed(r[relAlias(f.key)])
    }
  }
  return out as Row
}

type RelField = FieldDef & { relation: NonNullable<FieldDef['relation']> }
function relFieldsOf(config: ListConfig): RelField[] {
  return config.fields.filter((f): f is RelField => f.type === 'relation' && !!f.relation)
}

/** Carrega opções (id+label) e, para relações embed, o mapa de objetos aninhados por id. */
async function loadRelations(config: ListConfig): Promise<{ options: OptionsMap; embeds: EmbedMap }> {
  const supabase = await createClient()
  const options: OptionsMap = {}
  const embeds: EmbedMap = {}
  await Promise.all(relFieldsOf(config).map(async (f) => {
    const rel = f.relation
    const extra = rel.embed && rel.extraSelect ? `, ${rel.extraSelect}` : ''
    const { data } = await supabase.from(rel.table).select(`id, ${rel.labelField}${extra}`).order(rel.orderBy ?? rel.labelField, { ascending: true })
    const rowsR = (data ?? []) as unknown as Record<string, unknown>[]
    options[f.key] = rowsR.map((o) => ({ id: String(o.id), label: String(o[rel.labelField] ?? '') }))
    if (rel.embed) {
      embeds[f.key] = {}
      for (const o of rowsR) {
        const norm: Record<string, unknown> = {}
        for (const k of Object.keys(o)) {
          if (k === 'id') continue
          norm[k] = Array.isArray(o[k]) ? ((o[k] as unknown[])[0] ?? null) : o[k]
        }
        embeds[f.key][String(o.id)] = norm
      }
    }
  }))
  return { options, embeds }
}

export async function loadListData(config: ListConfig): Promise<{ rows: Row[]; options: OptionsMap; embeds: EmbedMap }> {
  const supabase = await createClient()
  let q = supabase.from(config.table).select(buildSelect(config))
  if (config.baseFilter) q = q.eq(config.baseFilter.col, config.baseFilter.value)
  if (config.baseFilterIn) q = q.in(config.baseFilterIn.col, config.baseFilterIn.values)
  q = config.orderBy ? q.order(config.orderBy.col, { ascending: config.orderBy.ascending }) : q.order('criado_em', { ascending: false })
  // Linhas e relações em paralelo (cada um faz seu round-trip ao Supabase)
  const [{ data }, rel] = await Promise.all([q, loadRelations(config)])
  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => normalizeRow(config, r))
  return { rows, options: rel.options, embeds: rel.embeds }
}

export async function loadRecord(config: ListConfig, id: string): Promise<{ row: Row | null; options: OptionsMap; embeds: EmbedMap }> {
  const supabase = await createClient()
  const rec = supabase.from(config.table).select(buildSelect(config)).eq('id', id).single()
  const [{ data }, rel] = await Promise.all([rec, loadRelations(config)])
  const row = data ? normalizeRow(config, data as unknown as Record<string, unknown>) : null
  return { row, options: rel.options, embeds: rel.embeds }
}

export async function loadOptions(config: ListConfig): Promise<OptionsMap> {
  const { options } = await loadRelations(config)
  return options
}
