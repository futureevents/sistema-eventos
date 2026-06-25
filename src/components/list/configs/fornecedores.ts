import { type ListConfig, type SelectOption } from '../types'
import { SPACE_ENTREGAS } from '../spaces'
import { CATEGORIAS_FORNECEDOR } from '@/app/(app)/entregas/base-de-dados/fornecedores/categorias'

// Avaliação interna do fornecedor (uso da equipe, nunca exposta ao cliente).
const AVALIACAO: SelectOption[] = [
  { value: 'excelente', label: 'Excelente', dot: 'var(--fe-status-done)',   bg: 'var(--fe-status-done-tint)',   text: 'var(--fe-status-done-text)' },
  { value: 'bom',       label: 'Bom',       dot: 'var(--fe-status-prog)',   bg: 'var(--fe-status-prog-tint)',   text: 'var(--fe-status-prog-text)' },
  { value: 'mediano',   label: 'Mediano',   dot: 'var(--fe-status-review)', bg: 'var(--fe-status-review-tint)', text: 'var(--fe-status-review-text)' },
  { value: 'ruim',      label: 'Ruim',      dot: 'var(--fe-prio-urgent)',   bg: 'rgba(220,61,67,0.12)',         text: '#C42A30' },
  { value: 'blacklist', label: 'Blacklist', dot: '#1A1A1A',                 bg: 'rgba(10,10,10,0.10)',          text: '#0A0A0A' },
]

// Abrangência geográfica de atendimento.
const ABRANGENCIA: SelectOption[] = [
  { value: 'local',    label: 'Só local', dot: 'var(--fe-status-todo)', bg: 'var(--fe-status-todo-tint)', text: 'var(--fe-status-todo-text)' },
  { value: 'regional', label: 'Regional', dot: 'var(--fe-status-prog)', bg: 'var(--fe-status-prog-tint)', text: 'var(--fe-status-prog-text)' },
  { value: 'nacional', label: 'Nacional', dot: 'var(--fe-status-done)', bg: 'var(--fe-status-done-tint)', text: 'var(--fe-status-done-text)' },
]

// Praças onde o fornecedor atende. Lista editável — ajuste conforme a operação.
const PRACAS = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba',
  'Porto Alegre', 'Salvador', 'Recife', 'Fortaleza', 'Florianópolis',
  'Goiânia', 'Campinas', 'Manaus',
] as const

export const fornecedoresConfig: ListConfig = {
  table: 'fornecedor',
  space: SPACE_ENTREGAS,
  breadcrumb: ['Entregas', 'Base de dados', 'Fornecedores'],
  basePath: '/entregas/base-de-dados/fornecedores',
  singular: 'Fornecedor',
  plural: 'Fornecedores',
  titleField: 'nome',
  titlePlaceholder: 'Nome do fornecedor',
  titleAvatar: true,
  descriptionField: 'descricao',
  defaultGroupBy: null,
  fields: [
    { key: 'nome', label: 'Nome', type: 'text', required: true, column: { width: 'minmax(0,1fr)', primary: true, header: 'Nome' } },
    { key: 'categorias', label: 'Categorias', type: 'multiselect', multiOptions: CATEGORIAS_FORNECEDOR, column: { width: '250px', display: 'tags' }, filterable: true },
    { key: 'avaliacao', label: 'Avaliação', type: 'select', options: AVALIACAO, column: { width: '140px', display: 'pill' }, groupable: true, filterable: true },
    { key: 'cidade_sede', label: 'Cidade-sede', type: 'text', column: { width: '150px' }, filterable: true, groupable: true },
    { key: 'pracas_atendimento', label: 'Praças que atende', type: 'multiselect', multiOptions: PRACAS, column: { width: '230px', display: 'tags' }, filterable: true },
    { key: 'abrangencia', label: 'Abrangência', type: 'select', options: ABRANGENCIA, groupable: true, filterable: true },
    { key: 'responsavel', label: 'Responsável', type: 'text', column: { width: '160px' }, filterable: true, groupable: true },
    { key: 'whatsapp', label: 'WhatsApp', type: 'tel', column: { width: '140px' } },
    { key: 'cnpj_cpf', label: 'CNPJ / CPF', type: 'text' },
    { key: 'telefone', label: 'Telefone', type: 'tel' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'descricao', label: 'Descrição', type: 'richtext' },
  ],
}
