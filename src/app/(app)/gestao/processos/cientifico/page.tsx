import { loadListData } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { DataListClient } from '@/components/list/client'

export default async function Page() {
  const data = await loadListData(LIST_CONFIGS['proc:cientifico'])
  return <DataListClient listKey="proc:cientifico" {...data} />
}
