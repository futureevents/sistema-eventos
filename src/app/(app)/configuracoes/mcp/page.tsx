import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSettingsSection } from '@/components/settings/sections'
import { SectionScaffold } from '@/components/settings/SectionScaffold'
import { McpConnect } from '@/components/settings/McpConnect'

const MCP_URL = 'https://sistema-eventos-eosin.vercel.app/api/mcp'

export default async function McpPage() {
  const s = getSettingsSection('mcp')!
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let token: string | null = null
  if (user?.email) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('mcp_token')
      .select('token')
      .eq('membro_email', user.email)
      .eq('ativo', true)
      .order('criado_em', { ascending: true })
      .limit(1)
      .maybeSingle()
    token = data?.token ?? null

    // Defensivo: se por algum motivo o usuário não tiver token, cria na hora.
    if (!token) {
      const novo = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '')
      const { data: ins } = await admin
        .from('mcp_token')
        .insert({ token: novo, membro_email: user.email })
        .select('token')
        .single()
      token = ins?.token ?? null
    }
  }

  return (
    <SectionScaffold icon={s.icon} title={s.label} summary={s.summary}>
      <McpConnect url={MCP_URL} token={token} email={user?.email ?? null} />
    </SectionScaffold>
  )
}
