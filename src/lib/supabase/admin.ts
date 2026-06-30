import { createClient } from '@supabase/supabase-js'

/**
 * Admin client do Supabase — usa a SERVICE ROLE KEY e ignora o RLS.
 *
 * Use SOMENTE no servidor (Route Handlers / código server-side). NUNCA importe
 * isto em componentes de cliente: a service role dá acesso total ao banco.
 *
 * O MCP usa este client porque a autorização passa a ser o token pessoal do
 * membro (ver src/lib/mcp/auth.ts), não o cookie de sessão do Supabase.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no ambiente.'
    )
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
