import { AppShell } from '@/components/shell/AppShell'
import { PermProvider } from '@/lib/permissions/context'
import { getMyPermissions } from '@/lib/permissions/resolve'
import { todasAsCadeias } from '@/lib/permissions/scopes'
import { ContaDesativada } from '@/components/permissions/AcessoNegado'
import type { Capacidades } from '@/lib/permissions/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perm = await getMyPermissions()

  // Membro desativado: acesso ao sistema bloqueado.
  if (perm.email && !perm.ativo) return <ContaDesativada />

  const nav = perm.navVisivel()

  // Mapa de capacidades por List visível — o cliente usa para travar edição.
  const capsPorHref: Record<string, Capacidades> = {}
  for (const cadeia of todasAsCadeias()) {
    const caps = perm.capsDaLista(cadeia.href)
    if (caps) capsPorHref[cadeia.href] = caps
  }

  return (
    <PermProvider value={{ capsPorHref, papel: perm.papel, isAdmin: perm.isAdmin }}>
      <AppShell nav={nav}>{children}</AppShell>
    </PermProvider>
  )
}
