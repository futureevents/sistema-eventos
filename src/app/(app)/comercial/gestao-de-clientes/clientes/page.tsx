import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ClientesLista } from './ClientesLista'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: clientes } = await supabase
    .from('cliente')
    .select('id, nome, email, telefone, whatsapp, empresa, cnpj_cpf')
    .order('criado_em', { ascending: false })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 44,
          padding: '0 20px',
          borderBottom: '1px solid var(--fe-border-soft)',
          background: 'var(--fe-surface)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fe-text-muted)' }}>
          <span>Comercial</span>
          <span>/</span>
          <span>Gestão de clientes</span>
          <span>/</span>
          <span style={{ fontWeight: 600, color: 'var(--fe-text)' }}>Clientes</span>
        </div>
        <Link
          href="/comercial/gestao-de-clientes/clientes/novo"
          style={{
            height: 28,
            padding: '0 12px',
            borderRadius: 'var(--fe-radius-md)',
            background: 'var(--fe-accent)',
            color: 'var(--fe-accent-dark)',
            fontSize: 12.5,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          Novo cliente
        </Link>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 40,
          padding: '0 20px',
          borderBottom: '1px solid var(--fe-border-soft)',
          background: 'var(--fe-surface)',
          flexShrink: 0,
        }}
      >
        {['Lista', 'Quadro'].map((tab, i) => (
          <button
            key={tab}
            style={{
              height: '100%',
              padding: '0 14px',
              border: 'none',
              borderBottom: i === 0 ? '2px solid var(--fe-black)' : '2px solid transparent',
              background: 'transparent',
              fontSize: 13,
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? 'var(--fe-black)' : 'var(--fe-text-muted)',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--fe-surface)' }}>
        <ClientesLista clientes={clientes ?? []} />
      </div>
    </div>
  )
}
