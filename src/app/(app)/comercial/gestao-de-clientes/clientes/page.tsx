import { loadListData } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { DataListClient } from '@/components/list/client'

export default async function ClientesPage() {
  const data = await loadListData(LIST_CONFIGS.clientes)
  return <DataListClient listKey="clientes" {...data} />
}
