import { loadListData } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { DataListClient } from '@/components/list/client'

export default async function Page() {
  const data = await loadListData(LIST_CONFIGS['tasks:onboarding'])
  return <DataListClient listKey="tasks:onboarding" {...data} />
}
