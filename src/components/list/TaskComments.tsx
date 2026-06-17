'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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

// Renderiza o body destacando @menções em azul
function RenderBody({ body }: { body: string }) {
  const parts = body.split(/(@\S+)/g)
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} style={{ color: 'var(--fe-accent)', fontWeight: 600 }}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
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
        <div style={{ fontSize: 13.5, color: 'var(--fe-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <RenderBody body={c.body} />
        </div>
      </div>
    </div>
  )
}

// Dropdown de sugestões de @menção
function MentionDropdown({
  membros,
  query,
  onSelect,
  anchorRef,
}: {
  membros: Membro[]
  query: string
  onSelect: (m: Membro) => void
  anchorRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  const filtered = membros.filter((m) =>
    m.nome.toLowerCase().includes(query.toLowerCase()) ||
    m.email.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6)

  if (filtered.length === 0) return null

  // Posicionar o dropdown logo abaixo do textarea
  const rect = anchorRef.current?.getBoundingClientRect()
  if (!rect) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(220, rect.width),
        background: 'var(--fe-surface)',
        border: '1px solid var(--fe-border)',
        borderRadius: 'var(--fe-radius-md)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {filtered.map((m) => (
        <button
          key={m.id}
          onMouseDown={(e) => { e.preventDefault(); onSelect(m) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '8px 12px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <div style={{
            width: 26, height: 26, borderRadius: '50%', background: '#6E56CF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {initials(m.nome)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fe-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nome}</div>
            <div style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

// Extrai os IDs dos membros mencionados no texto com base no mapa nome→id
function extractMentionIds(body: string, membros: Membro[]): string[] {
  const matches = body.match(/@(\S+)/g) ?? []
  const ids: string[] = []
  for (const match of matches) {
    const name = match.slice(1).toLowerCase()
    const m = membros.find((mb) => mb.nome.toLowerCase() === name || mb.nome.toLowerCase().replace(/\s+/g, '') === name)
    if (m && !ids.includes(m.id)) ids.push(m.id)
  }
  return ids
}

export function TaskComments({ taskId, taskTable }: { taskId: string; taskTable: string }) {
  const supabase = useRef(createClient()).current
  const [comments, setComments] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [author, setAuthor] = useState('Usuário')
  const [membros, setMembros] = useState<Membro[]>([])

  // Estado do dropdown de menção
  const [mentionQuery, setMentionQuery] = useState<string | null>(null) // null = fechado

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  // Detecta @query na posição do cursor
  const detectMention = useCallback((value: string, cursorPos: number) => {
    const textBeforeCursor = value.slice(0, cursorPos)
    const match = textBeforeCursor.match(/@(\S*)$/)
    if (match) {
      setMentionQuery(match[1])
    } else {
      setMentionQuery(null)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setDraft(val)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
    detectMention(val, e.target.selectionStart ?? val.length)
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget
    detectMention(draft, el.selectionStart ?? draft.length)
  }

  function handleSelectMention(m: Membro) {
    const ta = textareaRef.current
    if (!ta) return
    const cursor = ta.selectionStart ?? draft.length
    const before = draft.slice(0, cursor)
    const after = draft.slice(cursor)
    // Substitui o @query pelo @nome (sem espaços)
    const replaced = before.replace(/@(\S*)$/, `@${m.nome.replace(/\s+/g, '')} `)
    const newDraft = replaced + after
    setDraft(newDraft)
    setMentionQuery(null)
    // Reposiciona o cursor após a menção
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(replaced.length, replaced.length)
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
    }, 0)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
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

  async function send() {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    const mentions = extractMentionIds(body, membros)
    const { data, error } = await supabase
      .from('task_comment')
      .insert({ task_id: taskId, task_table: taskTable, author, body, mentions })
      .select()
      .single()
    setSending(false)
    if (!error && data) {
      setComments((prev) => [...prev, data as Comment])
      setDraft('')
      setMentionQuery(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
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

      {/* Input */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginTop: comments.length > 0 ? 20 : 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--fe-accent-dim)', color: 'var(--fe-accent)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {initials(author)}
        </div>
        <div style={{ flex: 1, border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-surface)', overflow: 'hidden', transition: 'border-color 150ms' }}
          onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'var(--fe-accent)')}
          onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'var(--fe-border)'; setTimeout(() => setMentionQuery(null), 150) }}
        >
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            onKeyUp={handleKeyUp}
            onClick={(e) => detectMention(draft, e.currentTarget.selectionStart ?? draft.length)}
            placeholder="Escreva um comentário… use @ para mencionar alguém (⌘↵ para enviar)"
            rows={1}
            style={{ display: 'block', width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: '10px 12px', fontSize: 13.5, color: 'var(--fe-text)', lineHeight: 1.55, minHeight: 40, boxSizing: 'border-box' }}
          />
          {draft.trim() && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 10px', borderTop: '1px solid var(--fe-divider)' }}>
              <button
                onClick={send}
                disabled={sending}
                style={{ height: 28, padding: '0 14px', borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'var(--fe-accent)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1 }}
              >
                {sending ? 'Enviando…' : 'Comentar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown de menção */}
      {mentionQuery !== null && (
        <MentionDropdown
          membros={membros}
          query={mentionQuery}
          onSelect={handleSelectMention}
          anchorRef={textareaRef}
        />
      )}
    </div>
  )
}
