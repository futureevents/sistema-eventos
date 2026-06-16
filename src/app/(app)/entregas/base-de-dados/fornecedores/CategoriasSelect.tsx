'use client'

import { useState, useRef, useEffect } from 'react'
import { CATEGORIAS_FORNECEDOR } from './categorias'

export function CategoriasSelect({
  value,
  onChange,
}: {
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggle(cat: string) {
    if (value.includes(cat)) {
      onChange(value.filter((c) => c !== cat))
    } else {
      onChange([...value, cat])
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          minHeight: 36,
          padding: '6px 12px',
          borderRadius: 'var(--fe-radius-md)',
          border: '1px solid var(--fe-border)',
          background: 'var(--fe-surface)',
          fontSize: 13.5,
          color: 'var(--fe-text)',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          alignItems: 'center',
        }}
      >
        {value.length === 0 ? (
          <span style={{ color: 'var(--fe-text-faint)' }}>Selecionar categorias…</span>
        ) : (
          value.map((cat) => (
            <span
              key={cat}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 20,
                padding: '0 7px',
                borderRadius: 'var(--fe-radius-pill)',
                background: 'var(--fe-status-todo-tint)',
                color: 'var(--fe-status-todo-text)',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {cat}
            </span>
          ))
        )}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.4 }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'var(--fe-surface)',
            border: '1px solid var(--fe-border)',
            borderRadius: 'var(--fe-radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {CATEGORIAS_FORNECEDOR.map((cat) => {
            const checked = value.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggle(cat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px 14px',
                  border: 'none',
                  background: checked ? 'var(--fe-accent-dim)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  color: checked ? 'var(--fe-black)' : 'var(--fe-text)',
                }}
                onMouseEnter={(e) => !checked && ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
                onMouseLeave={(e) => !checked && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: checked ? 'none' : '1.5px solid var(--fe-border)',
                    background: checked ? 'var(--fe-accent)' : 'transparent',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {checked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4.5 7.5L8.5 3" stroke="var(--fe-accent-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {cat}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
