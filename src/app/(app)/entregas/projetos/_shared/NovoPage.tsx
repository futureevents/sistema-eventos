import { createClient } from '@/lib/supabase/server'
import { NovaTaskForm } from './TaskForm'
import { type TipoTask } from './types'

export async function NovoPage({ tipo }: { tipo: TipoTask }) {
  const supabase = await createClient()

  const [{ data: eventos }, { data: membros }] = await Promise.all([
    supabase.from('evento').select('id, nome').order('nome'),
    supabase.from('membros').select('id, nome, email'),
  ])

  return <NovaTaskForm tipo={tipo} eventos={eventos ?? []} membros={membros ?? []} />
}
