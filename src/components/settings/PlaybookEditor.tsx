'use client'

import { useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type SelectOption } from '@/components/list/types'
import { SelectMenu, OptionPill, FlagInline, RowMenu } from '@/components/list/inline'
import { SettingsIcon } from './sections'

// ── Opções (mesma linguagem visual do motor de Lists) ───────────────────────

const LISTAS: SelectOption[] = [
  { value: 'onboarding',   label: 'Tarefas de onboarding', dot: 'var(--fe-status-prog)',   bg: 'var(--fe-status-prog-tint)',   text: 'var(--fe-status-prog-text)' },
  { value: 'pre_evento',   label: 'Pré-evento',            dot: 'var(--fe-accent)',         bg: 'var(--fe-accent-dim)',         text: 'var(--fe-accent)' },
  { value: 'intra_evento', label: 'Intra-evento',          dot: 'var(--fe-status-review)',  bg: 'var(--fe-status-review-tint)', text: 'var(--fe-status-review-text)' },
  { value: 'pos_evento',   label: 'Pós-evento',            dot: 'var(--fe-accent-dark)',    bg: 'var(--fe-accent-dim)',         text: 'var(--fe-accent-dark)' },
]

const ANCORAS: SelectOption[] = [
  { value: 'inicio_organizacao', label: 'Início da organização', dot: 'var(--fe-status-todo)',   bg: 'var(--fe-status-todo-tint)',   text: 'var(--fe-status-todo-text)' },
  { value: 'realizacao_inicio',  label: 'Realização (início)',   dot: 'var(--fe-status-review)', bg: 'var(--fe-status-review-tint)', text: 'var(--fe-status-review-text)' },
  { value: 'data_montagem',      label: 'Montagem',              dot: 'var(--fe-status-prog)',   bg: 'var(--fe-status-prog-tint)',   text: 'var(--fe-status-prog-text)' },
  { value: 'realizacao_fim',     label: 'Realização (fim)',      dot: 'var(--fe-status-done)',   bg: 'var(--fe-status-done-tint)',   text: 'var(--fe-status-done-text)' },
]

const PRIORIDADES: SelectOption[] = [
  { value: 'urgente', label: 'Urgente', flag: 'var(--fe-prio-urgent)' },
  { value: 'alta',    label: 'Alta',    flag: 'var(--fe-prio-high)' },
  { value: 'media',   label: 'Média',   flag: 'var(--fe-prio-normal)' },
  { value: 'baixa',   label: 'Baixa',   flag: 'var(--fe-prio-low)' },
]

const ANCORA_CURTA: Record<string, string> = {
  inicio_organizacao: 'Organização',
  realizacao_inicio: 'Realização',
  data_montagem: 'Montagem',
  realizacao_fim: 'Fim',
}

export type PlaybookRow = {
  id: string
  ordem: number
  titulo: string
  lista: string
  ancora: string
  offset_dias: number
  bloco: string | null
  setor_padrao: string | null
  prioridade_padrao: string
  descricao_padrao: string | null
  ativo: boolean
}

function offsetLabel(dias: number): string {
  if (dias === 0) return 'no dia'
  return dias > 0 ? `+${dias}d` : `${dias}d`
}

const optOf = (opts: SelectOption[], v: string) => opts.find((o) => o.value === v)

