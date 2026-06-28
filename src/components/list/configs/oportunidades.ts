import { type ListConfig, type FieldDef, type SelectOption, type Row } from '../types'
import { SPACE_COMERCIAL } from '../spaces'

export type TipoOportunidade = 'trafego_pago' | 'prospeccao_ativa'

// ── Pipeline da List Tráfego Pago (inbound de anúncios) ──────────────────────
// Ordem = ordem do funil. Estados terminais (Feito/Fechado) usam done:true →
// boinha preenchida com check, estilo ClickUp.
const STATUS_TRAFEGO: SelectOption[] = [
  // Não iniciado
  { value: 'lead',               label: 'Lead',                  dot: 'var(--fe-status-todo)', bg: 'var(--fe-status-todo-tint)', text: 'var(--fe-status-todo-text)' },
  // Ativo
  { value: 'qualificacao',       label: 'Qualificação',          dot: '#E8A23D', bg: 'rgba(232,162,61,0.16)', text: '#8A5D11' },
  { value: 'reuniao_agendada',   label: 'Reunião agendada',      dot: '#D5680B', bg: 'rgba(213,104,11,0.14)', text: '#9A4E0A' },
  { value: 'reuniao_realizada',  label: 'Reunião realizada',     dot: '#2E9E62', bg: 'rgba(46,158,98,0.14)',  text: '#207A49' },
  { value: 'negociacao_valores', label: 'Negociação de valores', dot: '#3E63DD', bg: 'rgba(62,99,221,0.12)',  text: '#3A4FC0' },
  { value: 'no_show',            label: 'No-show',               dot: '#E5484D', bg: 'rgba(229,72,77,0.12)',  text: '#C42A30' },
  { value: 'followup_1',         label: 'Followup 1',            dot: '#8E4EC6', bg: 'rgba(142,78,198,0.12)', text: '#7A3DAE' },
  { value: 'followup_2',         label: 'Followup 2',            dot: '#3E3E8F', bg: 'rgba(62,62,143,0.13)',  text: '#33336F' },
  { value: 'resposta_futura',    label: 'Resposta futura',       dot: '#62708A', bg: 'rgba(98,112,138,0.14)', text: '#465268' },
  { value: 'aquecimento',        label: 'Aquecimento',           dot: '#D6409F', bg: 'rgba(214,64,159,0.12)', text: '#B03088' },
  // Feito
  { value: 'desqualificado',     label: 'Desqualificado',        dot: '#2B2B2B', bg: 'rgba(43,43,43,0.10)',   text: '#363636', done: true },
  { value: 'perdido',            label: 'Perdido',               dot: '#E5484D', bg: 'rgba(229,72,77,0.12)',  text: '#C42A30', done: true },
  // Fechado
  { value: 'negocio_fechado',    label: 'Negócio fechado',       dot: '#2A8C57', bg: 'rgba(42,140,87,0.16)',  text: '#1B6B40', done: true },
]

// ── Pipeline da List Prospeção Ativa (outbound) ──────────────────────────────
// PLACEHOLDER: o pipeline real será enviado pelo usuário. Por ora há só o status
// inicial para a List renderizar; basta trocar este array quando vierem os status.
const STATUS_PROSPECCAO: SelectOption[] = [
  { value: 'a_prospectar', label: 'A prospectar', dot: 'var(--fe-status-todo)', bg: 'var(--fe-status-todo-tint)', text: 'var(--fe-status-todo-text)' },
]

// ── Campos de qualificação e reunião (compartilhados pelas duas Lists) ────────
const QUALIDADE_LEAD: SelectOption[] = [
  { value: 'qualificado',    label: 'Qualificado',    dot: '#2E9E62', bg: 'rgba(46,158,98,0.14)',   text: '#207A49' },
  { value: 'desqualificado', label: 'Desqualificado', dot: '#E5484D', bg: 'rgba(229,72,77,0.12)',   text: '#C42A30' },
]

const QUALIDADE_REUNIAO: SelectOption[] = [
  { value: 'qualificada',    label: 'Qualificada',    dot: '#2E9E62', bg: 'rgba(46,158,98,0.14)',   text: '#207A49' },
  { value: 'desqualificada', label: 'Desqualificada', dot: '#E5484D', bg: 'rgba(229,72,77,0.12)',   text: '#C42A30' },
]

const REUNIAO_REALIZADA: SelectOption[] = [
  { value: 'nao', label: 'Não', dot: '#62708A', bg: 'rgba(98,112,138,0.14)', text: '#465268' },
  { value: 'sim', label: 'Sim', dot: '#2E9E62', bg: 'rgba(46,158,98,0.14)',  text: '#207A49' },
]

const PRIORIDADE: SelectOption[] = [
  { value: 'urgente', label: 'Urgente', flag: 'var(--fe-prio-urgent)' },
  { value: 'alta',    label: 'Alta',    flag: 'var(--fe-prio-high)' },
  { value: 'media',   label: 'Média',   flag: 'var(--fe-prio-normal)' },
  { value: 'baixa',   label: 'Baixa',   flag: 'var(--fe-prio-low)' },
]

