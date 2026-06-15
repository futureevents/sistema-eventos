import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventoDetalhe } from './EventoDetalhe'

export default async function EventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: evento }, { data: clientes }] = await Promise.all([
    supabase
      .from('evento')
      .select('*, cliente:cliente_id(id, nome)')
      .eq('id', id)
      .single(),
    supabase.from('cliente').select('id, nome').order('nome'),
  ])

  if (!evento) notFound()

  return <EventoDetalhe evento={evento} clientes={clientes ?? []} />
}
