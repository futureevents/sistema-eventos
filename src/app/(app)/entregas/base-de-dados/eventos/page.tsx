import { loadListData } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { DataListClient } from '@/components/list/client'

export default async function EventosPage() {
  const data = await loadListData(LIST_CONFIGS.eventos)
  return <DataListClient listKey="eventos" {...data} />
}
