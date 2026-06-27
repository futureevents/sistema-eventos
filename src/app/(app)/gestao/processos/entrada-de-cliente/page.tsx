import { loadListData } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { DataListClient } from '@/components/list/client'

export default async function Page() {
  const data = await loadListData(LIST_CONFIGS['proc:entrada_cliente'])
  return <DataListClient listKey="proc:entrada_cliente" {...data} />
}
