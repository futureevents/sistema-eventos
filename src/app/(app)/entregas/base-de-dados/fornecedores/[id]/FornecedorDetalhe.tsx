'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CategoriasSelect } from '../CategoriasSelect'

type Fornecedor = {
  id: string
  nome: string
  responsavel: string | null
  categorias: string[]
  cnpj_cpf: string | null
  whatsapp: string | null
  telefone: string | null
  email: string | null
  criado_em: string
}

export function FornecedorDetalhe({ fornecedor }: { fornecedor: Fornecedor }) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: fornecedor.nome,
    responsavel: fornecedor.responsavel ?? '',
    categorias: fornecedor.categorias,
    cnpj_cpf: fornecedor.cnpj_cpf ?? '',
    whatsapp: fornecedor.whatsapp ?? '',
    telefone: fornecedor.telefone ?? '',
    email: fornecedor.email ?? '',
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
    const { error } = await supabase.from('fornecedor').update({
      nome: form.nome.trim(),
      responsavel: form.responsavel.trim() || null,
      categorias: form.categorias,
      cnpj_cpf: form.cnpj_cpf.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
    }).eq('id', fornecedor.id)

    if (error) { setErro(error.message); setSalvando(false); return }
    setSalvando(false)
    setEditando(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return
    setExcluindo(true)
    const supabase = createClient()
    await supabase.from('fornecedor').delete().eq('id', fornecedor.id)
    router.push('/entregas/base-de-dados/fornecedores')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          <Link href="/entregas/base-de-dados/fornecedores" style={{ color: 'var(--fe-text-muted)', textDecoration: 'none' }}>Fornecedores</Link>
          <span>/</span>
          <span style={{ fontWeight: 600, color: 'var(--fe-text)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fornecedor.nome}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!editando ? (
            <>
              <button
                onClick={handleExcluir}
                disabled={excluindo}
                style={{ height: 28, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, color: '#DC2626', cursor: 'pointer' }}
              >
                {excluindo ? 'Excluindo…' : 'Excluir'}
              </button>
              <button
                onClick={() => setEditando(true)}
                style={{ height: 28, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: 'var(--fe-accent-dark)', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Editar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setEditando(false); setErro(null) }}
                style={{ height: 28, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, color: 'var(--fe-text-soft)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                form="form-editar-fornecedor"
                type="submit"
                disabled={salvando}
                style={{ height: 28, padding: '0 14px', borderRadius: 'var(--fe-radius-md)', background: salvando ? 'var(--fe-border)' : 'var(--fe-accent)', color: salvando ? 'var(--fe-text-muted)' : 'var(--fe-accent-dark)', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer' }}
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
        {!editando ? (
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-0.025em', color: 'var(--fe-text-strong)', margin: '0 0 10px' }}>
                {fornecedor.nome}
              </h1>
              {fornecedor.categorias.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {fornecedor.categorias.map((cat) => (
                    <span
                      key={cat}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: 22,
                        padding: '0 9px',
                        borderRadius: 'var(--fe-radius-pill)',
                        background: 'var(--fe-status-todo-tint)',
                        color: 'var(--fe-status-todo-text)',
                        fontSize: 11.5,
                        fontWeight: 600,
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoItem label="Responsável" value={fornecedor.responsavel} />
              <InfoItem label="CNPJ / CPF" value={fornecedor.cnpj_cpf} />
              <InfoItem label="WhatsApp" value={fornecedor.whatsapp} />
              <InfoItem label="Telefone" value={fornecedor.telefone} />
              <InfoItem label="Email" value={fornecedor.email} />
            </div>
          </div>
        ) : (
          <form
            id="form-editar-fornecedor"
            onSubmit={handleSalvar}
            style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            {erro && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--fe-radius-md)', background: 'rgba(239,68,68,0.08)', color: '#DC2626', fontSize: 13 }}>
                {erro}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Nome do fornecedor" required>
                <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} style={inputStyle} autoFocus />
              </Field>
              <Field label="Responsável">
                <input type="text" value={form.responsavel} onChange={(e) => set('responsavel', e.target.value)} style={inputStyle} />
              </Field>
            </div>

            <Field label="Categorias">
              <CategoriasSelect
                value={form.categorias}
                onChange={(v) => setForm((prev) => ({ ...prev, categorias: v }))}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="CNPJ / CPF">
                <input type="text" value={form.cnpj_cpf} onChange={(e) => set('cnpj_cpf', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="WhatsApp">
                <input type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Telefone">
                <input type="tel" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} style={inputStyle} />
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
