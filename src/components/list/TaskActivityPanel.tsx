'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type ListConfig } from './types'

/**
 * Painel retrátil "Atividade" no estilo ClickUp: histórico da task e
 * comentários num feed cronológico único, com o compositor fixo no rodapé.
 * Usado na página cheia da task (FullRecord). Mescla `task_activity` e
 * `task_comment` ordenados por data (mais antigo no topo, mais recente junto
 * ao compositor).
 */

interface ActivityRow {
  id: string
  type: 'created' | 'updated'
  actor: string
  payload: Record<string, { de: string | null; para: string | null }>
  criado_em: string
}

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

type FeedItem =
  | { kind: 'activity'; criado_em: string; data: ActivityRow }
  | { kind: 'comment'; criado_em: string; data: Comment }

// ─── Helpers ──────────────────────────────────────────────────────────────

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
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fieldLabel(key: string, config: ListConfig): string {
  const f = config.fields.find((x) => x.key === key)
  if (f) return f.label
  const map: Record<string, string> = {
    nome: 'Nome', status: 'Status', descricao: 'Descrição', prioridade: 'Prioridade',
    prazo: 'Prazo', data_inicio: 'Início', responsavel_id: 'Responsável',
    evento_id: 'Evento', cliente_id: 'Cliente', fornecedor_id: 'Fornecedor',
  }
  return map[key] ?? key
}

function displayValue(val: string | null): string {
  if (val === null || val === '') return '—'
  if (val === 'true') return 'Sim'
  if (val === 'false') return 'Não'
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    return new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return val
}

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

// ─── Itens do feed ────────────────────────────────────────────────────────

function ActivityLine({ item, config }: { item: ActivityRow; config: ListConfig }) {
  if (item.type === 'created') {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--fe-accent-dim)', color: 'var(--fe-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M5 2V8M2 5H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>
        <div style={{ minWidth: 0, paddingTop: 3 }}>
          <span style={{ fontSize: 'var(--fe-text-sm)', color: 'var(--fe-text-soft)' }}>
            <span style={{ fontWeight: 600, color: 'var(--fe-text)' }}>{item.actor || 'Alguém'}</span> criou esta task
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', marginLeft: 8 }}>{horaRelativa(item.criado_em)}</span>
        </div>
      </div>
    )
  }

  const changes = Object.entries(item.payload)
  if (changes.length === 0) return null

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--fe-warm-white)', border: '1px solid var(--fe-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 5h7M6 2.5L8.5 5 6 7.5" stroke="var(--fe-text-muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div style={{ minWidth: 0, paddingTop: 1 }}>
        {changes.map(([key, { de, para }]) => (
          <div key={key} style={{ fontSize: 'var(--fe-text-sm)', color: 'var(--fe-text-soft)', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: 'var(--fe-text)' }}>{item.actor || 'Alguém'}</span> alterou{' '}
            <span style={{ fontWeight: 500, color: 'var(--fe-text)' }}>{fieldLabel(key, config)}</span>{' '}
            de <span style={{ background: 'var(--fe-border-soft)', borderRadius: 3, padding: '0 4px', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12 }}>{displayValue(de)}</span>{' '}
            para <span style={{ background: 'var(--fe-accent-dim)', borderRadius: 3, padding: '0 4px', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12, color: 'var(--fe-accent-dark)' }}>{displayValue(para)}</span>
          </div>
        ))}
        <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)' }}>{horaRelativa(item.criado_em)}</span>
      </div>
    </div>
  )
}

