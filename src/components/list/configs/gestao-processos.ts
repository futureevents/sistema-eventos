import { type ListConfig, type SelectOption, type ViewPreset } from '../types'
import { SPACE_GESTAO } from '../spaces'

export type TipoProcesso = 'entrada_cliente' | 'projetos' | 'cientifico' | 'marketing' | 'comercial' | 'juridico'

const STATUS: SelectOption[] = [
  { value: 'para_fazer',  label: 'Para fazer',  dot: 'var(--fe-status-todo)',   bg: 'var(--fe-status-todo-tint)',   text: 'var(--fe-status-todo-text)' },
  { value: 'desenhando',  label: 'Desenhando',  dot: 'var(--fe-status-prog)',   bg: 'var(--fe-status-prog-tint)',   text: 'var(--fe-status-prog-text)' },
  { value: 'ativo',       label: 'Ativo',       dot: 'var(--fe-status-done)',   bg: 'var(--fe-status-done-tint)',   text: 'var(--fe-status-done-text)' },
  { value: 'descartado',  label: 'Descartado',  dot: 'var(--fe-prio-urgent)',   bg: 'rgba(220,61,67,0.12)',         text: '#C42A30' },
]

const STATUS_VALUES = STATUS.map((s) => s.value)

const VIEWS: ViewPreset[] = [
  {
    key: 'ativos',
    label: 'Processos ativos',
    groupBy: null,
    filter: { status: ['ativo'] },
  },
  {
    key: 'todos',
    label: 'Todos os processos',
    groupBy: 'status',
    filter: {},
  },
]

const META: Record<TipoProcesso, { singular: string; plural: string; breadcrumb: string[]; basePath: string }> = {
  entrada_cliente: { singular: 'Processo', plural: 'Entrada de cliente', breadcrumb: ['Gestão', 'Processos', 'Entrada de cliente'], basePath: '/gestao/processos/entrada-de-cliente' },
  projetos:        { singular: 'Processo', plural: 'Projetos',           breadcrumb: ['Gestão', 'Processos', 'Projetos'],           basePath: '/gestao/processos/projetos' },
  cientifico:      { singular: 'Processo', plural: 'Científico/Conteúdo', breadcrumb: ['Gestão', 'Processos', 'Científico/Conteúdo'], basePath: '/gestao/processos/cientifico' },
  marketing:       { singular: 'Processo', plural: 'Marketing',          breadcrumb: ['Gestão', 'Processos', 'Marketing'],          basePath: '/gestao/processos/marketing' },
  comercial:       { singular: 'Processo', plural: 'Comercial',          breadcrumb: ['Gestão', 'Processos', 'Comercial'],          basePath: '/gestao/processos/comercial' },
  juridico:        { singular: 'Processo', plural: 'Jurídico',           breadcrumb: ['Gestão', 'Processos', 'Jurídico'],           basePath: '/gestao/processos/juridico' },
}

export function processoConfig(tipo: TipoProcesso): ListConfig {
  const meta = META[tipo]
  return {
    table: 'task_processo',
    space: SPACE_GESTAO,
    breadcrumb: meta.breadcrumb,
    basePath: meta.basePath,
    singular: meta.singular,
    plural: meta.plural,
    titleField: 'nome',
    titlePlaceholder: 'Nome do processo',
    descriptionField: 'descricao',
    statusField: 'status',
    defaultGroupBy: null,
    baseFilter: { col: 'tipo', value: tipo },
    orderBy: { col: 'nome', ascending: true },
    viewPresets: VIEWS,
    fields: [
      {
        key: 'nome',
        label: 'Nome',
        type: 'text',
        required: true,
        column: { width: 'minmax(0,1fr)', primary: true },
        inPanel: false,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: STATUS,
        groupOrder: STATUS_VALUES,
        alwaysGroups: STATUS_VALUES,
        groupable: true,
        filterable: true,
        column: { width: '130px', display: 'pill', header: 'Status' },
      },
    ],
    addLabel: 'Adicionar processo',
  }
}
