import { createClient } from '@/lib/supabase/server'
import { FornecedoresView } from './FornecedoresView'

export default async function FornecedoresPage() {
  const supabase = await createClient()
  const { data: fornecedores } = await supabase
    .from('fornecedor')
    .select('id, nome, responsavel, categorias, email, whatsapp')
    .order('criado_em', { ascending: false })

  return <FornecedoresView fornecedores={fornecedores ?? []} />
}
