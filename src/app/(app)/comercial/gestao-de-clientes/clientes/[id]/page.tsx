import { notFound } from 'next/navigation'
import { loadRecord } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { FullRecordClient } from '@/components/list/client'

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { row, options, embeds } = await loadRecord(LIST_CONFIGS.clientes, id)
  if (!row) notFound()
  return <FullRecordClient listKey="clientes" row={row} options={options} embeds={embeds} />
}
