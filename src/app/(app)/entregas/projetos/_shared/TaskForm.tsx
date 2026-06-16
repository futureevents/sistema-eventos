'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  type TipoTask, type PrioridadeTask, type StatusTask, type Membro, type EventoOpcao, type TaskProjeto, type EventoRef,
  TIPO_META, PRIORIDADE_LABEL, STATUS_LABEL,
} from './types'
import { Avatar, PriorityFlag, dataLonga, estadoPrazo } from './ui'
import { Dropdown, StatusPillSelect, CalendarPopover, EventoSelect, ResponsavelSelect, PrioridadeSelect } from './inline'
import { RichTextEditor } from './RichText'

type EventoSimples = { id: string; nome: string }

const PRIORIDADES: PrioridadeTask[] = ['baixa', 'media', 'alta', 'urgente']
const STATUSES: StatusTask[] = ['a_fazer', 'em_andamento', 'concluida', 'cancelada']
const ENTREGAS_COLOR = '#00C47A'

function eventoRef(eventos: EventoOpcao[], id: string | null): EventoRef {
  const op = id ? eventos.find((e) => e.id === id) : undefined
  if (!op) return null
  return { nome: op.nome, cliente_id: op.cliente_id, cliente: op.cliente_nome ? { nome: op.cliente_nome } : null }
}

// ─── Nova Task ──────────────────────────────────────────────────────────────

