'use client'

import { useEffect, useRef, useState } from 'react'
import { Dropdown } from './inline'

const CORES = ['#27241F', '#DC2626', '#E8833A', '#047857', '#2563EB', '#6E56CF', '#D6457D', '#9B9893']

function exec(cmd: string, value?: string) { document.execCommand(cmd, false, value) }

/**
 * Editor rich text leve baseado em contentEditable (sem dependência externa).
 * Emite HTML via onChange. Conteúdo inicial semeado uma vez (não reseta cursor);
 * o auto-save (debounce) fica a cargo do pai.
 */
export function RichTextEditor({
  value, onChange, placeholder = 'Adicione uma descrição…', minHeight = 120,
}: { value: string | null; onChange: (html: string) => void; minHeight?: number; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vazio, setVazio] = useState(!value || value === '<br>')
  const [focado, setFocado] = useState(false)

  useEffect(() => {
    if (ref.current && value != null) ref.current.innerHTML = value
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function emitir() {
    if (!ref.current) return
    const html = ref.current.innerHTML
    setVazio(html === '' || html === '<br>')
    onChange(html)
  }

  function aplicar(cmd: string, val?: string) { ref.current?.focus(); exec(cmd, val); emitir() }

  const tbBtn = (active = false): React.CSSProperties => ({
    minWidth: 28, height: 28, padding: '0 6px', borderRadius: 6, border: 'none',
    background: active ? 'var(--fe-hover)' : 'transparent', color: 'var(--fe-text-soft)',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5,
  })

  return (
    <div style={{ border: `1px solid ${focado ? 'var(--fe-accent)' : 'var(--fe-border-soft)'}`, borderRadius: 'var(--fe-radius-lg)', overflow: 'hidden', transition: 'border-color var(--fe-dur-fast)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '5px 6px', borderBottom: '1px solid var(--fe-divider)', background: 'var(--fe-warm-white)', flexWrap: 'wrap' }}>
        <button type="button" title="Título" style={tbBtn()} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar('formatBlock', 'H2')}><span style={{ fontWeight: 700, fontSize: 13 }}>H1</span></button>
        <button type="button" title="Subtítulo" style={tbBtn()} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar('formatBlock', 'H3')}><span style={{ fontWeight: 700, fontSize: 12 }}>H2</span></button>
        <button type="button" title="Texto normal" style={tbBtn()} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar('formatBlock', 'P')}><span style={{ fontWeight: 500, fontSize: 12 }}>P</span></button>
        <Sep />
        <button type="button" title="Negrito" style={tbBtn()} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar('bold')}><b style={{ fontSize: 14 }}>B</b></button>
        <button type="button" title="Itálico" style={tbBtn()} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar('italic')}><i style={{ fontSize: 14, fontFamily: 'Georgia, serif' }}>I</i></button>
        <button type="button" title="Sublinhado" style={tbBtn()} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar('underline')}><u style={{ fontSize: 13 }}>U</u></button>
        <button type="button" title="Tachado" style={tbBtn()} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar('strikeThrough')}><s style={{ fontSize: 13 }}>S</s></button>
        <Sep />
        <Dropdown align="left" width={150} stopPropagation={false}
          trigger={({ toggle }) => (
            <button type="button" title="Cor do texto" style={tbBtn()} onMouseDown={(e) => e.preventDefault()} onClick={toggle}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3.5 12.5L7.2 3.5H8.8L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 9.5H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><rect x="3" y="13.6" width="10" height="1.6" rx="0.8" fill="var(--fe-accent)" /></svg>
            </button>
          )}>
          {(close) => (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: 2 }}>
              {CORES.map((c) => (
                <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { aplicar('foreColor', c); close() }}
                  style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--fe-border-soft)', background: c, cursor: 'pointer' }} />
              ))}
            </div>
          )}
        </Dropdown>
        <Sep />
        <button type="button" title="Lista" style={tbBtn()} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar('insertUnorderedList')}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="4.5" r="1.2" fill="currentColor" /><circle cx="3" cy="8" r="1.2" fill="currentColor" /><circle cx="3" cy="11.5" r="1.2" fill="currentColor" /><path d="M6 4.5H13M6 8H13M6 11.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
        </button>
        <button type="button" title="Lista numerada" style={tbBtn()} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar('insertOrderedList')}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6 4.5H13M6 8H13M6 11.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><text x="1.5" y="6" fontSize="5" fill="currentColor" fontWeight="700">1</text><text x="1.5" y="9.6" fontSize="5" fill="currentColor" fontWeight="700">2</text><text x="1.5" y="13.2" fontSize="5" fill="currentColor" fontWeight="700">3</text></svg>
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        {vazio && !focado && (
          <span style={{ position: 'absolute', top: 12, left: 14, fontSize: 13.5, color: 'var(--fe-text-faint)', pointerEvents: 'none' }}>{placeholder}</span>
        )}
        <div ref={ref} contentEditable suppressContentEditableWarning onInput={emitir}
          onFocus={() => setFocado(true)} onBlur={() => { setFocado(false); emitir() }}
          className="fe-richtext" style={{ minHeight, padding: '11px 14px', fontSize: 13.5, lineHeight: 1.6, color: 'var(--fe-text)', outline: 'none' }} />
      </div>
    </div>
  )
}

function Sep() { return <span style={{ width: 1, height: 18, background: 'var(--fe-border-soft)', margin: '0 3px', flexShrink: 0 }} /> }

export function RichTextView({ html }: { html: string }) {
  return <div className="fe-richtext" style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--fe-text)' }} dangerouslySetInnerHTML={{ __html: html }} />
}
