'use client'

import { useEffect, useRef, useState } from 'react'

export const RICHTEXT_CORES = ['var(--fe-text-strong)', 'var(--fe-prio-urgent)', 'var(--fe-prio-high)', 'var(--fe-status-done-text)', 'var(--fe-status-prog-text)', 'var(--fe-accent)', '#D6409F', 'var(--fe-text-muted)']

function execCmd(cmd: string, value?: string) { document.execCommand(cmd, false, value) }

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function inlineFmt(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

export function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let inUl = false
  let inOl = false

  function closeList() {
    if (inUl) { out.push('</ul>'); inUl = false }
    if (inOl) { out.push('</ol>'); inOl = false }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    const hm = line.match(/^(#{1,4})\s+(.+)/)
    if (hm) {
      closeList()
      out.push(`<h${hm[1].length}>${inlineFmt(hm[2])}</h${hm[1].length}>`)
      continue
    }

    const ulm = line.match(/^[\s]*[-*+]\s+(.+)/)
    if (ulm) {
      if (inOl) { out.push('</ol>'); inOl = false }
      if (!inUl) { out.push('<ul>'); inUl = true }
      out.push(`<li>${inlineFmt(ulm[1])}</li>`)
      continue
    }

    const olm = line.match(/^[\s]*\d+\.\s+(.+)/)
    if (olm) {
      if (inUl) { out.push('</ul>'); inUl = false }
      if (!inOl) { out.push('<ol>'); inOl = true }
      out.push(`<li>${inlineFmt(olm[1])}</li>`)
      continue
    }

    if (!line.trim()) {
      closeList()
      out.push('<p><br></p>')
      continue
    }

    closeList()
    out.push(`<p>${inlineFmt(line)}</p>`)
  }

  closeList()
  return out.join('')
}

type SlashAction = { kind: 'block'; tag: string } | { kind: 'list'; ordered: boolean }

const SLASH_ITEMS: { label: string; icon: string; action: SlashAction }[] = [
  { label: 'Título 1',       icon: 'H1',  action: { kind: 'block', tag: 'H1' } },
  { label: 'Título 2',       icon: 'H2',  action: { kind: 'block', tag: 'H2' } },
  { label: 'Título 3',       icon: 'H3',  action: { kind: 'block', tag: 'H3' } },
  { label: 'Título 4',       icon: 'H4',  action: { kind: 'block', tag: 'H4' } },
  { label: 'Texto normal',   icon: 'P',   action: { kind: 'block', tag: 'P' } },
  { label: 'Lista de itens', icon: '•',   action: { kind: 'list', ordered: false } },
  { label: 'Lista numerada', icon: '1.',  action: { kind: 'list', ordered: true } },
]

interface Pos { x: number; y: number }

export function FtBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        minWidth: 24, height: 24, padding: '0 4px',
        borderRadius: 4, border: 'none',
        background: 'transparent', color: 'var(--fe-text-soft)',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

export function FtSep() {
  return <span style={{ width: 1, height: 14, background: 'var(--fe-border-soft)', margin: '0 2px', flexShrink: 0 }} />
}

function BulletIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="3" cy="4.5" r="1.2" fill="currentColor" />
      <circle cx="3" cy="8"   r="1.2" fill="currentColor" />
      <circle cx="3" cy="11.5" r="1.2" fill="currentColor" />
      <path d="M6 4.5H13M6 8H13M6 11.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function OrderedIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M6 4.5H13M6 8H13M6 11.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <text x="1.5" y="6"    fontSize="5" fill="currentColor" fontWeight="700">1</text>
      <text x="1.5" y="9.6"  fontSize="5" fill="currentColor" fontWeight="700">2</text>
      <text x="1.5" y="13.2" fontSize="5" fill="currentColor" fontWeight="700">3</text>
    </svg>
  )
}

/**
 * Editor rich text clean: sem toolbar fixa.
 * - Barra flutuante aparece ao selecionar texto
 * - Slash commands com /
 * - Markdown inline: "- " → bullet, "1. " → numerada
 * - Paste de markdown converte automaticamente
 */
