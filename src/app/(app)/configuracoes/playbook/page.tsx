import { createClient } from '@/lib/supabase/server'
import { PlaybookEditor, type PlaybookRow } from '@/components/settings/PlaybookEditor'

export default async function PlaybookPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('playbook_modelo')
    .select('*')
    .order('ordem', { ascending: true })
  return <PlaybookEditor rows={(data ?? []) as PlaybookRow[]} />
}
