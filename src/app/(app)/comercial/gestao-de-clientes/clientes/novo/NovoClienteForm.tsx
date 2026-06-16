'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function NovoClienteForm() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    empresa: '',
    cnpj_cpf: '',
    whatsapp: '',
    telefone: '',
    email: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('O nome do cliente é obrigatório.'); return }
    setSalvando(true)
    setErro(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('cliente')
      .insert({
        nome: form.nome.trim(),
        empresa: form.empresa.trim() || null,
        cnpj_cpf: form.cnpj_cpf.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        telefone: form.telefone.trim() || null,
        email: form.email.trim() || null,
      })
      .select('id')
      .single()

    if (error) {
      setErro(error.message)
      setSalvando(false)
      return
    }

    router.push(`/comercial/gestao-de-clientes/clientes/${data.id}`)
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
          <span style={{ fontWeight: 600, color: 'var(--fe-text)' }}>Novo cliente</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href="/comercial/gestao-de-clientes/clientes"
            style={{
              height: 28,
              padding: '0 12px',
              borderRadius: 'var(--fe-radius-md)',
              border: '1px solid var(--fe-border)',
              background: 'transparent',
              fontSize: 12.5,
              fontWeight: 500,
              color: 'var(--fe-text-soft)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Cancelar
          </Link>
          <button
            form="form-cliente"
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
            {salvando ? 'Salvando…' : 'Criar cliente'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
        <form
          id="form-cliente"
          onSubmit={handleSubmit}
          style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {erro && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--fe-radius-md)', background: 'rgba(239,68,68,0.08)', color: '#DC2626', fontSize: 13 }}>
              {erro}
            </div>
          )}

          <Field label="Nome" required>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="Ex: João Silva"
              style={inputStyle}
              autoFocus
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Empresa">
              <input
                type="text"
                value={form.empresa}
                onChange={(e) => set('empresa', e.target.value)}
                placeholder="Ex: Silva & Associados"
                style={inputStyle}
              />
            </Field>
            <Field label="CNPJ / CPF">
              <input
                type="text"
                value={form.cnpj_cpf}
                onChange={(e) => set('cnpj_cpf', e.target.value)}
                placeholder="00.000.000/0001-00"
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Field label="WhatsApp">
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                placeholder="(11) 99999-9999"
                style={inputStyle}
              />
            </Field>
            <Field label="Telefone">
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => set('telefone', e.target.value)}
                placeholder="(11) 3333-3333"
                style={inputStyle}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="email@exemplo.com"
                style={inputStyle}
              />
            </Field>
          </div>
        </form>
      </div>
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
