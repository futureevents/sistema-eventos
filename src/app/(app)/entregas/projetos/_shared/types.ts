export type TipoTask = 'pre_evento' | 'intra_evento' | 'pos_evento'
export type PrioridadeTask = 'baixa' | 'media' | 'alta' | 'urgente'
export type StatusTask = 'a_fazer' | 'em_andamento' | 'concluida' | 'cancelada'

export type Membro = { id: string; nome: string; email: string }

export type TaskProjeto = {
  id: string
  nome: string
  tipo: TipoTask
  evento_id: string | null
  evento: { nome: string } | null
  responsavel_id: string | null
  data_fim: string | null
  prioridade: PrioridadeTask
  status: StatusTask
  criado_em: string
}

export const TIPO_META: Record<TipoTask, { label: string; breadcrumb: string; slug: string }> = {
  pre_evento:    { label: 'Pré-evento',    breadcrumb: 'Pré-evento',    slug: 'pre-evento' },
  intra_evento:  { label: 'Intra-evento',  breadcrumb: 'Intra-evento',  slug: 'intra-evento' },
  pos_evento:    { label: 'Pós-evento',    breadcrumb: 'Pós-evento',    slug: 'pos-evento' },
}

export const PRIORIDADE_LABEL: Record<PrioridadeTask, string> = {
  baixa:   'Baixa',
  media:   'Média',
  alta:    'Alta',
  urgente: 'Urgente',
}

export const PRIORIDADE_STYLE: Record<PrioridadeTask, { bg: string; color: string }> = {
  baixa:   { bg: 'var(--fe-status-todo-tint)',   color: 'var(--fe-status-todo-text)' },
  media:   { bg: 'var(--fe-status-prog-tint)',   color: 'var(--fe-status-prog-text)' },
  alta:    { bg: 'var(--fe-status-review-tint)', color: 'var(--fe-status-review-text)' },
  urgente: { bg: 'rgba(239,68,68,0.10)',         color: '#DC2626' },
}

export const STATUS_LABEL: Record<StatusTask, string> = {
  a_fazer:      'A fazer',
  em_andamento: 'Em andamento',
  concluida:    'Concluída',
  cancelada:    'Cancelada',
}

export const STATUS_STYLE: Record<StatusTask, { bg: string; color: string }> = {
  a_fazer:      { bg: 'var(--fe-status-todo-tint)',   color: 'var(--fe-status-todo-text)' },
  em_andamento: { bg: 'var(--fe-status-prog-tint)',   color: 'var(--fe-status-prog-text)' },
  concluida:    { bg: 'var(--fe-status-done-tint)',   color: 'var(--fe-status-done-text)' },
  cancelada:    { bg: 'rgba(239,68,68,0.10)',         color: '#DC2626' },
}

// Ordem canônica dos grupos na view Lista (agrupar por status)
export const STATUS_ORDER: StatusTask[] = ['a_fazer', 'em_andamento', 'concluida', 'cancelada']

// Pill de status no padrão ClickUp: dot sólido + tint de fundo + texto escurecido
export const STATUS_PILL: Record<StatusTask, { dot: string; bg: string; text: string }> = {
  a_fazer:      { dot: '#8A8783', bg: 'var(--fe-status-todo-tint)',   text: 'var(--fe-status-todo-text)' },
  em_andamento: { dot: '#3B82F6', bg: 'var(--fe-status-prog-tint)',   text: 'var(--fe-status-prog-text)' },
  concluida:    { dot: '#00C47A', bg: 'var(--fe-status-done-tint)',   text: 'var(--fe-status-done-text)' },
  cancelada:    { dot: '#EF4444', bg: 'rgba(239,68,68,0.10)',         text: '#DC2626' },
}

// Cor da bandeira de prioridade
export const PRIORIDADE_FLAG: Record<PrioridadeTask, string> = {
  urgente: 'var(--fe-prio-urgent)',
  alta:    'var(--fe-prio-high)',
  media:   'var(--fe-prio-normal)',
  baixa:   'var(--fe-prio-low)',
}

// Paleta de cores de avatar (iniciais sobre cor sólida)
export const AVATAR_PALETTE = ['#6E56CF', '#00A368', '#3B82F6', '#E8833A', '#D6457D', '#0EA5A4']