export function NovaTaskForm({ tipo, eventos, membros }: { tipo: TipoTask; eventos: EventoSimples[]; membros: Membro[] }) {
  const router = useRouter()
  const meta = TIPO_META[tipo]
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '', evento_id: '', responsavel_id: '', data_fim: '',
    prioridade: 'media' as PrioridadeTask, status: 'a_fazer' as StatusTask, descricao: '',
  })

  function set(field: string, value: string) { setForm((prev) => ({ ...prev, [field]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('O nome da tarefa é obrigatório.'); return }
    setSalvando(true); setErro(null)
    const supabase = createClient()
    const { data, error } = await supabase.from('task_projeto').insert({
      nome: form.nome.trim(), tipo,
      evento_id: form.evento_id || null, responsavel_id: form.responsavel_id || null,
      data_fim: form.data_fim || null, prioridade: form.prioridade, status: form.status,
      descricao: form.descricao || null,
    }).select('id').single()
    if (error) { setErro(error.message); setSalvando(false); return }
    router.push(`/entregas/projetos/${meta.slug}/${data.id}`)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
        breadcrumb={<><Link href={`/entregas/projetos/${meta.slug}`} style={linkStyle}>{meta.label}</Link><Sep /><span style={{ fontWeight: 600, color: 'var(--fe-text-strong)' }}>Nova tarefa</span></>}
        actions={<>
          <Link href={`/entregas/projetos/${meta.slug}`} style={cancelBtnStyle}>Cancelar</Link>
          <button form="form-task" type="submit" disabled={salvando} style={submitBtnStyle(salvando)}>{salvando ? 'Salvando…' : 'Criar tarefa'}</button>
        </>}
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
          <Field label="Descrição">
            <RichTextEditor value="" onChange={(html) => set('descricao', html)} />
          </Field>
        </form>
      </div>
    </div>
  )
}

// ─── Detalhe (página cheia, edição inline + auto-save) ──────────────────────

type TaskRow = TaskProjeto

export function TaskDetalhe({ task, eventos, membros }: { task: TaskRow; eventos: EventoOpcao[]; membros: Membro[] }) {
  const router = useRouter()
  const meta = TIPO_META[task.tipo]
  const supabase = useMemo(() => createClient(), [])
  const [t, setT] = useState<TaskRow>(task)
  const [salvando, setSalvando] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [excluindo, setExcluindo] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function marcarSalvo() {
    setSalvando('saved')
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSalvando('idle'), 1600)
  }

  async function patch(p: Partial<TaskRow>) {
    setT((prev) => ({ ...prev, ...p }))
    setSalvando('saving')
    const db: Record<string, unknown> = {}
    for (const k of ['nome', 'evento_id', 'responsavel_id', 'data_fim', 'prioridade', 'status', 'descricao'] as const) {
      if (k in p) db[k] = (p as Record<string, unknown>)[k]
    }
    const { error } = await supabase.from('task_projeto').update(db).eq('id', t.id)
    if (error) { setSalvando('idle'); return }
    marcarSalvo()
  }

  function patchEvento(id: string | null) { patch({ evento_id: id, evento: eventoRef(eventos, id) }) }

  // Título com auto-save (debounce)
  const [nome, setNome] = useState(task.nome)
  const nomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function onNome(v: string) {
    setNome(v)
    if (nomeTimer.current) clearTimeout(nomeTimer.current)
    nomeTimer.current = setTimeout(() => { if (v.trim() && v !== t.nome) patch({ nome: v.trim() }) }, 600)
  }

  // Descrição com auto-save (debounce)
  const descTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function onDescricao(html: string) {
    if (descTimer.current) clearTimeout(descTimer.current)
    descTimer.current = setTimeout(() => patch({ descricao: html }), 600)
  }

  async function handleExcluir() {
    if (!confirm('Excluir esta tarefa?')) return
    setExcluindo(true)
    await supabase.from('task_projeto').delete().eq('id', t.id)
    router.push(`/entregas/projetos/${meta.slug}`)
    router.refresh()
  }

  const membro = membros.find((m) => m.id === t.responsavel_id) ?? null
  const concluida = t.status === 'concluida'
  const prazo = estadoPrazo(t.data_fim, t.status)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'var(--fe-warm-white)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 50, padding: '0 16px 0 22px', borderBottom: '1px solid var(--fe-border-soft)', background: 'var(--fe-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fe-text-muted)', minWidth: 0 }}>
          <span style={{ width: 19, height: 19, borderRadius: 5, background: ENTREGAS_COLOR, color: '#003D26', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>E</span>
          <span>Entregas</span><Sep /><Link href={`/entregas/projetos/${meta.slug}`} style={linkStyle}>{meta.label}</Link><Sep />
          <span style={{ fontWeight: 600, color: 'var(--fe-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nome}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SaveIndicator estado={salvando} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <button onClick={() => patch({ status: concluida ? 'a_fazer' : 'concluida' })} style={{ height: 34, padding: '0 14px', borderRadius: 'var(--fe-radius-md)', border: `1px solid ${concluida ? 'var(--fe-accent)' : 'var(--fe-border)'}`, background: concluida ? 'var(--fe-accent-dim)' : 'transparent', color: concluida ? 'var(--fe-status-done-text)' : 'var(--fe-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M3 7.2L5.8 9.8L11 4" stroke={concluida ? 'var(--fe-accent)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {concluida ? 'Reabrir' : 'Marcar concluída'}
              </button>
              <StatusPillSelect status={t.status} onChange={(s) => patch({ status: s })} />
            </div>

            <textarea
              value={nome} onChange={(e) => onNome(e.target.value)} rows={1}
              onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }}
              style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.14, letterSpacing: '-0.03em', color: 'var(--fe-text-strong)', margin: '0 0 24px', padding: 0, overflow: 'hidden' }}
            />

            <RichTextEditor key={t.id} value={t.descricao} onChange={onDescricao} minHeight={200} />

            <div style={{ marginTop: 20 }}>
              <button type="button" onClick={handleExcluir} disabled={excluindo} style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fe-prio-urgent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5H11.5M5 3.5V2.5C5 2.2 5.2 2 5.5 2H8.5C8.8 2 9 2.2 9 2.5V3.5M3.5 3.5L4 11.5C4 11.8 4.2 12 4.5 12H9.5C9.8 12 10 11.8 10 11.5L10.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {excluindo ? 'Excluindo…' : 'Excluir tarefa'}
              </button>
            </div>
          </div>

          {/* Card de detalhes (inline editável) */}
          <aside style={{ position: 'sticky', top: 0, background: 'var(--fe-surface)', border: '1px solid var(--fe-border-soft)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--fe-divider)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Detalhes</span>
            </div>
            <div style={{ padding: '4px 18px 14px' }}>
              <DetRow label="Responsável">
                <ResponsavelSelect membros={membros} value={t.responsavel_id} onChange={(id) => patch({ responsavel_id: id })}>
                  {({ toggle }) => (
                    <button onClick={toggle} style={detBtn}>
                      {membro ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Avatar nome={membro.nome} id={membro.id} size={22} /><span style={{ fontSize: 13, color: 'var(--fe-text)' }}>{membro.nome}</span></span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Avatar nome={null} id={null} size={22} /><span style={{ fontSize: 13, color: 'var(--fe-text-faint)' }}>Sem responsável</span></span>}
                    </button>
                  )}
                </ResponsavelSelect>
              </DetRow>
              <DetRow label="Status">
                <StatusPillSelect status={t.status} onChange={(s) => patch({ status: s })} />
              </DetRow>
              <DetRow label="Prazo">
                <Dropdown align="left" width={252}
                  trigger={({ toggle }) => (
                    <button onClick={toggle} style={detBtn}>
                      {prazo ? <span style={{ fontSize: 13, color: prazo.cor, fontWeight: prazo.bold ? 600 : 400 }}>{prazo.texto}</span> : <Dash />}
                    </button>
                  )}>
                  {(close) => <CalendarPopover value={t.data_fim} onChange={(iso) => patch({ data_fim: iso })} onClose={close} />}
                </Dropdown>
              </DetRow>
              <DetRow label="Prioridade">
                <PrioridadeSelect value={t.prioridade} onChange={(p) => patch({ prioridade: p })}>
                  {({ toggle }) => <button onClick={toggle} style={detBtn}><PriorityFlag prioridade={t.prioridade} label /></button>}
                </PrioridadeSelect>
              </DetRow>
              <DetRow label="Evento">
                <EventoSelect eventos={eventos} value={t.evento_id} onChange={patchEvento}>
                  {({ toggle }) => (
                    <button onClick={toggle} style={detBtn}>
                      <span style={{ fontSize: 13, color: t.evento?.nome ? 'var(--fe-text)' : 'var(--fe-text-faint)' }}>{t.evento?.nome ?? 'Sem evento'}</span>
                    </button>
                  )}
                </EventoSelect>
              </DetRow>
              <DetRow label="Lista" last>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fe-text)' }}>
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.7 }}><path d="M2 3.5H10M2 6H10M2 8.5H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                  {meta.label}
                </span>
              </DetRow>
            </div>
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--fe-divider)' }}>
              <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)' }}>Criada em {dataLonga(t.criado_em.slice(0, 10))}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

