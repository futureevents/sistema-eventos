import { LIST_CONFIGS } from './registry'
import { type ListConfig } from './types'

/**
 * Resolve a List (config) de uma Task a partir da tabela e, quando a tabela é
 * compartilhada por várias Lists (ex.: task_projeto → pré/intra/pós-evento),
 * do valor discriminador (o campo `baseFilter.col`, hoje sempre `tipo`).
 *
 * Fonte única de verdade: o registro de Lists. Assim, ao adicionar uma List
 * nova, o roteamento do Inbox passa a funcionar sem mudança aqui.
 */
export function resolveTaskList(table: string, discriminator?: string | null): ListConfig | null {
  const configs = Object.values(LIST_CONFIGS).filter((c) => c.table === table)
  if (configs.length === 0) return null
  // Tabela de List única (sem discriminador) — evento, cliente, fornecedor.
  if (configs.length === 1 && !configs[0].baseFilter) return configs[0]
  // Tabela compartilhada — casa pelo discriminador.
  const match = configs.find((c) => c.baseFilter && String(c.baseFilter.value) === String(discriminator))
  return match ?? configs[0]
}

/** Colunas discriminadoras por tabela (ex.: { task_projeto: 'tipo' }). Derivado das configs. */
export function discriminatorColumns(): Map<string, string> {
  const map = new Map<string, string>()
  for (const c of Object.values(LIST_CONFIGS)) {
    if (c.baseFilter) map.set(c.table, c.baseFilter.col)
  }
  return map
}

/** URL da Task (abre o registro completo). Null quando a tabela não tem List. */
export function taskHref(table: string, id: string, discriminator?: string | null): string | null {
  const list = resolveTaskList(table, discriminator)
  return list ? `${list.basePath}/${id}` : null
}

/** Rótulo curto da List (último item do breadcrumb). */
export function taskListLabel(table: string, discriminator?: string | null): string {
  const list = resolveTaskList(table, discriminator)
  if (!list) return table
  return list.breadcrumb[list.breadcrumb.length - 1] ?? list.plural
}
