import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Definição ÚNICA de "urgência" no sistema, reutilizada por todas as tools.
 *
 * Uma task é urgente quando:
 *   - tem prazo (`data_fim` não nulo) E
 *   - o prazo cai em até N dias (default 7), incluindo atrasadas E
 *   - o status NÃO é terminal (concluída/cancelada/finalizada/etc).
 *
 * Cruzamos as tabelas de task que têm prazo + responsável:
 *   task_projeto, task_marketing, task_oportunidade.
 * `task_processo` fica de fora (não tem data_fim nem responsável).
 *
 * Ordenação: prioridade (urgente>alta>media>baixa) e depois data_fim (mais
 * próxima primeiro). Atrasadas sobem para o topo.
 */

export type UrgenciaItem = {
  origem: 'Pré/Intra/Pós-evento' | 'Marketing' | 'Oportunidade'
  tabela: 'task_projeto' | 'task_marketing' | 'task_oportunidade'
  id: string
  nome: string
  status: string
  prioridade: string
  data_fim: string // ISO
  atrasada: boolean
  responsavel_id: string | null
}

const PESO_PRIORIDADE: Record<string, number> = { urgente: 4, alta: 3, media: 2, baixa: 1 }

// status terminais (não contam como pendência) por tabela
const TERMINAIS: Record<string, string[]> = {
  task_projeto: ['concluida', 'cancelada'],
  task_marketing: ['finalizado', 'descartado'],
  task_oportunidade: ['negocio_fechado', 'perdido', 'desqualificado'],
}

const ORIGEM: Record<string, UrgenciaItem['origem']> = {
  task_projeto: 'Pré/Intra/Pós-evento',
  task_marketing: 'Marketing',
  task_oportunidade: 'Oportunidade',
}

export type GetUrgenciasOpts = {
  /** Filtra por um responsável específico (para "minhas urgências"). */
  membroId?: string | null
  /** Janela em dias a partir de hoje. Default 7. */
  dias?: number
}

export async function getUrgencias(opts: GetUrgenciasOpts = {}): Promise<UrgenciaItem[]> {
  const dias = opts.dias ?? 7
  const supabase = createAdminClient()

  const hoje = new Date()
  const corte = new Date()
  corte.setDate(corte.getDate() + dias)
  const corteFim = `${corte.toISOString().slice(0, 10)}T23:59:59`
  const hojeInicio = `${hoje.toISOString().slice(0, 10)}T00:00:00`

  const tabelas: UrgenciaItem['tabela'][] = ['task_projeto', 'task_marketing', 'task_oportunidade']

  const resultados = await Promise.all(
    tabelas.map(async (tabela) => {
      let q = supabase
        .from(tabela)
        .select('id, nome, status, prioridade, data_fim, responsavel_id')
        .not('data_fim', 'is', null)
        .lte('data_fim', corteFim)

      if (opts.membroId) q = q.eq('responsavel_id', opts.membroId)

      const { data, error } = await q
      if (error || !data) return [] as UrgenciaItem[]

      const terminais = TERMINAIS[tabela]
      return (data as Record<string, unknown>[])
        .filter((r) => !terminais.includes(String(r.status)))
        .map((r): UrgenciaItem => {
          const dataFim = String(r.data_fim)
          return {
            origem: ORIGEM[tabela],
            tabela,
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
    // atrasadas primeiro
    if (a.atrasada !== b.atrasada) return a.atrasada ? -1 : 1
    // depois prioridade
    const dp = (PESO_PRIORIDADE[b.prioridade] ?? 2) - (PESO_PRIORIDADE[a.prioridade] ?? 2)
    if (dp !== 0) return dp
    // depois prazo mais próximo
    return a.data_fim.localeCompare(b.data_fim)
  })
  return itens
}
