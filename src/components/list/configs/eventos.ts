import { type ListConfig, type SelectOption } from '../types'
import { SPACE_ENTREGAS } from '../spaces'

const STATUS: SelectOption[] = [
  { value: 'backlog',     label: 'Backlog',     dot: '#8A8783', bg: 'var(--fe-status-todo-tint)',   text: 'var(--fe-status-todo-text)' },
  { value: 'em_execucao', label: 'Em execução', dot: '#F59E0B', bg: 'var(--fe-status-review-tint)', text: 'var(--fe-status-review-text)' },
  { value: 'realizado',   label: 'Realizado',   dot: '#00C47A', bg: 'var(--fe-status-done-tint)',   text: 'var(--fe-status-done-text)', done: true },
  { value: 'cancelado',   label: 'Cancelado',   dot: '#EF4444', bg: 'rgba(239,68,68,0.10)',         text: '#DC2626' },
]

export const eventosConfig: ListConfig = {
  table: 'evento',
  space: SPACE_ENTREGAS,
  breadcrumb: ['Entregas', 'Base de dados', 'Eventos'],
  basePath: '/entregas/base-de-dados/eventos',
  singular: 'Evento',
  plural: 'Eventos',
  titleField: 'nome',
  titlePlaceholder: 'Nome do evento',
  descriptionField: 'descricao',
  statusField: 'status',
  defaultGroupBy: 'status',
  fields: [
    { key: 'nome', label: 'Nome do evento', type: 'text', required: true, column: { width: 'minmax(0,1fr)', primary: true, header: 'Nome do evento' } },
    { key: 'status', label: 'Status', type: 'select', options: STATUS, alwaysGroups: ['backlog', 'em_execucao'], column: { width: '150px', display: 'pill' }, groupable: true, filterable: true },
    { key: 'cliente_id', label: 'Cliente', type: 'relation', relation: { table: 'cliente', labelField: 'nome' }, column: { width: '180px' }, groupable: true, filterable: true },
    { key: 'data_realizacao_inicio', label: 'Realização', type: 'date', column: { width: '150px', header: 'Realização' }, groupable: true, filterable: true },
    { key: 'data_realizacao_fim', label: 'Fim da realização', type: 'date' },
    { key: 'local', label: 'Local', type: 'text', column: { width: '160px' } },
    { key: 'data_inicio_organizacao', label: 'Início organização', type: 'date' },
    { key: 'data_montagem', label: 'Montagem', type: 'date' },
    { key: 'descricao', label: 'Descrição', type: 'richtext' },
  ],
}
