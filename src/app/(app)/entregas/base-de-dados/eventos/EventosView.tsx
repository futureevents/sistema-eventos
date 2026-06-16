'use client'

import { useMemo, useState } from 'react'
import {
  SPACE_ENTREGAS, Breadcrumb, TabsToolbar, ColunasHeader, Row, CellNome, CellText,
  Grupo, Pill, SlideOver, PropRow, EmptyState, Dash, dataCurta,
} from '@/components/list/kit'

const BASE = '/entregas/base-de-dados/eventos'
const SEG = ['Entregas', 'Base de dados', 'Eventos']
const TEMPLATE = 'minmax(0,1fr) 180px 140px 150px'

type StatusEvento = 'backlog' | 'em_aberto' | 'em_execucao' | 'realizado' | 'encerrado' | 'cancelado'

export type EventoRow = {
  id: string
  nome: string
  status: StatusEvento
  local: string | null
  data_realizacao_inicio: string | null
  data_realizacao_fim: string | null
  data_inicio_organizacao: string | null
  data_montagem: string | null
  cliente: { nome: string } | null
}

const ORDER: StatusEvento[] = ['backlog', 'em_aberto', 'em_execucao', 'realizado', 'encerrado', 'cancelado']
const SEMPRE: StatusEvento[] = ['backlog', 'em_aberto', 'em_execucao']

export const EV_STATUS: Record<StatusEvento, { label: string; dot: string; bg: string; text: string }> = {
  backlog:     { label: 'Backlog',     dot: '#8A8783', bg: 'var(--fe-status-todo-tint)',   text: 'var(--fe-status-todo-text)' },
  em_aberto:   { label: 'Em aberto',   dot: '#3B82F6', bg: 'var(--fe-status-prog-tint)',   text: 'var(--fe-status-prog-text)' },
  em_execucao: { label: 'Em execução', dot: '#F59E0B', bg: 'var(--fe-status-review-tint)', text: 'var(--fe-status-review-text)' },
  realizado:   { label: 'Realizado',   dot: '#00C47A', bg: 'var(--fe-status-done-tint)',   text: 'var(--fe-status-done-text)' },
  encerrado:   { label: 'Encerrado',   dot: '#8A8783', bg: 'var(--fe-status-todo-tint)',   text: 'var(--fe-status-todo-text)' },
  cancelado:   { label: 'Cancelado',   dot: '#EF4444', bg: 'rgba(239,68,68,0.10)',         text: '#DC2626' },
}

function realizacao(ev: EventoRow): string | null {
  if (!ev.data_realizacao_inicio) return null
  const ini = dataCurta(ev.data_realizacao_inicio)
  return ev.data_realizacao_fim ? `${ini} – ${dataCurta(ev.data_realizacao_fim)}` : ini
}

function statusPill(s: StatusEvento, chevron = false) {
  const c = EV_STATUS[s]
  return <Pill label={c.label} dot={c.dot} bg={c.bg} text={c.text} chevron={chevron} />
}

export function EventosView({ eventos }: { eventos: EventoRow[] }) {
  const [busca, setBusca] = useState('')
  const [sel, setSel] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? eventos.filter((e) => e.nome.toLowerCase().includes(q)) : eventos
  }, [eventos, busca])

  const grupos = useMemo(() => {
    return ORDER
      .map((status) => ({ status, itens: filtrados.filter((e) => e.status === status) }))
      .filter((g) => g.itens.length > 0 || SEMPRE.includes(g.status))
  }, [filtrados])

  const aberto = sel ? eventos.find((e) => e.id === sel) ?? null : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--fe-surface)' }}>
      <Breadcrumb space={SPACE_ENTREGAS} segments={SEG} />
      <TabsToolbar grouping="Status" busca={busca} onBusca={setBusca} addHref={`${BASE}/novo`} addLabel="Adicionar evento" />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {eventos.length === 0 ? (
          <EmptyState
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 2V6M16 2V6M3 9H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
            titulo="Nenhum evento cadastrado"
            descricao="Crie seu primeiro evento para começar a organizar a operação."
            addHref={`${BASE}/novo`} addLabel="Adicionar evento"
          />
        ) : (
          <>
            <ColunasHeader cols={[{ label: 'Nome', width: 'minmax(0,1fr)' }, { label: 'Cliente', width: '180px' }, { label: 'Realização', width: '140px' }, { label: 'Local', width: '150px' }]} />
            {grupos.map((g) => (
              <Grupo key={g.status} pill={statusPill(g.status)} count={g.itens.length} addHref={`${BASE}/novo`}>
                {g.itens.map((ev) => (
                  <Row key={ev.id} template={TEMPLATE} onClick={() => setSel(ev.id)}>
                    <CellNome>{ev.nome}</CellNome>
                    <CellText>{ev.cliente?.nome ?? <Dash />}</CellText>
                    <CellText>{realizacao(ev) ?? <Dash />}</CellText>
                    <CellText>{ev.local ?? <Dash />}</CellText>
                  </Row>
                ))}
              </Grupo>
            ))}
            <div style={{ height: 40 }} />
          </>
        )}
      </div>

      {aberto && (
        <SlideOver
          space={SPACE_ENTREGAS}
          segments={['Base de dados', 'Eventos']}
          expandHref={`${BASE}/${aberto.id}`}
          onClose={() => setSel(null)}
          statusSlot={statusPill(aberto.status)}
          title={aberto.nome}
        >
          <PropRow icon={<IcUser />} label="Cliente">{aberto.cliente?.nome ?? <span style={{ color: 'var(--fe-text-faint)' }}>Sem cliente</span>}</PropRow>
          <PropRow icon={<IcPin />} label="Local">{aberto.local ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}</PropRow>
          <PropRow icon={<IcCal />} label="Realização">{realizacao(aberto) ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}</PropRow>
          <PropRow icon={<IcCal />} label="Organização">{aberto.data_inicio_organizacao ? dataCurta(aberto.data_inicio_organizacao) : <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}</PropRow>
          <PropRow icon={<IcCal />} label="Montagem">{aberto.data_montagem ? dataCurta(aberto.data_montagem) : <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}</PropRow>
        </SlideOver>
      )}
    </div>
  )
}

function IcUser() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="4.6" r="2.4" stroke="currentColor" strokeWidth="1.2" /><path d="M2.5 11.5C2.5 9.2 4.5 8 7 8S11.5 9.2 11.5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg> }
function IcCal() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.2" /><path d="M2 5.6H12M4.5 1.8V3.6M9.5 1.8V3.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg> }
function IcPin() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12.5C7 12.5 11 8.8 11 5.8A4 4 0 0 0 3 5.8C3 8.8 7 12.5 7 12.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><circle cx="7" cy="5.8" r="1.4" stroke="currentColor" strokeWidth="1.2" /></svg> }
