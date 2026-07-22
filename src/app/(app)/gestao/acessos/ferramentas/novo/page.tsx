import { loadOptions } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { NewRecordFormClient } from '@/components/list/client'

export default async function Page() {
  const options = await loadOptions(LIST_CONFIGS['acesso:ferramentas'])
  return <NewRecordFormClient listKey="acesso:ferramentas" options={options} />
}
