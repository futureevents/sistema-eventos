import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TaskDetalhe } from './TaskForm'
import { type EventoOpcao } from './types'

export async function DetalhePage({ id }: { id: string }) {
  const supabase = await createClient()

  const [{ data: task }, { data: eventosRaw }, { data: membros }] = await Promise.all([
    supabase
      .from('task_projeto')
      .select('id, nome, tipo, evento_id, evento:evento_id(nome, cliente_id, cliente:cliente_id(nome)), responsavel_id, data_fim, prioridade, status, descricao, criado_em')
      .eq('id', id)
      .single(),
    supabase.from('evento').select('id, nome, cliente_id, cliente:cliente_id(nome)').order('nome'),
    supabase.from('membros').select('id, nome, email'),
  ])

  if (!task) notFound()

  const e = Array.isArray(task.evento) ? (task.evento[0] ?? null) : task.evento
  const cli = e ? (Array.isArray(e.cliente) ? (e.cliente[0] ?? null) : e.cliente) : null
  const taskNorm = {
    ...task,
    evento: e ? { nome: e.nome, cliente_id: e.cliente_id, cliente: (cli as { nome: string } | null) ?? null } : null,
  }

  const eventos: EventoOpcao[] = (eventosRaw ?? []).map((ev) => {
    const c = Array.isArray(ev.cliente) ? (ev.cliente[0] ?? null) : ev.cliente
    return { id: ev.id, nome: ev.nome, cliente_id: ev.cliente_id, cliente_nome: (c as { nome: string } | null)?.nome ?? null }
  })

  return <TaskDetalhe task={taskNorm as never} eventos={eventos} membros={membros ?? []} />
}
