import { createAdminClient } from '@/lib/supabase/admin'

/** Quem está perguntando — resolvido a partir do token pessoal. */
export type Membro = {
  email: string
  /** id em auth.users (= responsavel_id nas tasks). Pode ser null se o e-mail
   *  do token ainda não tiver login criado no sistema. */
  id: string | null
  nome: string | null
}

/**
 * Valida o token Bearer contra a tabela `mcp_token` e resolve o membro.
 * Retorna null quando o token é inválido/inativo (a rota responde 401).
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

  // marca uso (não bloqueia a request se falhar)
  void supabase
    .from('mcp_token')
    .update({ ultimo_uso: new Date().toISOString() })
    .eq('token', token)

  // resolve id/nome do membro pelo e-mail (view `membros` sobre auth.users)
  const { data: membro } = await supabase
    .from('membros')
    .select('id, nome')
    .eq('email', tokenRow.membro_email)
    .maybeSingle()

  return {
    email: tokenRow.membro_email,
    id: membro?.id ?? null,
    nome: membro?.nome ?? null,
  }
}
