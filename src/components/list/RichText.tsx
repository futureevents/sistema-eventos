'use client'

import { useEffect, useRef, useState } from 'react'
import { markdownToHtml } from '@/lib/richtext'

export const RICHTEXT_CORES = ['var(--fe-text-strong)', 'var(--fe-prio-urgent)', 'var(--fe-prio-high)', 'var(--fe-status-done-text)', 'var(--fe-status-prog-text)', 'var(--fe-accent)', '#D6409F', 'var(--fe-text-muted)']

function execCmd(cmd: string, value?: string) { document.execCommand(cmd, false, value) }

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// markdownToHtml (GFM: tabelas, código, citações, task lists) vive em
// src/lib/richtext.ts — a MESMA conversão usada pelo servidor MCP. Reexporta
// para os componentes que já a importam daqui (ex.: TaskComments).
export { markdownToHtml }

type SlashAction =
  | { kind: 'block'; tag: string }
  | { kind: 'list'; ordered: boolean }
  | { kind: 'quote' }
  | { kind: 'code' }
  | { kind: 'hr' }
  | { kind: 'table' }
  | { kind: 'tasklist' }
  | { kind: 'link' }
  | { kind: 'image' }

const SLASH_ITEMS: { label: string; icon: string; action: SlashAction }[] = [
  { label: 'Título 1',         icon: 'H1',  action: { kind: 'block', tag: 'H1' } },
  { label: 'Título 2',         icon: 'H2',  action: { kind: 'block', tag: 'H2' } },
  { label: 'Título 3',         icon: 'H3',  action: { kind: 'block', tag: 'H3' } },
  { label: 'Título 4',         icon: 'H4',  action: { kind: 'block', tag: 'H4' } },
  { label: 'Texto normal',     icon: 'P',   action: { kind: 'block', tag: 'P' } },
  { label: 'Lista de itens',   icon: '•',   action: { kind: 'list', ordered: false } },
  { label: 'Lista numerada',   icon: '1.',  action: { kind: 'list', ordered: true } },
  { label: 'Lista de tarefas', icon: '☑',   action: { kind: 'tasklist' } },
  { label: 'Tabela',           icon: '⊞',   action: { kind: 'table' } },
  { label: 'Citação',          icon: '❝',   action: { kind: 'quote' } },
  { label: 'Código',           icon: '‹›',  action: { kind: 'code' } },
  { label: 'Divisória',        icon: '—',   action: { kind: 'hr' } },
  { label: 'Link',             icon: '🔗',  action: { kind: 'link' } },
  { label: 'Imagem',           icon: '🖼',   action: { kind: 'image' } },
]

interface Pos { x: number; y: number }

