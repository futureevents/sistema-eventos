import { createClient } from '@supabase/supabase-js'

/**
 * Admin client do Supabase — usa a SERVICE ROLE KEY e ignora o RLS.
 *
 * Use SOMENTE no servidor (Route Handlers / código server-side). NUNCA importe
 * isto em componentes de cliente: a service role dá acesso total ao banco.
 *
 * Usado pelo sistema de permissões (src/lib/permissions) para ler/gravar
 * ignorando o RLS quando a autorização já foi resolvida na camada da aplicação.
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
