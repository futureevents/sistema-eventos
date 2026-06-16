import { createClient } from '@/lib/supabase/server'
import { EventosView, type EventoRow } from './EventosView'

export default async function EventosPage() {
  const supabase = await createClient()
  const { data: eventos } = await supabase
    .from('evento')
    .select('id, nome, status, local, data_realizacao_inicio, data_realizacao_fim, data_inicio_organizacao, data_montagem, cliente:cliente_id(nome)')
    .order('criado_em', { ascending: false })

  const lista: EventoRow[] = (eventos ?? []).map((e) => ({
    ...e,
    cliente: Array.isArray(e.cliente) ? (e.cliente[0] ?? null) : e.cliente,
  })) as EventoRow[]

  return <EventosView eventos={lista} />
}
