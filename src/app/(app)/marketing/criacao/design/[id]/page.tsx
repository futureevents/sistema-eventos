import { notFound } from 'next/navigation'
import { loadRecord } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { FullRecordClient } from '@/components/list/client'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { row, options, embeds } = await loadRecord(LIST_CONFIGS['mkt:design'], id)
  if (!row) notFound()
  return <FullRecordClient listKey="mkt:design" row={row} options={options} embeds={embeds} />
}
