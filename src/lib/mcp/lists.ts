/**
 * Registro das Lists que têm anatomia de Task, para as tools GENÉRICAS
 * (detalhe_task, atualizar_status_task, comentar_em_task, anexar_em_task).
 *
 * Princípio "tudo é Task": a anatomia (comentário, status, anexo, histórico)
 * é a mesma em todas as Lists — por isso as tools genéricas recebem só o
 * parâmetro `list` e o id. Cada List declara aqui apenas o que difere:
 * o nome da tabela e os status válidos.
 */

export type ListDef = {
  /** slug canônico, usado como valor do parâmetro `list`. */
  slug: string
  /** nome real da tabela = valor gravado em task_comment.task_table etc. */
  table: string
  label: string
  /** status válidos (para validar e sugerir em erros). Vazio = texto livre. */
  statuses: string[]
  /** status que contam como concluído/encerrado (não são pendência). */
  terminais: string[]
  /** status é texto livre (task_oportunidade). */
  statusLivre?: boolean
  /** tem coluna responsavel_id. */
  temResponsavel: boolean
  /** tem coluna data_fim (prazo). */
  temPrazo: boolean
}

const DEFS: ListDef[] = [
  {
    slug: 'projeto',
    table: 'task_projeto',
    label: 'Pré/Intra/Pós-evento (Projetos)',
    statuses: ['a_fazer', 'em_andamento', 'concluida', 'cancelada'],
    terminais: ['concluida', 'cancelada'],
    temResponsavel: true,
    temPrazo: true,
  },
  {
    slug: 'marketing',
    table: 'task_marketing',
    label: 'Marketing / Criação',
    statuses: ['para_fazer', 'para_gravar', 'em_andamento', 'em_aprovacao', 'em_alteracao', 'descartado', 'finalizado'],
    terminais: ['descartado', 'finalizado'],
    temResponsavel: true,
    temPrazo: true,
  },
  {
    slug: 'oportunidade',
    table: 'task_oportunidade',
    label: 'Oportunidades (CRM)',
    statuses: [], // status é texto livre
    terminais: ['negocio_fechado', 'perdido', 'desqualificado'],
    statusLivre: true,
    temResponsavel: true,
    temPrazo: true,
  },
  {
    slug: 'processo',
    table: 'task_processo',
    label: 'Processos (POPs)',
    statuses: ['para_fazer', 'desenhando', 'ativo', 'descartado'],
    terminais: ['descartado'],
    temResponsavel: false,
    temPrazo: false,
  },
]

/** Aceita o slug, o nome da tabela ou sinônimos comuns. */
const ALIASES: Record<string, string> = {
  projeto: 'projeto', projetos: 'projeto', task_projeto: 'projeto',
  evento_task: 'projeto', pre_evento: 'projeto',
  marketing: 'marketing', task_marketing: 'marketing', criacao: 'marketing',
  oportunidade: 'oportunidade', oportunidades: 'oportunidade',
  task_oportunidade: 'oportunidade', crm: 'oportunidade', lead: 'oportunidade',
  processo: 'processo', processos: 'processo', task_processo: 'processo', pop: 'processo',
}

export const LISTS_VALIDAS = DEFS.map((d) => d.slug)

export function resolveList(input: string): ListDef | null {
  const key = ALIASES[input.trim().toLowerCase()]
  if (!key) return null
  return DEFS.find((d) => d.slug === key) ?? null
}

/** Todas as Lists de trabalho (com responsável + prazo), usadas em buscas amplas. */
export const LISTS_TRABALHO = DEFS.filter((d) => d.temResponsavel && d.temPrazo)