export function RichTextEditor({
  value, onChange, placeholder = 'Adicione uma descrição…', minHeight = 120,
}: { value: string | null; onChange: (html: string) => void; minHeight?: number; placeholder?: string }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [vazio, setVazio] = useState(!value || value === '<br>')
  const [focado, setFocado] = useState(false)

  // Floating toolbar
  const [floatPos, setFloatPos] = useState<Pos | null>(null)

  // Slash menu
  const [slashPos, setSlashPos]       = useState<Pos | null>(null)
  const [slashFilter, setSlashFilter] = useState('')
  const [slashIdx, setSlashIdx]       = useState(0)

  // Seed initial content once (não resetar cursor em re-renders)
  useEffect(() => {
    if (editorRef.current && value != null) editorRef.current.innerHTML = value
  }, []) // eslint-disable-line

  // Detectar seleção de texto para a barra flutuante
  useEffect(() => {
    function onSelChange() {
      if (!editorRef.current) return
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !editorRef.current.contains(sel.anchorNode)) {
        setFloatPos(null)
        return
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      if (!rect || rect.width === 0) { setFloatPos(null); return }
      setFloatPos({ x: rect.left + rect.width / 2, y: rect.top })
    }
    document.addEventListener('selectionchange', onSelChange)
    return () => document.removeEventListener('selectionchange', onSelChange)
  }, [])

  function emitir() {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    setVazio(html === '' || html === '<br>')
    onChange(html)
  }

  function getLinePrefix(): string {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return ''
    const range = sel.getRangeAt(0)
    const node  = range.startContainer

    // Navegadores convertem o espaço final em contentEditable para   (nbsp).
    // Normalizar para espaço comum para que os gatilhos de markdown casem.
    const norm = (s: string) => s.replace(/ /g, ' ')

    if (node.nodeType === Node.TEXT_NODE) {
      const text = norm((node.textContent || '').substring(0, range.startOffset))
      const nl = text.lastIndexOf('\n')
      return nl >= 0 ? text.substring(nl + 1) : text
    }

    // Cursor em element node (editor vazio ou entre blocos)
    if (node.nodeType === Node.ELEMENT_NODE) {
      let text = ''
      const el = node as HTMLElement
      for (let i = 0; i < range.startOffset; i++) {
        const child = el.childNodes[i]
        if (child) text += child.textContent || ''
      }
      text = norm(text)
      const nl = text.lastIndexOf('\n')
      return nl >= 0 ? text.substring(nl + 1) : text
    }

    return ''
  }

  function getCursorBottomLeft(): Pos | null {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0).cloneRange()
    range.collapse(true)
    let rect = range.getBoundingClientRect()

    // getBoundingClientRect retorna height=0 em alguns contextos fixos/scrolláveis
    if (!rect.height && editorRef.current) {
      const span = document.createElement('span')
      span.appendChild(document.createTextNode('​'))
      range.insertNode(span)
      rect = span.getBoundingClientRect()
      const parent = span.parentNode
      if (parent) { parent.removeChild(span); parent.normalize?.() }
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    }

    if (!rect.height && editorRef.current) {
      const edRect = editorRef.current.getBoundingClientRect()
      return { x: edRect.left + 20, y: edRect.bottom + 6 }
    }

    return rect.height ? { x: rect.left, y: rect.bottom + 6 } : null
  }

  // Posiciona o cursor no início de um elemento
  function placeCaret(el: HTMLElement) {
    const sel = window.getSelection()
    if (!sel) return
    const r = document.createRange()
    r.setStart(el, 0)
    r.collapse(true)
    sel.removeAllRanges()
    sel.addRange(r)
  }

  // Converte a linha atual numa lista. Construímos o DOM manualmente porque
  // document.execCommand('insert*List') é instável quando o cursor está num nó
  // de texto solto (primeira linha) ou no editor vazio.
  // - Markdown ("1. "/"- "): substitui o nó-marcador pela lista.
  // - Slash / linha vazia: insere a lista na posição do cursor.
  function convertToList(ordered: boolean) {
    if (!editorRef.current) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    const node  = range.startContainer

    const list = document.createElement(ordered ? 'ol' : 'ul')
    const li = document.createElement('li')
    li.appendChild(document.createElement('br'))
    list.appendChild(li)

    // Caso marcador: nó de texto não-vazio (ex.: "1. "/"- ")
    if (node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim() !== '' && node.parentNode) {
      const parent = node.parentNode as HTMLElement
      if (
        parent !== editorRef.current &&
        (parent.tagName === 'DIV' || parent.tagName === 'P') &&
        (parent.textContent || '').trim() === (node.textContent || '').trim() &&
        parent.parentNode
      ) {
        parent.parentNode.replaceChild(list, parent)
      } else {
        parent.replaceChild(list, node)
      }
      placeCaret(li)
      return
    }

    // Caso linha vazia / slash: insere no cursor
    range.deleteContents()
    range.insertNode(list)
    placeCaret(li)
  }

  function handleInput() {
    const prefix = getLinePrefix()

    // ── Slash command ──────────────────────────────────────────────────────
    if (prefix.startsWith('/') && !prefix.includes(' ')) {
      const pos = getCursorBottomLeft()
      if (pos) {
        setSlashPos(pos)
        setSlashFilter(prefix.slice(1))
        setSlashIdx(0)
        setFloatPos(null)
        emitir()
        return
      }
    } else if (slashPos) {
      setSlashPos(null)
    }

    // ── Markdown inline ────────────────────────────────────────────────────
    if (prefix === '- ' || prefix === '– ' || prefix === '* ') {
      convertToList(false)
      emitir()
      return
    }
    if (/^\d+\. $/.test(prefix)) {
      convertToList(true)
      emitir()
      return
    }

    emitir()
  }

  function handlePaste(e: React.ClipboardEvent) {
    // Se não há HTML no clipboard, converter o texto plain como markdown
    const hasHtml = e.clipboardData.types.includes('text/html')
    if (!hasHtml) {
      const plain = e.clipboardData.getData('text/plain')
      if (plain) {
        e.preventDefault()
        execCmd('insertHTML', markdownToHtml(plain))
        emitir()
      }
    }
  }

  function applySlashItem(item: typeof SLASH_ITEMS[0]) {
    if (!editorRef.current) return
    const sel = window.getSelection()

    // Remove o texto do gatilho "/query" via range (do "/" até o cursor)
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const node  = range.startContainer
      if (node.nodeType === Node.TEXT_NODE) {
        const text  = node.textContent || ''
        const start = text.lastIndexOf('/')
        if (start !== -1) {
          const r = document.createRange()
          r.setStart(node, start)
          r.setEnd(node, range.startOffset)
          r.deleteContents()
          r.collapse(true)
          sel.removeAllRanges()
          sel.addRange(r)
        }
      }
    }

    editorRef.current.focus()
    if (item.action.kind === 'list') {
      convertToList(item.action.ordered)
    } else {
      // formatBlock falha em nó de texto vazio; limpar o editor se ficou vazio
      // garante uma base limpa para o comando.
      if ((editorRef.current.textContent || '') === '') editorRef.current.innerHTML = ''
      editorRef.current.focus()
      execCmd('formatBlock', item.action.tag)
    }
    setSlashPos(null)
    emitir()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!slashPos) return
    const filtered = filteredSlash()
    if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIdx(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter')   { e.preventDefault(); if (filtered[slashIdx]) applySlashItem(filtered[slashIdx]) }
    else if (e.key === 'Escape')  { setSlashPos(null) }
  }

  function applyFmt(cmd: string, val?: string) {
    editorRef.current?.focus()
    execCmd(cmd, val)
    emitir()
  }

  function filteredSlash() {
    const f = normalize(slashFilter)
    return SLASH_ITEMS.filter(i => !f || normalize(i.label).includes(f) || normalize(i.icon).includes(f))
  }

  const slashItems = filteredSlash()

  return (
    <>
      {/* ── Barra flutuante na seleção ─────────────────────────────────────── */}
      {floatPos && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: 'fixed',
            left: floatPos.x,
            top: floatPos.y,
            transform: 'translate(-50%, calc(-100% - 8px))',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            padding: '3px 5px',
            background: 'var(--fe-bg)',
            border: '1px solid var(--fe-border-soft)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
            pointerEvents: 'auto',
          }}
        >
          <FtBtn onClick={() => applyFmt('bold')}><b style={{ fontSize: 13 }}>B</b></FtBtn>
          <FtBtn onClick={() => applyFmt('italic')}><i style={{ fontFamily: 'Georgia,serif', fontSize: 13 }}>I</i></FtBtn>
          <FtBtn onClick={() => applyFmt('underline')}><u style={{ fontSize: 12 }}>U</u></FtBtn>
          <FtBtn onClick={() => applyFmt('strikeThrough')}><s style={{ fontSize: 12 }}>S</s></FtBtn>
          <FtSep />
          <FtBtn onClick={() => applyFmt('formatBlock', 'H1')}><span style={{ fontWeight: 700, fontSize: 11 }}>H1</span></FtBtn>
          <FtBtn onClick={() => applyFmt('formatBlock', 'H2')}><span style={{ fontWeight: 700, fontSize: 11 }}>H2</span></FtBtn>
          <FtBtn onClick={() => applyFmt('formatBlock', 'H3')}><span style={{ fontWeight: 700, fontSize: 11 }}>H3</span></FtBtn>
          <FtBtn onClick={() => applyFmt('formatBlock', 'H4')}><span style={{ fontWeight: 700, fontSize: 11 }}>H4</span></FtBtn>
          <FtSep />
          <FtBtn onClick={() => applyFmt('insertUnorderedList')}><BulletIcon /></FtBtn>
          <FtBtn onClick={() => applyFmt('insertOrderedList')}><OrderedIcon /></FtBtn>
          <FtSep />
          {RICHTEXT_CORES.map((c) => (
            <button key={c} type="button" onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyFmt('foreColor', c)}
              style={{ width: 13, height: 13, borderRadius: 3, border: '1px solid rgba(0,0,0,0.1)', background: c, cursor: 'pointer', flexShrink: 0 }} />
          ))}
        </div>
      )}

      {/* ── Slash command menu ────────────────────────────────────────────── */}
      {slashPos && slashItems.length > 0 && (
        <div
          style={{
            position: 'fixed',
            left: slashPos.x,
            top: slashPos.y,
            zIndex: 9999,
            background: 'var(--fe-bg)',
            border: '1px solid var(--fe-border-soft)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: 210,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '6px 10px 4px', fontSize: 10, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '1px solid var(--fe-divider)' }}>
            Blocos de texto
          </div>
          {slashItems.map((item, i) => (
            <div key={item.label}
              onMouseDown={(e) => { e.preventDefault(); applySlashItem(item) }}
              onMouseEnter={() => setSlashIdx(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                cursor: 'pointer',
                background: i === slashIdx ? 'var(--fe-hover)' : 'transparent',
                transition: 'background 80ms',
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: 6,
                border: '1px solid var(--fe-border-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                color: 'var(--fe-text-soft)',
                background: 'var(--fe-warm-white)',
                flexShrink: 0,
              }}>
                {item.icon}
              </span>
              <span style={{ fontSize: 13, color: 'var(--fe-text)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Editor ───────────────────────────────────────────────────────── */}
      <div style={{
        border: `1px solid ${focado ? 'var(--fe-accent)' : 'var(--fe-border-soft)'}`,
        borderRadius: 'var(--fe-radius-lg)',
        overflow: 'hidden',
        transition: 'border-color var(--fe-dur-fast)',
      }}>
        <div style={{ position: 'relative' }}>
          {vazio && !focado && (
            <span style={{
              position: 'absolute', top: 12, left: 14,
              fontSize: 13.5, color: 'var(--fe-text-faint)', pointerEvents: 'none',
            }}>
              {placeholder}
            </span>
          )}
          {focado && (
            <span style={{
              position: 'absolute', bottom: 8, right: 12,
              fontSize: 11, color: 'var(--fe-text-faint)', pointerEvents: 'none',
            }}>
              Digite / para comandos
            </span>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setFocado(true)}
            onBlur={() => { setFocado(false); setSlashPos(null); emitir() }}
            className="fe-richtext"
            style={{ minHeight, padding: '11px 14px 28px', fontSize: 13.5, lineHeight: 1.6, color: 'var(--fe-text)', outline: 'none' }}
          />
        </div>
      </div>
    </>
  )
}

export function RichTextView({ html }: { html: string }) {
  return (
    <div
      className="fe-richtext"
      style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--fe-text)' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
