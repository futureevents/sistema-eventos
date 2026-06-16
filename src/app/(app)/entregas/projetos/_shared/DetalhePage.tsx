import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TaskDetalhe } from './TaskForm'

export async function DetalhePage({ id }: { id: string }) {
  const supabase = await createClient()

  const [{ data: task }, { data: eventos }, { data: membros }] = await Promise.all([
    supabase
      .from('task_projeto')
      .select('id, nome, tipo, evento_id, evento:evento_id(nome), responsavel_id, data_fim, prioridade, status, criado_em')
      .eq('id', id)
      .single(),
    supabase.from('evento').select('id, nome').order('nome'),
    supabase.from('membros').select('id, nome, email'),
  ])

  if (!task) notFound()

  return <TaskDetalhe task={task as any} eventos={eventos ?? []} membros={membros ?? []} />
}
