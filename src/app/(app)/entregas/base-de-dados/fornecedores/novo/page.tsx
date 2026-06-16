import { loadOptions } from '@/components/list/load'
import { LIST_CONFIGS } from '@/components/list/registry'
import { NewRecordFormClient } from '@/components/list/client'

export default async function NovoFornecedorPage() {
  const options = await loadOptions(LIST_CONFIGS.fornecedores)
  return <NewRecordFormClient listKey="fornecedores" options={options} />
}
