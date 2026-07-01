'use client'

import { LIST_CONFIGS } from './registry'
import { DataList } from './DataList'
import { FullRecord } from './FullRecord'
import { NewRecordForm } from './NewRecordForm'
import { type Row, type OptionsMap } from './types'
import { type EmbedMap } from './load'
import { useListPerm } from '@/lib/permissions/context'
import { AcessoNegado, SomenteLeituraBloqueado } from '@/components/permissions/AcessoNegado'

export function DataListClient({ listKey, rows, options, embeds }: { listKey: string; rows: Row[]; options: OptionsMap; embeds: EmbedMap }) {
  const caps = useListPerm()
  if (!caps) return <AcessoNegado />
  return <DataList config={LIST_CONFIGS[listKey]} caps={caps} rows={rows} options={options} embeds={embeds} />
}

export function FullRecordClient({ listKey, row, options, embeds }: { listKey: string; row: Row; options: OptionsMap; embeds: EmbedMap }) {
  const caps = useListPerm()
  if (!caps) return <AcessoNegado />
  return <FullRecord config={LIST_CONFIGS[listKey]} caps={caps} row={row} options={options} embeds={embeds} />
}

export function NewRecordFormClient({ listKey, options }: { listKey: string; options: OptionsMap }) {
  const caps = useListPerm()
  if (!caps) return <AcessoNegado />
  if (!caps.canEdit) return <SomenteLeituraBloqueado />
  return <NewRecordForm config={LIST_CONFIGS[listKey]} options={options} />
}
