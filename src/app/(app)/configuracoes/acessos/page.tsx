import { getMyPermissions } from '@/lib/permissions/resolve'
import { getAcessosData } from '@/lib/permissions/admin-data'
import { arvoreDeEscopos } from '@/lib/permissions/scopes'
import { AcessoNegado } from '@/components/permissions/AcessoNegado'
import { AcessosManager } from '@/components/settings/AcessosManager'

export const dynamic = 'force-dynamic'

export default async function AcessosPage() {
  const perm = await getMyPermissions()
  if (!perm.isAdmin) {
    return <AcessoNegado descricao="Só Proprietários e Administradores podem gerenciar acessos e permissões." />
  }

  const data = await getAcessosData()
  const arvore = arvoreDeEscopos()

  return <AcessosManager data={data} arvore={arvore} callerPapel={perm.papel!} callerEmail={perm.email!} />
}
