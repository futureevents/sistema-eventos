import { type FieldDef, type Row, type OptionsMap, parseISO } from './types'
import { displayLabel, isDerived } from './cells'

/**
 * Ordenação de colunas do motor de Lists. Vale para qualquer List: o tipo do
 * campo declarado na config decide como a coluna ordena (data = cronológica,
 * select = ordem declarada, relation = nome exibido, etc.).
 */

export type SortState = { key: string; dir: 'asc' | 'desc' }

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

/** Valor comparável do campo na linha. null = vazio → sempre no fim. */
function sortValue(f: FieldDef, row: Row, options: OptionsMap): string | number | null {
  if (isDerived(f)) return texto(displayLabel(f, row, options))

  const v = row[f.key]
  if (v == null || v === '') return null

  switch (f.type) {
    case 'date': {
      const t = parseISO(String(v)).getTime()
      return isNaN(t) ? null : t
    }
    case 'money': {
      const n = Number(v)
      return isNaN(n) ? null : n
    }
    // Select ordena pela ordem declarada nas options (A fazer → Em andamento →
    // Concluído), não alfabeticamente. Valor fora das options cai no fim.
    case 'select': {
      if (!f.options) return String(v)
      const i = f.options.findIndex((o) => o.value === String(v))
      return i === -1 ? f.options.length : i
    }
    case 'multiselect':
      return Array.isArray(v) && v.length > 0 ? texto(displayLabel(f, row, options)) : null
    // relation → nome resolvido; texto/email/tel/richtext → o próprio valor.
    default:
      return texto(displayLabel(f, row, options))
  }
}

function texto(s: string | null): string | null {
  return s && s.trim() !== '' ? s : null
}

export function sortRows(rows: Row[], sort: SortState | null, fields: FieldDef[], options: OptionsMap): Row[] {
  if (!sort) return rows
  const f = fields.find((x) => x.key === sort.key)
  if (!f) return rows
  const dir = sort.dir === 'asc' ? 1 : -1

  return [...rows].sort((a, b) => {
    const va = sortValue(f, a, options)
    const vb = sortValue(f, b, options)
    // Vazios ficam no fim tanto no crescente quanto no decrescente.
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? va - vb
      : collator.compare(String(va), String(vb))
    return cmp * dir
  })
}

/** Ciclo do clique no cabeçalho: crescente → decrescente → ordem padrão. */
export function nextSort(cur: SortState | null, key: string): SortState | null {
  if (cur?.key !== key) return { key, dir: 'asc' }
  return cur.dir === 'asc' ? { key, dir: 'desc' } : null
}
