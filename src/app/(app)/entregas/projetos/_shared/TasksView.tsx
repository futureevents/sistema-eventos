'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  type TaskProjeto, type TipoTask, type Membro, type StatusTask, type PrioridadeTask,
  type EventoOpcao, type ClienteOpcao, type CampoGrupo, type EventoRef,
  TIPO_META, STATUS_ORDER, STATUS_LABEL, PRIORIDADE_ORDER, PRIORIDADE_LABEL, GRUPO_LABEL, GRUPO_ORDER,
} from './types'
import { Avatar, StatusPill, PriorityFlag, PrazoText, estadoPrazo } from './ui'
import {
  Dropdown, StatusDotSelect, StatusPillSelect, CalendarPopover,
  EventoSelect, ResponsavelSelect, PrioridadeSelect, RowMenu, parseISO,
} from './inline'
import { RichTextEditor } from './RichText'

const GRID = 'minmax(0,1fr) 168px 120px 152px 122px 30px'
const ENTREGAS_COLOR = '#00C47A'

type Filtros = {
  status: StatusTask[]
  prioridade: PrioridadeTask[]
  evento_id: string | null
  cliente_id: string | null
  dataDe: string | null
  dataAte: string | null
}

const FILTROS_VAZIOS: Filtros = { status: [], prioridade: [], evento_id: null, cliente_id: null, dataDe: null, dataAte: null }

function eventoRefFromOpcao(op: EventoOpcao | undefined): EventoRef {
  if (!op) return null
  return { nome: op.nome, cliente_id: op.cliente_id, cliente: op.cliente_nome ? { nome: op.cliente_nome } : null }
}

export function TasksView({
  tasks: tasksProp, tipo, membros, eventos, clientes,
}: {
  tasks: TaskProjeto[]; tipo: TipoTask; membros: Membro[]
  eventos: EventoOpcao[]; clientes: ClienteOpcao[]
}) {
  const meta = TIPO_META[tipo]
  const supabase = useMemo(() => createClient(), [])
  const [tasks, setTasks] = useState<TaskProjeto[]>(tasksProp)
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [agruparPor, setAgruparPor] = useState<CampoGrupo>('status')
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS)
  const [salvando, setSalvando] = useState<'idle' | 'saving' | 'saved'>('idle')
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const membroPorId = useMemo(() => new Map(membros.map((m) => [m.id, m])), [membros])
  const eventoPorId = useMemo(() => new Map(eventos.map((e) => [e.id, e])), [eventos])

  function marcarSalvo() {
    setSalvando('saved')
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSalvando('idle'), 1600)
  }

  async function patchTask(id: string, patch: Partial<TaskProjeto>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    setSalvando('saving')
    // monta payload do banco (apenas colunas reais)
    const db: Record<string, unknown> = {}
    for (const k of ['nome', 'evento_id', 'responsavel_id', 'data_fim', 'prioridade', 'status', 'descricao'] as const) {
      if (k in patch) db[k] = (patch as Record<string, unknown>)[k]
    }
    const { error } = await supabase.from('task_projeto').update(db).eq('id', id)
    if (error) { setSalvando('idle'); return }
    marcarSalvo()
  }

  // patch de evento que também atualiza o objeto evento aninhado (nome/cliente p/ exibição e grupos)
  function patchEvento(id: string, evento_id: string | null) {
    patchTask(id, { evento_id, evento: eventoRefFromOpcao(evento_id ? eventoPorId.get(evento_id) : undefined) })
  }

  async function excluirTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    if (selecionada === id) setSelecionada(null)
    setSalvando('saving')
    const { error } = await supabase.from('task_projeto').delete().eq('id', id)
    if (error) { setSalvando('idle'); return }
    marcarSalvo()
  }

  const filtradas = useMemo(() => aplicarFiltros(tasks, busca, filtros), [tasks, busca, filtros])
  const grupos = useMemo(() => agrupar(filtradas, agruparPor, eventos, clientes, membros), [filtradas, agruparPor, eventos, clientes, membros])
  const filtrosAtivos = contarFiltros(filtros)

  const taskAberta = selecionada ? tasks.find((t) => t.id === selecionada) ?? null : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--fe-surface)' }}>
      <Breadcrumb meta={meta} membros={membros} />
      <TabsToolbar
        meta={meta} busca={busca} onBusca={setBusca}
        agruparPor={agruparPor} onAgrupar={setAgruparPor}
        filtros={filtros} onFiltros={setFiltros} filtrosAtivos={filtrosAtivos}
        eventos={eventos} clientes={clientes} salvando={salvando}
      />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tasks.length === 0 ? (
          <EstadoVazio meta={meta} />
        ) : (
          <>
            <ColunasHeader />
            {grupos.map((g) => (
              <Grupo
                key={g.key}
                grupo={g}
                meta={meta}
                membroPorId={membroPorId}
                eventos={eventos}
                membros={membros}
                onAbrir={setSelecionada}
                patchTask={patchTask}
                patchEvento={patchEvento}
                excluirTask={excluirTask}
              />
            ))}
            {grupos.every((g) => g.itens.length === 0) && (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: 'var(--fe-text-muted)' }}>
                Nenhuma tarefa corresponde aos filtros.
              </div>
            )}
            <div style={{ height: 40 }} />
          </>
        )}
      </div>

      {taskAberta && (
        <SlideOver
          key={taskAberta.id}
          task={taskAberta}
          meta={meta}
          membros={membros}
          eventos={eventos}
          membroPorId={membroPorId}
          patchTask={patchTask}
          patchEvento={patchEvento}
          excluirTask={excluirTask}
          onFechar={() => setSelecionada(null)}
        />
      )}
    </div>
  )
}