// ─── Primitivos ─────────────────────────────────────────────────────────────

function SaveIndicator({ estado }: { estado: 'idle' | 'saving' | 'saved' }) {
  if (estado === 'idle') return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--fe-text-muted)', whiteSpace: 'nowrap' }}>
      {estado === 'saving' ? (
        <><svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ animation: 'feSpin 0.7s linear infinite' }}><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.25" /><path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>Salvando…</>
      ) : (
        <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="var(--fe-accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>Salvo</>
      )}
    </span>
  )
}

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
    <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', alignItems: 'center', minHeight: 40, borderBottom: last ? 'none' : '1px solid var(--fe-divider)' }}>
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
const submitBtnStyle = (disabled: boolean): React.CSSProperties => ({ height: 32, padding: '0 16px', borderRadius: 'var(--fe-radius-md)', background: disabled ? 'var(--fe-border)' : 'var(--fe-accent)', color: disabled ? 'var(--fe-text-muted)' : 'var(--fe-accent-dark)', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer' })
const formStyle: React.CSSProperties = { maxWidth: 600, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }
const inputStyle: React.CSSProperties = { width: '100%', height: 36, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 13.5, color: 'var(--fe-text)', outline: 'none' }
const detBtn: React.CSSProperties = { border: 'none', background: 'transparent', padding: '4px 6px', margin: '0 -6px', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', textAlign: 'left', width: '100%' }
