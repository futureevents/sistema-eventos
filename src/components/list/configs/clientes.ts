import { type ListConfig } from '../types'
import { SPACE_COMERCIAL } from '../spaces'

export const clientesConfig: ListConfig = {
  table: 'cliente',
  space: SPACE_COMERCIAL,
  breadcrumb: ['Comercial', 'Gestão de clientes', 'Clientes'],
  basePath: '/comercial/gestao-de-clientes/clientes',
  singular: 'Cliente',
  plural: 'Clientes',
  titleField: 'nome',
  titlePlaceholder: 'Nome do cliente',
  titleAvatar: true,
  descriptionField: 'descricao',
  defaultGroupBy: null,
  fields: [
    { key: 'nome', label: 'Nome', type: 'text', required: true, column: { width: 'minmax(0,1fr)', primary: true, header: 'Nome', subtitle: (r) => (r.empresa as string) || null } },
    { key: 'empresa', label: 'Empresa', type: 'text', filterable: true, groupable: true },
    { key: 'cnpj_cpf', label: 'CNPJ / CPF', type: 'text', column: { width: '150px' } },
    { key: 'whatsapp', label: 'WhatsApp', type: 'tel', column: { width: '140px' } },
    { key: 'telefone', label: 'Telefone', type: 'tel' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'descricao', label: 'Descrição', type: 'richtext' },
  ],
}
