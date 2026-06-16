import { loadListData } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { DataListClient } from '@/components/list/client'

export default async function Page() {
  const data = await loadListData(LIST_CONFIGS['tasks:intra_evento'])
  return <DataListClient listKey="tasks:intra_evento" {...data} />
}
