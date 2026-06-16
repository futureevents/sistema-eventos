'use client'

import { LIST_CONFIGS } from './registry'
import { DataList } from './DataList'
import { FullRecord } from './FullRecord'
import { NewRecordForm } from './NewRecordForm'
import { type Row, type OptionsMap } from './types'
import { type EmbedMap } from './load'

export function DataListClient({ listKey, rows, options, embeds }: { listKey: string; rows: Row[]; options: OptionsMap; embeds: EmbedMap }) {
  return <DataList config={LIST_CONFIGS[listKey]} rows={rows} options={options} embeds={embeds} />
}

export function FullRecordClient({ listKey, row, options, embeds }: { listKey: string; row: Row; options: OptionsMap; embeds: EmbedMap }) {
  return <FullRecord config={LIST_CONFIGS[listKey]} row={row} options={options} embeds={embeds} />
}

export function NewRecordFormClient({ listKey, options }: { listKey: string; options: OptionsMap }) {
  return <NewRecordForm config={LIST_CONFIGS[listKey]} options={options} />
}
