'use client'

/**
 * Kit de UI compartilhado para todas as Lists do sistema (estilo ClickUp).
 * Shell (breadcrumb + tabs/toolbar), linha de lista, grupos, slide-over,
 * página cheia de detalhe e primitivas (pill, avatar, tag, property row).
 *
 * Cada List compõe estes blocos com seus próprios campos. Fonte da verdade
 * visual: skill future-events-design (tokens --fe-*).
 */

import { useState } from 'react'
import Link from 'next/link'

const AVATAR_PALETTE = ['#6E56CF', '#00A368', '#3B82F6', '#E8833A', '#D6457D', '#0EA5A4']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export type Space = { badge: string; color: string; badgeText: string }

export const SPACE_ENTREGAS: Space = { badge: 'E', color: '#00C47A', badgeText: '#003D26' }
export const SPACE_COMERCIAL: Space = { badge: 'C', color: '#6E56CF', badgeText: '#FFFFFF' }

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
      <span style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, border: '1.4px dashed var(--fe-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fe-text-faint)' }}>
        <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.2" stroke="currentColor" strokeWidth="1.1" /><path d="M2 10.2C2 8.4 3.8 7.4 6 7.4S10 8.4 10 10.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: dot ? 7 : 0, height: 24, padding: '0 10px', borderRadius: 'var(--fe-radius-md)', background: bg, color: text, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {dot && <span style={{ width: 8, height: 8, borderRadius: 2.5, background: dot, flexShrink: 0 }} />}
      {label}
      {chevron && <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ opacity: 0.5, marginLeft: 1 }}><path d="M1.5 3L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </span>
  )
}

export function Tag({ label }: { label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: 'var(--fe-radius-sm)', background: 'rgba(110,86,207,0.10)', color: '#5B3FD0', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {label}
    </span>
  )
}

export function Dash() { return <span style={{ color: 'var(--fe-text-faint)' }}>—</span> }

// ─── Breadcrumb ─────────────────────────────────────────────────────────────

export function Breadcrumb({ space, segments }: { space: Space; segments: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 46, padding: '0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0, background: 'var(--fe-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, minWidth: 0 }}>
        <SpaceBadge space={space} />
        {segments.map((s, i) => {
          const last = i === segments.length - 1
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontWeight: last ? 600 : 400, color: last ? 'var(--fe-text-strong)' : 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s}</span>
              {!last && <span style={{ color: 'var(--fe-text-faint)' }}>/</span>}
            </span>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button title="Convidar" style={{ width: 24, height: 24, borderRadius: '50%', border: '1.4px dashed var(--fe-border)', background: 'var(--fe-surface)', color: 'var(--fe-text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, lineHeight: 1 }}>+</button>
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

export function SpaceBadge({ space, size = 19 }: { space: Space; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: 5, background: space.color, color: space.badgeText, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.58, fontWeight: 700, flexShrink: 0 }}>{space.badge}</span>
}

function Sep() { return <span style={{ color: 'var(--fe-text-faint)' }}>/</span> }

// ─── Tabs + Toolbar ─────────────────────────────────────────────────────────

export function TabsToolbar({ grouping, busca, onBusca, addHref, addLabel }: { grouping?: string; busca: string; onBusca: (v: string) => void; addHref: string; addLabel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 14px 0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0, gap: 12, background: 'var(--fe-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
        <span style={{ height: '100%', padding: '0 12px', borderBottom: '2px solid var(--fe-black)', fontSize: 13, fontWeight: 600, color: 'var(--fe-black)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4H12M2 7H12M2 10H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          Lista
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <Ghost icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1.5 2.5H12.5L8.5 7.2V11L5.5 12.5V7.2L1.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>}>Filtros</Ghost>
        <Ghost icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 3.5H11M4.5 7H9.5M6 10.5H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>}>Ordenar</Ghost>
        {grouping && (
          <Ghost icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="2" y="8" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="8" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2" /></svg>}>
            Agrupar: <span style={{ color: 'var(--fe-text)', fontWeight: 600, marginLeft: 3 }}>{grouping}</span>
          </Ghost>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', left: 9, opacity: 0.4, pointerEvents: 'none' }}><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" /><path d="M8 8L10.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          <input value={busca} onChange={(e) => onBusca(e.target.value)} placeholder="Buscar" style={{ height: 30, width: 150, padding: '0 10px 0 26px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 12.5, color: 'var(--fe-text)', outline: 'none' }} onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--fe-accent)')} onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--fe-border)')} />
        </div>
        <Link href={addHref} style={{ height: 30, padding: '0 14px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: 'var(--fe-accent-dark)', fontSize: 12.5, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          {addLabel}
        </Link>
      </div>
    </div>
  )
}

function Ghost({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button style={{ height: 30, padding: '0 10px', borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-warm-white)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      {icon}{children}
    </button>
  )
}

// ─── Cabeçalho de colunas ───────────────────────────────────────────────────

export type Col = { label: string; width: string }

export function ColunasHeader({ cols, leftPad = 20 }: { cols: Col[]; leftPad?: number }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'grid', gridTemplateColumns: cols.map((c) => c.width).join(' '), gap: 12, padding: `0 20px 0 ${leftPad}px`, height: 34, alignItems: 'center', background: 'var(--fe-surface)', borderBottom: '1px solid var(--fe-border-soft)' }}>
      {cols.map((c) => (
        <span key={c.label} style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</span>
      ))}
    </div>
  )
}

// ─── Linha ──────────────────────────────────────────────────────────────────

export function Row({ template, onClick, children, leftPad = 20 }: { template: string; onClick: () => void; children: React.ReactNode; leftPad?: number }) {
  return (
    <div onClick={onClick} style={{ display: 'grid', gridTemplateColumns: template, gap: 12, alignItems: 'center', minHeight: 44, padding: `0 20px 0 ${leftPad}px`, borderBottom: '1px solid var(--fe-divider)', cursor: 'pointer', transition: 'background var(--fe-dur-fast)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF9F4')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      {children}
    </div>
  )
}

export function CellNome({ children, avatar }: { children: React.ReactNode; avatar?: string | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {avatar !== undefined && <Avatar nome={avatar} size={24} />}
      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fe-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
    </div>
  )
}

export function CellText({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
}

// ─── Grupo (status) ─────────────────────────────────────────────────────────

export function Grupo({ pill, count, addHref, children }: { pill: React.ReactNode; count: number; addHref: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(true)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 20px', cursor: 'pointer', borderBottom: '1px solid var(--fe-divider)' }} onClick={() => setAberto((v) => !v)}>
        <svg width="10" height="10" viewBox="0 0 9 9" fill="none" style={{ transform: aberto ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform var(--fe-dur-fast) var(--fe-ease)', color: 'var(--fe-text-muted)' }}><path d="M3 1.5L6 4.5L3 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {pill}
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--fe-text-muted)' }}>{count}</span>
        <Link href={addHref} onClick={(e) => e.stopPropagation()} style={{ marginLeft: 6, fontSize: 12.5, color: 'var(--fe-text-faint)', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fe-text-soft)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fe-text-faint)')}>+ Adicionar</Link>
      </div>
      {aberto && children}
      {aberto && count === 0 && (
        <div style={{ padding: '0 20px 0 48px', height: 38, display: 'flex', alignItems: 'center', fontSize: 12.5, color: 'var(--fe-text-faint)', borderBottom: '1px solid var(--fe-divider)' }}>Nenhum item</div>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 46, padding: '0 12px 0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0 }}>
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
            <Link href={expandHref} title="Expandir" style={iconBtn}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 2H12V5.5M12 2L8 6M5.5 12H2V8.5M2 12L6 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
            <button title="Mais" style={iconBtn as React.CSSProperties}>⋯</button>
            <button onClick={onClose} title="Fechar" style={iconBtn as React.CSSProperties}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {statusSlot && <div style={{ marginBottom: 18 }}>{statusSlot}</div>}
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 25, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--fe-text-strong)', margin: '0 0 22px' }}>{title}</h1>
          <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
        </div>
      </aside>
    </>
  )
}

export function PropRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', minHeight: 38 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--fe-text-muted)' }}>{icon}{label}</span>
      <span style={{ fontSize: 13, color: 'var(--fe-text)' }}>{children}</span>
    </div>
  )
}

const iconBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 16 }

