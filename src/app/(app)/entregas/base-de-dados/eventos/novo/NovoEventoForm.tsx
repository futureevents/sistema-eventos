'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Cliente = { id: string; nome: string }

const STATUS_OPTIONS = [
  { value: 'backlog',      label: 'Backlog' },
  { value: 'em_aberto',   label: 'Em aberto' },
  { value: 'em_execucao', label: 'Em execução' },
  { value: 'realizado',   label: 'Realizado' },
  { value: 'encerrado',   label: 'Encerrado' },
  { value: 'cancelado',   label: 'Cancelado' },
]

export function NovoEventoForm({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    status: 'backlog',
    cliente_id: '',
    local: '',
    descricao: '',
    data_inicio_organizacao: '',
    data_montagem: '',
    data_realizacao_inicio: '',
    data_realizacao_fim: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('O nome do evento é obrigatório.'); return }
    setSalvando(true)
    setErro(null)

    const supabase = createClient()
    const payload = {
      nome: form.nome.trim(),
      status: form.status,
      cliente_id: form.cliente_id || null,
      local: form.local.trim() || null,
      descricao: form.descricao.trim() || null,
      data_inicio_organizacao: form.data_inicio_organizacao || null,
      data_montagem: form.data_montagem || null,
      data_realizacao_inicio: form.data_realizacao_inicio || null,
      data_realizacao_fim: form.data_realizacao_fim || null,
    }

    const { data, error } = await supabase.from('evento').insert(payload).select('id').single()

    if (error) {
      setErro(error.message)
      setSalvando(false)
      return
    }

    router.push(`/entregas/base-de-dados/eventos/${data.id}`)
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
          <Link href="/entregas/base-de-dados/eventos" style={{ color: 'var(--fe-text-muted)', textDecoration: 'none' }}>Eventos</Link>
          <span>/</span>
          <span style={{ fontWeight: 600, color: 'var(--fe-text)' }}>Novo evento</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href="/entregas/base-de-dados/eventos"
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
            form="form-evento"
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
            {salvando ? 'Salvando…' : 'Criar evento'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
        <form
          id="form-evento"
          onSubmit={handleSubmit}
          style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          {erro && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--fe-radius-md)', background: 'rgba(239,68,68,0.08)', color: '#DC2626', fontSize: 13 }}>
              {erro}
            </div>
          )}

          <Field label="Nome do evento" required>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="Ex: Casamento João & Maria"
              style={inputStyle}
              autoFocus
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set('status', e.target.value)} style={inputStyle}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Cliente">
              <select value={form.cliente_id} onChange={(e) => set('cliente_id', e.target.value)} style={inputStyle}>
                <option value="">Sem cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Local">
            <input
              type="text"
              value={form.local}
              onChange={(e) => set('local', e.target.value)}
              placeholder="Ex: Espaço Villa, São Paulo"
              style={inputStyle}
            />
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
              placeholder="Observações gerais sobre o evento…"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', paddingTop: 10, paddingBottom: 10 }}
            />
          </Field>
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

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--fe-border-soft)' }} />
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
