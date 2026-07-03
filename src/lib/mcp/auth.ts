import { createAdminClient } from '@/lib/supabase/admin'

/** Quem está chamando o MCP — resolvido a partir do token pessoal. */
export type Membro = {
  email: string
  /** id em auth.users (= responsavel_id nas tasks). Null se o e-mail do token
   *  ainda não tiver login criado no sistema. */
  id: string | null
  nome: string | null
}

/**
 * Valida o token (Bearer ou ?token=) contra `mcp_token` e resolve o membro.
 * Retorna null quando o token é inválido/inativo — a rota responde 401.
 */
export async function validarToken(token: string | undefined): Promise<Membro | null> {
  if (!token) return null
  const supabase = createAdminClient()

  const { data: tokenRow, error } = await supabase
    .from('mcp_token')
    .select('membro_email, ativo')
    .eq('token', token)
    .eq('ativo', true)
    .maybeSingle()

  if (error || !tokenRow) return null

  // marca último uso sem bloquear a request
  void supabase
    .from('mcp_token')
    .update({ ultimo_uso: new Date().toISOString() })
    .eq('token', token)

  // resolve id/nome pelo e-mail (view `membros` sobre auth.users)
  const { data: membro } = await supabase
    .from('membros')
    .select('id, nome')
    .eq('email', tokenRow.membro_email)
    .maybeSingle()

  return {
    email: tokenRow.membro_email,
    id: (membro?.id as string | undefined) ?? null,
    nome: (membro?.nome as string | undefined) ?? null,
  }
}
