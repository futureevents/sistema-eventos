import { loadOptions } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { NewRecordFormClient } from '@/components/list/client'

export default async function Page() {
  const options = await loadOptions(LIST_CONFIGS['proc:cientifico'])
  return <NewRecordFormClient listKey="proc:cientifico" options={options} />
}