function CommentBlock({ comment: c, isOwn, onDelete }: { comment: Comment; isOwn: boolean; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--fe-accent)', color: 'var(--fe-accent-fg)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {initials(c.author)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 'var(--fe-text-sm)', fontWeight: 600, color: 'var(--fe-text-strong)' }}>{c.author}</span>
          <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)' }}>{horaRelativa(c.criado_em)}</span>
          {isOwn && hovered && (
            <button onClick={onDelete} title="Excluir comentário" style={{ marginLeft: 'auto', width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--fe-prio-urgent)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, padding: 0, opacity: 0.7 }} onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>
              <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
        <div style={{ fontSize: 'var(--fe-text-base)', color: 'var(--fe-text)', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <RenderBody body={c.body} />
        </div>
      </div>
    </div>
  )
}

function MentionDropdown({ membros, query, onSelect }: {
  membros: Membro[]; query: string; onSelect: (m: Membro) => void
}) {
  const filtered = membros.filter((m) =>
    m.nome.toLowerCase().includes(query.toLowerCase()) || m.email.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6)
  if (filtered.length === 0) return null
  return (
    <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, width: '100%', background: 'var(--fe-surface)', border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-md)', boxShadow: 'var(--fe-shadow-pop)', zIndex: 9999, overflow: 'hidden' }}>
      {filtered.map((m) => (
        <button key={m.id} onMouseDown={(e) => { e.preventDefault(); onSelect(m) }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--fe-hover)')} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--fe-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--fe-accent-fg)', flexShrink: 0 }}>{initials(m.nome)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fe-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nome}</div>
            <div style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Painel ───────────────────────────────────────────────────────────────

export function TaskActivityPanel({ taskId, taskTable, config, onClose }: {
  taskId: string; taskTable: string; config: ListConfig; onClose: () => void
}) {
  const supabase = useRef(createClient()).current
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [membros, setMembros] = useState<Membro[]>([])
  const [author, setAuthor] = useState('Usuário')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email
      if (email) setAuthor(email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    })
  }, [supabase])

  useEffect(() => {
    supabase.from('task_activity').select('*').eq('task_table', taskTable).eq('task_id', taskId).order('criado_em', { ascending: true }).limit(200)
      .then(({ data }) => setActivity((data ?? []) as ActivityRow[]))
  }, [supabase, taskId, taskTable])

  useEffect(() => {
    supabase.from('task_comment').select('*').eq('task_table', taskTable).eq('task_id', taskId).order('criado_em', { ascending: true })
      .then(({ data }) => setComments((data as Comment[]) ?? []))
  }, [supabase, taskId, taskTable])

  useEffect(() => {
    supabase.from('membros').select('id, email, nome').then(({ data }) => setMembros((data as Membro[]) ?? []))
  }, [supabase])

  const feed = useMemo<FeedItem[]>(() => {
    const merged: FeedItem[] = [
      ...activity.map((a) => ({ kind: 'activity' as const, criado_em: a.criado_em, data: a })),
      ...comments.map((c) => ({ kind: 'comment' as const, criado_em: c.criado_em, data: c })),
    ]
    merged.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime())
    return merged
  }, [activity, comments])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [feed.length])

  const detectMention = useCallback((value: string, cursorPos: number) => {
    const match = value.slice(0, cursorPos).match(/@(\S*)$/)
    setMentionQuery(match ? match[1] : null)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setDraft(val)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
    detectMention(val, e.target.selectionStart ?? val.length)
  }

  function handleSelectMention(m: Membro) {
    const ta = textareaRef.current
    if (!ta) return
    const cursor = ta.selectionStart ?? draft.length
    const before = draft.slice(0, cursor)
    const after = draft.slice(cursor)
    const replaced = before.replace(/@(\S*)$/, `@${m.nome.replace(/\s+/g, '')} `)
    setDraft(replaced + after)
    setMentionQuery(null)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(replaced.length, replaced.length) }, 0)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape' && mentionQuery !== null) { e.preventDefault(); setMentionQuery(null); return }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send() }
  }

  async function send() {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    const mentions = extractMentionIds(body, membros)
    const { data, error } = await supabase.from('task_comment').insert({ task_id: taskId, task_table: taskTable, author, body, mentions }).select().single()
    setSending(false)
    if (!error && data) {
      setComments((prev) => [...prev, data as Comment])
      setDraft('')
      setMentionQuery(null)
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }
  }

  return (
    <aside style={{ width: 'var(--fe-activity-w, 380px)', flexShrink: 0, height: '100%', borderLeft: '1px solid var(--fe-border)', background: 'var(--fe-surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, padding: '0 10px 0 18px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0 }}>
        <span style={{ fontSize: 'var(--fe-text-md)', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--fe-text-strong)' }}>Atividade</span>
        <button onClick={onClose} title="Esconder atividade" aria-label="Esconder painel de atividade" style={{ width: 30, height: 30, borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'transparent', color: 'var(--fe-text-soft)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fe-hover)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
        </button>
      </div>

      {/* Feed (histórico + comentários) */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 18px 8px' }}>
        {feed.length === 0 ? (
          <p style={{ fontSize: 'var(--fe-text-sm)', color: 'var(--fe-text-faint)', margin: 0 }}>Sem atividade ainda. Os comentários e o histórico de mudanças aparecem aqui.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {feed.map((it) =>
              it.kind === 'activity' ? (
                <ActivityLine key={`a-${it.data.id}`} item={it.data} config={config} />
              ) : (
                <CommentBlock key={`c-${it.data.id}`} comment={it.data} isOwn={it.data.author === author} onDelete={async () => {
                  await supabase.from('task_comment').delete().eq('id', it.data.id)
                  setComments((prev) => prev.filter((x) => x.id !== it.data.id))
                }} />
              )
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compositor fixo */}
      <div style={{ flexShrink: 0, padding: '12px 14px 14px', borderTop: '1px solid var(--fe-border-soft)' }}>
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--fe-accent-dim)', color: 'var(--fe-accent)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(author)}</div>
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            {mentionQuery !== null && <MentionDropdown membros={membros} query={mentionQuery} onSelect={handleSelectMention} />}
            <div style={{ border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-surface)', overflow: 'hidden', transition: 'border-color 150ms' }}
              onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'var(--fe-accent)')}
              onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'var(--fe-border)'; setTimeout(() => setMentionQuery(null), 150) }}>
              <textarea ref={textareaRef} value={draft} onChange={handleChange} onKeyDown={onKeyDown}
                onKeyUp={(e) => detectMention(draft, e.currentTarget.selectionStart ?? draft.length)}
                onClick={(e) => detectMention(draft, e.currentTarget.selectionStart ?? draft.length)}
                placeholder="Escreva um comentário… @ menciona alguém (⌘↵ envia)" rows={1}
                style={{ display: 'block', width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: '9px 11px', fontSize: 'var(--fe-text-sm)', color: 'var(--fe-text)', lineHeight: 1.5, minHeight: 38, boxSizing: 'border-box' }} />
              {draft.trim() && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 9px', borderTop: '1px solid var(--fe-divider)' }}>
                  <button onClick={send} disabled={sending} style={{ height: 28, padding: '0 14px', borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'var(--fe-accent)', color: 'var(--fe-accent-fg)', fontSize: 12.5, fontWeight: 600, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1 }}>{sending ? 'Enviando…' : 'Comentar'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