// ─── Filtros + agrupamento (lógica) ────────────────────────────────────────────

function aplicarFiltros(tasks: TaskProjeto[], busca: string, f: Filtros): TaskProjeto[] {
  const q = busca.trim().toLowerCase()
  return tasks.filter((t) => {
    if (q && !t.nome.toLowerCase().includes(q)) return false
    if (f.status.length && !f.status.includes(t.status)) return false
    if (f.prioridade.length && !f.prioridade.includes(t.prioridade)) return false
    if (f.evento_id && t.evento_id !== f.evento_id) return false
    if (f.cliente_id && t.evento?.cliente_id !== f.cliente_id) return false
    if (f.dataDe && (!t.data_fim || t.data_fim < f.dataDe)) return false
    if (f.dataAte && (!t.data_fim || t.data_fim > f.dataAte)) return false
    return true
  })
}

function contarFiltros(f: Filtros): number {
  let n = 0
  if (f.status.length) n++
  if (f.prioridade.length) n++
  if (f.evento_id) n++
  if (f.cliente_id) n++
  if (f.dataDe || f.dataAte) n++
  return n
}

type GrupoView = { key: string; header: React.ReactNode; itens: TaskProjeto[] }

function prazoBucket(iso: string | null): { ordem: number; key: string; label: string } {
  if (!iso) return { ordem: 5, key: 'sem', label: 'Sem prazo' }
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const alvo = parseISO(iso)
  const dias = Math.round((alvo.getTime() - hoje.getTime()) / 86400000)
  if (dias < 0) return { ordem: 0, key: 'atrasada', label: 'Atrasadas' }
  if (dias === 0) return { ordem: 1, key: 'hoje', label: 'Hoje' }
  if (dias <= 7) return { ordem: 2, key: 'semana', label: 'Próximos 7 dias' }
  if (dias <= 30) return { ordem: 3, key: 'mes', label: 'Próximos 30 dias' }
  return { ordem: 4, key: 'depois', label: 'Mais tarde' }
}

function chipHeader(label: string, count: number, extra?: React.ReactNode): React.ReactNode {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {extra}
      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fe-text-strong)' }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--fe-text-muted)' }}>{count}</span>
    </span>
  )
}

