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
  titlePlaceholder: 'Nome da empresa',
  titleAvatar: true,
  descriptionField: 'descricao',
  defaultGroupBy: null,
  fields: [
    { key: 'nome', label: 'Empresa', type: 'text', required: true, column: { width: 'minmax(0,1fr)', primary: true, header: 'Empresa', subtitle: (r) => (r.contato_interno as string) || null } },
    { key: 'contato_interno', label: 'Contato interno', type: 'text', filterable: true },
    // Dados para elaboração do contrato
    { key: 'razao_social', label: 'Razão social', type: 'text' },
    { key: 'cnpj_cpf', label: 'CNPJ / CPF', type: 'text', column: { width: '150px' } },
    { key: 'inscricao_estadual', label: 'Inscrição estadual', type: 'text' },
    { key: 'representante_legal', label: 'Representante legal', type: 'text' },
    // Contato
    { key: 'whatsapp', label: 'WhatsApp', type: 'tel', column: { width: '140px' } },
    { key: 'telefone', label: 'Telefone', type: 'tel' },
    { key: 'email', label: 'Email', type: 'email' },
    // Endereço (contrato)
    { key: 'cep', label: 'CEP', type: 'text' },
    { key: 'logradouro', label: 'Logradouro', type: 'text' },
    { key: 'numero', label: 'Número', type: 'text' },
    { key: 'complemento', label: 'Complemento', type: 'text' },
    { key: 'bairro', label: 'Bairro', type: 'text' },
    { key: 'cidade', label: 'Cidade', type: 'text', filterable: true, groupable: true },
    { key: 'uf', label: 'UF', type: 'text', filterable: true },
    { key: 'descricao', label: 'Descrição', type: 'richtext' },
  ],
}
