import { createClient } from '@/lib/supabase/server'
import { TasksView } from './TasksView'
import { type TipoTask } from './types'

export async function ListPage({ tipo }: { tipo: TipoTask }) {
  const supabase = await createClient()

  const [{ data: tasks }, { data: membros }] = await Promise.all([
    supabase
      .from('task_projeto')
      .select('id, nome, tipo, evento_id, evento:evento_id(nome), responsavel_id, data_fim, prioridade, status, criado_em')
      .eq('tipo', tipo)
      .order('criado_em', { ascending: false }),
    supabase.from('membros').select('id, nome, email'),
  ])

  const taskList = (tasks ?? []).map((t) => ({
    ...t,
    evento: Array.isArray(t.evento) ? (t.evento[0] ?? null) : t.evento,
  }))

  return <TasksView tasks={taskList} tipo={tipo} membros={membros ?? []} />
}
