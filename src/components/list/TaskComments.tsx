'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { markdownToHtml, RICHTEXT_CORES, FtBtn, FtSep } from './RichText'
import { useListCaps } from './perm-ctx'

interface Comment {
  id: string
  author: string
  body: string
  criado_em: string
  mentions: string[]
}

interface Membro {
  id: string
  email: string
  nome: string
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

function horaRelativa(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function safeRenderBody(body: string): string {
  // Se parece HTML, renderizar como HTML; senão, tratar como plain text preservando quebras
  if (/<[a-z][\s\S]*>/i.test(body)) return body
  return body
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(@\S+)/g, '<span style="color:var(--fe-accent);font-weight:600">$1</span>')
    .replace(/\n/g, '<br>')
}

function CommentRow({ comment: c, isOwn, onDelete }: { comment: Comment; isOwn: boolean; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
    >
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--fe-accent-dim)', color: 'var(--fe-accent)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {initials(c.author)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fe-text-strong)' }}>{c.author}</span>
          <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)' }}>{horaRelativa(c.criado_em)}</span>
          {isOwn && hovered && (
            <button
              onClick={onDelete}
              title="Excluir comentário"
              style={{ marginLeft: 4, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--fe-prio-urgent)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, padding: 0, opacity: 0.7 }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            >
              <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
        <div
          className="fe-richtext"
          style={{ fontSize: 13.5, color: 'var(--fe-text)', lineHeight: 1.6, wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: safeRenderBody(c.body) }}
        />
      </div>
    </div>
  )
}

// Editor rich text para comentários com suporte a @mentions
function RichCommentInput({
  membros,
  onSend,
}: {
  membros: Membro[]
  onSend: (html: string) => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [empty, setEmpty] = useState(true)
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionPos, setMentionPos]     = useState<{ x: number; y: number } | null>(null)

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

  function getTextBeforeCursor(): string {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return ''
    const range = sel.getRangeAt(0)
    const node = range.startContainer
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent || '').substring(0, range.startOffset)
    return ''
  }

  function getCursorBottomLeft(): { x: number; y: number } | null {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return null
    const range = sel.getRangeAt(0).cloneRange()
    range.collapse(true)
    const rect = range.getBoundingClientRect()
    if (!rect.height) return null
    return { x: rect.left, y: rect.bottom + 4 }
  }

  function exec(cmd: string, val?: string) { document.execCommand(cmd, false, val) }

  function applyFmt(cmd: string, val?: string) {
    editorRef.current?.focus()
    exec(cmd, val)
    checkEmpty()
  }

  function checkEmpty() {
    if (!editorRef.current) return
    setEmpty((editorRef.current.textContent || '').trim() === '')
  }

  function handleInput() {
    checkEmpty()
    const textBefore = getTextBeforeCursor()
    const match = textBefore.match(/@(\S*)$/)
    if (match) {
      setMentionQuery(match[1])
      setMentionPos(getCursorBottomLeft())
    } else {
      setMentionQuery(null)
    }
  }

