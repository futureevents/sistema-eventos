import { loadOptions } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { NewRecordFormClient } from '@/components/list/client'

export default async function NovoClientePage() {
  const options = await loadOptions(LIST_CONFIGS.clientes)
  return <NewRecordFormClient listKey="clientes" options={options} />
}
