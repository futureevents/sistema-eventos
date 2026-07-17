'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Comment = {
  id: string
  task_id: string
  task_table: string
  author: string
  body: string
  criado_em: string
  mentions: string[]
  href: string | null
  listLabel: string
  resolved: boolean
}

type Tab = 'abertas' | 'fechadas'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

// Comentários são salvos como HTML (editor rich text) — extrai só o texto p/ o preview.
function preview(body: string) {
  return body
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

const iconBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  border: 'none', borderLeft: '1px solid var(--fe-border)', background: 'transparent',
  padding: '0 14px', cursor: 'pointer', color: 'var(--fe-text-faint)',
  fontSize: 12, fontWeight: 600, flexShrink: 0,
  transition: 'background var(--fe-dur-fast), color var(--fe-dur-fast)',
} as const

function CommentCard({ c, onToggle }: { c: Comment; onToggle: (c: Comment, resolved: boolean) => void }) {
  const clickable = Boolean(c.href)
  const cardInner = {
    flex: 1, minWidth: 0, display: 'block', padding: '12px 16px',
    textDecoration: 'none', cursor: clickable ? 'pointer' : 'default',
    transition: 'background var(--fe-dur-fast)',
  } as const

  const content = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: 'var(--fe-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: 'var(--fe-accent-fg)', flexShrink: 0,
          }}>
            {c.author.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fe-text-strong)' }}>{c.author}</span>
          <span style={{ fontSize: 12, color: 'var(--fe-text-faint)', padding: '1px 7px', borderRadius: 20, background: 'var(--fe-track)', whiteSpace: 'nowrap' }}>
            {c.listLabel}
          </span>
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', flexShrink: 0 }}>{timeAgo(c.criado_em)}</span>
      </div>
      <p style={{
        margin: 0, fontSize: 13.5, color: 'var(--fe-text)',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        lineHeight: 1.5,
      }}>
        {preview(c.body)}
      </p>
    </>
  )

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderRadius: 'var(--fe-radius-md)', border: '1px solid var(--fe-border)',
      background: 'var(--fe-surface)', overflow: 'hidden',
    }}>
      {clickable ? (
        <Link
          href={c.href!}
          style={cardInner}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          {content}
        </Link>
      ) : (
        <div style={cardInner}>{content}</div>
      )}

      <button
        type="button"
        title={c.resolved ? 'Reabrir' : 'Concluir'}
        onClick={() => onToggle(c, !c.resolved)}
        style={iconBtn}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--fe-hover)'; e.currentTarget.style.color = 'var(--fe-accent)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fe-text-faint)' }}
      >
        {c.resolved ? (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8a5 5 0 1 1 1.5 3.5M3 8V5m0 3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </button>
    </div>
  )
}

function TabButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '7px 4px', border: 'none', background: 'transparent', cursor: 'pointer',
        fontSize: 13.5, fontWeight: 600,
        color: active ? 'var(--fe-text-strong)' : 'var(--fe-text-soft)',
        borderBottom: `2px solid ${active ? 'var(--fe-accent)' : 'transparent'}`,
        marginBottom: -1,
      }}
    >
      {label}
      <span style={{
        fontSize: 11.5, fontWeight: 600, padding: '1px 7px', borderRadius: 20,
        background: active ? 'var(--fe-accent-dim)' : 'var(--fe-track)',
        color: active ? 'var(--fe-accent)' : 'var(--fe-text-faint)',
      }}>
        {count}
      </span>
    </button>
  )
}

export function InboxClient({ mentions, currentUserId }: { mentions: Comment[]; currentUserId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState<Comment[]>(mentions)
  const [tab, setTab] = useState<Tab>('abertas')

  const abertas = items.filter((c) => !c.resolved)
  const fechadas = items.filter((c) => c.resolved)
  const visible = tab === 'abertas' ? abertas : fechadas

  async function onToggle(c: Comment, resolved: boolean) {
    // Otimista: move o item de aba na hora.
    setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, resolved } : x)))
    const { error } = resolved
      ? await supabase.from('mention_status').upsert({ comment_id: c.id, user_id: currentUserId })
      : await supabase.from('mention_status').delete().eq('comment_id', c.id).eq('user_id', currentUserId)
    // Reverte se falhar.
    if (error) setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, resolved: !resolved } : x)))
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fe-black)', margin: 0, marginBottom: 4 }}>
          Inbox
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--fe-text-soft)', margin: 0 }}>
          Comentários onde você foi mencionado
        </p>
      </div>

      {/* Sub-abas */}
      <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--fe-border)', marginBottom: 20 }}>
        <TabButton label="Em aberto" count={abertas.length} active={tab === 'abertas'} onClick={() => setTab('abertas')} />
        <TabButton label="Fechadas" count={fechadas.length} active={tab === 'fechadas'} onClick={() => setTab('fechadas')} />
      </div>

      {visible.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, padding: '64px 0', color: 'var(--fe-text-faint)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 14 }}>
            {tab === 'abertas' ? 'Nada em aberto por aqui' : 'Nenhuma mensagem fechada'}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map((c) => (
            <CommentCard key={c.id} c={c} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}
