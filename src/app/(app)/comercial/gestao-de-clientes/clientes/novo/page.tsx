import { createClient } from '@/lib/supabase/server'
import { NovoClienteForm } from './NovoClienteForm'

export default async function NovoClientePage() {
  // Sem dependências externas — form simples
  return <NovoClienteForm />
}
