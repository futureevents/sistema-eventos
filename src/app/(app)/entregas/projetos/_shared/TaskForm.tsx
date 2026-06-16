'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  type TipoTask, type PrioridadeTask, type StatusTask, type Membro,
  TIPO_META, PRIORIDADE_LABEL, PRIORIDADE_STYLE, STATUS_LABEL, STATUS_STYLE,
} from './types'

type Evento = { id: string; nome: string }

const PRIORIDADES: PrioridadeTask[] = ['baixa', 'media', 'alta', 'urgente']
const STATUSES: StatusTask[] = ['a_fazer', 'em_andamento', 'concluida', 'cancelada']

// ─── Nova Task ──────────────────────────────────────────────────────────────

export function NovaTaskForm({ tipo, eventos, membros }: { tipo: TipoTask; eventos: Evento[]; membros: Membro[] }) {
  const router = useRouter()
  const meta = TIPO_META[tipo]
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    evento_id: '',
    responsavel_id: '',
    data_fim: '',
    prioridade: 'media' as PrioridadeTask,
    status: 'a_fazer' as StatusTask,
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('O nome da task é obrigatório.'); return }
    setSalvando(true)
    setErro(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('task_projeto')
      .insert({
        nome: form.nome.trim(),
        tipo,
        evento_id: form.evento_id || null,
        responsavel_id: form.responsavel_id || null,
        data_fim: form.data_fim || null,
        prioridade: form.prioridade,
        status: form.status,
      })
      .select('id')
      .single()

    if (error) { setErro(error.message); setSalvando(false); return }
    router.push(`/entregas/projetos/${meta.slug}/${data.id}`)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
        breadcrumb={<><Link href={`/entregas/projetos/${meta.slug}`} style={linkStyle}>{meta.label}</Link><span>/</span><span style={{ fontWeight: 600, color: 'var(--fe-text)' }}>Nova task</span></>}
        actions={
          <>
            <Link href={`/entregas/projetos/${meta.slug}`} style={cancelBtnStyle}>Cancelar</Link>
            <button form="form-task" type="submit" disabled={salvando} style={submitBtnStyle(salvando)}>
              {salvando ? 'Salvando…' : 'Criar task'}
            </button>
          </>
        }
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
        <form id="form-task" onSubmit={handleSubmit} style={formStyle}>
          {erro && <ErroBanner msg={erro} />}
          <Field label="Nome da task" required>
            <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: Confirmar local do evento" style={inputStyle} autoFocus />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Evento">
              <select value={form.evento_id} onChange={(e) => set('evento_id', e.target.value)} style={inputStyle}>
                <option value="">Sem evento</option>
                {eventos.map((ev) => <option key={ev.id} value={ev.id}>{ev.nome}</option>)}
              </select>
            </Field>
            <Field label="Responsável">
              <select value={form.responsavel_id} onChange={(e) => set('responsavel_id', e.target.value)} style={inputStyle}>
                <option value="">Sem responsável</option>
                {membros.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Field label="Data final">
              <input type="date" value={form.data_fim} onChange={(e) => set('data_fim', e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Prioridade">
              <select value={form.prioridade} onChange={(e) => set('prioridade', e.target.value)} style={inputStyle}>
                {PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDADE_LABEL[p]}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set('status', e.target.value)} style={inputStyle}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </Field>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Detalhe / Edição ───────────────────────────────────────────────────────

type TaskRow = {
  id: string
  nome: string
  tipo: TipoTask
  evento_id: string | null
  evento: { nome: string } | null
  responsavel_id: string | null
  data_fim: string | null
  prioridade: PrioridadeTask
  status: StatusTask
}

export function TaskDetalhe({ task, eventos, membros }: { task: TaskRow; eventos: Evento[]; membros: Membro[] }) {
  const router = useRouter()
  const meta = TIPO_META[task.tipo]
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: task.nome,
    evento_id: task.evento_id ?? '',
    responsavel_id: task.responsavel_id ?? '',
    data_fim: task.data_fim ?? '',
    prioridade: task.prioridade,
    status: task.status,
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
    const { error } = await supabase.from('task_projeto').update({
      nome: form.nome.trim(),
      evento_id: form.evento_id || null,
      responsavel_id: form.responsavel_id || null,
      data_fim: form.data_fim || null,
      prioridade: form.prioridade,
      status: form.status,
    }).eq('id', task.id)

    if (error) { setErro(error.message); setSalvando(false); return }
    setSalvando(false)
    setEditando(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirm('Excluir esta task?')) return
    setExcluindo(true)
    const supabase = createClient()
    await supabase.from('task_projeto').delete().eq('id', task.id)
    router.push(`/entregas/projetos/${meta.slug}`)
    router.refresh()
  }

  const membro = membros.find((m) => m.id === task.responsavel_id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
        breadcrumb={<><Link href={`/entregas/projetos/${meta.slug}`} style={linkStyle}>{meta.label}</Link><span>/</span><span style={{ fontWeight: 600, color: 'var(--fe-text)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.nome}</span></>}
        actions={
          !editando ? (
            <>
              <button onClick={handleExcluir} disabled={excluindo} style={{ height: 28, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, color: '#DC2626', cursor: 'pointer' }}>
                {excluindo ? 'Excluindo…' : 'Excluir'}
              </button>
              <button onClick={() => setEditando(true)} style={{ height: 28, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: 'var(--fe-accent-dark)', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                Editar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditando(false); setErro(null) }} style={{ height: 28, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, color: 'var(--fe-text-soft)', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button form="form-editar-task" type="submit" disabled={salvando} style={submitBtnStyle(salvando)}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          )
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
        {!editando ? (
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: '-0.025em', color: 'var(--fe-text-strong)', margin: '0 0 10px' }}>{task.nome}</h1>
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge label={STATUS_LABEL[task.status]} style={STATUS_STYLE[task.status]} />
                <Badge label={PRIORIDADE_LABEL[task.prioridade]} style={PRIORIDADE_STYLE[task.prioridade]} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoItem label="Evento" value={task.evento?.nome} />
              <InfoItem label="Responsável" value={membro?.nome} />
              <InfoItem label="Data final" value={task.data_fim ? new Date(task.data_fim + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : null} />
            </div>
          </div>
        ) : (
          <form id="form-editar-task" onSubmit={handleSalvar} style={formStyle}>
            {erro && <ErroBanner msg={erro} />}
            <Field label="Nome da task" required>
              <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} style={inputStyle} autoFocus />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Evento">
                <select value={form.evento_id} onChange={(e) => set('evento_id', e.target.value)} style={inputStyle}>
                  <option value="">Sem evento</option>
                  {eventos.map((ev) => <option key={ev.id} value={ev.id}>{ev.nome}</option>)}
                </select>
              </Field>
              <Field label="Responsável">
                <select value={form.responsavel_id} onChange={(e) => set('responsavel_id', e.target.value)} style={inputStyle}>
                  <option value="">Sem responsável</option>
                  {membros.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Field label="Data final">
                <input type="date" value={form.data_fim} onChange={(e) => set('data_fim', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Prioridade">
                <select value={form.prioridade} onChange={(e) => set('prioridade', e.target.value)} style={inputStyle}>
                  {PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDADE_LABEL[p]}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => set('status', e.target.value)} style={inputStyle}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </Field>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Primitivos ─────────────────────────────────────────────────────────────

function TopBar({ breadcrumb, actions }: { breadcrumb: React.ReactNode; actions: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 20px', borderBottom: '1px solid var(--fe-border-soft)', background: 'var(--fe-surface)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fe-text-muted)' }}>{breadcrumb}</div>
      <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
    </div>
  )
}

function Badge({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 10px', borderRadius: 'var(--fe-radius-pill)', background: style.bg, color: style.color, fontSize: 12, fontWeight: 600 }}>
      {label}
    </span>
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

function ErroBanner({ msg }: { msg: string }) {
  return <div style={{ padding: '10px 14px', borderRadius: 'var(--fe-radius-md)', background: 'rgba(239,68,68,0.08)', color: '#DC2626', fontSize: 13 }}>{msg}</div>
}

const linkStyle: React.CSSProperties = { color: 'var(--fe-text-muted)', textDecoration: 'none' }

const cancelBtnStyle: React.CSSProperties = { height: 28, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, fontWeight: 500, color: 'var(--fe-text-soft)', textDecoration: 'none', display: 'flex', alignItems: 'center' }

const submitBtnStyle = (disabled: boolean): React.CSSProperties => ({
  height: 28, padding: '0 14px', borderRadius: 'var(--fe-radius-md)',
  background: disabled ? 'var(--fe-border)' : 'var(--fe-accent)',
  color: disabled ? 'var(--fe-text-muted)' : 'var(--fe-accent-dark)',
  border: 'none', fontSize: 12.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
})

const formStyle: React.CSSProperties = { maxWidth: 600, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }

const inputStyle: React.CSSProperties = { width: '100%', height: 36, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 13.5, color: 'var(--fe-text)', outline: 'none' }
