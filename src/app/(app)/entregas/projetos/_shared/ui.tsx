import {
  type PrioridadeTask, type StatusTask,
  PRIORIDADE_LABEL, PRIORIDADE_FLAG, STATUS_LABEL, STATUS_PILL, AVATAR_PALETTE,
} from './types'

// ─── Datas ──────────────────────────────────────────────────────────────────

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function dataCurta(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

export function dataLonga(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/** Estado do prazo derivado da data + status (cores não-fixas, conforme tokens). */
export function estadoPrazo(iso: string | null, status: StatusTask): { texto: string; cor: string; bold: boolean } | null {
  if (!iso) return null
  const curta = dataCurta(iso)
  if (status === 'concluida' || status === 'cancelada') {
    return { texto: curta, cor: 'var(--fe-text-faint)', bold: false }
  }
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(iso + 'T00:00:00')
  const dias = Math.round((alvo.getTime() - hoje.getTime()) / 86400000)
  if (dias < 0) return { texto: `Atrasada · ${curta}`, cor: '#DC2626', bold: true }
  if (dias <= 3) return { texto: curta, cor: '#C2410C', bold: false }
  return { texto: curta, cor: 'var(--fe-text-soft)', bold: false }
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function corAvatar(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

export function Avatar({ nome, id, size = 24 }: { nome: string | null; id: string | null; size?: number }) {
  if (!nome) {
    // responsável não atribuído
    return (
      <span
        style={{
          width: size, height: size, borderRadius: '50%', flexShrink: 0,
          border: '1.4px dashed var(--fe-border)', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--fe-text-faint)',
        }}
      >
        <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="4" r="2.2" stroke="currentColor" strokeWidth="1.1" />
          <path d="M2 10.2C2 8.4 3.8 7.4 6 7.4S10 8.4 10 10.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  return (
    <span
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: corAvatar(id ?? nome), color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42, fontWeight: 600, letterSpacing: '0.01em',
      }}
    >
      {iniciais(nome)}
    </span>
  )
}

// ─── Status ─────────────────────────────────────────────────────────────────

export function StatusPill({ status, chevron = false }: { status: StatusTask; chevron?: boolean }) {
  const s = STATUS_PILL[status]
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, height: 24,
        padding: chevron ? '0 8px 0 10px' : '0 10px', borderRadius: 'var(--fe-radius-md)',
        background: s.bg, color: s.text, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 2.5, background: s.dot, flexShrink: 0 }} />
      {STATUS_LABEL[status]}
      {chevron && (
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ opacity: 0.5 }}>
          <path d="M1.5 3L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}

// ─── Prioridade ───────────────────────────────────────────────────────────────

export function PriorityFlag({ prioridade, label = false }: { prioridade: PrioridadeTask; label?: boolean }) {
  const cor = PRIORIDADE_FLAG[prioridade]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
        <path d="M3 1.5V11.5" stroke={cor} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M3 2H9.5L8 4.25L9.5 6.5H3" fill={cor} fillOpacity={prioridade === 'baixa' ? 0.5 : 1} stroke={cor} strokeWidth="0.6" strokeLinejoin="round" />
      </svg>
      {label && <span style={{ fontSize: 12.5, fontWeight: 500, color: cor }}>{PRIORIDADE_LABEL[prioridade]}</span>}
    </span>
  )
}

// ─── Prazo (texto) ─────────────────────────────────────────────────────────────

export function PrazoText({ iso, status }: { iso: string | null; status: StatusTask }) {
  const e = estadoPrazo(iso, status)
  if (!e) return <span style={{ color: 'var(--fe-text-faint)' }}>—</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: e.cor, fontWeight: e.bold ? 600 : 400, fontSize: 12.5 }}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.85, flexShrink: 0 }}>
        <rect x="2" y="2.8" width="10" height="9.2" rx="1.6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2 5.2H12M4.6 1.6V3.4M9.4 1.6V3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {e.texto}
    </span>
  )
}
