import { loadOptions } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { NewRecordFormClient } from '@/components/list/client'

export default async function NovoTrafegoPagoPage() {
  const options = await loadOptions(LIST_CONFIGS['oport:trafego_pago'])
  return <NewRecordFormClient listKey="oport:trafego_pago" options={options} />
}
