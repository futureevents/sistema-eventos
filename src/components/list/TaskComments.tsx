'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: string
  author: string
  body: string
  criado_em: string
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

export function TaskComments({ taskId, taskTable }: { taskId: string; taskTable: string }) {
  const supabase = useRef(createClient()).current
  const [comments, setComments] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [author, setAuthor] = useState('Usuário')
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

  async function send() {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    const { data, error } = await supabase
      .from('task_comment')
      .insert({ task_id: taskId, task_table: taskTable, author, body })
      .select()
      .single()
    setSending(false)
    if (!error && data) {
      setComments((prev) => [...prev, data as Comment])
      setDraft('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send() }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
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
          <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--fe-accent-dim)', color: 'var(--fe-accent)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {initials(c.author)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fe-text-strong)' }}>{c.author}</span>
                <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)' }}>{horaRelativa(c.criado_em)}</span>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--fe-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {c.body}
              </div>
            </div>
          </div>
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
          onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'var(--fe-border)')}
        >
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={autoResize}
            onKeyDown={onKeyDown}
            placeholder="Escreva um comentário… (⌘↵ para enviar)"
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
    </div>
  )
}
