import { loadOptions } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { NewRecordFormClient } from '@/components/list/client'

export default async function Page() {
  const options = await loadOptions(LIST_CONFIGS['acesso:emails_redes'])
  return <NewRecordFormClient listKey="acesso:emails_redes" options={options} />
}
