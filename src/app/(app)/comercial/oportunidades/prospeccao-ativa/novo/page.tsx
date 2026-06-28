import { loadOptions } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { NewRecordFormClient } from '@/components/list/client'

export default async function NovoProspeccaoAtivaPage() {
  const options = await loadOptions(LIST_CONFIGS['oport:prospeccao_ativa'])
  return <NewRecordFormClient listKey="oport:prospeccao_ativa" options={options} />
}
