'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Cliente = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  whatsapp: string | null
  empresa: string | null
  cnpj_cpf: string | null
  criado_em: string
}

export function ClienteDetalhe({ cliente }: { cliente: Cliente }) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: cliente.nome,
    empresa: cliente.empresa ?? '',
    cnpj_cpf: cliente.cnpj_cpf ?? '',
    whatsapp: cliente.whatsapp ?? '',
    telefone: cliente.telefone ?? '',
    email: cliente.email ?? '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('O nome é obrigatório.'); return }
    setSalvando(true)
    setErro(null)

    const supabase = createClient()
    const { error } = await supabase.from('cliente').update({
      nome: form.nome.trim(),
      empresa: form.empresa.trim() || null,
      cnpj_cpf: form.cnpj_cpf.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
    }).eq('id', cliente.id)

    if (error) { setErro(error.message); setSalvando(false); return }
    setSalvando(false)
    setEditando(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) return
    setExcluindo(true)
    const supabase = createClient()
    await supabase.from('cliente').delete().eq('id', cliente.id)
    router.push('/comercial/gestao-de-clientes/clientes')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb */}
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
          <Link href="/comercial/gestao-de-clientes/clientes" style={{ color: 'var(--fe-text-muted)', textDecoration: 'none' }}>Clientes</Link>
          <span>/</span>
          <span style={{ fontWeight: 600, color: 'var(--fe-text)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cliente.nome}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!editando ? (
            <>
              <button
                onClick={handleExcluir}
                disabled={excluindo}
                style={{
                  height: 28,
                  padding: '0 12px',
                  borderRadius: 'var(--fe-radius-md)',
                  border: '1px solid var(--fe-border)',
                  background: 'transparent',
                  fontSize: 12.5,
                  color: '#DC2626',
                  cursor: 'pointer',
                }}
              >
                {excluindo ? 'Excluindo…' : 'Excluir'}
              </button>
              <button
                onClick={() => setEditando(true)}
                style={{
                  height: 28,
                  padding: '0 12px',
                  borderRadius: 'var(--fe-radius-md)',
                  background: 'var(--fe-accent)',
                  color: 'var(--fe-accent-dark)',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Editar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setEditando(false); setErro(null) }}
                style={{
                  height: 28,
                  padding: '0 12px',
                  borderRadius: 'var(--fe-radius-md)',
                  border: '1px solid var(--fe-border)',
                  background: 'transparent',
                  fontSize: 12.5,
                  color: 'var(--fe-text-soft)',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                form="form-editar-cliente"
                type="submit"
                disabled={salvando}
                style={{
                  height: 28,
                  padding: '0 14px',
                  borderRadius: 'var(--fe-radius-md)',
                  background: salvando ? 'var(--fe-border)' : 'var(--fe-accent)',
                  color: salvando ? 'var(--fe-text-muted)' : 'var(--fe-accent-dark)',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: salvando ? 'not-allowed' : 'pointer',
                }}
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
        {!editando ? (
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-0.025em', color: 'var(--fe-text-strong)', margin: '0 0 4px' }}>
                {cliente.nome}
              </h1>
              {cliente.empresa && (
                <p style={{ fontSize: 14, color: 'var(--fe-text-muted)', margin: 0 }}>{cliente.empresa}</p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoItem label="Empresa" value={cliente.empresa} />
              <InfoItem label="CNPJ / CPF" value={cliente.cnpj_cpf} />
              <InfoItem label="WhatsApp" value={cliente.whatsapp} />
              <InfoItem label="Telefone" value={cliente.telefone} />
              <InfoItem label="Email" value={cliente.email} />
            </div>
          </div>
        ) : (
          <form
            id="form-editar-cliente"
            onSubmit={handleSalvar}
            style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            {erro && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--fe-radius-md)', background: 'rgba(239,68,68,0.08)', color: '#DC2626', fontSize: 13 }}>
                {erro}
              </div>
            )}

            <Field label="Nome" required>
              <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} style={inputStyle} autoFocus />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Empresa">
                <input type="text" value={form.empresa} onChange={(e) => set('empresa', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="CNPJ / CPF">
                <input type="text" value={form.cnpj_cpf} onChange={(e) => set('cnpj_cpf', e.target.value)} style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Field label="WhatsApp">
                <input type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Telefone">
                <input type="tel" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} style={inputStyle} />
              </Field>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>{label}</p>
      <p style={{ fontSize: 13.5, color: value ? 'var(--fe-text)' : 'var(--fe-text-faint)', margin: 0 }}>{value ?? '—'}</p>
    </div>
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-soft)' }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 36,
  padding: '0 12px',
  borderRadius: 'var(--fe-radius-md)',
  border: '1px solid var(--fe-border)',
  background: 'var(--fe-surface)',
  fontSize: 13.5,
  color: 'var(--fe-text)',
  outline: 'none',
}
