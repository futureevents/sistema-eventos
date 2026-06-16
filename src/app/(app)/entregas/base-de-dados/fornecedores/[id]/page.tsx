import { notFound } from 'next/navigation'
import { loadRecord } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { FullRecordClient } from '@/components/list/client'

export default async function FornecedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { row, options, embeds } = await loadRecord(LIST_CONFIGS.fornecedores, id)
  if (!row) notFound()
  return <FullRecordClient listKey="fornecedores" row={row} options={options} embeds={embeds} />
}
