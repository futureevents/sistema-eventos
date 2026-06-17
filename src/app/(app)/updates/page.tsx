'use server'

import { createClient } from '@/lib/supabase/server'
import { UpdatesClient } from './UpdatesClient'

export default async function UpdatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const userId = user.id
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Atividades do dia do usuário atual
  const { data: activities } = await supabase
    .from('task_activity')
    .select('*')
    .gte('criado_em', todayStart.toISOString())
    .order('criado_em', { ascending: false })
    .limit(200)

  // Tasks concluídas hoje (task_projeto com status 'concluida' e responsavel_id do usuário)
  const { data: concluded } = await supabase
    .from('task_projeto')
    .select('id, nome, tipo, status, atualizado_em')
    .eq('responsavel_id', userId)
    .eq('status', 'concluida')
    .gte('atualizado_em', todayStart.toISOString())
    .order('atualizado_em', { ascending: false })

  const userName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Usuário'

  return (
    <UpdatesClient
      activities={activities ?? []}
      concluded={concluded ?? []}
      userName={userName}
    />
  )
}
