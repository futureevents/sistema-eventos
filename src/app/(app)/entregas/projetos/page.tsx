import { loadListData } from '@/components/list/load'
import { projetosFolderConfig } from '@/components/list/configs/projetos-folder'
import { ProjetosFolderClient } from './FolderClient'

export default async function Page() {
  const data = await loadListData(projetosFolderConfig())
  return <ProjetosFolderClient {...data} />
}
