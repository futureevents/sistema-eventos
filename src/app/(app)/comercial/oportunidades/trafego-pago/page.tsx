import { loadListData } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { DataListClient } from '@/components/list/client'

export default async function TrafegoPagoPage() {
  const data = await loadListData(LIST_CONFIGS['oport:trafego_pago'])
  return <DataListClient listKey="oport:trafego_pago" {...data} />
}