function agrupar(
  tasks: TaskProjeto[], campo: CampoGrupo,
  eventos: EventoOpcao[], clientes: ClienteOpcao[], membros: Membro[],
): GrupoView[] {
  if (campo === 'status') {
    return STATUS_ORDER.map((s) => {
      const itens = tasks.filter((t) => t.status === s)
      return { key: s, itens, header: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><StatusPill status={s} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--fe-text-muted)' }}>{itens.length}</span></span> }
    }).filter((g) => g.itens.length > 0 || ['a_fazer', 'em_andamento', 'concluida'].includes(g.key))
  }
  if (campo === 'prioridade') {
    return PRIORIDADE_ORDER.map((p) => {
      const itens = tasks.filter((t) => t.prioridade === p)
      return { key: p, itens, header: chipHeader(PRIORIDADE_LABEL[p], itens.length, <PriorityFlag prioridade={p} />) }
    }).filter((g) => g.itens.length > 0)
  }
  if (campo === 'evento') {
    const grupos: GrupoView[] = []
    for (const ev of eventos) {
      const itens = tasks.filter((t) => t.evento_id === ev.id)
      if (itens.length) grupos.push({ key: ev.id, itens, header: chipHeader(ev.nome, itens.length) })
    }
    const sem = tasks.filter((t) => !t.evento_id)
    if (sem.length) grupos.push({ key: 'sem', itens: sem, header: chipHeader('Sem evento', sem.length) })
    return grupos
  }
  if (campo === 'cliente') {
    const grupos: GrupoView[] = []
    for (const c of clientes) {
      const itens = tasks.filter((t) => t.evento?.cliente_id === c.id)
      if (itens.length) grupos.push({ key: c.id, itens, header: chipHeader(c.nome, itens.length) })
    }
    const sem = tasks.filter((t) => !t.evento?.cliente_id)
    if (sem.length) grupos.push({ key: 'sem', itens: sem, header: chipHeader('Sem cliente', sem.length) })
    return grupos
  }
  if (campo === 'responsavel') {
    const grupos: GrupoView[] = []
    for (const m of membros) {
      const itens = tasks.filter((t) => t.responsavel_id === m.id)
      if (itens.length) grupos.push({ key: m.id, itens, header: chipHeader(m.nome, itens.length, <Avatar nome={m.nome} id={m.id} size={20} />) })
    }
    const sem = tasks.filter((t) => !t.responsavel_id)
    if (sem.length) grupos.push({ key: 'sem', itens: sem, header: chipHeader('Sem responsável', sem.length, <Avatar nome={null} id={null} size={20} />) })
    return grupos
  }
  // prazo
  const buckets = new Map<string, { ordem: number; label: string; itens: TaskProjeto[] }>()
  for (const t of tasks) {
    const b = prazoBucket(t.data_fim)
    if (!buckets.has(b.key)) buckets.set(b.key, { ordem: b.ordem, label: b.label, itens: [] })
    buckets.get(b.key)!.itens.push(t)
  }
  return [...buckets.entries()].sort((a, b) => a[1].ordem - b[1].ordem)
    .map(([key, v]) => ({ key, itens: v.itens, header: chipHeader(v.label, v.itens.length) }))
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ meta, membros }: { meta: { label: string }; membros: Membro[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 46, padding: '0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
        <span style={{ width: 19, height: 19, borderRadius: 5, background: ENTREGAS_COLOR, color: '#003D26', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>E</span>
        <span style={{ color: 'var(--fe-text-muted)' }}>Entregas</span>
        <Sep />
        <span style={{ color: 'var(--fe-text-muted)' }}>Projetos</span>
        <Sep />
        <span style={{ fontWeight: 600, color: 'var(--fe-text-strong)' }}>{meta.label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {membros.slice(0, 4).map((m, i) => (
            <span key={m.id} style={{ marginLeft: i === 0 ? 0 : -7, border: '2px solid var(--fe-surface)', borderRadius: '50%', display: 'inline-flex' }}>
              <Avatar nome={m.nome} id={m.id} size={24} />
            </span>
          ))}
          <button title="Convidar" style={{ marginLeft: membros.length ? -7 : 0, width: 24, height: 24, borderRadius: '50%', border: '1.4px dashed var(--fe-border)', background: 'var(--fe-surface)', color: 'var(--fe-text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, lineHeight: 1 }}>+</button>
        </div>
        <span style={{ width: 1, height: 18, background: 'var(--fe-border)' }} />
        <button style={{ height: 30, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, fontWeight: 500, color: 'var(--fe-text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 9V2.5M7 2.5L4.5 5M7 2.5L9.5 5M2.5 9V11C2.5 11.3 2.7 11.5 3 11.5H11C11.3 11.5 11.5 11.3 11.5 11V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Compartilhar
        </button>
      </div>
    </div>
  )
}

function Sep() {
  return <span style={{ color: 'var(--fe-text-faint)' }}>/</span>
}

// ─── Tabs + Toolbar ─────────────────────────────────────────────────────────────

const TABS = ['Lista', 'Quadro', 'Calendário', 'Cronograma'] as const

function TabsToolbar({
  meta, busca, onBusca, agruparPor, onAgrupar, filtros, onFiltros, filtrosAtivos, eventos, clientes, salvando,
}: {
  meta: { slug: string }; busca: string; onBusca: (v: string) => void
  agruparPor: CampoGrupo; onAgrupar: (c: CampoGrupo) => void
  filtros: Filtros; onFiltros: (f: Filtros) => void; filtrosAtivos: number
  eventos: EventoOpcao[]; clientes: ClienteOpcao[]; salvando: 'idle' | 'saving' | 'saved'
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 14px 0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
        {TABS.map((t, i) => {
          const ativa = i === 0
          return (
            <button key={t} title={ativa ? undefined : 'Em breve'}
              style={{ height: '100%', padding: '0 12px', border: 'none', background: 'transparent', borderBottom: ativa ? '2px solid var(--fe-black)' : '2px solid transparent', fontSize: 13, fontWeight: ativa ? 600 : 500, color: ativa ? 'var(--fe-black)' : 'var(--fe-text-muted)', cursor: ativa ? 'default' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <TabIcon nome={t} ativa={ativa} />
              {t}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <SaveIndicator estado={salvando} />
        <FiltrosBtn filtros={filtros} onFiltros={onFiltros} ativos={filtrosAtivos} eventos={eventos} clientes={clientes} />
        <AgruparBtn agruparPor={agruparPor} onAgrupar={onAgrupar} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', left: 9, opacity: 0.4, pointerEvents: 'none' }}><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" /><path d="M8 8L10.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          <input value={busca} onChange={(e) => onBusca(e.target.value)} placeholder="Buscar"
            style={{ height: 30, width: 150, padding: '0 10px 0 26px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 12.5, color: 'var(--fe-text)', outline: 'none' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--fe-accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--fe-border)')} />
        </div>
        <Link href={`/entregas/projetos/${meta.slug}/novo`}
          style={{ height: 30, padding: '0 14px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: 'var(--fe-accent-dark)', fontSize: 12.5, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          Adicionar tarefa
        </Link>
      </div>
    </div>
  )
}

function SaveIndicator({ estado }: { estado: 'idle' | 'saving' | 'saved' }) {
  if (estado === 'idle') return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--fe-text-muted)', marginRight: 2, whiteSpace: 'nowrap' }}>
      {estado === 'saving' ? (
        <><svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ animation: 'feSpin 0.7s linear infinite' }}><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.25" /><path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>Salvando…</>
      ) : (
        <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="var(--fe-accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>Salvo</>
      )}
    </span>
  )
}

function Ghost({ children, icon, onClick, badge }: { children: React.ReactNode; icon: React.ReactNode; onClick?: (e: React.MouseEvent) => void; badge?: number }) {
  return (
    <button onClick={onClick}
      style={{ height: 30, padding: '0 10px', borderRadius: 'var(--fe-radius-md)', border: 'none', background: badge ? 'var(--fe-accent-dim)' : 'transparent', color: badge ? 'var(--fe-accent-dark)' : 'var(--fe-text-soft)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
      onMouseEnter={(e) => { if (!badge) e.currentTarget.style.background = 'var(--fe-warm-white)' }}
      onMouseLeave={(e) => { if (!badge) e.currentTarget.style.background = 'transparent' }}>
      {icon}
      {children}
      {badge ? <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--fe-accent)', color: 'var(--fe-accent-dark)', fontSize: 10.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span> : null}
    </button>
  )
}

function AgruparBtn({ agruparPor, onAgrupar }: { agruparPor: CampoGrupo; onAgrupar: (c: CampoGrupo) => void }) {
  return (
    <Dropdown align="right" width={180} stopPropagation={false}
      trigger={({ toggle }) => (
        <Ghost onClick={toggle} icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="2" y="8" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="8" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2" /></svg>}>
          Agrupar: <span style={{ color: 'var(--fe-text)', fontWeight: 600, marginLeft: 3 }}>{GRUPO_LABEL[agruparPor]}</span>
        </Ghost>
      )}>
      {(close) => GRUPO_ORDER.map((c) => (
        <button key={c} onClick={() => { close(); onAgrupar(c) }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '7px 8px', border: 'none', background: c === agruparPor ? 'var(--fe-accent-dim)' : 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: 'var(--fe-text)' }}
          onMouseEnter={(e) => { if (c !== agruparPor) e.currentTarget.style.background = 'var(--fe-hover)' }}
          onMouseLeave={(e) => { if (c !== agruparPor) e.currentTarget.style.background = 'transparent' }}>
          {GRUPO_LABEL[c]}
          {c === agruparPor && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="var(--fe-accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
      ))}
    </Dropdown>
  )
}

function FiltrosBtn({ filtros, onFiltros, ativos, eventos, clientes }: { filtros: Filtros; onFiltros: (f: Filtros) => void; ativos: number; eventos: EventoOpcao[]; clientes: ClienteOpcao[] }) {
  function toggleStatus(s: StatusTask) {
    onFiltros({ ...filtros, status: filtros.status.includes(s) ? filtros.status.filter((x) => x !== s) : [...filtros.status, s] })
  }
  function togglePrio(p: PrioridadeTask) {
    onFiltros({ ...filtros, prioridade: filtros.prioridade.includes(p) ? filtros.prioridade.filter((x) => x !== p) : [...filtros.prioridade, p] })
  }
  const selStyle: React.CSSProperties = { width: '100%', height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 12.5, color: 'var(--fe-text)', outline: 'none' }
  const dateStyle: React.CSSProperties = { ...selStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }

  return (
    <Dropdown align="right" width={280} stopPropagation={false}
      trigger={({ toggle }) => (
        <Ghost onClick={toggle} badge={ativos} icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1.5 2.5H12.5L8.5 7.2V11L5.5 12.5V7.2L1.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>}>
          Filtros
        </Ghost>
      )}>
      {() => (
        <div style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FilterGroup label="Status">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {STATUS_ORDER.map((s) => (
                <Chip key={s} ativo={filtros.status.includes(s)} onClick={() => toggleStatus(s)}>{STATUS_LABEL[s]}</Chip>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup label="Prioridade">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {PRIORIDADE_ORDER.map((p) => (
                <Chip key={p} ativo={filtros.prioridade.includes(p)} onClick={() => togglePrio(p)}>{PRIORIDADE_LABEL[p]}</Chip>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup label="Evento">
            <select value={filtros.evento_id ?? ''} onChange={(e) => onFiltros({ ...filtros, evento_id: e.target.value || null })} style={selStyle}>
              <option value="">Todos</option>
              {eventos.map((ev) => <option key={ev.id} value={ev.id}>{ev.nome}</option>)}
            </select>
          </FilterGroup>
          <FilterGroup label="Cliente">
            <select value={filtros.cliente_id ?? ''} onChange={(e) => onFiltros({ ...filtros, cliente_id: e.target.value || null })} style={selStyle}>
              <option value="">Todos</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </FilterGroup>
          <FilterGroup label="Prazo">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="date" value={filtros.dataDe ?? ''} onChange={(e) => onFiltros({ ...filtros, dataDe: e.target.value || null })} style={dateStyle} />
              <span style={{ fontSize: 12, color: 'var(--fe-text-faint)' }}>até</span>
              <input type="date" value={filtros.dataAte ?? ''} onChange={(e) => onFiltros({ ...filtros, dataAte: e.target.value || null })} style={dateStyle} />
            </div>
          </FilterGroup>
          {ativos > 0 && (
            <button onClick={() => onFiltros(FILTROS_VAZIOS)} style={{ height: 30, borderRadius: 6, border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, fontWeight: 500, color: 'var(--fe-text-soft)', cursor: 'pointer' }}>
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </Dropdown>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {children}
    </div>
  )
}

function Chip({ children, ativo, onClick }: { children: React.ReactNode; ativo: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ height: 26, padding: '0 10px', borderRadius: 'var(--fe-radius-pill)', border: `1px solid ${ativo ? 'var(--fe-accent)' : 'var(--fe-border)'}`, background: ativo ? 'var(--fe-accent-dim)' : 'transparent', color: ativo ? 'var(--fe-accent-dark)' : 'var(--fe-text-soft)', fontSize: 12, fontWeight: ativo ? 600 : 500, cursor: 'pointer' }}>
      {children}
    </button>
  )
}

function TabIcon({ nome, ativa }: { nome: string; ativa: boolean }) {
  const c = ativa ? 'var(--fe-black)' : 'var(--fe-text-faint)'
  if (nome === 'Lista') return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4H12M2 7H12M2 10H9" stroke={c} strokeWidth="1.3" strokeLinecap="round" /></svg>
  if (nome === 'Quadro') return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2.5" width="3.4" height="9" rx="1" stroke={c} strokeWidth="1.2" /><rect x="8.6" y="2.5" width="3.4" height="6" rx="1" stroke={c} strokeWidth="1.2" /></svg>
  if (nome === 'Calendário') return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="9" rx="1.4" stroke={c} strokeWidth="1.2" /><path d="M2 5.6H12M4.5 1.8V3.6M9.5 1.8V3.6" stroke={c} strokeWidth="1.2" strokeLinecap="round" /></svg>
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4H8M2.5 7H10.5M2.5 10H6.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" /></svg>
}

// ─── Cabeçalho de colunas ─────────────────────────────────────────────────────

function ColunasHeader() {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'grid', gridTemplateColumns: GRID, gap: 12, padding: '0 20px 0 48px', height: 34, alignItems: 'center', background: 'var(--fe-surface)', borderBottom: '1px solid var(--fe-border)' }}>
      {['Nome da tarefa', 'Evento', 'Responsável', 'Prazo', 'Prioridade', ''].map((h, i) => (
        <span key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
      ))}
    </div>
  )
}

// ─── Grupo ─────────────────────────────────────────────────────────────────────

function Grupo({
  grupo, meta, membroPorId, eventos, membros, onAbrir, patchTask, patchEvento, excluirTask,
}: {
  grupo: GrupoView
  meta: { slug: string }
  membroPorId: Map<string, Membro>
  eventos: EventoOpcao[]
  membros: Membro[]
  onAbrir: (id: string) => void
  patchTask: (id: string, patch: Partial<TaskProjeto>) => void
  patchEvento: (id: string, evento_id: string | null) => void
  excluirTask: (id: string) => void
}) {
  const [aberto, setAberto] = useState(true)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 20px', cursor: 'pointer', borderBottom: '1px solid var(--fe-border-soft)', background: 'var(--fe-warm-white)' }}
        onClick={() => setAberto((v) => !v)}>
        <svg width="10" height="10" viewBox="0 0 9 9" fill="none" style={{ transform: aberto ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform var(--fe-dur-fast) var(--fe-ease)', color: 'var(--fe-text-muted)' }}>
          <path d="M3 1.5L6 4.5L3 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {grupo.header}
        <Link href={`/entregas/projetos/${meta.slug}/novo`} onClick={(e) => e.stopPropagation()}
          style={{ marginLeft: 6, fontSize: 12.5, color: 'var(--fe-text-faint)', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fe-text-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fe-text-faint)')}>
          + Adicionar
        </Link>
      </div>

      {aberto && grupo.itens.map((t) => (
        <Linha key={t.id} task={t} membro={t.responsavel_id ? membroPorId.get(t.responsavel_id) ?? null : null}
          eventos={eventos} membros={membros}
          onAbrir={onAbrir} patchTask={patchTask} patchEvento={patchEvento} excluirTask={excluirTask} />
      ))}
      {aberto && grupo.itens.length === 0 && (
        <div style={{ padding: '0 20px 0 48px', height: 38, display: 'flex', alignItems: 'center', fontSize: 12.5, color: 'var(--fe-text-faint)', borderBottom: '1px solid var(--fe-border-soft)' }}>
          Nenhuma tarefa
        </div>
      )}
    </div>
  )
}

// ─── Linha ───────────────────────────────────────────────────────────────────

function Linha({
  task, membro, eventos, membros, onAbrir, patchTask, patchEvento, excluirTask,
}: {
  task: TaskProjeto; membro: Membro | null
  eventos: EventoOpcao[]; membros: Membro[]
  onAbrir: (id: string) => void
  patchTask: (id: string, patch: Partial<TaskProjeto>) => void
  patchEvento: (id: string, evento_id: string | null) => void
  excluirTask: (id: string) => void
}) {
  const concluida = task.status === 'concluida'
  const [popoverAberto, setPopoverAberto] = useState(false)
  const cellBtn: React.CSSProperties = { width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '4px 6px', margin: '0 -6px', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }

  return (
    <div className="fe-row"
      style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, alignItems: 'center', minHeight: 46, padding: '0 20px', borderBottom: '1px solid var(--fe-border-soft)', cursor: 'pointer', transition: 'background var(--fe-dur-fast)', background: 'var(--fe-surface)' }}
      onClick={() => { if (!popoverAberto) onAbrir(task.id) }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-warm-white)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--fe-surface)')}>

      {/* Nome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        <span onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex' }}>
          <StatusDotSelect status={task.status} onChange={(s) => patchTask(task.id, { status: s })} />
        </span>
        <PriorityFlag prioridade={task.prioridade} />
        <span style={{ fontSize: 13.5, fontWeight: 500, color: concluida ? 'var(--fe-text-muted)' : 'var(--fe-text-strong)', textDecoration: concluida ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.nome}
        </span>
      </div>

      {/* Evento */}
      <span onClick={(e) => e.stopPropagation()} style={{ minWidth: 0 }}>
        <EventoSelect eventos={eventos} value={task.evento_id} onChange={(id) => patchEvento(task.id, id)}>
          {({ toggle }) => (
            <button onClick={toggle} style={cellBtn} title="Alterar evento"
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: 12.5, color: task.evento?.nome ? 'var(--fe-text-muted)' : 'var(--fe-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.evento?.nome ?? '—'}
              </span>
            </button>
          )}
        </EventoSelect>
      </span>

      {/* Responsável */}
      <span onClick={(e) => e.stopPropagation()}>
        <ResponsavelSelect membros={membros} value={task.responsavel_id} onChange={(id) => patchTask(task.id, { responsavel_id: id })}>
          {({ toggle }) => (
            <button onClick={toggle} title="Alterar responsável" style={{ border: 'none', background: 'transparent', padding: 2, borderRadius: '50%', cursor: 'pointer', display: 'inline-flex' }}>
              <Avatar nome={membro?.nome ?? null} id={task.responsavel_id} size={24} />
            </button>
          )}
        </ResponsavelSelect>
      </span>

      {/* Prazo */}
      <span onClick={(e) => e.stopPropagation()}>
        <Dropdown align="left" width={252} onOpenChange={setPopoverAberto}
          trigger={({ toggle }) => (
            <button onClick={toggle} style={cellBtn} title="Alterar prazo"
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <PrazoText iso={task.data_fim} status={task.status} />
            </button>
          )}>
          {(close) => <CalendarPopover value={task.data_fim} onChange={(iso) => patchTask(task.id, { data_fim: iso })} onClose={close} />}
        </Dropdown>
      </span>

      {/* Prioridade */}
      <span onClick={(e) => e.stopPropagation()}>
        <PrioridadeSelect value={task.prioridade} onChange={(p) => patchTask(task.id, { prioridade: p })}>
          {({ toggle }) => (
            <button onClick={toggle} style={cellBtn} title="Alterar prioridade"
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <PriorityFlag prioridade={task.prioridade} label />
            </button>
          )}
        </PrioridadeSelect>
      </span>

      {/* Ações */}
      <span className="fe-row-actions" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', justifyContent: 'flex-end' }}>
        <RowMenu onExcluir={() => { if (confirm(`Excluir a tarefa "${task.nome}"?`)) excluirTask(task.id) }} />
      </span>
    </div>
  )
}

// ─── Slide-over ───────────────────────────────────────────────────────────────

function SlideOver({
  task, meta, membros, eventos, membroPorId, patchTask, patchEvento, excluirTask, onFechar,
}: {
  task: TaskProjeto; meta: { slug: string; label: string }
  membros: Membro[]; eventos: EventoOpcao[]; membroPorId: Map<string, Membro>
  patchTask: (id: string, patch: Partial<TaskProjeto>) => void
  patchEvento: (id: string, evento_id: string | null) => void
  excluirTask: (id: string) => void
  onFechar: () => void
}) {
  const concluida = task.status === 'concluida'
  const membro = task.responsavel_id ? membroPorId.get(task.responsavel_id) ?? null : null
  const prazo = estadoPrazo(task.data_fim, task.status)

  // Nome com auto-save (debounce). O componente é remontado por task (key=id).
  const [nome, setNome] = useState(task.nome)
  const nomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function onNome(v: string) {
    setNome(v)
    if (nomeTimer.current) clearTimeout(nomeTimer.current)
    nomeTimer.current = setTimeout(() => { if (v.trim() && v !== task.nome) patchTask(task.id, { nome: v.trim() }) }, 600)
  }

  // Descrição com auto-save (debounce)
  const descTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function onDescricao(html: string) {
    if (descTimer.current) clearTimeout(descTimer.current)
    descTimer.current = setTimeout(() => patchTask(task.id, { descricao: html }), 600)
  }

  return (
    <>
      <div className="fe-fade-in" onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'var(--fe-backdrop)', zIndex: 60 }} />
      <aside className="fe-slide-in"
        style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'var(--fe-panel-w)', maxWidth: '92vw', background: 'var(--fe-surface)', boxShadow: 'var(--fe-shadow-panel)', zIndex: 61, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 46, padding: '0 12px 0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--fe-text-muted)' }}>
            <span style={{ width: 17, height: 17, borderRadius: 4, background: ENTREGAS_COLOR, color: '#003D26', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>E</span>
            <span>Projetos</span><Sep /><span style={{ color: 'var(--fe-text-soft)', fontWeight: 500 }}>{meta.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link href={`/entregas/projetos/${meta.slug}/${task.id}`} title="Expandir" style={iconBtn}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 2H12V5.5M12 2L8 6M5.5 12H2V8.5M2 12L6 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <Dropdown align="right" width={160}
              trigger={({ toggle }) => <button onClick={toggle} title="Mais" style={iconBtn as React.CSSProperties}>⋯</button>}>
              {(close) => (
                <button onClick={() => { close(); if (confirm(`Excluir a tarefa "${task.nome}"?`)) excluirTask(task.id) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: 'var(--fe-prio-urgent)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5H11.5M5 3.5V2.5C5 2.2 5.2 2 5.5 2H8.5C8.8 2 9 2.2 9 2.5V3.5M3.5 3.5L4 11.5C4 11.8 4.2 12 4.5 12H9.5C9.8 12 10 11.8 10 11.5L10.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Excluir tarefa
                </button>
              )}
            </Dropdown>
            <button onClick={onFechar} title="Fechar" style={iconBtn as React.CSSProperties}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <button onClick={() => patchTask(task.id, { status: concluida ? 'a_fazer' : 'concluida' })}
              style={{ height: 32, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: `1px solid ${concluida ? 'var(--fe-accent)' : 'var(--fe-border)'}`, background: concluida ? 'var(--fe-accent-dim)' : 'transparent', color: concluida ? 'var(--fe-status-done-text)' : 'var(--fe-text)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.2L5.8 9.8L11 4" stroke={concluida ? 'var(--fe-accent)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {concluida ? 'Reabrir' : 'Marcar concluída'}
            </button>
            <StatusPillSelect status={task.status} onChange={(s) => patchTask(task.id, { status: s })} />
          </div>

          <textarea
            value={nome} onChange={(e) => onNome(e.target.value)} rows={1}
            onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }}
            style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 25, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--fe-text-strong)', margin: '0 0 20px', padding: 0, overflow: 'hidden' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 22 }}>
            <PropRow icon={<IcUser />} label="Responsável">
              <ResponsavelSelect membros={membros} value={task.responsavel_id} onChange={(id) => patchTask(task.id, { responsavel_id: id })}>
                {({ toggle }) => (
                  <button onClick={toggle} style={propBtn}>
                    {membro ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Avatar nome={membro.nome} id={membro.id} size={22} /><span style={{ fontSize: 13, color: 'var(--fe-text)' }}>{membro.nome}</span></span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Avatar nome={null} id={null} size={22} /><span style={{ fontSize: 13, color: 'var(--fe-text-faint)' }}>Sem responsável</span></span>}
                  </button>
                )}
              </ResponsavelSelect>
            </PropRow>
            <PropRow icon={<IcCal />} label="Prazo">
              <Dropdown align="left" width={252}
                trigger={({ toggle }) => (
                  <button onClick={toggle} style={propBtn}>
                    {prazo ? <span style={{ fontSize: 13, color: prazo.cor, fontWeight: prazo.bold ? 600 : 400 }}>{prazo.texto}</span> : <span style={{ fontSize: 13, color: 'var(--fe-text-faint)' }}>Sem prazo</span>}
                  </button>
                )}>
                {(close) => <CalendarPopover value={task.data_fim} onChange={(iso) => patchTask(task.id, { data_fim: iso })} onClose={close} />}
              </Dropdown>
            </PropRow>
            <PropRow icon={<IcFlag />} label="Prioridade">
              <PrioridadeSelect value={task.prioridade} onChange={(p) => patchTask(task.id, { prioridade: p })}>
                {({ toggle }) => <button onClick={toggle} style={propBtn}><PriorityFlag prioridade={task.prioridade} label /></button>}
              </PrioridadeSelect>
            </PropRow>
            <PropRow icon={<IcEvent />} label="Evento">
              <EventoSelect eventos={eventos} value={task.evento_id} onChange={(id) => patchEvento(task.id, id)}>
                {({ toggle }) => (
                  <button onClick={toggle} style={propBtn}>
                    <span style={{ fontSize: 13, color: task.evento?.nome ? 'var(--fe-text)' : 'var(--fe-text-faint)' }}>{task.evento?.nome ?? 'Sem evento'}</span>
                  </button>
                )}
              </EventoSelect>
            </PropRow>
          </div>

          {/* Descrição rich text */}
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--fe-text-muted)', marginBottom: 8 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5H11.5M2.5 7H11.5M2.5 10.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              Descrição
            </span>
            <RichTextEditor key={task.id} value={task.descricao} onChange={onDescricao} />
          </div>
        </div>
      </aside>
    </>
  )
}

function PropRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '128px 1fr', alignItems: 'center', minHeight: 40 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--fe-text-muted)' }}>{icon}{label}</span>
      <span>{children}</span>
    </div>
  )
}

const propBtn: React.CSSProperties = { border: 'none', background: 'transparent', padding: '5px 8px', margin: '0 -8px', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', textAlign: 'left' }

const iconBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 16 }

function IcUser() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="4.6" r="2.4" stroke="currentColor" strokeWidth="1.2" /><path d="M2.5 11.5C2.5 9.2 4.5 8 7 8S11.5 9.2 11.5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg> }
function IcCal() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.2" /><path d="M2 5.6H12M4.5 1.8V3.6M9.5 1.8V3.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg> }
function IcFlag() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 1.8V12.2M3.5 2.4H10L8.4 4.8L10 7.2H3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg> }
function IcEvent() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 6.5L7 2L12 6.5V12H2V6.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg> }

// ─── Estado vazio ─────────────────────────────────────────────────────────────

function EstadoVazio({ meta }: { meta: { slug: string; label: string } }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 14, padding: 40 }}>
      <div style={{ width: 54, height: 54, borderRadius: 14, background: 'var(--fe-warm-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fe-text-faint)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--fe-text-strong)', margin: '0 0 6px' }}>Nenhuma tarefa em {meta.label}</p>
        <p style={{ fontSize: 13, color: 'var(--fe-text-muted)', maxWidth: 280, margin: 0, lineHeight: 1.5 }}>Crie a primeira tarefa para organizar as entregas do evento.</p>
      </div>
      <Link href={`/entregas/projetos/${meta.slug}/novo`} style={{ marginTop: 4, height: 34, padding: '0 16px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: 'var(--fe-accent-dark)', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
        Adicionar tarefa
      </Link>
    </div>
  )
}
