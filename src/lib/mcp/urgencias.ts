import { admin } from './helpers'
import { LISTS_TRABALHO } from './lists'

/**
 * Definição ÚNICA de "urgência", reutilizada por todas as tools.
 *
 * Uma task é urgente quando:
 *   - tem prazo (`data_fim` não nulo), E
 *   - o prazo cai em até N dias (default 7), incluindo atrasadas, E
 *   - o status NÃO é terminal (concluída/finalizada/etc).
 *
 * Cruzamos as Lists de trabalho (task_projeto, task_marketing,
 * task_oportunidade). task_processo fica de fora (sem prazo/responsável).
 * Ordenação: atrasadas no topo, depois prioridade, depois prazo mais próximo.
 */

export type UrgenciaItem = {
  origem: string
  tabela: string
  id: string
  nome: string
  status: string
  prioridade: string
  data_fim: string
  atrasada: boolean
  responsavel_id: string | null
}

const PESO_PRIORIDADE: Record<string, number> = { urgente: 4, alta: 3, media: 2, baixa: 1 }

export type GetUrgenciasOpts = {
  /** Filtra por um responsável específico ("minhas urgências"). */
  membroId?: string | null
  /** Janela em dias a partir de hoje. Default 7. */
  dias?: number
}

export async function getUrgencias(opts: GetUrgenciasOpts = {}): Promise<UrgenciaItem[]> {
  const dias = opts.dias ?? 7
  const supabase = admin()

  const hoje = new Date()
  const corte = new Date()
  corte.setDate(corte.getDate() + dias)
  const corteFim = `${corte.toISOString().slice(0, 10)}T23:59:59`
  const hojeInicio = `${hoje.toISOString().slice(0, 10)}T00:00:00`

  const resultados = await Promise.all(
    LISTS_TRABALHO.map(async (lista) => {
      let q = supabase
        .from(lista.table)
        .select('id, nome, status, prioridade, data_fim, responsavel_id')
        .not('data_fim', 'is', null)
        .lte('data_fim', corteFim)

      if (opts.membroId) q = q.eq('responsavel_id', opts.membroId)

      const { data, error } = await q
      if (error || !data) return [] as UrgenciaItem[]

      return (data as Record<string, unknown>[])
        .filter((r) => !lista.terminais.includes(String(r.status)))
        .map((r): UrgenciaItem => {
          const dataFim = String(r.data_fim)
          return {
            origem: lista.label,
            tabela: lista.table,
            id: String(r.id),
            nome: String(r.nome ?? '(sem nome)'),
            status: String(r.status),
            prioridade: String(r.prioridade ?? 'media'),
            data_fim: dataFim,
            atrasada: dataFim < hojeInicio,
            responsavel_id: (r.responsavel_id as string | null) ?? null,
          }
        })
    })
  )

  const itens = resultados.flat()
  itens.sort((a, b) => {
    if (a.atrasada !== b.atrasada) return a.atrasada ? -1 : 1
    const dp = (PESO_PRIORIDADE[b.prioridade] ?? 2) - (PESO_PRIORIDADE[a.prioridade] ?? 2)
    if (dp !== 0) return dp
    return a.data_fim.localeCompare(b.data_fim)
  })
  return itens
}
