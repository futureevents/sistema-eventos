'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  SPACE_COMERCIAL, FullPage, DetRow, Avatar, Dash, dataLonga,
  ghostBtn, accentBtn, inputStyle,
} from '@/components/list/kit'

const BASE = '/comercial/gestao-de-clientes/clientes'

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

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })) }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('O nome é obrigatório.'); return }
    setSalvando(true); setErro(null)
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
    setSalvando(false); setEditando(false); router.refresh()
  }

  async function handleExcluir() {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) return
    setExcluindo(true)
    const supabase = createClient()
    await supabase.from('cliente').delete().eq('id', cliente.id)
    router.push(BASE); router.refresh()
  }

  const details = (
    <>
      <DetRow label="Empresa">{cliente.empresa ?? <Dash />}</DetRow>
      <DetRow label="CNPJ / CPF">{cliente.cnpj_cpf ?? <Dash />}</DetRow>
      <DetRow label="WhatsApp">{cliente.whatsapp ?? <Dash />}</DetRow>
      <DetRow label="Telefone">{cliente.telefone ?? <Dash />}</DetRow>
      <DetRow label="Email" last>{cliente.email ?? <Dash />}</DetRow>
    </>
  )

  const topActions = !editando ? (
    <button onClick={() => setEditando(true)} style={ghostBtn}>Editar</button>
  ) : (
    <>
      <button onClick={() => { setEditando(false); setErro(null) }} style={ghostBtn}>Cancelar</button>
      <button form="form-cliente" type="submit" disabled={salvando} style={accentBtn(salvando)}>{salvando ? 'Salvando…' : 'Salvar'}</button>
    </>
  )

  const body = !editando ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar nome={cliente.nome} size={40} />
      <div>
        <p style={{ fontSize: 13.5, color: 'var(--fe-text)', margin: 0 }}>{cliente.empresa ?? 'Contato'}</p>
        <p style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', margin: 0 }}>{cliente.email ?? cliente.whatsapp ?? cliente.telefone ?? 'Sem contato cadastrado'}</p>
      </div>
    </div>
  ) : (
    <form id="form-cliente" onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {erro && <ErroBanner msg={erro} />}
      <Field label="Nome" required><input value={form.nome} onChange={(e) => set('nome', e.target.value)} style={inputStyle} autoFocus /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Empresa"><input value={form.empresa} onChange={(e) => set('empresa', e.target.value)} style={inputStyle} /></Field>
        <Field label="CNPJ / CPF"><input value={form.cnpj_cpf} onChange={(e) => set('cnpj_cpf', e.target.value)} style={inputStyle} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <Field label="WhatsApp"><input type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} style={inputStyle} /></Field>
        <Field label="Telefone"><input type="tel" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} style={inputStyle} /></Field>
        <Field label="Email"><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} style={inputStyle} /></Field>
      </div>
      <div><button type="button" onClick={handleExcluir} disabled={excluindo} style={{ fontSize: 12.5, fontWeight: 500, color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>{excluindo ? 'Excluindo…' : 'Excluir cliente'}</button></div>
    </form>
  )

  return (
    <FullPage
      space={SPACE_COMERCIAL}
      segments={['Comercial', 'Clientes', cliente.nome]}
      backHref={BASE}
      topActions={topActions}
      title={!editando ? cliente.nome : undefined}
      body={body}
      details={details}
      criadoEm={dataLonga(cliente.criado_em.slice(0, 10))}
    />
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-soft)' }}>{label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}</label>
      {children}
    </div>
  )
}

function ErroBanner({ msg }: { msg: string }) {
  return <div style={{ padding: '10px 14px', borderRadius: 'var(--fe-radius-md)', background: 'rgba(239,68,68,0.08)', color: '#DC2626', fontSize: 13 }}>{msg}</div>
}
