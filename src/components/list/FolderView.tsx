'use client'

import { useState } from 'react'
import { DataList } from './DataList'
import { Breadcrumb, SpaceBadge } from './kit'
import type { ListConfig, Row, OptionsMap } from './types'
import type { EmbedMap } from './load'
import type { Space } from './spaces'

export type FolderViewDef = {
  key: string
  label: string
  config: ListConfig
  rows: Row[]
  options: OptionsMap
  embeds: EmbedMap
}

export function FolderView({
  space,
  breadcrumb,
  views,
}: {
  space: Space
  breadcrumb: string[]
  views: FolderViewDef[]
}) {
  const [activeKey, setActiveKey] = useState(views[0]?.key ?? '')
  const active = views.find((v) => v.key === activeKey) ?? views[0]

  if (!active) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--fe-surface)' }}>
      {/* Breadcrumb do folder */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0 }}>
        <SpaceBadge space={space} size={18} />
        {breadcrumb.map((seg, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: 'var(--fe-icon)', fontSize: 13 }}>/</span>}
            <span style={{ fontSize: 13, fontWeight: i === breadcrumb.length - 1 ? 600 : 400, color: i === breadcrumb.length - 1 ? 'var(--fe-text-strong)' : 'var(--fe-text-muted)' }}>
              {seg}
            </span>
          </span>
        ))}
      </div>

      {/* Abas de views do folder (visíveis só se houver mais de uma) */}
      {views.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 38, padding: '0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0, overflowX: 'auto' }}>
          {views.map((v) => {
            const isActive = v.key === activeKey
            return (
              <button
                key={v.key}
                onClick={() => setActiveKey(v.key)}
                style={{
                  height: '100%',
                  padding: '0 14px',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: isActive ? '2px solid var(--fe-black)' : '2px solid transparent',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--fe-black)' : 'var(--fe-text-soft)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--fe-text)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--fe-text-soft)' }}
              >
                {v.label}
              </button>
            )
          })}
        </div>
      )}

      {/* DataList da view ativa — sem o breadcrumb próprio dela (já está no folder header) */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <DataList
          key={active.key}
          config={{ ...active.config, hideBreadcrumb: true }}
          rows={active.rows}
          options={active.options}
          embeds={active.embeds}
        />
      </div>
    </div>
  )
}
