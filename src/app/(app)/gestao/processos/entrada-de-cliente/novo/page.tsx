import { loadOptions } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { NewRecordFormClient } from '@/components/list/client'

export default async function Page() {
  const options = await loadOptions(LIST_CONFIGS['proc:entrada_cliente'])
  return <NewRecordFormClient listKey="proc:entrada_cliente" options={options} />
}
