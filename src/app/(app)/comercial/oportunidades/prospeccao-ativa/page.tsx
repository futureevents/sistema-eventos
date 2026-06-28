import { loadListData } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { DataListClient } from '@/components/list/client'

export default async function ProspeccaoAtivaPage() {
  const data = await loadListData(LIST_CONFIGS['oport:prospeccao_ativa'])
  return <DataListClient listKey="oport:prospeccao_ativa" {...data} />
}
