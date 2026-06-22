import { type ListConfig, type SelectOption, type Row } from '../types'
import { SPACE_ENTREGAS } from '../spaces'

export type TipoTask = 'pre_evento' | 'intra_evento' | 'pos_evento'

const STATUS: SelectOption[] = [
  { value: 'a_fazer',      label: 'A fazer',      dot: 'var(--fe-status-todo)', bg: 'var(--fe-status-todo-tint)', text: 'var(--fe-status-todo-text)' },
  { value: 'em_andamento', label: 'Em andamento', dot: 'var(--fe-status-prog)', bg: 'var(--fe-status-prog-tint)', text: 'var(--fe-status-prog-text)' },
  { value: 'concluida',    label: 'Concluída',    dot: 'var(--fe-status-done)', bg: 'var(--fe-status-done-tint)', text: 'var(--fe-status-done-text)', done: true },
  { value: 'cancelada',    label: 'Cancelada',    dot: 'var(--fe-prio-urgent)', bg: 'rgba(220,61,67,0.12)',       text: '#C42A30' },
]

const PRIORIDADE: SelectOption[] = [
  { value: 'urgente', label: 'Urgente', flag: 'var(--fe-prio-urgent)' },
  { value: 'alta',    label: 'Alta',    flag: 'var(--fe-prio-high)' },
  { value: 'media',   label: 'Média',   flag: 'var(--fe-prio-normal)' },
  { value: 'baixa',   label: 'Baixa',   flag: 'var(--fe-prio-low)' },
]

const META: Record<TipoTask, { label: string; slug: string }> = {
  pre_evento:   { label: 'Pré-evento',   slug: 'pre-evento' },
  intra_evento: { label: 'Intra-evento', slug: 'intra-evento' },
  pos_evento:   { label: 'Pós-evento',   slug: 'pos-evento' },
}

const eventoCliente = (row: Row) => (row['evento'] as { cliente?: { nome?: string } } | null)?.cliente ?? null

export function tasksConfig(tipo: TipoTask): ListConfig {
  const meta = META[tipo]
  return {
    table: 'task_projeto',
    space: SPACE_ENTREGAS,
    breadcrumb: ['Entregas', 'Projetos', meta.label],
    basePath: `/entregas/projetos/${meta.slug}`,
    singular: 'Tarefa',
    plural: meta.label,
    addLabel: 'Adicionar tarefa',
    titleField: 'nome',
    titlePlaceholder: 'Nome da tarefa',
    descriptionField: 'descricao',
    statusField: 'status',
    defaultGroupBy: 'status',
    baseFilter: { col: 'tipo', value: tipo },
    fields: [
      { key: 'nome', label: 'Nome da tarefa', type: 'text', required: true, column: { width: 'minmax(0,1fr)', primary: true, header: 'Nome da tarefa' } },
      { key: 'status', label: 'Status', type: 'select', options: STATUS, alwaysGroups: ['a_fazer', 'em_andamento', 'concluida'], groupable: true, filterable: true },
      { key: 'evento_id', label: 'Evento', type: 'relation', relation: { table: 'evento', labelField: 'nome', embed: true, extraSelect: 'cliente_id, cliente:cliente_id(nome)' }, column: { width: '168px' }, groupable: true, filterable: true },
      { key: 'responsavel_id', label: 'Responsável', type: 'relation', relation: { table: 'membros', labelField: 'nome' }, column: { width: '120px', display: 'avatar' }, groupable: true, filterable: true },
      { key: 'data_inicio', label: 'Início', type: 'date', column: { width: '140px' }, groupable: true, filterable: true },
      { key: 'data_fim', label: 'Prazo', type: 'date', column: { width: '140px' }, groupable: true, filterable: true },
      { key: 'prioridade', label: 'Prioridade', type: 'select', options: PRIORIDADE, groupOrder: ['urgente', 'alta', 'media', 'baixa'], column: { width: '122px', display: 'flag' }, groupable: true, filterable: true },
      // Cliente derivado (via evento) — só filtro/grupo
      { key: 'cliente', label: 'Cliente', type: 'text', editable: false, groupable: true, filterable: true, valuePath: (r) => (r['evento'] as { cliente_id?: string } | null)?.cliente_id ?? null, labelPath: (r) => eventoCliente(r)?.nome ?? null },
      { key: 'descricao', label: 'Descrição', type: 'richtext' },
    ],
  }
}