// ─── Página cheia (overlay) ─────────────────────────────────────────────────

export function FullPage({ space, segments, backHref, topActions, statusSlot, title, body, details, criadoEm }: { space: Space; segments: string[]; backHref: string; topActions?: React.ReactNode; statusSlot?: React.ReactNode; title?: string; body: React.ReactNode; details: React.ReactNode; criadoEm?: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'var(--fe-warm-white)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 50, padding: '0 16px 0 22px', borderBottom: '1px solid var(--fe-border-soft)', background: 'var(--fe-surface)', flexShrink: 0 }}>
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
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5.5 2H2V5.5M2 2L6 6M8.5 12H12V8.5M12 12L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Recolher
          </Link>
          <Link href={backHref} title="Fechar" style={{ width: 32, height: 32, borderRadius: 'var(--fe-radius-md)', background: 'transparent', color: 'var(--fe-text-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          </Link>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 32px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 332px', gap: 36, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>
            {statusSlot && <div style={{ marginBottom: 18 }}>{statusSlot}</div>}
            {title && <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.14, letterSpacing: '-0.03em', color: 'var(--fe-text-strong)', margin: '0 0 24px' }}>{title}</h1>}
            {body}
          </div>
          <aside style={{ position: 'sticky', top: 0, background: 'var(--fe-surface)', border: '1px solid var(--fe-border-soft)', borderRadius: 'var(--fe-radius-lg)', boxShadow: 'var(--fe-shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--fe-divider)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Detalhes</span>
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
        <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--fe-text-strong)', margin: '0 0 6px' }}>{titulo}</p>
        <p style={{ fontSize: 13, color: 'var(--fe-text-muted)', maxWidth: 280, margin: 0, lineHeight: 1.5 }}>{descricao}</p>
      </div>
      <Link href={addHref} style={{ marginTop: 4, height: 34, padding: '0 16px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: 'var(--fe-accent-dark)', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
        {addLabel}
      </Link>
    </div>
  )
}

export const ghostBtn: React.CSSProperties = { height: 32, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'transparent', fontSize: 12.5, fontWeight: 500, color: 'var(--fe-text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }
export const accentBtn = (disabled = false): React.CSSProperties => ({ height: 32, padding: '0 16px', borderRadius: 'var(--fe-radius-md)', background: disabled ? 'var(--fe-border)' : 'var(--fe-accent)', color: disabled ? 'var(--fe-text-muted)' : 'var(--fe-accent-dark)', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer' })
export const inputStyle: React.CSSProperties = { width: '100%', height: 36, padding: '0 12px', borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', fontSize: 13.5, color: 'var(--fe-text)', outline: 'none' }
