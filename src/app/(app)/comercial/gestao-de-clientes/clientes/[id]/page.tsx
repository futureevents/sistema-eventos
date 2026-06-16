import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClienteDetalhe } from './ClienteDetalhe'

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: cliente } = await supabase
    .from('cliente')
    .select('id, nome, email, telefone, whatsapp, empresa, cnpj_cpf, criado_em')
    .eq('id', id)
    .single()

  if (!cliente) notFound()

  return <ClienteDetalhe cliente={cliente} />
}
