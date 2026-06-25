import type { ReactNode } from 'react'
import { SettingsIcon, type SettingsIconKey } from './sections'

/**
 * Cabeçalho padrão de uma página de configuração. `planned` lista o escopo
 * previsto da seção enquanto ela ainda não foi construída — herda o vocabulário
 * visual do sistema (tag neutra "Em construção", sem cor de ação).
 */
export function SectionScaffold({
  icon,
  title,
  summary,
  planned,
  children,
}: {
  icon: SettingsIconKey
  title: string
  summary: string
  planned?: string[]
  children?: ReactNode
}) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 28px 64px' }}>
      {/* Cabeçalho */}
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 'var(--fe-radius-lg)',
            background: 'var(--fe-warm-white)',
            color: 'var(--fe-text-soft)',
            flexShrink: 0,
          }}
        >
          <SettingsIcon icon={icon} size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1
              style={{
                fontFamily: 'var(--font-geist), sans-serif',
                fontSize: 'var(--fe-text-2xl)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: 'var(--fe-text-strong)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            {planned && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: 'var(--fe-radius-sm)',
                  fontSize: 'var(--fe-text-xs)',
                  fontWeight: 600,
                  background: 'var(--fe-status-todo-tint)',
                  color: 'var(--fe-status-todo-text)',
                }}
              >
                Em construção
              </span>
            )}
          </div>
          <p style={{ fontSize: 'var(--fe-text-base)', color: 'var(--fe-text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
            {summary}
          </p>
        </div>
      </header>

      {/* Conteúdo real da seção (quando houver) */}
      {children}

      {/* Preview do escopo previsto */}
      {planned && (
        <section style={{ marginTop: 24 }}>
          <div
            style={{
              fontSize: 'var(--fe-text-xs)',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--fe-text-muted)',
              marginBottom: 10,
            }}
          >
            O que vai ter aqui
          </div>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              border: '1px solid var(--fe-border)',
              borderRadius: 'var(--fe-radius-lg)',
              overflow: 'hidden',
              background: 'var(--fe-surface)',
            }}
          >
            {planned.map((item, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 11,
                  padding: '12px 16px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--fe-divider)',
                  fontSize: 'var(--fe-text-base)',
                  color: 'var(--fe-text)',
                  lineHeight: 1.5,
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--fe-text-faint)"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: 1 }}
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
