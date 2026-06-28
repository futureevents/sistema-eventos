import { notFound } from 'next/navigation'
import { loadRecord } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { FullRecordClient } from '@/components/list/client'

export default async function TrafegoPagoLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { row, options, embeds } = await loadRecord(LIST_CONFIGS['oport:trafego_pago'], id)
  if (!row) notFound()
  return <FullRecordClient listKey="oport:trafego_pago" row={row} options={options} embeds={embeds} />
}