  function handleSelectMention(m: Membro) {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const node = range.startContainer
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ''
        const cursor = range.startOffset
        const before = text.substring(0, cursor)
        const matchAt = before.match(/@(\S*)$/)
        if (matchAt) {
          const start = cursor - matchAt[0].length
          const replacement = `@${m.nome.replace(/\s+/g, '')} `
          node.textContent = text.substring(0, start) + replacement + text.substring(cursor)
          const newRange = document.createRange()
          newRange.setStart(node, start + replacement.length)
          newRange.collapse(true)
          sel.removeAllRanges()
          sel.addRange(newRange)
        }
      }
    }
    setMentionQuery(null)
    editorRef.current?.focus()
    checkEmpty()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape' && mentionQuery !== null) {
      e.preventDefault()
      setMentionQuery(null)
      return
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      send()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const hasHtml = e.clipboardData.types.includes('text/html')
    if (!hasHtml) {
      const plain = e.clipboardData.getData('text/plain')
      if (plain) {
        e.preventDefault()
        exec('insertHTML', markdownToHtml(plain))
        checkEmpty()
      }
    }
  }

  function send() {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    if (!html || (editorRef.current.textContent || '').trim() === '') return
    onSend(html)
    editorRef.current.innerHTML = ''
    setEmpty(true)
    setFloatPos(null)
    setMentionQuery(null)
  }

  const mentionFiltered = mentionQuery !== null
    ? membros.filter(m =>
        m.nome.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(mentionQuery.toLowerCase())
      ).slice(0, 6)
    : []

  return (
    <>
      {/* Barra flutuante na seleção */}
      {floatPos && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          style={{ position: 'fixed', left: floatPos.x, top: floatPos.y, transform: 'translate(-50%, calc(-100% - 8px))', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 1, padding: '3px 5px', background: 'var(--fe-bg)', border: '1px solid var(--fe-border-soft)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.14)', pointerEvents: 'auto' }}
        >
          <FtBtn onClick={() => applyFmt('bold')}><b style={{ fontSize: 13 }}>B</b></FtBtn>
          <FtBtn onClick={() => applyFmt('italic')}><i style={{ fontFamily: 'Georgia,serif', fontSize: 13 }}>I</i></FtBtn>
          <FtBtn onClick={() => applyFmt('underline')}><u style={{ fontSize: 12 }}>U</u></FtBtn>
          <FtBtn onClick={() => applyFmt('strikeThrough')}><s style={{ fontSize: 12 }}>S</s></FtBtn>
          <FtSep />
          {RICHTEXT_CORES.map((c) => (
            <button key={c} type="button" onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyFmt('foreColor', c)}
              style={{ width: 13, height: 13, borderRadius: 3, border: '1px solid rgba(0,0,0,0.1)', background: c, cursor: 'pointer', flexShrink: 0 }} />
          ))}
        </div>
      )}

      {/* Dropdown de @menção */}
      {mentionQuery !== null && mentionFiltered.length > 0 && mentionPos && (
        <div style={{ position: 'fixed', top: mentionPos.y, left: mentionPos.x, background: 'var(--fe-surface)', border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-md)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 9999, overflow: 'hidden', minWidth: 200 }}>
          {mentionFiltered.map((m) => (
            <button key={m.id} onMouseDown={(e) => { e.preventDefault(); handleSelectMention(m) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--fe-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--fe-accent-fg)', flexShrink: 0 }}>
                {initials(m.nome)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fe-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nome}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Wrapper do input */}
      <div
        style={{ flex: 1, border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-surface)', overflow: 'hidden', transition: 'border-color 150ms' }}
        onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'var(--fe-accent)')}
        onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'var(--fe-border)'; setTimeout(() => setMentionQuery(null), 150) }}
      >
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          data-placeholder="Escreva um comentário… use @ para mencionar alguém (⌘↵ para enviar)"
          className="fe-richtext fe-comment-input"
          style={{ outline: 'none', padding: '10px 12px', fontSize: 13.5, color: 'var(--fe-text)', lineHeight: 1.55, minHeight: 40, boxSizing: 'border-box' as const }}
        />
        {!empty && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 10px', borderTop: '1px solid var(--fe-divider)' }}>
            <button
              onMouseDown={(e) => { e.preventDefault(); send() }}
              style={{ height: 28, padding: '0 14px', borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'var(--fe-accent)', color: 'var(--fe-accent-fg)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            >
              Comentar
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function extractMentionIds(body: string, membros: Membro[]): string[] {
  // body pode ser HTML — extrair texto para encontrar @mentions
  let text = body
  if (/<[a-z][\s\S]*>/i.test(body)) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(body, 'text/html')
    text = doc.body.textContent || ''
  }
  const matches = text.match(/@(\S+)/g) ?? []
  const ids: string[] = []
  for (const match of matches) {
    const name = match.slice(1).toLowerCase()
    const m = membros.find((mb) => mb.nome.toLowerCase() === name || mb.nome.toLowerCase().replace(/\s+/g, '') === name)
    if (m && !ids.includes(m.id)) ids.push(m.id)
  }
  return ids
}

export function TaskComments({ taskId, taskTable }: { taskId: string; taskTable: string }) {
  const { canComment } = useListCaps()
  const supabase = useRef(createClient()).current
  const [comments, setComments] = useState<Comment[]>([])
  const [sending, setSending] = useState(false)
  const [author, setAuthor] = useState('Usuário')
  const [membros, setMembros] = useState<Membro[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email
      if (email) setAuthor(email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    })
  }, [supabase])

  useEffect(() => {
    supabase
      .from('task_comment')
      .select('*')
      .eq('task_table', taskTable)
      .eq('task_id', taskId)
      .order('criado_em', { ascending: true })
      .then(({ data }) => setComments((data as Comment[]) ?? []))
  }, [supabase, taskId, taskTable])

  useEffect(() => {
    supabase
      .from('membros')
      .select('id, email, nome')
      .then(({ data }) => setMembros((data as Membro[]) ?? []))
  }, [supabase])

  async function handleSend(html: string) {
    if (sending) return
    setSending(true)
    const mentions = extractMentionIds(html, membros)
    const { data, error } = await supabase
      .from('task_comment')
      .insert({ task_id: taskId, task_table: taskTable, author, body: html, mentions })
      .select()
      .single()
    setSending(false)
    if (!error && data) {
      setComments((prev) => [...prev, data as Comment])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--fe-text-muted)', flexShrink: 0 }}>
          <path d="M12.5 7C12.5 9.76 10.04 12 7 12C6.13 12 5.3 11.8 4.57 11.45L1.5 12.5L2.58 9.66C2.21 8.88 2 8.02 2 7C2 4.24 4.46 2 7.5 2C10.54 2 12.5 4.24 12.5 7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Comentários {comments.length > 0 ? `(${comments.length})` : ''}
        </span>
      </div>

      {comments.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--fe-text-faint)', margin: '0 0 16px' }}>Nenhum comentário ainda.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {comments.map((c) => (
          <CommentRow key={c.id} comment={c} isOwn={c.author === author} onDelete={async () => {
            await supabase.from('task_comment').delete().eq('id', c.id)
            setComments((prev) => prev.filter((x) => x.id !== c.id))
          }} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input de comentário rich text — só com permissão de comentar. */}
      {canComment && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: comments.length > 0 ? 20 : 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--fe-accent-dim)', color: 'var(--fe-accent)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 5 }}>
            {initials(author)}
          </div>
          <RichCommentInput membros={membros} onSend={handleSend} />
        </div>
      )}
    </div>
  )
}
