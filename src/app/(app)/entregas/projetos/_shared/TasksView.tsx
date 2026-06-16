'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  type TaskProjeto, type TipoTask, type Membro, type StatusTask,
  TIPO_META, STATUS_ORDER,
} from './types'
import { Avatar, StatusPill, PriorityFlag, PrazoText, estadoPrazo } from './ui'

const GRID = 'minmax(0,1fr) 168px 132px 150px 132px'
const ENTREGAS_COLOR = '#00C47A'

export function TasksView({ tasks, tipo, membros }: { tasks: TaskProjeto[]; tipo: TipoTask; membros: Membro[] }) {
  const meta = TIPO_META[tipo]
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const membroPorId = useMemo(() => {
    const m = new Map<string, Membro>()
    for (const x of membros) m.set(x.id, x)
    return m
  }, [membros])

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return tasks
    return tasks.filter((t) => t.nome.toLowerCase().includes(q))
  }, [tasks, busca])

  const grupos = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      itens: filtradas.filter((t) => t.status === status),
    })).filter((g) => g.itens.length > 0 || g.status === 'a_fazer' || g.status === 'em_andamento' || g.status === 'concluida')
  }, [filtradas])

  const taskAberta = selecionada ? tasks.find((t) => t.id === selecionada) ?? null : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--fe-surface)' }}>
      <Breadcrumb meta={meta} membros={membros} />
      <TabsToolbar meta={meta} busca={busca} onBusca={setBusca} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tasks.length === 0 ? (
          <EstadoVazio meta={meta} />
        ) : (
          <>
            <ColunasHeader />
            {grupos.map((g) => (
              <Grupo
                key={g.status}
                status={g.status}
                itens={g.itens}
                meta={meta}
                membroPorId={membroPorId}
                onAbrir={setSelecionada}
              />
            ))}
            <div style={{ height: 40 }} />
          </>
        )}
      </div>

      {taskAberta && (
        <SlideOver
          task={taskAberta}
          meta={meta}
          membro={taskAberta.responsavel_id ? membroPorId.get(taskAberta.responsavel_id) ?? null : null}
          onFechar={() => setSelecionada(null)}
        />
      )}
    </div>
  )
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
        <button title="Mais" style={{ width: 30, height: 30, borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', cursor: 'pointer' }}>⋯</button>
      </div>
    </div>
  )
}

function Sep() {
  return <span style={{ color: 'var(--fe-text-faint)' }}>/</span>
}

// ─── Tabs + Toolbar ─────────────────────────────────────────────────────────────

const TABS = ['Lista', 'Quadro', 'Calendário', 'Cronograma'] as const

