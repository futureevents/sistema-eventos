import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FornecedorDetalhe } from './FornecedorDetalhe'

export default async function FornecedorDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: fornecedor } = await supabase
    .from('fornecedor')
    .select('id, nome, responsavel, categorias, cnpj_cpf, whatsapp, telefone, email, criado_em')
    .eq('id', id)
    .single()

  if (!fornecedor) notFound()

  return <FornecedorDetalhe fornecedor={fornecedor} />
}
