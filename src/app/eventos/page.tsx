import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function EventosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  async function logout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Sistema de Eventos</h1>
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit">Sair</Button>
        </form>
      </header>
      <main className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Eventos</h2>
          </div>
          <div className="bg-white rounded-lg border p-12 text-center text-gray-500">
            <p className="text-lg font-medium mb-1">Nenhum evento cadastrado</p>
            <p className="text-sm">Em breve você poderá criar e gerenciar seus eventos aqui.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
