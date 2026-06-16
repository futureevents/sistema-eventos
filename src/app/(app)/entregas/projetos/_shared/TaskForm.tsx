'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  type TipoTask, type PrioridadeTask, type StatusTask, type Membro,
  TIPO_META, PRIORIDADE_LABEL, STATUS_LABEL, STATUS_ORDER,
} from './types'
import { Avatar, StatusPill, PriorityFlag, dataLonga, estadoPrazo } from './ui'

type Evento = { id: string; nome: string }

const PRIORIDADES: PrioridadeTask[] = ['baixa', 'media', 'alta', 'urgente']
const STATUSES: StatusTask[] = ['a_fazer', 'em_andamento', 'concluida', 'cancelada']
const ENTREGAS_COLOR = '#00C47A'

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
    if (!form.nome.trim()) { setErro('O nome da tarefa é obrigatório.'); return }
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
        breadcrumb={<><Link href={`/entregas/projetos/${meta.slug}`} style={linkStyle}>{meta.label}</Link><Sep /><span style={{ fontWeight: 600, color: 'var(--fe-text-strong)' }}>Nova tarefa</span></>}
        actions={
          <>
            <Link href={`/entregas/projetos/${meta.slug}`} style={cancelBtnStyle}>Cancelar</Link>
            <button form="form-task" type="submit" disabled={salvando} style={submitBtnStyle(salvando)}>
              {salvando ? 'Salvando…' : 'Criar tarefa'}
            </button>
          </>
        }
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
        <form id="form-task" onSubmit={handleSubmit} style={formStyle}>
          {erro && <ErroBanner msg={erro} />}
          <Field label="Nome da tarefa" required>
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
            <Field label="Prazo">
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

// ─── Detalhe / Edição (página cheia) ────────────────────────────────────────

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
  criado_em: string
}

