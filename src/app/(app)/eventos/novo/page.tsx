import { createClient } from '@/lib/supabase/server'
import { NovoEventoForm } from './NovoEventoForm'

export default async function NovoEventoPage() {
  const supabase = await createClient()
  const { data: clientes } = await supabase
    .from('cliente')
    .select('id, nome')
    .order('nome')

  return <NovoEventoForm clientes={clientes ?? []} />
}
