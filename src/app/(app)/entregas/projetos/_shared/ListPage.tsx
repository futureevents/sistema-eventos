import { createClient } from '@/lib/supabase/server'
import { TasksView } from './TasksView'
import { type TipoTask, type EventoOpcao, type ClienteOpcao } from './types'

export async function ListPage({ tipo }: { tipo: TipoTask }) {
  const supabase = await createClient()

  const [{ data: tasks }, { data: membros }, { data: eventosRaw }, { data: clientes }] = await Promise.all([
    supabase
      .from('task_projeto')
      .select('id, nome, tipo, evento_id, evento:evento_id(nome, cliente_id, cliente:cliente_id(nome)), responsavel_id, data_fim, prioridade, status, descricao, criado_em')
      .eq('tipo', tipo)
      .order('criado_em', { ascending: false }),
    supabase.from('membros').select('id, nome, email'),
    supabase.from('evento').select('id, nome, cliente_id, cliente:cliente_id(nome)').order('nome'),
    supabase.from('cliente').select('id, nome').order('nome'),
  ])

  const taskList = (tasks ?? []).map((t) => ({
    ...t,
    evento: normEvento(t.evento),
  }))

  const eventos: EventoOpcao[] = (eventosRaw ?? []).map((e) => {
    const cli = Array.isArray(e.cliente) ? (e.cliente[0] ?? null) : e.cliente
    return { id: e.id, nome: e.nome, cliente_id: e.cliente_id, cliente_nome: cli?.nome ?? null }
  })

  return (
    <TasksView
      tasks={taskList as never}
      tipo={tipo}
      membros={membros ?? []}
      eventos={eventos}
      clientes={(clientes ?? []) as ClienteOpcao[]}
    />
  )
}

function normEvento(ev: unknown) {
  const e = Array.isArray(ev) ? (ev[0] ?? null) : ev
  if (!e || typeof e !== 'object') return null
  const obj = e as { nome: string; cliente_id: string | null; cliente: unknown }
  const cli = Array.isArray(obj.cliente) ? (obj.cliente[0] ?? null) : obj.cliente
  return { nome: obj.nome, cliente_id: obj.cliente_id, cliente: (cli as { nome: string } | null) ?? null }
}
