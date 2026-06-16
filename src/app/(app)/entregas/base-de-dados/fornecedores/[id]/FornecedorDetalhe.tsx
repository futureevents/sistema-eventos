'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  SPACE_ENTREGAS, FullPage, DetRow, Avatar, Tag, Dash, dataLonga,
  ghostBtn, accentBtn, inputStyle,
} from '@/components/list/kit'
import { CategoriasSelect } from '../CategoriasSelect'

const BASE = '/entregas/base-de-dados/fornecedores'

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

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })) }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('O nome é obrigatório.'); return }
    setSalvando(true); setErro(null)
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
    setSalvando(false); setEditando(false); router.refresh()
  }

  async function handleExcluir() {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return
    setExcluindo(true)
    const supabase = createClient()
    await supabase.from('fornecedor').delete().eq('id', fornecedor.id)
    router.push(BASE); router.refresh()
  }

  const details = (
    <>
      <DetRow label="Responsável">{fornecedor.responsavel ?? <Dash />}</DetRow>
      <DetRow label="CNPJ / CPF">{fornecedor.cnpj_cpf ?? <Dash />}</DetRow>
      <DetRow label="WhatsApp">{fornecedor.whatsapp ?? <Dash />}</DetRow>
      <DetRow label="Telefone">{fornecedor.telefone ?? <Dash />}</DetRow>
      <DetRow label="Email" last>{fornecedor.email ?? <Dash />}</DetRow>
    </>
  )

  const topActions = !editando ? (
    <button onClick={() => setEditando(true)} style={ghostBtn}>Editar</button>
  ) : (
    <>
      <button onClick={() => { setEditando(false); setErro(null) }} style={ghostBtn}>Cancelar</button>
      <button form="form-fornecedor" type="submit" disabled={salvando} style={accentBtn(salvando)}>{salvando ? 'Salvando…' : 'Salvar'}</button>
    </>
  )

  const body = !editando ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar nome={fornecedor.nome} size={40} />
        <p style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', margin: 0 }}>{fornecedor.email ?? fornecedor.whatsapp ?? 'Fornecedor'}</p>
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Categorias</p>
        {fornecedor.categorias.length > 0
          ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{fornecedor.categorias.map((c) => <Tag key={c} label={c} />)}</div>
          : <Dash />}
      </div>
    </div>
  ) : (
    <form id="form-fornecedor" onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {erro && <ErroBanner msg={erro} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Nome do fornecedor" required><input value={form.nome} onChange={(e) => set('nome', e.target.value)} style={inputStyle} autoFocus /></Field>
        <Field label="Responsável"><input value={form.responsavel} onChange={(e) => set('responsavel', e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="Categorias"><CategoriasSelect value={form.categorias} onChange={(v) => setForm((p) => ({ ...p, categorias: v }))} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="CNPJ / CPF"><input value={form.cnpj_cpf} onChange={(e) => set('cnpj_cpf', e.target.value)} style={inputStyle} /></Field>
        <Field label="Email"><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} style={inputStyle} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="WhatsApp"><input type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} style={inputStyle} /></Field>
        <Field label="Telefone"><input type="tel" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} style={inputStyle} /></Field>
      </div>
      <div><button type="button" onClick={handleExcluir} disabled={excluindo} style={{ fontSize: 12.5, fontWeight: 500, color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>{excluindo ? 'Excluindo…' : 'Excluir fornecedor'}</button></div>
    </form>
  )

  return (
    <FullPage
      space={SPACE_ENTREGAS}
      segments={['Entregas', 'Fornecedores', fornecedor.nome]}
      backHref={BASE}
      topActions={topActions}
      title={!editando ? fornecedor.nome : undefined}
      body={body}
      details={details}
      criadoEm={dataLonga(fornecedor.criado_em.slice(0, 10))}
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
