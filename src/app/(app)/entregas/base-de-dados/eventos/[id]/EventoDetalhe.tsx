'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  SPACE_ENTREGAS, FullPage, DetRow, Pill, Dash, dataLonga,
  ghostBtn, accentBtn, inputStyle,
} from '@/components/list/kit'
import { EV_STATUS } from '../EventosView'

const BASE = '/entregas/base-de-dados/eventos'

type StatusEvento = 'backlog' | 'em_aberto' | 'em_execucao' | 'realizado' | 'encerrado' | 'cancelado'

type Evento = {
  id: string
  nome: string
  status: StatusEvento
  local: string | null
  descricao: string | null
  cliente_id: string | null
  cliente: { id: string; nome: string } | null
  data_inicio_organizacao: string | null
  data_montagem: string | null
  data_realizacao_inicio: string | null
  data_realizacao_fim: string | null
  criado_em: string
}

type Cliente = { id: string; nome: string }

const ORDER: StatusEvento[] = ['backlog', 'em_aberto', 'em_execucao', 'realizado', 'encerrado', 'cancelado']

function dataLongaOpt(iso: string | null) { return iso ? dataLonga(iso) : null }

export function EventoDetalhe({ evento, clientes }: { evento: Evento; clientes: Cliente[] }) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: evento.nome,
    status: evento.status,
    cliente_id: evento.cliente_id ?? '',
    local: evento.local ?? '',
    descricao: evento.descricao ?? '',
    data_inicio_organizacao: evento.data_inicio_organizacao ?? '',
    data_montagem: evento.data_montagem ?? '',
    data_realizacao_inicio: evento.data_realizacao_inicio ?? '',
    data_realizacao_fim: evento.data_realizacao_fim ?? '',
  })

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })) }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('O nome é obrigatório.'); return }
    setSalvando(true); setErro(null)
    const supabase = createClient()
    const { error } = await supabase.from('evento').update({
      nome: form.nome.trim(),
      status: form.status,
      cliente_id: form.cliente_id || null,
      local: form.local.trim() || null,
      descricao: form.descricao.trim() || null,
      data_inicio_organizacao: form.data_inicio_organizacao || null,
      data_montagem: form.data_montagem || null,
      data_realizacao_inicio: form.data_realizacao_inicio || null,
      data_realizacao_fim: form.data_realizacao_fim || null,
    }).eq('id', evento.id)
    if (error) { setErro(error.message); setSalvando(false); return }
    setSalvando(false); setEditando(false); router.refresh()
  }

  async function handleExcluir() {
    if (!confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) return
    setExcluindo(true)
    const supabase = createClient()
    await supabase.from('evento').delete().eq('id', evento.id)
    router.push(BASE); router.refresh()
  }

  const c = EV_STATUS[evento.status]
  const statusPill = <Pill label={c.label} dot={c.dot} bg={c.bg} text={c.text} />

  const details = (
    <>
      <DetRow label="Status">{statusPill}</DetRow>
      <DetRow label="Cliente">{evento.cliente?.nome ?? <span style={{ color: 'var(--fe-text-faint)' }}>Sem cliente</span>}</DetRow>
      <DetRow label="Local">{evento.local ?? <Dash />}</DetRow>
      <DetRow label="Realização">{dataLongaOpt(evento.data_realizacao_inicio) ?? <Dash />}</DetRow>
      <DetRow label="Realiz. fim">{dataLongaOpt(evento.data_realizacao_fim) ?? <Dash />}</DetRow>
      <DetRow label="Organização">{dataLongaOpt(evento.data_inicio_organizacao) ?? <Dash />}</DetRow>
      <DetRow label="Montagem" last>{dataLongaOpt(evento.data_montagem) ?? <Dash />}</DetRow>
    </>
  )

  const topActions = !editando ? (
    <button onClick={() => setEditando(true)} style={ghostBtn}>Editar</button>
  ) : (
    <>
      <button onClick={() => { setEditando(false); setErro(null) }} style={ghostBtn}>Cancelar</button>
      <button form="form-evento" type="submit" disabled={salvando} style={accentBtn(salvando)}>{salvando ? 'Salvando…' : 'Salvar'}</button>
    </>
  )

  const body = !editando ? (
    evento.descricao ? (
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Descrição</p>
        <p style={{ fontSize: 13.5, color: 'var(--fe-text)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>{evento.descricao}</p>
      </div>
    ) : (
      <div style={{ border: '1px dashed var(--fe-border)', borderRadius: 'var(--fe-radius-lg)', padding: '22px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--fe-text-muted)', margin: '0 0 6px' }}>Este evento ainda não tem descrição.</p>
        <button onClick={() => setEditando(true)} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-soft)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Editar evento</button>
      </div>
    )
  ) : (
    <form id="form-evento" onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {erro && <ErroBanner msg={erro} />}
      <Field label="Nome do evento" required><input value={form.nome} onChange={(e) => set('nome', e.target.value)} style={inputStyle} autoFocus /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Status"><select value={form.status} onChange={(e) => set('status', e.target.value)} style={inputStyle}>{ORDER.map((s) => <option key={s} value={s}>{EV_STATUS[s].label}</option>)}</select></Field>
        <Field label="Cliente"><select value={form.cliente_id} onChange={(e) => set('cliente_id', e.target.value)} style={inputStyle}><option value="">Sem cliente</option>{clientes.map((cl) => <option key={cl.id} value={cl.id}>{cl.nome}</option>)}</select></Field>
      </div>
      <Field label="Local"><input value={form.local} onChange={(e) => set('local', e.target.value)} style={inputStyle} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Início da organização"><input type="date" value={form.data_inicio_organizacao} onChange={(e) => set('data_inicio_organizacao', e.target.value)} style={inputStyle} /></Field>
        <Field label="Data de montagem"><input type="date" value={form.data_montagem} onChange={(e) => set('data_montagem', e.target.value)} style={inputStyle} /></Field>
        <Field label="Realização — início"><input type="date" value={form.data_realizacao_inicio} onChange={(e) => set('data_realizacao_inicio', e.target.value)} style={inputStyle} /></Field>
        <Field label="Realização — fim"><input type="date" value={form.data_realizacao_fim} onChange={(e) => set('data_realizacao_fim', e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="Descrição"><textarea value={form.descricao} onChange={(e) => set('descricao', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', paddingTop: 10, paddingBottom: 10, height: 'auto' }} /></Field>
      <div><button type="button" onClick={handleExcluir} disabled={excluindo} style={{ fontSize: 12.5, fontWeight: 500, color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>{excluindo ? 'Excluindo…' : 'Excluir evento'}</button></div>
    </form>
  )

  return (
    <FullPage
      space={SPACE_ENTREGAS}
      segments={['Entregas', 'Eventos', evento.nome]}
      backHref={BASE}
      topActions={topActions}
      statusSlot={!editando ? statusPill : undefined}
      title={!editando ? evento.nome : undefined}
      body={body}
      details={details}
      criadoEm={dataLonga(evento.criado_em.slice(0, 10))}
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
