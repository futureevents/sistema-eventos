'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SETTINGS_SECTIONS,
  SETTINGS_GROUP_ORDER,
  SettingsIcon,
  type SettingsSection,
} from './sections'

function isActive(section: SettingsSection, pathname: string) {
  if (section.exact) return pathname === section.href
  return pathname === section.href || pathname.startsWith(section.href + '/')
}

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const active = SETTINGS_SECTIONS.find((s) => isActive(s, pathname))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb */}
      <div
        className="fe-bar-pad"
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 44,
          padding: '0 20px',
          borderBottom: '1px solid var(--fe-border-soft)',
          background: 'var(--fe-surface)',
          flexShrink: 0,
          gap: 6,
          fontSize: 'var(--fe-text-sm)',
          color: 'var(--fe-text-muted)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            borderRadius: 5,
            background: 'var(--fe-warm-white)',
            color: 'var(--fe-text-soft)',
            marginRight: 2,
          }}
        >
          <SettingsIcon icon="gear" size={12} />
        </span>
        <span>Configurações</span>
        {active && (
          <>
            <span>/</span>
            <span style={{ fontWeight: 600, color: 'var(--fe-text)' }}>{active.label}</span>
          </>
        )}
      </div>

      {/* Nav secundária + conteúdo */}
      <div className="fe-settings-body" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <nav className="fe-settings-nav" aria-label="Seções de configuração">
          {SETTINGS_GROUP_ORDER.map((group) => {
            const items = SETTINGS_SECTIONS.filter((s) => s.group === group)
            if (items.length === 0) return null
            return (
              <div key={group} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 'var(--fe-text-xs)',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--fe-text-muted)',
                    padding: '0 10px',
                    marginBottom: 4,
                  }}
                >
                  {group}
                </div>
                {items.map((section) => {
                  const activeItem = isActive(section, pathname)
                  return (
                    <Link
                      key={section.slug}
                      href={section.href}
                      className="fe-nav-row"
                      aria-current={activeItem ? 'page' : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        height: 34,
                        padding: '0 10px',
                        borderRadius: 'var(--fe-radius-md)',
                        fontSize: 'var(--fe-text-base)',
                        fontWeight: activeItem ? 600 : 400,
                        color: activeItem ? 'var(--fe-accent-dark)' : 'var(--fe-text-soft)',
                        background: activeItem ? 'var(--fe-accent-dim)' : 'transparent',
                        textDecoration: 'none',
                        transition: 'background var(--fe-dur-fast)',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) =>
                        !activeItem && ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')
                      }
                      onMouseLeave={(e) =>
                        !activeItem && ((e.currentTarget as HTMLElement).style.background = 'transparent')
                      }
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          color: activeItem ? 'var(--fe-accent)' : 'var(--fe-text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        <SettingsIcon icon={section.icon} size={16} />
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{section.label}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        <div className="fe-settings-content" style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
