'use client'

import Link from 'next/link'

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
}

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

export function InboxClient({ mentions }: { mentions: Comment[]; currentUserId: string }) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fe-black)', margin: 0, marginBottom: 4 }}>
          Inbox
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--fe-text-soft)', margin: 0 }}>
          Comentários onde você foi mencionado
        </p>
      </div>

      {mentions.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, padding: '64px 0', color: 'var(--fe-text-faint)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 14 }}>Nenhuma menção ainda</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {mentions.map((c) => {
            const clickable = Boolean(c.href)
            const cardStyle = {
              display: 'block',
              padding: '12px 16px',
              borderRadius: 'var(--fe-radius-md)',
              border: '1px solid var(--fe-border)',
              background: 'var(--fe-surface)',
              textDecoration: 'none',
              transition: 'background var(--fe-dur-fast)',
              cursor: clickable ? 'pointer' : 'default',
            } as const

            const content = (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: 'var(--fe-accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: 'var(--fe-accent-fg)', flexShrink: 0,
                    }}>
                      {c.author.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fe-text-strong)' }}>{c.author}</span>
                    <span style={{ fontSize: 12, color: 'var(--fe-text-faint)', padding: '1px 7px', borderRadius: 20, background: 'var(--fe-track)' }}>
                      {c.listLabel}
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)' }}>{timeAgo(c.criado_em)}</span>
                </div>
                <p style={{
                  margin: 0, fontSize: 13.5, color: 'var(--fe-text)',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  lineHeight: 1.5,
                }}>
                  {c.body}
                </p>
              </>
            )

            return clickable ? (
              <Link
                key={c.id}
                href={c.href!}
                style={cardStyle}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-surface)')}
              >
                {content}
              </Link>
            ) : (
              <div key={c.id} style={cardStyle}>
                {content}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