function TabsToolbar({ meta, busca, onBusca }: { meta: { slug: string }; busca: string; onBusca: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 14px 0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
        {TABS.map((t, i) => {
          const ativa = i === 0
          return (
            <button
              key={t}
              title={ativa ? undefined : 'Em breve'}
              style={{
                height: '100%', padding: '0 12px', border: 'none', background: 'transparent',
                borderBottom: ativa ? '2px solid var(--fe-black)' : '2px solid transparent',
                fontSize: 13, fontWeight: ativa ? 600 : 500, color: ativa ? 'var(--fe-black)' : 'var(--fe-text-muted)',
                cursor: ativa ? 'default' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <TabIcon nome={t} ativa={ativa} />
              {t}
            </button>
          )
        })}
        <button title="Adicionar view" style={{ width: 26, height: 26, marginLeft: 4, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--fe-text-muted)', cursor: 'pointer', fontSize: 15 }}>+</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <Ghost icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1.5 2.5H12.5L8.5 7.2V11L5.5 12.5V7.2L1.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>}>Filtros</Ghost>
        <Ghost icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 3.5H11M4.5 7H9.5M6 10.5H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>}>Ordenar</Ghost>
        <Ghost icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="2" y="8" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="8" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2" /></svg>}>
          Agrupar: <span style={{ color: 'var(--fe-text)', fontWeight: 600, marginLeft: 3 }}>Status</span>
        </Ghost>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', left: 9, opacity: 0.4, pointerEvents: 'none' }}><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" /><path d="M8 8L10.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          <input
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            placeholder="Buscar"
            style={{ height: 30, width: 150, padding: '0 10px 0 26px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 12.5, color: 'var(--fe-text)', outline: 'none' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--fe-accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--fe-border)')}
          />
        </div>
        <Link
          href={`/entregas/projetos/${meta.slug}/novo`}
          style={{ height: 30, padding: '0 14px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: 'var(--fe-accent-dark)', fontSize: 12.5, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          Adicionar tarefa
        </Link>
      </div>
    </div>
  )
}

function Ghost({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      style={{ height: 30, padding: '0 10px', borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-warm-white)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
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
    <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'grid', gridTemplateColumns: GRID, gap: 12, padding: '0 20px 0 48px', height: 34, alignItems: 'center', background: 'var(--fe-surface)', borderBottom: '1px solid var(--fe-border-soft)' }}>
      {['Nome da tarefa', 'Evento', 'Responsável', 'Prazo', 'Prioridade'].map((h) => (
        <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
      ))}
    </div>
  )
}

// ─── Grupo (status) ─────────────────────────────────────────────────────────────

function Grupo({
  status, itens, meta, membroPorId, onAbrir,
}: {
  status: StatusTask
  itens: TaskProjeto[]
  meta: { slug: string }
  membroPorId: Map<string, Membro>
  onAbrir: (id: string) => void
}) {
  const [aberto, setAberto] = useState(true)

  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 20px', cursor: 'pointer', borderBottom: '1px solid var(--fe-divider)' }}
        onClick={() => setAberto((v) => !v)}
      >
        <svg width="10" height="10" viewBox="0 0 9 9" fill="none" style={{ transform: aberto ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform var(--fe-dur-fast) var(--fe-ease)', color: 'var(--fe-text-muted)' }}>
          <path d="M3 1.5L6 4.5L3 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <StatusPill status={status} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--fe-text-muted)' }}>{itens.length}</span>
        <Link
          href={`/entregas/projetos/${meta.slug}/novo`}
          onClick={(e) => e.stopPropagation()}
          style={{ marginLeft: 6, fontSize: 12.5, color: 'var(--fe-text-faint)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fe-text-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fe-text-faint)')}
        >
          + Adicionar
        </Link>
      </div>

      {aberto && itens.map((t) => (
        <Linha key={t.id} task={t} membro={t.responsavel_id ? membroPorId.get(t.responsavel_id) ?? null : null} onAbrir={onAbrir} />
      ))}
      {aberto && itens.length === 0 && (
        <div style={{ padding: '0 20px 0 48px', height: 38, display: 'flex', alignItems: 'center', fontSize: 12.5, color: 'var(--fe-text-faint)', borderBottom: '1px solid var(--fe-divider)' }}>
          Nenhuma tarefa
        </div>
      )}
    </div>
  )
}

function Linha({ task, membro, onAbrir }: { task: TaskProjeto; membro: Membro | null; onAbrir: (id: string) => void }) {
  const concluida = task.status === 'concluida'
  return (
    <div
      onClick={() => onAbrir(task.id)}
      style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, alignItems: 'center', minHeight: 44, padding: '0 20px 0 20px', borderBottom: '1px solid var(--fe-divider)', cursor: 'pointer', transition: 'background var(--fe-dur-fast)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF9F4')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        <ConclusaoCheck taskId={task.id} concluida={concluida} compact />
        <PriorityFlag prioridade={task.prioridade} />
        <span style={{ fontSize: 13.5, fontWeight: 500, color: concluida ? 'var(--fe-text-muted)' : 'var(--fe-text-strong)', textDecoration: concluida ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.nome}
        </span>
      </div>
      <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.evento?.nome ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}
      </span>
      <span><Avatar nome={membro?.nome ?? null} id={task.responsavel_id} size={24} /></span>
      <span><PrazoText iso={task.data_fim} status={task.status} /></span>
      <span><PriorityFlag prioridade={task.prioridade} label /></span>
    </div>
  )
}

// ─── Check de conclusão ─────────────────────────────────────────────────────────

function ConclusaoCheck({ taskId, concluida, compact = false }: { taskId: string; concluida: boolean; compact?: boolean }) {
  const router = useRouter()
  const [pend, setPend] = useState(false)
  const size = compact ? 18 : 20

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (pend) return
    setPend(true)
    const supabase = createClient()
    await supabase.from('task_projeto').update({ status: concluida ? 'a_fazer' : 'concluida' }).eq('id', taskId)
    router.refresh()
    setPend(false)
  }

  return (
    <button
      onClick={toggle}
      title={concluida ? 'Reabrir' : 'Marcar concluída'}
      style={{
        width: size, height: size, flexShrink: 0, borderRadius: '50%', cursor: 'pointer', padding: 0,
        border: concluida ? 'none' : '1.7px solid var(--fe-border)',
        background: concluida ? 'var(--fe-accent)' : 'transparent',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color var(--fe-dur-fast)', opacity: pend ? 0.5 : 1,
      }}
      onMouseEnter={(e) => { if (!concluida) e.currentTarget.style.borderColor = 'var(--fe-accent)' }}
      onMouseLeave={(e) => { if (!concluida) e.currentTarget.style.borderColor = 'var(--fe-border)' }}
    >
      {concluida && (
        <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </button>
  )
}

// ─── Slide-over ───────────────────────────────────────────────────────────────

function SlideOver({ task, meta, membro, onFechar }: { task: TaskProjeto; meta: { slug: string; label: string }; membro: Membro | null; onFechar: () => void }) {
  const router = useRouter()
  const [salvandoStatus, setSalvandoStatus] = useState(false)
  const [statusAberto, setStatusAberto] = useState(false)
  const concluida = task.status === 'concluida'

  async function mudarStatus(novo: StatusTask) {
    setStatusAberto(false)
    if (novo === task.status) return
    setSalvandoStatus(true)
    const supabase = createClient()
    await supabase.from('task_projeto').update({ status: novo }).eq('id', task.id)
    router.refresh()
    setSalvandoStatus(false)
  }

  async function marcarConcluida() {
    setSalvandoStatus(true)
    const supabase = createClient()
    await supabase.from('task_projeto').update({ status: concluida ? 'a_fazer' : 'concluida' }).eq('id', task.id)
    router.refresh()
    setSalvandoStatus(false)
  }

  const prazo = estadoPrazo(task.data_fim, task.status)

  return (
    <>
      <div className="fe-fade-in" onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'var(--fe-backdrop)', zIndex: 60 }} />
      <aside
        className="fe-slide-in"
        style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'var(--fe-panel-w)', maxWidth: '92vw', background: 'var(--fe-surface)', boxShadow: 'var(--fe-shadow-panel)', zIndex: 61, display: 'flex', flexDirection: 'column' }}
      >
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
            <button title="Mais" style={iconBtn as React.CSSProperties}>⋯</button>
            <button onClick={onFechar} title="Fechar" style={iconBtn as React.CSSProperties}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <button
              onClick={marcarConcluida}
              disabled={salvandoStatus}
              style={{ height: 32, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: `1px solid ${concluida ? 'var(--fe-accent)' : 'var(--fe-border)'}`, background: concluida ? 'var(--fe-accent-dim)' : 'transparent', color: concluida ? 'var(--fe-status-done-text)' : 'var(--fe-text)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.2L5.8 9.8L11 4" stroke={concluida ? 'var(--fe-accent)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {concluida ? 'Reabrir' : 'Marcar concluída'}
            </button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setStatusAberto((v) => !v)} disabled={salvandoStatus} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
                <StatusPill status={task.status} chevron />
              </button>
              {statusAberto && (
                <div style={{ position: 'absolute', top: 30, left: 0, zIndex: 5, minWidth: 180, background: 'var(--fe-surface)', border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-pop)', padding: 5 }}>
                  {STATUS_ORDER.map((s) => (
                    <button key={s} onClick={() => mudarStatus(s)} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '7px 8px', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <StatusPill status={s} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 25, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--fe-text-strong)', margin: '0 0 22px' }}>
            {task.nome}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <PropRow icon={<IcUser />} label="Responsável">
              {membro ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Avatar nome={membro.nome} id={membro.id} size={22} /><span style={{ fontSize: 13, color: 'var(--fe-text)' }}>{membro.nome}</span></span>
              ) : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Avatar nome={null} id={null} size={22} /><span style={{ fontSize: 13, color: 'var(--fe-text-faint)' }}>Sem responsável</span></span>}
            </PropRow>
            <PropRow icon={<IcCal />} label="Prazo">
              {prazo ? <span style={{ fontSize: 13, color: prazo.cor, fontWeight: prazo.bold ? 600 : 400 }}>{prazo.texto}</span> : <span style={{ fontSize: 13, color: 'var(--fe-text-faint)' }}>Sem prazo</span>}
            </PropRow>
            <PropRow icon={<IcFlag />} label="Prioridade">
              <PriorityFlag prioridade={task.prioridade} label />
            </PropRow>
            <PropRow icon={<IcEvent />} label="Evento">
              <span style={{ fontSize: 13, color: task.evento?.nome ? 'var(--fe-text)' : 'var(--fe-text-faint)' }}>{task.evento?.nome ?? 'Sem evento'}</span>
            </PropRow>
          </div>
        </div>
      </aside>
    </>
  )
}

function PropRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '128px 1fr', alignItems: 'center', minHeight: 38 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--fe-text-muted)' }}>{icon}{label}</span>
      <span>{children}</span>
    </div>
  )
}

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
