'use server'

import { createClient } from '@/lib/supabase/server'
import { InboxClient } from './InboxClient'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const userId = user.id

  const { data: mentions } = await supabase
    .from('task_comment')
    .select('*')
    .contains('mentions', [userId])
    .order('criado_em', { ascending: false })
    .limit(100)

  return <InboxClient mentions={mentions ?? []} currentUserId={userId} />
}
