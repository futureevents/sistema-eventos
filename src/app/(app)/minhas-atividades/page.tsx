'use server'

import { createClient } from '@/lib/supabase/server'
import { MinhasAtividadesClient } from './MinhasAtividadesClient'

export default async function MinhasAtividadesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const userId = user.id

  // Tasks de projeto (Entregas)
  const { data: tasksProjeto } = await supabase
    .from('task_projeto')
    .select('id, nome, tipo, status, prioridade, data_fim, criado_em')
    .eq('responsavel_id', userId)
    .neq('status', 'cancelada')
    .order('criado_em', { ascending: false })

  const userName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Você'

  return (
    <MinhasAtividadesClient
      tasksProjeto={tasksProjeto ?? []}
      userName={userName}
    />
  )
}
