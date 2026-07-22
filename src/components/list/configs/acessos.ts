import { type ListConfig, type FieldDef, type SelectOption, type ViewPreset } from '../types'
import { SPACE_GESTAO } from '../spaces'

export type TipoAcesso = 'emails_redes' | 'ferramentas'

// ── Status da List (compartilhado pelas duas Lists do Folder Acessos) ─────────
const STATUS: SelectOption[] = [
  { value: 'em_aberto', label: 'Em aberto', dot: 'var(--fe-status-todo)', bg: 'var(--fe-status-todo-tint)', text: 'var(--fe-status-todo-text)' },
  { value: 'ativo',     label: 'Ativo',     dot: 'var(--fe-status-done)', bg: 'var(--fe-status-done-tint)', text: 'var(--fe-status-done-text)' },
  { value: 'inativo',   label: 'Inativo',   dot: '#8B8D98',              bg: 'rgba(139,141,152,0.14)',      text: '#52555F' },
]
const STATUS_VALUES = STATUS.map((s) => s.value)

// ── Setor (multiselect) — cores herdadas dos Spaces correspondentes ───────────
const SETOR: SelectOption[] = [
  { value: 'Marketing', label: 'Marketing', dot: '#E54666', bg: 'rgba(229,70,102,0.12)',  text: '#C42A30' },
  { value: 'Gestão',    label: 'Gestão',    dot: '#D9730D', bg: 'rgba(217,115,13,0.13)',  text: '#9A4E0A' },
  { value: 'Comercial', label: 'Comercial', dot: '#8E4EC6', bg: 'rgba(142,78,198,0.12)',  text: '#7A3DAE' },
  { value: 'Entregas',  label: 'Entregas',  dot: '#30A46C', bg: 'rgba(46,158,98,0.14)',   text: '#207A49' },
]

const PRIORIDADE: SelectOption[] = [
  { value: 'urgente', label: 'Urgente', flag: 'var(--fe-prio-urgent)' },
  { value: 'alta',    label: 'Alta',    flag: 'var(--fe-prio-high)' },
  { value: 'media',   label: 'Média',   flag: 'var(--fe-prio-normal)' },
  { value: 'baixa',   label: 'Baixa',   flag: 'var(--fe-prio-low)' },
]

// ── Views: Ativos (em aberto + ativo) · Inativos (inativo) ────────────────────
const VIEWS: ViewPreset[] = [
  { key: 'ativos',   label: 'Ativos',   groupBy: 'status', filter: { status: ['em_aberto', 'ativo'] } },
  { key: 'inativos', label: 'Inativos', groupBy: null,     filter: { status: ['inativo'] } },
]

const META: Record<TipoAcesso, { singular: string; plural: string; breadcrumb: string[]; basePath: string; titlePlaceholder: string; addLabel: string }> = {
  emails_redes: {
    singular: 'Acesso',
    plural: 'Emails e Redes sociais',
    breadcrumb: ['Gestão', 'Acessos', 'Emails e Redes sociais'],
    basePath: '/gestao/acessos/emails-redes',
    titlePlaceholder: 'Nome do acesso',
    addLabel: 'Adicionar acesso',
  },
  ferramentas: {
    singular: 'Ferramenta',
    plural: 'Ferramentas',
    breadcrumb: ['Gestão', 'Acessos', 'Ferramentas'],
    basePath: '/gestao/acessos/ferramentas',
    titlePlaceholder: 'Nome da ferramenta',
    addLabel: 'Adicionar ferramenta',
  },
}

export function acessoConfig(tipo: TipoAcesso): ListConfig {
  const meta = META[tipo]

  const fields: FieldDef[] = [
    // ── Colunas visíveis: Nome · Função do acesso · Setor ─────────────────────
    { key: 'nome', label: 'Nome', type: 'text', required: true,
      column: { width: 'minmax(0,1fr)', primary: true, header: 'Nome' } },
    { key: 'funcao', label: 'Função do acesso', type: 'text',
      column: { width: 'minmax(0,0.8fr)', header: 'Função do acesso' }, filterable: true },
    { key: 'setor', label: 'Setor', type: 'multiselect', options: SETOR,
      column: { width: '220px', display: 'tags' }, filterable: true },

    // ── Painel de detalhes (sem coluna) ───────────────────────────────────────
    { key: 'status', label: 'Status', type: 'select', options: STATUS, groupOrder: STATUS_VALUES, alwaysGroups: STATUS_VALUES, groupable: true, filterable: true },
    { key: 'responsavel_id', label: 'Responsável', type: 'relation', relation: { table: 'membros', labelField: 'nome' }, groupable: true, filterable: true },
    { key: 'prioridade', label: 'Prioridade', type: 'select', options: PRIORIDADE, groupOrder: ['urgente', 'alta', 'media', 'baixa'], groupable: true, filterable: true },
    { key: 'data_inicio', label: 'Início', type: 'date', groupable: true, filterable: true },
    { key: 'data_fim', label: 'Término', type: 'date', groupable: true, filterable: true },
    { key: 'descricao', label: 'Descrição', type: 'richtext' },
  ]

  return {
    table: 'task_acesso',
    space: SPACE_GESTAO,
    breadcrumb: meta.breadcrumb,
    basePath: meta.basePath,
    singular: meta.singular,
    plural: meta.plural,
    addLabel: meta.addLabel,
    titleField: 'nome',
    titlePlaceholder: meta.titlePlaceholder,
    descriptionField: 'descricao',
    statusField: 'status',
    startDateField: 'data_inicio',
    endDateField: 'data_fim',
    assigneeField: 'responsavel_id',
    defaultGroupBy: 'status',
    baseFilter: { col: 'tipo', value: tipo },
    orderBy: { col: 'nome', ascending: true },
    viewPresets: VIEWS,
    fields,
  }
}