export function TaskDetalhe({ task, eventos, membros }: { task: TaskRow; eventos: Evento[]; membros: Membro[] }) {
  const router = useRouter()
  const meta = TIPO_META[task.tipo]
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [statusAberto, setStatusAberto] = useState(false)
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

  async function mudarStatus(novo: StatusTask) {
    setStatusAberto(false)
    if (novo === task.status) return
    const supabase = createClient()
    await supabase.from('task_projeto').update({ status: novo }).eq('id', task.id)
    router.refresh()
  }

  async function marcarConcluida() {
    const supabase = createClient()
    await supabase.from('task_projeto').update({ status: task.status === 'concluida' ? 'a_fazer' : 'concluida' }).eq('id', task.id)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirm('Excluir esta tarefa?')) return
    setExcluindo(true)
    const supabase = createClient()
    await supabase.from('task_projeto').delete().eq('id', task.id)
    router.push(`/entregas/projetos/${meta.slug}`)
    router.refresh()
  }

  const membro = membros.find((m) => m.id === task.responsavel_id) ?? null
  const concluida = task.status === 'concluida'
  const prazo = estadoPrazo(task.data_fim, task.status)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'var(--fe-warm-white)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 50, padding: '0 16px 0 22px', borderBottom: '1px solid var(--fe-border-soft)', background: 'var(--fe-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fe-text-muted)', minWidth: 0 }}>
          <span style={{ width: 19, height: 19, borderRadius: 5, background: ENTREGAS_COLOR, color: '#003D26', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>E</span>
          <span>Entregas</span><Sep /><Link href={`/entregas/projetos/${meta.slug}`} style={linkStyle}>{meta.label}</Link><Sep />
          <span style={{ fontWeight: 600, color: 'var(--fe-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.nome}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!editando ? (
            <button onClick={() => setEditando(true)} style={ghostBtnStyle}>Editar</button>
          ) : (
            <>
              <button onClick={() => { setEditando(false); setErro(null) }} style={ghostBtnStyle}>Cancelar</button>
              <button form="form-editar-task" type="submit" disabled={salvando} style={submitBtnStyle(salvando)}>{salvando ? 'Salvando…' : 'Salvar'}</button>
            </>
          )}
          <Link href={`/entregas/projetos/${meta.slug}`} style={{ ...ghostBtnStyle, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5.5 2H2V5.5M2 2L6 6M8.5 12H12V8.5M12 12L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Recolher
          </Link>
          <Link href={`/entregas/projetos/${meta.slug}`} title="Fechar" style={{ width: 32, height: 32, borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          </Link>
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 32px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 332px', gap: 36, alignItems: 'start' }}>
          {/* Coluna principal */}
          <div style={{ minWidth: 0 }}>
            {!editando ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <button onClick={marcarConcluida} style={{ height: 34, padding: '0 14px', borderRadius: 'var(--fe-radius-md)', border: `1px solid ${concluida ? 'var(--fe-accent)' : 'var(--fe-border)'}`, background: concluida ? 'var(--fe-accent-dim)' : 'transparent', color: concluida ? 'var(--fe-status-done-text)' : 'var(--fe-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M3 7.2L5.8 9.8L11 4" stroke={concluida ? 'var(--fe-accent)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {concluida ? 'Reabrir' : 'Marcar concluída'}
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setStatusAberto((v) => !v)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
                      <StatusPill status={task.status} chevron />
                    </button>
                    {statusAberto && (
                      <div style={{ position: 'absolute', top: 32, left: 0, zIndex: 5, minWidth: 180, background: 'var(--fe-surface)', border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-pop)', padding: 5 }}>
                        {STATUS_ORDER.map((s) => (
                          <button key={s} onClick={() => mudarStatus(s)} style={{ display: 'flex', width: '100%', padding: '7px 8px', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                            <StatusPill status={s} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.14, letterSpacing: '-0.03em', color: 'var(--fe-text-strong)', margin: '0 0 24px' }}>
                  {task.nome}
                </h1>

                <div style={{ border: '1px dashed var(--fe-border)', borderRadius: 'var(--fe-radius-lg)', padding: '22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--fe-text-muted)', margin: 0 }}>Esta tarefa ainda não tem descrição.</p>
                  <button onClick={() => setEditando(true)} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-soft)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Editar tarefa</button>
                </div>
              </>
            ) : (
              <form id="form-editar-task" onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {erro && <ErroBanner msg={erro} />}
                <Field label="Nome da tarefa" required>
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
                  <Field label="Prazo">
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
                <div style={{ marginTop: 4 }}>
                  <button type="button" onClick={handleExcluir} disabled={excluindo} style={{ fontSize: 12.5, fontWeight: 500, color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {excluindo ? 'Excluindo…' : 'Excluir tarefa'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card de detalhes */}
          <aside style={{ position: 'sticky', top: 0, background: 'var(--fe-surface)', border: '1px solid var(--fe-border-soft)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--fe-divider)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Detalhes</span>
            </div>
            <div style={{ padding: '4px 18px 14px' }}>
              <DetRow label="Responsável">
                {membro ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Avatar nome={membro.nome} id={membro.id} size={22} /><span style={{ fontSize: 13, color: 'var(--fe-text)' }}>{membro.nome}</span></span>
                  : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Avatar nome={null} id={null} size={22} /><span style={{ fontSize: 13, color: 'var(--fe-text-faint)' }}>Sem responsável</span></span>}
              </DetRow>
              <DetRow label="Status"><StatusPill status={task.status} /></DetRow>
              <DetRow label="Prazo">
                {prazo ? <span style={{ fontSize: 13, color: prazo.cor, fontWeight: prazo.bold ? 600 : 400 }}>{prazo.texto}</span> : <Dash />}
              </DetRow>
              <DetRow label="Prioridade"><PriorityFlag prioridade={task.prioridade} label /></DetRow>
              <DetRow label="Evento">
                <span style={{ fontSize: 13, color: task.evento?.nome ? 'var(--fe-text)' : 'var(--fe-text-faint)' }}>{task.evento?.nome ?? 'Sem evento'}</span>
              </DetRow>
              <DetRow label="Lista" last>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fe-text)' }}>
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.7 }}><path d="M2 3.5H10M2 6H10M2 8.5H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                  {meta.label}
                </span>
              </DetRow>
            </div>
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--fe-divider)' }}>
              <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)' }}>Criada em {dataLonga(task.criado_em.slice(0, 10))}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

// ─── Primitivos ─────────────────────────────────────────────────────────────

function TopBar({ breadcrumb, actions }: { breadcrumb: React.ReactNode; actions: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 46, padding: '0 18px', borderBottom: '1px solid var(--fe-border-soft)', background: 'var(--fe-surface)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--fe-text-muted)' }}>{breadcrumb}</div>
      <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
    </div>
  )
}

function Sep() { return <span style={{ color: 'var(--fe-text-faint)' }}>/</span> }
function Dash() { return <span style={{ color: 'var(--fe-text-faint)', fontSize: 13 }}>—</span> }

function DetRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', alignItems: 'center', minHeight: 40, borderTop: last ? undefined : undefined, borderBottom: last ? 'none' : '1px solid var(--fe-divider)' }}>
      <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)' }}>{label}</span>
      <span>{children}</span>
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

const ghostBtnStyle: React.CSSProperties = { height: 32, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, fontWeight: 500, color: 'var(--fe-text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }

const cancelBtnStyle: React.CSSProperties = { height: 32, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, fontWeight: 500, color: 'var(--fe-text-soft)', textDecoration: 'none', display: 'flex', alignItems: 'center' }

const submitBtnStyle = (disabled: boolean): React.CSSProperties => ({
  height: 32, padding: '0 16px', borderRadius: 'var(--fe-radius-md)',
  background: disabled ? 'var(--fe-border)' : 'var(--fe-accent)',
  color: disabled ? 'var(--fe-text-muted)' : 'var(--fe-accent-dark)',
  border: 'none', fontSize: 12.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
})

const formStyle: React.CSSProperties = { maxWidth: 600, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }

const inputStyle: React.CSSProperties = { width: '100%', height: 36, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 13.5, color: 'var(--fe-text)', outline: 'none' }