export function FtBtn({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      title={title}
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
 * Editor rich text clean estilo ClickUp.
 * - Barra flutuante ao selecionar texto
 * - Slash commands com /  (títulos, listas, tarefas, tabela, citação, código, divisória, link, imagem)
 * - Markdown inline ao digitar (#, -, 1., >, ```, ---, - [ ])
 * - Colar markdown completo (markdown-it / GFM) converte para rich text
 * - Edição visual de tabela (Tab navega, barra de controles add/remove linha/coluna)
 */
export function RichTextEditor({
  value, onChange, placeholder = 'Adicione uma descrição…', minHeight = 120,
}: { value: string | null; onChange: (html: string) => void; minHeight?: number; placeholder?: string }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [vazio, setVazio] = useState(!value || value === '<br>')
  const [focado, setFocado] = useState(false)

  const [floatPos, setFloatPos] = useState<Pos | null>(null)
  const [slashPos, setSlashPos]       = useState<Pos | null>(null)
  const [slashCaretTop, setSlashCaretTop] = useState(0)
  const [slashFilter, setSlashFilter] = useState('')
  const [slashIdx, setSlashIdx]       = useState(0)
  const [tablePos, setTablePos]       = useState<Pos | null>(null)
  const slashMenuRef = useRef<HTMLDivElement>(null)

  // Seed inicial (uma vez)
  useEffect(() => {
    if (editorRef.current && value != null) { editorRef.current.innerHTML = value; normalizeEditor() }
  }, []) // eslint-disable-line

  // Barra flutuante na seleção + detecção de tabela
  useEffect(() => {
    function onSelChange() {
      const ed = editorRef.current
      if (!ed) return
      const sel = window.getSelection()
      // Tabela: cursor dentro de <table>?
      if (sel && sel.anchorNode && ed.contains(sel.anchorNode)) {
        const table = closestEl(sel.anchorNode, 'TABLE')
        if (table) {
          const r = table.getBoundingClientRect()
          setTablePos({ x: r.left, y: r.top })
        } else setTablePos(null)
      } else setTablePos(null)

      if (!sel || sel.isCollapsed || !ed.contains(sel.anchorNode)) { setFloatPos(null); return }
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      if (!rect || rect.width === 0) { setFloatPos(null); return }
      setFloatPos({ x: rect.left + rect.width / 2, y: rect.top })
    }
    document.addEventListener('selectionchange', onSelChange)
    return () => document.removeEventListener('selectionchange', onSelChange)
  }, [])

  // Reposiciona o slash menu para caber na viewport (vira pra cima se estourar)
  useEffect(() => {
    const menu = slashMenuRef.current
    if (!menu || !slashPos) return
    menu.style.top = slashPos.y + 'px'
    menu.style.bottom = 'auto'
    const rect = menu.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    if (rect.bottom > vh - 8) {
      // tenta acima do cursor
      const above = slashCaretTop - rect.height - 6
      if (above >= 8) { menu.style.top = above + 'px' }
      else { menu.style.top = '8px'; menu.style.maxHeight = (vh - 16) + 'px' }
    }
  }, [slashPos, slashCaretTop, slashFilter])

  // Mantém o item destacado visível ao navegar por teclado
  useEffect(() => {
    const menu = slashMenuRef.current
    if (!menu) return
    const active = menu.querySelector('[data-active="true"]') as HTMLElement | null
    active?.scrollIntoView({ block: 'nearest' })
  }, [slashIdx])

  function closestEl(node: Node | null, tag: string): HTMLElement | null {
    let n: Node | null = node
    while (n && n !== editorRef.current) {
      if (n.nodeType === Node.ELEMENT_NODE && (n as HTMLElement).tagName === tag) return n as HTMLElement
      n = n.parentNode
    }
    return null
  }

  // Marca checkboxes como não-editáveis para serem clicáveis dentro do contentEditable
  function normalizeEditor() {
    const ed = editorRef.current
    if (!ed) return
    ed.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      (cb as HTMLElement).contentEditable = 'false'
      cb.removeAttribute('disabled')
    })
  }

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
    const norm = (s: string) => s.replace(/ /g, ' ')

    if (node.nodeType === Node.TEXT_NODE) {
      const text = norm((node.textContent || '').substring(0, range.startOffset))
      const nl = text.lastIndexOf('\n')
      return nl >= 0 ? text.substring(nl + 1) : text
    }
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

  function getCursorBottomLeft(): { x: number; y: number; top: number } | null {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0).cloneRange()
    range.collapse(true)
    let rect = range.getBoundingClientRect()
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
      return { x: edRect.left + 20, y: edRect.bottom + 6, top: edRect.bottom }
    }
    return rect.height ? { x: rect.left, y: rect.bottom + 6, top: rect.top } : null
  }

  function placeCaret(el: HTMLElement) {
    const sel = window.getSelection()
    if (!sel) return
    const r = document.createRange()
    r.setStart(el, 0)
    r.collapse(true)
    sel.removeAllRanges()
    sel.addRange(r)
  }

  // Substitui a linha-marcador atual por um bloco (gatilhos markdown ao digitar)
  function replaceMarkerLine(el: HTMLElement) {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    const node  = range.startContainer
    if (node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim() !== '' && node.parentNode) {
      const parent = node.parentNode as HTMLElement
      if (parent !== editorRef.current && (parent.tagName === 'DIV' || parent.tagName === 'P') &&
          (parent.textContent || '').trim() === (node.textContent || '').trim() && parent.parentNode) {
        parent.parentNode.replaceChild(el, parent)
      } else {
        parent.replaceChild(el, node)
      }
    } else {
      range.deleteContents()
      range.insertNode(el)
    }
  }

  // Insere um bloco na posição do cursor (slash, após remover o gatilho)
  function insertBlockAtCaret(el: HTMLElement) {
    const ed = editorRef.current
    if (!ed) return
    const sel = window.getSelection()
    if ((ed.textContent || '') === '' && ed.querySelectorAll('img,hr,table').length === 0) {
      ed.innerHTML = ''
      ed.appendChild(el)
    } else if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      range.deleteContents()
      range.insertNode(el)
    } else {
      ed.appendChild(el)
    }
  }

  // ── Construtores de bloco ─────────────────────────────────────────────────
  function buildList(ordered: boolean) {
    const list = document.createElement(ordered ? 'ol' : 'ul')
    const li = document.createElement('li')
    li.appendChild(document.createElement('br'))
    list.appendChild(li)
    return { el: list, caret: li }
  }
  function buildTaskList() {
    const ul = document.createElement('ul')
    ul.className = 'fe-tasklist'
    const li = document.createElement('li')
    li.className = 'fe-task'
    const cb = document.createElement('input')
    cb.type = 'checkbox'; cb.contentEditable = 'false'
    const span = document.createElement('span')
    span.appendChild(document.createElement('br'))
    li.appendChild(cb); li.appendChild(span)
    ul.appendChild(li)
    return { el: ul, caret: span }
  }
  function buildQuote() {
    const bq = document.createElement('blockquote')
    bq.appendChild(document.createElement('br'))
    return { el: bq, caret: bq }
  }
  function buildCode() {
    const pre = document.createElement('pre')
    const code = document.createElement('code')
    code.appendChild(document.createElement('br'))
    pre.appendChild(code)
    return { el: pre, caret: code }
  }
  function buildHeading(tag: string) {
    const h = document.createElement(tag)
    h.appendChild(document.createElement('br'))
    return { el: h, caret: h }
  }
  function buildTable(rows = 3, cols = 3) {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr')
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement(r === 0 ? 'th' : 'td')
        cell.appendChild(document.createElement('br'))
        tr.appendChild(cell)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    const first = table.querySelector('th,td') as HTMLElement
    return { el: table, caret: first }
  }

  function convertToList(ordered: boolean, fromMarker: boolean) {
    const { el, caret } = buildList(ordered)
    if (fromMarker) replaceMarkerLine(el); else insertBlockAtCaret(el)
    placeCaret(caret)
  }

  // ── Entrada (digitação) ───────────────────────────────────────────────────
  function handleInput() {
    const prefix = getLinePrefix()

    // Slash command
    if (prefix.startsWith('/') && !prefix.includes(' ')) {
      const pos = getCursorBottomLeft()
      if (pos) {
        setSlashPos({ x: pos.x, y: pos.y }); setSlashCaretTop(pos.top); setSlashFilter(prefix.slice(1)); setSlashIdx(0); setFloatPos(null); emitir(); return
      }
    } else if (slashPos) {
      setSlashPos(null)
    }

    // Task list dentro de um <li>: "[] " ou "[ ] " / "[x] "
    const taskM = prefix.match(/^\[([ xX]?)\] $/)
    if (taskM && closestEl(window.getSelection()?.anchorNode ?? null, 'LI')) {
      convertLiToTask(taskM[1].toLowerCase() === 'x'); emitir(); return
    }

    // Markdown inline (linha = só o marcador)
    if (prefix === '- ' || prefix === '– ' || prefix === '* ' || prefix === '+ ') { convertToList(false, true); emitir(); return }
    if (/^\d+\. $/.test(prefix)) { convertToList(true, true); emitir(); return }
    const hM = prefix.match(/^(#{1,6}) $/)
    if (hM) { replaceMarkerLine(buildHeading('H' + hM[1].length).el); const h = lastInserted(); if (h) placeCaret(h); emitir(); return }
    if (prefix === '> ') { const { el, caret } = buildQuote(); replaceMarkerLine(el); placeCaret(caret); emitir(); return }
    if (prefix === '```') { const { el, caret } = buildCode(); replaceMarkerLine(el); placeCaret(caret); emitir(); return }
    if (prefix === '---' || prefix === '***' || prefix === '___') { insertHr(); emitir(); return }

    emitir()
  }

  function lastInserted(): HTMLElement | null {
    const sel = window.getSelection()
    const n = sel?.anchorNode
    return n ? (n.nodeType === Node.ELEMENT_NODE ? (n as HTMLElement) : (n.parentElement)) : null
  }

  function convertLiToTask(checked: boolean) {
    const sel = window.getSelection()
    const li = closestEl(sel?.anchorNode ?? null, 'LI')
    if (!li) return
    const ul = li.parentElement
    if (ul && ul.tagName === 'UL') ul.classList.add('fe-tasklist')
    li.className = 'fe-task' + (checked ? ' done' : '')
    // No momento do gatilho o <li> só contém o marcador "[ ] " — reconstrói limpo
    li.innerHTML = ''
    const cb = document.createElement('input')
    cb.type = 'checkbox'; cb.contentEditable = 'false'; if (checked) cb.setAttribute('checked', '')
    const span = document.createElement('span')
    span.appendChild(document.createElement('br'))
    li.appendChild(cb); li.appendChild(span)
    placeCaret(span)
  }

  function insertHr() {
    const hr = document.createElement('hr')
    const after = document.createElement('p'); after.appendChild(document.createElement('br'))
    replaceMarkerLine(hr)
    hr.parentNode?.insertBefore(after, hr.nextSibling)
    placeCaret(after)
  }

  function handlePaste(e: React.ClipboardEvent) {
    const hasHtml = e.clipboardData.types.includes('text/html')
    if (!hasHtml) {
      const plain = e.clipboardData.getData('text/plain')
      if (plain) {
        e.preventDefault()
        execCmd('insertHTML', markdownToHtml(plain))
        normalizeEditor()
        emitir()
      }
    }
  }

  // ── Slash apply ────────────────────────────────────────────────────────────
  function applySlashItem(item: typeof SLASH_ITEMS[0]) {
    const ed = editorRef.current
    if (!ed) return
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const node  = range.startContainer
      if (node.nodeType === Node.TEXT_NODE) {
        const text  = node.textContent || ''
        const start = text.lastIndexOf('/')
        if (start !== -1) {
          const r = document.createRange()
          r.setStart(node, start); r.setEnd(node, range.startOffset)
          r.deleteContents(); r.collapse(true)
          sel.removeAllRanges(); sel.addRange(r)
        }
      }
    }
    ed.focus()
    const a = item.action
    if (a.kind === 'list') { convertToList(a.ordered, false) }
    else if (a.kind === 'tasklist') { const { el, caret } = buildTaskList(); insertBlockAtCaret(el); placeCaret(caret) }
    else if (a.kind === 'quote') { const { el, caret } = buildQuote(); insertBlockAtCaret(el); placeCaret(caret) }
    else if (a.kind === 'code') { const { el, caret } = buildCode(); insertBlockAtCaret(el); placeCaret(caret) }
    else if (a.kind === 'hr') { const hr = document.createElement('hr'); const after = document.createElement('p'); after.appendChild(document.createElement('br')); insertBlockAtCaret(hr); hr.parentNode?.insertBefore(after, hr.nextSibling); placeCaret(after) }
    else if (a.kind === 'table') { const { el, caret } = buildTable(); const after = document.createElement('p'); after.appendChild(document.createElement('br')); insertBlockAtCaret(el); el.parentNode?.insertBefore(after, el.nextSibling); placeCaret(caret) }
    else if (a.kind === 'link') {
      const url = window.prompt('URL do link:'); if (url) { const texto = window.prompt('Texto do link:', url) || url; execCmd('insertHTML', `<a href="${escapeAttr(url)}">${escapeHtml(texto)}</a>&nbsp;`) }
    }
    else if (a.kind === 'image') {
      const url = window.prompt('URL da imagem:'); if (url) execCmd('insertHTML', `<img src="${escapeAttr(url)}" alt="" />`)
    }
    else if (a.kind === 'block') {
      if ((ed.textContent || '') === '') ed.innerHTML = ''
      ed.focus(); execCmd('formatBlock', a.tag)
    }
    setSlashPos(null)
    emitir()
  }

  function escapeHtml(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
  function escapeAttr(s: string) { return escapeHtml(s).replace(/"/g, '&quot;') }

  // ── Tabela: operações ──────────────────────────────────────────────────────
  function currentCell(): HTMLElement | null {
    const sel = window.getSelection()
    const td = closestEl(sel?.anchorNode ?? null, 'TD') || closestEl(sel?.anchorNode ?? null, 'TH')
    return td
  }
  function cellIndex(cell: HTMLElement): number {
    const row = cell.parentElement!
    return Array.from(row.children).indexOf(cell)
  }
  function addRow(after: boolean) {
    const cell = currentCell(); if (!cell) return
    const row = cell.parentElement as HTMLTableRowElement
    const nCols = row.children.length
    const tr = document.createElement('tr')
    for (let i = 0; i < nCols; i++) { const td = document.createElement('td'); td.appendChild(document.createElement('br')); tr.appendChild(td) }
    row.parentElement!.insertBefore(tr, after ? row.nextSibling : row)
    placeCaret(tr.children[0] as HTMLElement); emitir()
  }
  function addColumn(after: boolean) {
    const cell = currentCell(); if (!cell) return
    const idx = cellIndex(cell)
    const table = closestEl(cell, 'TABLE'); if (!table) return
    table.querySelectorAll('tr').forEach((tr) => {
      const isHead = tr.querySelector('th')
      const c = document.createElement(isHead ? 'th' : 'td')
      c.appendChild(document.createElement('br'))
      const ref = tr.children[idx]
      tr.insertBefore(c, after ? (ref?.nextSibling ?? null) : ref)
    })
    emitir()
  }
  function deleteRow() {
    const cell = currentCell(); if (!cell) return
    const row = cell.parentElement as HTMLTableRowElement
    const table = closestEl(cell, 'TABLE')!
    if (table.querySelectorAll('tr').length <= 1) { deleteTable(); return }
    const next = (row.nextElementSibling || row.previousElementSibling) as HTMLElement | null
    row.remove()
    if (next) placeCaret(next.querySelector('td,th') as HTMLElement)
    emitir()
  }
  function deleteColumn() {
    const cell = currentCell(); if (!cell) return
    const idx = cellIndex(cell)
    const table = closestEl(cell, 'TABLE')!
    const firstRow = table.querySelector('tr')
    if (firstRow && firstRow.children.length <= 1) { deleteTable(); return }
    table.querySelectorAll('tr').forEach((tr) => { tr.children[idx]?.remove() })
    emitir()
  }
  function deleteTable() {
    const cell = currentCell(); if (!cell) return
    const table = closestEl(cell, 'TABLE'); if (!table) return
    table.remove(); setTablePos(null); emitir()
  }

  // ── Teclado ────────────────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    // Navegação por Tab dentro de tabela
    if (e.key === 'Tab') {
      const cell = currentCell()
      if (cell) {
        e.preventDefault()
        const cells = Array.from(closestEl(cell, 'TABLE')!.querySelectorAll('td,th')) as HTMLElement[]
        const i = cells.indexOf(cell)
        if (e.shiftKey) { if (i > 0) placeCaret(cells[i - 1]) }
        else {
          if (i < cells.length - 1) placeCaret(cells[i + 1])
          else { addRow(true) }
        }
        return
      }
    }
    if (!slashPos) return
    const filtered = filteredSlash()
    if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIdx(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter')   { e.preventDefault(); if (filtered[slashIdx]) applySlashItem(filtered[slashIdx]) }
    else if (e.key === 'Escape')  { setSlashPos(null) }
  }

  function handleClick(e: React.MouseEvent) {
    const t = e.target as HTMLElement
    if (t.tagName === 'INPUT' && (t as HTMLInputElement).type === 'checkbox') {
      // persiste o estado no atributo (para serializar no innerHTML) e marca o li
      setTimeout(() => {
        const input = t as HTMLInputElement
        if (input.checked) input.setAttribute('checked', ''); else input.removeAttribute('checked')
        const li = closestEl(input, 'LI'); if (li) li.classList.toggle('done', input.checked)
        emitir()
      }, 0)
    }
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
      {/* Barra flutuante na seleção */}
      {floatPos && (
        <div onMouseDown={(e) => e.preventDefault()}
          style={{ position: 'fixed', left: floatPos.x, top: floatPos.y, transform: 'translate(-50%, calc(-100% - 8px))', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 1, padding: '3px 5px', background: 'var(--fe-surface)', border: '1px solid var(--fe-border-soft)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.14)', pointerEvents: 'auto' }}>
          <FtBtn onClick={() => applyFmt('bold')}><b style={{ fontSize: 13 }}>B</b></FtBtn>
          <FtBtn onClick={() => applyFmt('italic')}><i style={{ fontFamily: 'Georgia,serif', fontSize: 13 }}>I</i></FtBtn>
          <FtBtn onClick={() => applyFmt('underline')}><u style={{ fontSize: 12 }}>U</u></FtBtn>
          <FtBtn onClick={() => applyFmt('strikeThrough')}><s style={{ fontSize: 12 }}>S</s></FtBtn>
          <FtBtn onClick={() => applyFmt('formatBlock', 'PRE')} title="Código"><span style={{ fontSize: 12, fontFamily: 'monospace' }}>{'<>'}</span></FtBtn>
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
            <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFmt('foreColor', c)}
              style={{ width: 13, height: 13, borderRadius: 3, border: '1px solid rgba(0,0,0,0.1)', background: c, cursor: 'pointer', flexShrink: 0 }} />
          ))}
        </div>
      )}

      {/* Controles de tabela */}
      {tablePos && (
        <div onMouseDown={(e) => e.preventDefault()}
          style={{ position: 'fixed', left: tablePos.x, top: tablePos.y, transform: 'translateY(calc(-100% - 6px))', zIndex: 9998, display: 'flex', alignItems: 'center', gap: 2, padding: '3px 5px', background: 'var(--fe-surface)', border: '1px solid var(--fe-border-soft)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.14)', fontSize: 11 }}>
          <FtBtn onClick={() => addRow(true)} title="Adicionar linha abaixo">+ linha</FtBtn>
          <FtBtn onClick={() => addColumn(true)} title="Adicionar coluna à direita">+ coluna</FtBtn>
          <FtSep />
          <FtBtn onClick={() => deleteRow()} title="Remover linha">− linha</FtBtn>
          <FtBtn onClick={() => deleteColumn()} title="Remover coluna">− coluna</FtBtn>
          <FtSep />
          <FtBtn onClick={() => deleteTable()} title="Excluir tabela"><span style={{ color: 'var(--fe-prio-urgent)' }}>✕</span></FtBtn>
        </div>
      )}

      {/* Slash menu */}
      {slashPos && slashItems.length > 0 && (
        <div ref={slashMenuRef} style={{ position: 'fixed', left: slashPos.x, top: slashPos.y, zIndex: 9999, background: 'var(--fe-surface)', border: '1px solid var(--fe-border-soft)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 210, maxHeight: 320, overflowY: 'auto' }}>
          <div style={{ padding: '6px 10px 4px', fontSize: 10, color: 'var(--fe-text-faint)', textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '1px solid var(--fe-divider)', position: 'sticky', top: 0, background: 'var(--fe-surface)' }}>Blocos</div>
          {slashItems.map((item, i) => (
            <div key={item.label} data-active={i === slashIdx} onMouseDown={(e) => { e.preventDefault(); applySlashItem(item) }} onMouseEnter={() => setSlashIdx(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', cursor: 'pointer', background: i === slashIdx ? 'var(--fe-hover)' : 'transparent', transition: 'background 80ms' }}>
              <span style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--fe-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--fe-text-soft)', background: 'var(--fe-warm-white)', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: 'var(--fe-text)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <div style={{ border: `1px solid ${focado ? 'var(--fe-accent)' : 'var(--fe-border-soft)'}`, borderRadius: 'var(--fe-radius-lg)', overflow: 'hidden', transition: 'border-color var(--fe-dur-fast)' }}>
        <div style={{ position: 'relative' }}>
          {vazio && !focado && (
            <span style={{ position: 'absolute', top: 15, left: 18, fontSize: 15.5, color: 'var(--fe-text-faint)', pointerEvents: 'none' }}>{placeholder}</span>
          )}
          {focado && (
            <span style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 11, color: 'var(--fe-text-faint)', pointerEvents: 'none' }}>Digite / para comandos</span>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onClick={handleClick}
            onFocus={() => setFocado(true)}
            onBlur={() => { setFocado(false); setSlashPos(null); emitir() }}
            className="fe-richtext"
            style={{ minHeight, padding: '14px 18px 32px', fontSize: 15.5, lineHeight: 1.72, color: 'var(--fe-text)', outline: 'none' }}
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
      style={{ fontSize: 15.5, lineHeight: 1.72, color: 'var(--fe-text)' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
