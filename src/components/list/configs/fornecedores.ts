import { type ListConfig } from '../types'
import { SPACE_ENTREGAS } from '../spaces'
import { CATEGORIAS_FORNECEDOR } from '@/app/(app)/entregas/base-de-dados/fornecedores/categorias'

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
    { key: 'responsavel', label: 'Responsável', type: 'text', column: { width: '160px' }, filterable: true, groupable: true },
    { key: 'whatsapp', label: 'WhatsApp', type: 'tel', column: { width: '140px' } },
    { key: 'cnpj_cpf', label: 'CNPJ / CPF', type: 'text' },
    { key: 'telefone', label: 'Telefone', type: 'tel' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'descricao', label: 'Descrição', type: 'richtext' },
  ],
}
