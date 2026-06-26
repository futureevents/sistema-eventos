import type { ReactNode } from 'react'
import type { Space } from './spaces'

/**
 * Motor de Lists dirigido por configuração. Cada List declara seus campos e o
 * motor (DataList) entrega edição inline + auto-save + excluir + filtros +
 * grupos + slide-over + página cheia. Fonte da verdade visual: skill
 * future-events-design (tokens --fe-*).
 */

export type FieldType =
  | 'text' | 'richtext' | 'select' | 'date' | 'relation' | 'multiselect' | 'email' | 'tel'

export type SelectOption = {
  value: string
  label: string
  dot?: string      // cor do ponto (pill/boinha)
  bg?: string       // fundo da pill
  text?: string     // cor do texto da pill
  flag?: string     // cor da bandeira (display 'flag')
  done?: boolean     // estado "concluído" → boinha preenchida com check
}

export type ColumnDisplay = 'pill' | 'flag' | 'avatar' | 'text' | 'date' | 'tags'

export type Row = Record<string, unknown> & { id: string }

export type FieldDef = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  editable?: boolean                 // default true (richtext/derived tratados à parte)
  placeholder?: string

  // Coluna na tabela. subtitle (só na coluna primary) ativa a linha em 2 níveis:
  // título + subtítulo (estilo diretório), em vez de uma linha só.
  column?: { width: string; primary?: boolean; display?: ColumnDisplay; header?: string; subtitle?: (row: Row) => string | null }

  // Painel (slide-over / página cheia)
  inPanel?: boolean                  // default: true p/ campos não-primary e não-richtext
  panelIcon?: ReactNode

  // Filtro / grupo
  groupable?: boolean
  filterable?: boolean

  // select / enum
  options?: SelectOption[]
  groupOrder?: string[]              // ordem dos grupos; default = ordem de options
  alwaysGroups?: string[]            // grupos sempre exibidos mesmo vazios

  // relation (FK). embed=true só p/ FKs reais que precisam de dados aninhados
  // (ex.: evento→cliente); rótulos sempre resolvidos via options.
  relation?: { table: string; labelField: string; extraSelect?: string; orderBy?: string; embed?: boolean }

  // multiselect (array de strings)
  multiOptions?: readonly string[]

  // derivado (calculado a partir da linha; só filtro/grupo/exibição, não editável)
  valuePath?: (row: Row) => string | null
  labelPath?: (row: Row) => string | null
}

export type TaskTemplate = {
  label: string
  defaults: Record<string, unknown>
}

export type ListConfig = {
  table: string
  space: Space
  breadcrumb: string[]               // ex.: ['Entregas','Base de dados','Eventos']
  basePath: string                   // ex.: '/entregas/base-de-dados/eventos'
  // para views de folder onde cada row pode ter um basePath diferente
  rowBasePath?: (row: Row) => string
  singular: string
  plural: string
  titleField: string
  titlePlaceholder?: string
  titleAvatar?: boolean              // mostra avatar (iniciais do título) na coluna principal
  descriptionField?: string
  statusField?: string               // campo select usado na "boinha" + grupo padrão
  fields: FieldDef[]
  defaultGroupBy?: string | null
  // filtro-base da List (ex.: tasks compartilham a tabela por `tipo`)
  baseFilter?: { col: string; value: string | number }
  // filtro-base com múltiplos valores (ex.: tipo IN ['pre_evento','intra_evento','pos_evento'])
  baseFilterIn?: { col: string; values: string[] }
  orderBy?: { col: string; ascending: boolean }
  emptyIcon?: ReactNode
  addLabel?: string
  hideBreadcrumb?: boolean
  templates?: TaskTemplate[]
}

// Opções carregadas no servidor para campos relation
export type OptionsMap = Record<string, { id: string; label: string }[]>

// Datas
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function parseISO(iso: string): Date { return new Date(iso + 'T00:00:00') }