export function PlaybookEditor({ rows: rowsProp }: { rows: PlaybookRow[] }) {
  const supabase = useMemo(() => createClient(), [])
  const [rows, setRows] = useState<PlaybookRow[]>(rowsProp)
  const [salvando, setSalvando] = useState<'idle' | 'saving' | 'saved'>('idle')
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function marcarSalvo() {
    setSalvando('saved')
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSalvando('idle'), 1500)
  }

  async function patch(id: string, partial: Partial<PlaybookRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...partial } : r)))
    setSalvando('saving')
    const { error } = await supabase.from('playbook_modelo').update(partial).eq('id', id)
    if (error) { setSalvando('idle'); return }
    marcarSalvo()
  }

  async function adicionar(lista: string) {
    const daLista = rows.filter((r) => r.lista === lista)
    const ordem = daLista.reduce((m, r) => Math.max(m, r.ordem), 0) + 1
    const bloco = daLista[daLista.length - 1]?.bloco ?? null
    const ancora = daLista[daLista.length - 1]?.ancora ?? 'realizacao_inicio'
    const novo = { titulo: 'Nova task-modelo', lista, ancora, offset_dias: 0, bloco, prioridade_padrao: 'media', ativo: true, ordem }
    setSalvando('saving')
    const { data, error } = await supabase.from('playbook_modelo').insert(novo).select('*').single()
    if (error || !data) { setSalvando('idle'); return }
    setRows((prev) => [...prev, data as PlaybookRow])
    marcarSalvo()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta task-modelo do playbook?')) return
    setRows((prev) => prev.filter((r) => r.id !== id))
    await supabase.from('playbook_modelo').delete().eq('id', id)
    marcarSalvo()
  }

  const totalAtivas = rows.filter((r) => r.ativo).length

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 28px 80px' }}>
      {/* Cabeçalho */}
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 'var(--fe-radius-lg)', background: 'var(--fe-warm-white)', color: 'var(--fe-text-soft)', flexShrink: 0 }}>
          <SettingsIcon icon="bolt" size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontFamily: 'var(--font-geist), sans-serif', fontSize: 'var(--fe-text-2xl)', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--fe-text-strong)', margin: 0, lineHeight: 1.2 }}>
              Playbook das entregas
            </h1>
            <SaveIndicator estado={salvando} />
          </div>
          <p style={{ fontSize: 'var(--fe-text-base)', color: 'var(--fe-text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
            Tasks-modelo geradas automaticamente quando um evento entra em execução. {totalAtivas} ativas. O prazo de cada task é calculado a partir da data-âncora do evento + o offset.
          </p>
        </div>
      </header>

      {/* Listas */}
      {LISTAS.map((lista) => {
        const daLista = rows.filter((r) => r.lista === lista.value).sort((a, b) => a.ordem - b.ordem)
        const blocos = agruparPorBloco(daLista)
        return (
          <section key={lista.value} style={{ marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <OptionPill opt={lista} />
              <span style={{ fontSize: 'var(--fe-text-xs)', color: 'var(--fe-text-faint)' }}>{daLista.length} task{daLista.length === 1 ? '' : 's'}</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => adicionar(lista.value)}
                style={{ height: 28, padding: '0 10px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, fontWeight: 500, color: 'var(--fe-text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                Adicionar
              </button>
            </div>

            <div style={{ border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-lg)', overflow: 'hidden', background: 'var(--fe-surface)' }}>
              {daLista.length === 0 && (
                <div style={{ padding: '18px 16px', fontSize: 13, color: 'var(--fe-text-faint)' }}>Nenhuma task-modelo nesta lista.</div>
              )}
              {blocos.map((bloco, bi) => (
                <div key={bloco.nome ?? bi}>
                  {bloco.nome && (
                    <div style={{ padding: '9px 16px 7px', fontSize: 'var(--fe-text-xs)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fe-text-muted)', background: 'var(--fe-warm-white)', borderTop: bi === 0 ? 'none' : '1px solid var(--fe-divider)' }}>
                      {bloco.nome}
                    </div>
                  )}
                  {bloco.itens.map((r) => (
                    <Linha key={r.id} row={r} onPatch={patch} onExcluir={excluir} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

type BlocoGrupo = { nome: string | null; itens: PlaybookRow[] }
function agruparPorBloco(rows: PlaybookRow[]): BlocoGrupo[] {
  const out: BlocoGrupo[] = []
  for (const r of rows) {
    const nome = r.bloco ?? null
    const ultimo = out[out.length - 1]
    if (ultimo && ultimo.nome === nome) ultimo.itens.push(r)
    else out.push({ nome, itens: [r] })
  }
  return out
}

// ── Linha editável ──────────────────────────────────────────────────────────

function Linha({ row, onPatch, onExcluir }: {
  row: PlaybookRow
  onPatch: (id: string, p: Partial<PlaybookRow>) => void
  onExcluir: (id: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const ancoraOpt = optOf(ANCORAS, row.ancora)
  const prioOpt = optOf(PRIORIDADES, row.prioridade_padrao)

  return (
    <div style={{ borderTop: '1px solid var(--fe-divider)', opacity: row.ativo ? 1 : 0.55, transition: 'opacity var(--fe-dur-fast)' }}>
      {/* Linha principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px 8px 14px' }}>
        <Toggle on={row.ativo} onChange={(v) => onPatch(row.id, { ativo: v })} />

        <input
          defaultValue={row.titulo}
          onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== row.titulo) onPatch(row.id, { titulo: v }) }}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
          style={{ flex: 1, minWidth: 0, height: 30, padding: '0 6px', margin: '0 -6px', border: '1px solid transparent', borderRadius: 6, background: 'transparent', fontSize: 13, fontWeight: 500, color: 'var(--fe-text-strong)', outline: 'none' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--fe-accent)'; e.currentTarget.style.background = 'var(--fe-surface)' }}
          onMouseEnter={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = 'var(--fe-hover)' }}
          onMouseLeave={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = 'transparent' }}
        />

        {/* Âncora + offset (resumo) */}
        <button onClick={() => setAberto((v) => !v)} title="Gatilho de data"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 9px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border-soft)', background: 'var(--fe-warm-white)', cursor: 'pointer', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--fe-text-muted)' }}>{ANCORA_CURTA[row.ancora] ?? row.ancora}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fe-text)' }}>{offsetLabel(row.offset_dias)}</span>
        </button>

        {/* Prioridade */}
        <SelectMenu options={PRIORIDADES} value={row.prioridade_padrao} display="flag" onChange={(v) => onPatch(row.id, { prioridade_padrao: v })}>
          {({ toggle }) => (
            <button onClick={toggle} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', flexShrink: 0, width: 66, textAlign: 'left' }}>
              {prioOpt ? <FlagInline color={prioOpt.flag ?? 'var(--fe-text-muted)'} label={prioOpt.label} /> : <span style={{ fontSize: 12.5, color: 'var(--fe-text-faint)' }}>—</span>}
            </button>
          )}
        </SelectMenu>

        <button onClick={() => setAberto((v) => !v)} aria-label={aberto ? 'Recolher' : 'Expandir'}
          style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--fe-text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: aberto ? 'rotate(90deg)' : 'none', transition: 'transform var(--fe-dur-fast)' }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <RowMenu onExcluir={() => onExcluir(row.id)} />
      </div>

      {/* Detalhe expandido */}
      {aberto && (
        <div style={{ padding: '4px 16px 16px 44px', display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Campo label="Lista de destino">
              <SelectMenu options={LISTAS} value={row.lista} onChange={(v) => onPatch(row.id, { lista: v })}>
                {({ toggle }) => { const o = optOf(LISTAS, row.lista); return <button onClick={toggle} style={triggerBtn}>{o ? <OptionPill opt={o} chevron /> : '—'}</button> }}
              </SelectMenu>
            </Campo>

            <Campo label="Âncora de data">
              <SelectMenu options={ANCORAS} value={row.ancora} onChange={(v) => onPatch(row.id, { ancora: v })}>
                {({ toggle }) => <button onClick={toggle} style={triggerBtn}>{ancoraOpt ? <OptionPill opt={ancoraOpt} chevron /> : '—'}</button>}
              </SelectMenu>
            </Campo>

            <Campo label="Offset (dias)">
              <NumberInput value={row.offset_dias} onChange={(n) => onPatch(row.id, { offset_dias: n })} />
              <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', marginLeft: 8 }}>negativo = antes · 0 = no dia · positivo = depois</span>
            </Campo>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Campo label="Setor responsável">
              <input defaultValue={row.setor_padrao ?? ''} placeholder="ex.: Operação"
                onBlur={(e) => { const v = e.target.value.trim(); if (v !== (row.setor_padrao ?? '')) onPatch(row.id, { setor_padrao: v || null }) }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                style={{ ...campoInput, width: 220 }} onFocus={focoOn} onBlurCapture={focoOff} />
            </Campo>
            <Campo label="Bloco (agrupamento)">
              <input defaultValue={row.bloco ?? ''} placeholder="ex.: B. Fornecedores e orçamento"
                onBlur={(e) => { const v = e.target.value.trim(); if (v !== (row.bloco ?? '')) onPatch(row.id, { bloco: v || null }) }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                style={{ ...campoInput, width: 300 }} onFocus={focoOn} onBlurCapture={focoOff} />
            </Campo>
          </div>

          <Campo label="Descrição padrão">
            <textarea defaultValue={row.descricao_padrao ?? ''} rows={3} placeholder="Descrição que cada task gerada vai herdar…"
              onBlur={(e) => { const v = e.target.value.trim(); if (v !== (row.descricao_padrao ?? '')) onPatch(row.id, { descricao_padrao: v || null }) }}
              style={{ width: '100%', maxWidth: 640, padding: '8px 10px', border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-surface)', fontSize: 13, lineHeight: 1.5, color: 'var(--fe-text)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--fe-accent)')}
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'var(--fe-border)')} />
          </Campo>
        </div>
      )}
    </div>
  )
}

const triggerBtn: React.CSSProperties = { border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }
const campoInput: React.CSSProperties = { height: 32, padding: '0 10px', border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-surface)', fontSize: 13, color: 'var(--fe-text)', outline: 'none' }
const focoOn = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--fe-accent)' }
const focoOff = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--fe-border)' }

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 'var(--fe-text-xs)', fontWeight: 600, color: 'var(--fe-text-muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
    </div>
  )
}

function NumberInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input type="number" defaultValue={value}
      onBlur={(e) => { const n = parseInt(e.target.value, 10); if (!Number.isNaN(n) && n !== value) onChange(n) }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
      style={{ ...campoInput, width: 88 }} onFocus={focoOn} onBlurCapture={focoOff} />
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on} title={on ? 'Ativa' : 'Inativa'}
      style={{ width: 32, height: 18, flexShrink: 0, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 2, background: on ? 'var(--fe-accent)' : 'var(--fe-border)', transition: 'background var(--fe-dur-fast)', display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', transform: on ? 'translateX(14px)' : 'translateX(0)', transition: 'transform var(--fe-dur-fast)', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }} />
    </button>
  )
}

function SaveIndicator({ estado }: { estado: 'idle' | 'saving' | 'saved' }) {
  if (estado === 'idle') return null
  return (
    <span style={{ fontSize: 12, color: 'var(--fe-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {estado === 'saving' ? 'Salvando…' : (
        <>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 7.2L5.8 9.8L11 4" stroke="var(--fe-accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Salvo
        </>
      )}
    </span>
  )
}
