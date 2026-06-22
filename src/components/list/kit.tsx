'use client'

/**
 * Kit de UI compartilhado para todas as Lists do sistema (estilo ClickUp).
 * Shell (breadcrumb + tabs/toolbar), linha de lista, grupos, slide-over,
 * página cheia de detalhe e primitivas (pill, avatar, tag, property row).
 *
 * Cada List compõe estes blocos com seus próprios campos. Fonte da verdade
 * visual: skill future-events-design (tokens --fe-*, design "Hórus").
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { type Space, SPACE_ENTREGAS, SPACE_COMERCIAL, SPACE_GESTAO, SPACE_MARKETING } from './spaces'

const AVATAR_PALETTE = ['#5B5BD6', '#D6409F', '#30A46C', '#D9730D', '#0E8FC4', '#7C66DC']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export type { Space }
export { SPACE_ENTREGAS, SPACE_COMERCIAL, SPACE_GESTAO, SPACE_MARKETING }

// ─── Datas ──────────────────────────────────────────────────────────────────

export function dataCurta(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

export function dataLonga(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

export function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean)
  if (p.length === 0) return '?'
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase()
  return (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

function corAvatar(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

export function Avatar({ nome, size = 24 }: { nome: string | null; size?: number }) {
  if (!nome) {
    return (
      <span style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, border: '1.5px dashed var(--fe-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fe-text-faint)' }}>
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
      </span>
    )
  }
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: corAvatar(nome), color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 600 }}>
      {iniciais(nome)}
    </span>
  )
}

// ─── Pill (status / badge) ──────────────────────────────────────────────────

export function Pill({ label, dot, bg, text, chevron = false }: { label: string; dot?: string; bg: string; text: string; chevron?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: dot ? 7 : 0, height: 24, padding: '0 10px', borderRadius: 'var(--fe-radius-md)', background: bg, color: text, fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
      {label}
      {chevron && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55, marginLeft: 1 }}><polyline points="6 9 12 15 18 9" /></svg>}
    </span>
  )
}

export function Tag({ label }: { label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 9px', borderRadius: 'var(--fe-radius-sm)', background: 'var(--fe-track)', color: 'var(--fe-text-soft)', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {label}
    </span>
  )
}

export function Dash() { return <span style={{ color: 'var(--fe-text-faint)' }}>—</span> }

// ─── Breadcrumb ─────────────────────────────────────────────────────────────

export function Breadcrumb({ space, segments }: { space: Space; segments: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, padding: '0 22px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0, background: 'var(--fe-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, minWidth: 0 }}>
        <SpaceBadge space={space} size={20} />
        {segments.map((s, i) => {
          const last = i === segments.length - 1
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: last ? 15 : 13.5, fontWeight: last ? 600 : 400, color: last ? 'var(--fe-text-strong)' : 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s}</span>
              {!last && <span style={{ color: 'var(--fe-text-faint)' }}>/</span>}
            </span>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button title="Convidar" style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px dashed var(--fe-border)', background: 'var(--fe-surface)', color: 'var(--fe-text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, lineHeight: 1 }}>+</button>
        <span style={{ width: 1, height: 18, background: 'var(--fe-border)' }} />
        <button style={{ height: 32, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 13, fontWeight: 500, color: 'var(--fe-text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
          Compartilhar
        </button>
        <button title="Mais" style={{ width: 30, height: 30, borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', cursor: 'pointer' }}>⋯</button>
      </div>
    </div>
  )
}

export function SpaceBadge({ space, size = 20 }: { space: Space; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: 5, background: space.color, color: space.badgeText, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.55, fontWeight: 600, flexShrink: 0 }}>{space.badge}</span>
}

function Sep() { return <span style={{ color: 'var(--fe-text-faint)' }}>/</span> }

// ─── Tabs + Toolbar ─────────────────────────────────────────────────────────

export function TabsToolbar({ grouping, busca, onBusca, addHref, addLabel }: { grouping?: string; busca: string; onBusca: (v: string) => void; addHref: string; addLabel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, padding: '0 22px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0, gap: 12, background: 'var(--fe-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
        <span style={{ height: '100%', padding: '0 4px', borderBottom: '2px solid var(--fe-accent)', fontSize: 13.5, fontWeight: 600, color: 'var(--fe-text-strong)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
          Lista
        </span>
        <ViewTab disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="18" rx="1.5" /><rect x="10.5" y="3" width="6" height="12" rx="1.5" /><rect x="18" y="3" width="3" height="18" rx="1" /></svg>
          Quadro
        </ViewTab>
        <ViewTab disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="16" y1="2" x2="16" y2="6" /></svg>
          Calendário
        </ViewTab>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <Ghost icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>}>Filtros</Ghost>
        {grouping && (
          <Ghost icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M6 12h12M10 18h4" /></svg>}>
            Agrupar: <span style={{ color: 'var(--fe-text-strong)', fontWeight: 500, marginLeft: 3 }}>{grouping}</span>
          </Ghost>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fe-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={busca} onChange={(e) => onBusca(e.target.value)} placeholder="Buscar tarefa" style={{ height: 32, width: 180, padding: '0 12px 0 30px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'var(--fe-warm-white)', fontSize: 13, color: 'var(--fe-text)', outline: 'none' }} onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--fe-accent)'; e.currentTarget.style.background = 'var(--fe-surface)' }} onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--fe-border)'; e.currentTarget.style.background = 'var(--fe-warm-white)' }} />
        </div>
        <Link href={addHref} style={{ height: 32, padding: '0 13px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: 'var(--fe-accent-fg)', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-accent-hover)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--fe-accent)')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {addLabel}
        </Link>
      </div>
    </div>
  )
}

function ViewTab({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <span style={{ height: '100%', padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 500, color: 'var(--fe-text-muted)', cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function Ghost({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button style={{ height: 32, padding: '0 11px', borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      {icon}{children}
    </button>
  )
}

// ─── Cabeçalho de colunas ───────────────────────────────────────────────────

export type Col = { label: string; width: string }

export function ColunasHeader({ cols, leftPad = 22 }: { cols: Col[]; leftPad?: number }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'grid', gridTemplateColumns: cols.map((c) => c.width).join(' '), gap: 12, padding: `0 22px 0 ${leftPad}px`, height: 38, alignItems: 'center', background: 'var(--fe-surface)', borderBottom: '1px solid var(--fe-border)' }}>
      {cols.map((c) => (
        <span key={c.label} style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</span>
      ))}
    </div>
  )
}

// ─── Linha ──────────────────────────────────────────────────────────────────

export function Row({ template, onClick, children, leftPad = 22 }: { template: string; onClick: () => void; children: React.ReactNode; leftPad?: number }) {
  return (
    <div onClick={onClick} style={{ display: 'grid', gridTemplateColumns: template, gap: 12, alignItems: 'center', minHeight: 46, padding: `0 22px 0 ${leftPad}px`, borderBottom: '1px solid var(--fe-divider)', cursor: 'pointer', transition: 'background var(--fe-dur-fast)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-row-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      {children}
    </div>
  )
}

export function CellNome({ children, avatar }: { children: React.ReactNode; avatar?: string | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {avatar !== undefined && <Avatar nome={avatar} size={24} />}
      <span style={{ fontSize: 13.8, fontWeight: 500, color: 'var(--fe-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
    </div>
  )
}

export function CellText({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 13, color: 'var(--fe-text-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
}

// ─── Grupo (status) ─────────────────────────────────────────────────────────

export function Grupo({ pill, count, addHref, children }: { pill: React.ReactNode; count: number; addHref: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(true)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, height: 38, padding: '0 22px', cursor: 'pointer', background: 'var(--fe-warm-white)' }} onClick={() => setAberto((v) => !v)}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-row-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--fe-warm-white)')}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fe-text-soft)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: aberto ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform var(--fe-dur-fast) var(--fe-ease)' }}><polyline points="6 9 12 15 18 9" /></svg>
        {pill}
        <span style={{ fontSize: 11.5, color: 'var(--fe-text-soft)', background: 'var(--fe-track)', borderRadius: 8, minWidth: 20, height: 18, padding: '0 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{count}</span>
        <Link href={addHref} onClick={(e) => e.stopPropagation()} style={{ marginLeft: 6, fontSize: 12.5, color: 'var(--fe-text-faint)', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fe-text-soft)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fe-text-faint)')}>+ Adicionar</Link>
      </div>
      {aberto && children}
      {aberto && count === 0 && (
        <div style={{ padding: '0 22px 0 48px', height: 38, display: 'flex', alignItems: 'center', fontSize: 12.5, color: 'var(--fe-text-faint)', borderBottom: '1px solid var(--fe-divider)' }}>Nenhum item</div>
      )}
    </div>
  )
}

// ─── Slide-over ─────────────────────────────────────────────────────────────

export function SlideOver({ space, segments, expandHref, onClose, statusSlot, title, children }: { space: Space; segments: string[]; expandHref: string; onClose: () => void; statusSlot?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="fe-fade-in" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--fe-backdrop)', zIndex: 60 }} />
      <aside className="fe-slide-in" style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'var(--fe-panel-w)', maxWidth: '92vw', background: 'var(--fe-surface)', boxShadow: 'var(--fe-shadow-panel)', zIndex: 61, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, padding: '0 12px 0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--fe-text-muted)', minWidth: 0 }}>
            <SpaceBadge space={space} size={17} />
            {segments.map((s, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <span style={{ color: i === segments.length - 1 ? 'var(--fe-text-soft)' : 'var(--fe-text-muted)', fontWeight: i === segments.length - 1 ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s}</span>
                {i < segments.length - 1 && <Sep />}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <Link href={expandHref} title="Expandir" style={iconBtn}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg></Link>
            <button title="Mais" style={iconBtn as React.CSSProperties}>⋯</button>
            <button onClick={onClose} title="Fechar" style={iconBtn as React.CSSProperties}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px 40px' }}>
          {statusSlot && <div style={{ marginBottom: 18 }}>{statusSlot}</div>}
          <h1 style={{ fontFamily: 'var(--font-geist), sans-serif', fontWeight: 600, fontSize: 24, lineHeight: 1.25, letterSpacing: '-0.01em', color: 'var(--fe-text-strong)', margin: '0 0 22px' }}>{title}</h1>
          <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
        </div>
      </aside>
    </>
  )
}

export function PropRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', minHeight: 36 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fe-text-muted)' }}>{icon}{label}</span>
      <span style={{ fontSize: 13.5, color: 'var(--fe-text)' }}>{children}</span>
    </div>
  )
}

const iconBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 16 }

// ─── Página cheia (overlay) ─────────────────────────────────────────────────

export function FullPage({ space, segments, backHref, topActions, statusSlot, title, body, details, criadoEm }: { space: Space; segments: string[]; backHref: string; topActions?: React.ReactNode; statusSlot?: React.ReactNode; title?: string; body: React.ReactNode; details: React.ReactNode; criadoEm?: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'var(--fe-surface)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, padding: '0 16px 0 22px', borderBottom: '1px solid var(--fe-border-soft)', background: 'var(--fe-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fe-text-muted)', minWidth: 0 }}>
          <SpaceBadge space={space} />
          {segments.map((s, i) => {
            const last = i === segments.length - 1
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ fontWeight: last ? 600 : 400, color: last ? 'var(--fe-text-strong)' : 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s}</span>
                {!last && <Sep />}
              </span>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {topActions}
          <Link href={backHref} style={{ ...ghostBtn, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 3 3 3 3 9" /><polyline points="15 21 21 21 21 15" /><line x1="3" y1="3" x2="10" y2="10" /><line x1="21" y1="21" x2="14" y2="14" /></svg>
            Recolher
          </Link>
          <Link href={backHref} title="Fechar" style={{ width: 32, height: 32, borderRadius: 'var(--fe-radius-md)', background: 'transparent', color: 'var(--fe-text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </Link>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 32px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 332px', gap: 36, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>
            {statusSlot && <div style={{ marginBottom: 18 }}>{statusSlot}</div>}
            {title && <h1 style={{ fontFamily: 'var(--font-geist), sans-serif', fontWeight: 600, fontSize: 29, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--fe-text-strong)', margin: '0 0 24px' }}>{title}</h1>}
            {body}
          </div>
          <aside style={{ position: 'sticky', top: 0, background: 'var(--fe-surface)', border: '1px solid var(--fe-border-soft)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--fe-divider)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Detalhes</span>
            </div>
            <div style={{ padding: '4px 18px 14px' }}>{details}</div>
            {criadoEm && (
              <div style={{ padding: '10px 18px', borderTop: '1px solid var(--fe-divider)' }}>
                <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)' }}>Criado em {criadoEm}</span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

export function DetRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '104px 1fr', alignItems: 'center', minHeight: 40, borderBottom: last ? 'none' : '1px solid var(--fe-divider)' }}>
      <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--fe-text)' }}>{children}</span>
    </div>
  )
}

// ─── Estado vazio ───────────────────────────────────────────────────────────

export function EmptyState({ icon, titulo, descricao, addHref, addLabel }: { icon: React.ReactNode; titulo: string; descricao: string; addHref: string; addLabel: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 14, padding: 40 }}>
      <div style={{ width: 54, height: 54, borderRadius: 14, background: 'var(--fe-warm-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fe-text-faint)' }}>{icon}</div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-geist), sans-serif', fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em', color: 'var(--fe-text-strong)', margin: '0 0 6px' }}>{titulo}</p>
        <p style={{ fontSize: 13, color: 'var(--fe-text-muted)', maxWidth: 280, margin: 0, lineHeight: 1.5 }}>{descricao}</p>
      </div>
      <Link href={addHref} style={{ marginTop: 4, height: 34, padding: '0 16px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: 'var(--fe-accent-fg)', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        {addLabel}
      </Link>
    </div>
  )
}

export const ghostBtn: React.CSSProperties = { height: 32, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 13, fontWeight: 500, color: 'var(--fe-text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }
export const accentBtn = (disabled = false): React.CSSProperties => ({ height: 32, padding: '0 16px', borderRadius: 'var(--fe-radius-md)', background: disabled ? 'var(--fe-border)' : 'var(--fe-accent)', color: disabled ? 'var(--fe-text-muted)' : 'var(--fe-accent-fg)', border: 'none', fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer' })
export const inputStyle: React.CSSProperties = { width: '100%', height: 36, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 13.5, color: 'var(--fe-text)', outline: 'none' }

// ─── Mostrar/ocultar campos ──────────────────────────────────────────────────

export function useHiddenFields(table: string) {
  const lsKey = `fe-hidden-fields:${table}`
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(lsKey)
      if (raw) setHidden(new Set(JSON.parse(raw) as string[]))
    } catch {}
  }, [lsKey])

  function toggle(key: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      try { localStorage.setItem(lsKey, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  function reset() {
    setHidden(new Set())
    try { localStorage.removeItem(lsKey) } catch {}
  }

  return { hidden, toggle, reset }
}
