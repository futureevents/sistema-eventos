import { loadOptions } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { NewRecordFormClient } from '@/components/list/client'

export default async function NovoEventoPage() {
  const options = await loadOptions(LIST_CONFIGS.eventos)
  return <NewRecordFormClient listKey="eventos" options={options} />
}
