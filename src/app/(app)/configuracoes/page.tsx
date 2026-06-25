'use client'

import Link from 'next/link'
import { SETTINGS_SECTIONS, SettingsIcon } from '@/components/settings/sections'

export default function ConfiguracoesOverviewPage() {
  const sections = SETTINGS_SECTIONS.filter((s) => !s.exact)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 28px 64px' }}>
      <header style={{ marginBottom: 24 }}>
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
          Configurações
        </h1>
        <p style={{ fontSize: 'var(--fe-text-base)', color: 'var(--fe-text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
          Automações, acessos e ajustes do workspace da Future Events.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 12,
        }}
      >
        {sections.map((section) => (
          <Link
            key={section.slug}
            href={section.href}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: 16,
              border: '1px solid var(--fe-border)',
              borderRadius: 'var(--fe-radius-lg)',
              background: 'var(--fe-surface)',
              textDecoration: 'none',
              boxShadow: 'var(--fe-shadow-card)',
              transition: 'box-shadow var(--fe-dur-fast), border-color var(--fe-dur-fast)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.boxShadow = 'var(--fe-shadow-card-hover)'
              el.style.borderColor = '#D6D3CB'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.boxShadow = 'var(--fe-shadow-card)'
              el.style.borderColor = 'var(--fe-border)'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 34,
                height: 34,
                borderRadius: 'var(--fe-radius-md)',
                background: 'var(--fe-warm-white)',
                color: 'var(--fe-text-soft)',
                flexShrink: 0,
              }}
            >
              <SettingsIcon icon={section.icon} size={18} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--fe-text-md)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: 'var(--fe-text-strong)',
                  lineHeight: 1.3,
                }}
              >
                {section.label}
              </span>
              <span style={{ display: 'block', fontSize: 'var(--fe-text-sm)', color: 'var(--fe-text-muted)', marginTop: 3, lineHeight: 1.45 }}>
                {section.summary}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
