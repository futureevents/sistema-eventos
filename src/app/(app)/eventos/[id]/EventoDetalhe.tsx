'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

const STATUS_OPTIONS = [
  { value: 'backlog',      label: 'Backlog' },
  { value: 'em_aberto',   label: 'Em aberto' },
  { value: 'em_execucao', label: 'Em execução' },
  { value: 'realizado',   label: 'Realizado' },
  { value: 'encerrado',   label: 'Encerrado' },
  { value: 'cancelado',   label: 'Cancelado' },
]

const STATUS_STYLE: Record<StatusEvento, { bg: string; color: string }> = {
  backlog:      { bg: 'var(--fe-status-todo-tint)',   color: 'var(--fe-status-todo-text)' },
  em_aberto:    { bg: 'var(--fe-status-prog-tint)',   color: 'var(--fe-status-prog-text)' },
  em_execucao:  { bg: 'var(--fe-status-review-tint)', color: 'var(--fe-status-review-text)' },
  realizado:    { bg: 'var(--fe-status-done-tint)',   color: 'var(--fe-status-done-text)' },
  encerrado:    { bg: 'var(--fe-status-todo-tint)',   color: 'var(--fe-status-todo-text)' },
  cancelado:    { bg: 'rgba(239,68,68,0.10)',         color: '#DC2626' },
}

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

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('O nome é obrigatório.'); return }
    setSalvando(true)
    setErro(null)

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
    setSalvando(false)
    setEditando(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) return
    setExcluindo(true)
    const supabase = createClient()
    await supabase.from('evento').delete().eq('id', evento.id)
    router.push('/eventos')
    router.refresh()
  }

  const statusStyle = STATUS_STYLE[evento.status]

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
          <Link href="/eventos" style={{ color: 'var(--fe-text-muted)', textDecoration: 'none' }}>Eventos</Link>
          <span>/</span>
          <span style={{ fontWeight: 600, color: 'var(--fe-text)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {evento.nome}
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
                form="form-editar-evento"
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
          /* Modo visualização */
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-0.025em', color: 'var(--fe-text-strong)', margin: '0 0 8px' }}>
                {evento.nome}
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 24,
                  padding: '0 10px',
                  borderRadius: 'var(--fe-radius-pill)',
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {STATUS_OPTIONS.find((o) => o.value === evento.status)?.label}
              </span>
            </div>

            <InfoGrid>
              <InfoItem label="Cliente" value={evento.cliente?.nome} />
              <InfoItem label="Local" value={evento.local} />
              <InfoItem label="Início da organização" value={formatarData(evento.data_inicio_organizacao)} />
              <InfoItem label="Data de montagem" value={formatarData(evento.data_montagem)} />
              <InfoItem label="Realização — início" value={formatarData(evento.data_realizacao_inicio)} />
              <InfoItem label="Realização — fim" value={formatarData(evento.data_realizacao_fim)} />
            </InfoGrid>

            {evento.descricao && (
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Descrição</p>
                <p style={{ fontSize: 13.5, color: 'var(--fe-text)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>{evento.descricao}</p>
              </div>
            )}
          </div>
        ) : (
          /* Modo edição */
          <form
            id="form-editar-evento"
            onSubmit={handleSalvar}
            style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {erro && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--fe-radius-md)', background: 'rgba(239,68,68,0.08)', color: '#DC2626', fontSize: 13 }}>
                {erro}
              </div>
            )}

            <Field label="Nome do evento" required>
              <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} style={inputStyle} autoFocus />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Status">
                <select value={form.status} onChange={(e) => set('status', e.target.value)} style={inputStyle}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Cliente">
                <select value={form.cliente_id} onChange={(e) => set('cliente_id', e.target.value)} style={inputStyle}>
                  <option value="">Sem cliente</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Local">
              <input type="text" value={form.local} onChange={(e) => set('local', e.target.value)} style={inputStyle} />
            </Field>

            <Divider label="Datas" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Início da organização">
                <input type="date" value={form.data_inicio_organizacao} onChange={(e) => set('data_inicio_organizacao', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Data de montagem">
                <input type="date" value={form.data_montagem} onChange={(e) => set('data_montagem', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Realização — início">
                <input type="date" value={form.data_realizacao_inicio} onChange={(e) => set('data_realizacao_inicio', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Realização — fim">
                <input type="date" value={form.data_realizacao_fim} onChange={(e) => set('data_realizacao_fim', e.target.value)} style={inputStyle} />
              </Field>
            </div>

            <Divider label="Detalhes" />

            <Field label="Descrição">
              <textarea
                value={form.descricao}
                onChange={(e) => set('descricao', e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', paddingTop: 10, paddingBottom: 10, height: 'auto' }}
              />
            </Field>
          </form>
        )}
      </div>
    </div>
  )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {children}
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

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--fe-border-soft)' }} />
    </div>
  )
}

function formatarData(iso: string | null) {
  if (!iso) return null
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
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