const META: Record<TipoOportunidade, { plural: string; breadcrumb: string[]; basePath: string; status: SelectOption[] }> = {
  trafego_pago:     { plural: 'Tráfego Pago',     breadcrumb: ['Comercial', 'Oportunidades', 'Tráfego Pago'],     basePath: '/comercial/oportunidades/trafego-pago',     status: STATUS_TRAFEGO },
  prospeccao_ativa: { plural: 'Prospeção Ativa',  breadcrumb: ['Comercial', 'Oportunidades', 'Prospeção Ativa'],  basePath: '/comercial/oportunidades/prospeccao-ativa', status: STATUS_PROSPECCAO },
}

export function oportunidadeConfig(tipo: TipoOportunidade): ListConfig {
  const meta = META[tipo]
  const statusOptions = meta.status
  const statusValues = statusOptions.map((s) => s.value)
  const isTrafego = tipo === 'trafego_pago'

  // Nome da Task = Empresa; o contato (pessoa) vira subtítulo da linha (igual à
  // List Clientes). Colunas enxutas; UTMs e demais contatos ficam no painel.
  const fields: FieldDef[] = [
    { key: 'nome', label: 'Empresa', type: 'text', required: true, column: { width: 'minmax(0,1fr)', primary: true, header: 'Empresa', subtitle: (r: Row) => (r.nome_contato as string) || null } },
    { key: 'status', label: 'Status', type: 'select', options: statusOptions, groupOrder: statusValues, column: { width: '188px', display: 'pill', header: 'Status' }, groupable: true, filterable: true },
    { key: 'responsavel_id', label: 'Responsável', type: 'relation', relation: { table: 'membros', labelField: 'nome' }, column: { width: '120px', display: 'avatar' }, groupable: true, filterable: true },
    // Campos de qualificação e reunião (preenchidos manualmente e por automação)
    { key: 'oportunidade', label: 'Oportunidade', type: 'money', column: { width: '148px', header: 'Oportunidade (R$)' }, filterable: true },
    { key: 'qualidade_lead',    label: 'Qualidade do lead',    type: 'select', options: QUALIDADE_LEAD,    column: { width: '158px', display: 'pill', header: 'Qual. lead' }, groupable: true, filterable: true },
    { key: 'reuniao_realizada', label: 'Reunião realizada',    type: 'select', options: REUNIAO_REALIZADA, column: { width: '104px', display: 'pill', header: 'Reunião' },   groupable: true, filterable: true },
    { key: 'qualidade_reuniao', label: 'Qualidade da reunião', type: 'select', options: QUALIDADE_REUNIAO, groupable: true, filterable: true },
    { key: 'data_reuniao',      label: 'Data da reunião',      type: 'date',   column: { width: '148px', header: 'Data da reunião' }, groupable: true, filterable: true },
    { key: 'nome_contato', label: 'Nome do contato', type: 'text', filterable: true },
    { key: 'whatsapp', label: 'WhatsApp', type: 'tel', column: { width: '150px' } },
    { key: 'telefone', label: 'Telefone', type: 'tel' },
    { key: 'email', label: 'E-mail', type: 'email' },
    // Origem do lead (UTM): coluna só no Tráfego Pago; demais UTMs só no painel.
    { key: 'utm_source', label: 'Origem (utm_source)', type: 'text', filterable: true, groupable: true, ...(isTrafego ? { column: { width: '140px', header: 'Origem' } } : {}) },
    { key: 'utm_medium', label: 'Mídia (utm_medium)', type: 'text', filterable: true },
    { key: 'utm_campaign', label: 'Campanha (utm_campaign)', type: 'text', filterable: true, groupable: true },
    { key: 'utm_term', label: 'Termo (utm_term)', type: 'text' },
    { key: 'utm_content', label: 'Conteúdo (utm_content)', type: 'text' },
    { key: 'prioridade', label: 'Prioridade', type: 'select', options: PRIORIDADE, groupOrder: ['urgente', 'alta', 'media', 'baixa'], column: { width: '122px', display: 'flag' }, groupable: true, filterable: true },
    { key: 'data_inicio', label: 'Entrada', type: 'date', groupable: true, filterable: true },
    { key: 'data_fim', label: 'Término', type: 'date', groupable: true, filterable: true },
    { key: 'descricao', label: 'Descrição', type: 'richtext' },
  ]

  return {
    table: 'task_oportunidade',
    space: SPACE_COMERCIAL,
    breadcrumb: meta.breadcrumb,
    basePath: meta.basePath,
    singular: 'Lead',
    plural: meta.plural,
    addLabel: 'Adicionar lead',
    titleField: 'nome',
    titlePlaceholder: 'Nome da empresa',
    titleAvatar: true,
    descriptionField: 'descricao',
    statusField: 'status',
    startDateField: 'data_inicio',
    endDateField: 'data_fim',
    assigneeField: 'responsavel_id',
    defaultGroupBy: 'status',
    baseFilter: { col: 'tipo', value: tipo },
    fields,
  }
}
