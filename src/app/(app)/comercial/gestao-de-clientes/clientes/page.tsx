import { createClient } from '@/lib/supabase/server'
import { ClientesView } from './ClientesView'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: clientes } = await supabase
    .from('cliente')
    .select('id, nome, email, telefone, whatsapp, empresa, cnpj_cpf')
    .order('criado_em', { ascending: false })

  return <ClientesView clientes={clientes ?? []} />
}
