'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { markdownToHtml } from '@/lib/richtext'
import { useListEditable } from './perm-ctx'

interface Attachment {
  id: string
  name: string
  size: bigint | number
  mime_type: string
  storage_path: string
  criado_em: string
}

const BUCKET = 'task-attachments'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fileIcon(mime: string): React.ReactNode {
  const color = mime.startsWith('image/') ? '#3E63DD' : mime === 'application/pdf' ? '#DC3D43' : mime.startsWith('video/') ? '#7C66DC' : 'var(--fe-text-muted)'
  if (mime.startsWith('image/')) {
    return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="3" stroke={color} strokeWidth="1.4"/><path d="M2 13L7 8L11 12L14 9L18 13" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/><circle cx="13.5" cy="6.5" r="1.5" fill={color}/></svg>
  }
  if (mime === 'application/pdf') {
    return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 2H13L18 7V18C18 18.6 17.6 19 17 19H5C4.4 19 4 18.6 4 18V3C4 2.4 4.4 2 5 2Z" stroke={color} strokeWidth="1.4"/><path d="M13 2V7H18" stroke={color} strokeWidth="1.4"/><path d="M7 12H13M7 15H11" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></svg>
  }
  if (mime.startsWith('video/')) {
    return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="12" height="12" rx="2" stroke={color} strokeWidth="1.4"/><path d="M14 8L18 6V14L14 12V8Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/></svg>
  }
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 2H13L18 7V18C18 18.6 17.6 19 17 19H5C4.4 19 4 18.6 4 18V3C4 2.4 4.4 2 5 2Z" stroke={color} strokeWidth="1.4"/><path d="M13 2V7H18" stroke={color} strokeWidth="1.4"/></svg>
}

type PreviewKind = 'image' | 'video' | 'audio' | 'pdf' | 'markdown' | 'text' | 'other'

const TEXT_EXTS = ['txt', 'log', 'csv', 'json', 'xml', 'yml', 'yaml', 'js', 'ts', 'tsx', 'jsx', 'css', 'html', 'sql', 'sh', 'env', 'ini', 'toml']

// Decide como pré-visualizar: usa o mime; se vier vazio, cai para a extensão do nome.
function previewKind(mime: string, name: string): PreviewKind {
  const m = (mime || '').toLowerCase()
  const ext = (name.split('.').pop() ?? '').toLowerCase()
  if (m.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext)) return 'image'
  if (m.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext)) return 'video'
  if (m.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio'
  if (m === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (m === 'text/markdown' || ['md', 'markdown'].includes(ext)) return 'markdown'
  if (m.startsWith('text/') || m === 'application/json' || TEXT_EXTS.includes(ext)) return 'text'
  return 'other'
}

// Preview de texto/markdown: busca o conteúdo do arquivo (bucket público) e renderiza.
function TextPreview({ url, kind, name }: { url: string; kind: 'markdown' | 'text'; name: string }) {
  const [state, setState] = useState<{ loading: boolean; error: boolean; content: string }>({ loading: true, error: false, content: '' })
  useEffect(() => {
    let alive = true
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(); return r.text() })
      .then((t) => { if (alive) setState({ loading: false, error: false, content: t }) })
      .catch(() => { if (alive) setState({ loading: false, error: true, content: '' }) })
    return () => { alive = false }
  }, [url])

  if (state.loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--fe-text-faint)', fontSize: 13 }}>Carregando…</div>
  if (state.error) return <FallbackPreview url={url} name={name} />
  if (kind === 'markdown') {
    return <div className="fe-rich-content" style={{ fontSize: 14.5, color: 'var(--fe-text)', lineHeight: 1.65, padding: '24px 28px' }} dangerouslySetInnerHTML={{ __html: markdownToHtml(state.content) }} />
  }
  return <pre style={{ margin: 0, padding: '20px 24px', fontSize: 13, lineHeight: 1.6, color: 'var(--fe-text)', fontFamily: 'var(--fe-font-mono, ui-monospace, monospace)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{state.content}</pre>
}

// Tipo sem preview embutido (zip, docx, xlsx…): oferece baixar/abrir.
function FallbackPreview({ url, name }: { url: string; name: string }) {
  return (
    <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--fe-border-soft)', borderRadius: 12 }}>
        <svg width="28" height="28" viewBox="0 0 20 20" fill="none"><path d="M5 2H13L18 7V18C18 18.6 17.6 19 17 19H5C4.4 19 4 18.6 4 18V3C4 2.4 4.4 2 5 2Z" stroke="var(--fe-text-muted)" strokeWidth="1.2"/><path d="M13 2V7H18" stroke="var(--fe-text-muted)" strokeWidth="1.2"/></svg>
      </div>
      <div style={{ fontSize: 14, color: 'var(--fe-text)', fontWeight: 500, maxWidth: 360, overflowWrap: 'anywhere' }}>{name}</div>
      <div style={{ fontSize: 13, color: 'var(--fe-text-faint)' }}>Este tipo de arquivo não tem pré-visualização.</div>
      <a href={url} download={name} target="_blank" rel="noopener noreferrer" style={{ marginTop: 4, padding: '9px 18px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Baixar arquivo</a>
    </div>
  )
}

// Seta lateral de navegação entre anexos.
function NavArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={side === 'left' ? 'Anterior (←)' : 'Próximo (→)'}
      style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [side]: 'clamp(8px, 2vw, 24px)', width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.45)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        {side === 'left'
          ? <path d="M11 3L5 9L11 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M7 3L13 9L7 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>}
      </svg>
    </button>
  )
}

// Lightbox de preview, independente do tipo de arquivo. Navega pela lista inteira
// (setas na tela + teclado ← →). Fecha no backdrop ou Esc.
function AttachmentPreview({ items, index, urlFor, onNavigate, onClose }: { items: Attachment[]; index: number; urlFor: (a: Attachment) => string; onNavigate: (i: number) => void; onClose: () => void }) {
  const att = items[index]
  const total = items.length
  const go = (dir: number) => { if (total > 1) onNavigate((index + dir + total) % total) }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, total, onNavigate, onClose])

  if (typeof document === 'undefined' || !att) return null

  const url = urlFor(att)
  const kind = previewKind(att.mime_type, att.name)
  const fitsContent = kind === 'image' || kind === 'video' || kind === 'audio'

  return createPortal(
    <div
      className="fe-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--fe-backdrop, rgba(0,0,0,0.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px, 4vw, 48px)' }}
    >
      {total > 1 && <NavArrow side="left" onClick={() => go(-1)} />}
      {total > 1 && <NavArrow side="right" onClick={() => go(1)} />}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', background: 'var(--fe-surface)', borderRadius: 'var(--fe-radius-lg, 12px)', boxShadow: 'var(--fe-shadow-panel, 0 20px 60px rgba(0,0,0,0.3))', overflow: 'hidden', maxHeight: '90vh', width: fitsContent ? 'auto' : 'min(920px, 100%)', maxWidth: '100%' }}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0 }}>
          <div style={{ flexShrink: 0 }}>{fileIcon(att.mime_type)}</div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 500, color: 'var(--fe-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</div>
          {total > 1 && <div style={{ flexShrink: 0, fontSize: 12, color: 'var(--fe-text-faint)', fontVariantNumeric: 'tabular-nums', padding: '0 4px' }}>{index + 1} / {total}</div>}
          <a href={url} target="_blank" rel="noopener noreferrer" title="Abrir em nova aba" style={{ width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fe-text-muted)', textDecoration: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2.5C2.2 2 2 2.2 2 2.5V11.5C2 11.8 2.2 12 2.5 12H11.5C11.8 12 12 11.8 12 11.5V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M8 2H12V6M12 2L6.5 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
          <a href={url} download={att.name} target="_blank" rel="noopener noreferrer" title="Baixar" style={{ width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fe-text-muted)', textDecoration: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2V10M4 7L7 10L10 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.5 12H11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </a>
          <button onClick={onClose} title="Fechar" style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fe-text-muted)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Corpo */}
        <div style={{ overflow: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {kind === 'image' && <img key={att.id} src={url} alt={att.name} style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(90vh - 55px)', objectFit: 'contain', margin: 'auto' }} />}
          {kind === 'video' && <video key={att.id} src={url} controls autoPlay style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(90vh - 55px)', margin: 'auto', background: '#000' }} />}
          {kind === 'audio' && <div style={{ padding: '28px 24px', minWidth: 360 }}><audio key={att.id} src={url} controls autoPlay style={{ width: '100%' }} /></div>}
          {kind === 'pdf' && <iframe key={att.id} src={url} title={att.name} style={{ border: 'none', width: '100%', height: 'calc(90vh - 55px)' }} />}
          {(kind === 'markdown' || kind === 'text') && <TextPreview key={att.id} url={url} kind={kind} name={att.name} />}
          {kind === 'other' && <FallbackPreview key={att.id} url={url} name={att.name} />}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function TaskAttachments({ taskId, taskTable }: { taskId: string; taskTable: string }) {
  const canEdit = useListEditable()
  const supabase = useRef(createClient()).current
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase
      .from('task_attachment')
      .select('*')
      .eq('task_table', taskTable)
      .eq('task_id', taskId)
      .order('criado_em', { ascending: false })
      .then(({ data }) => setAttachments((data ?? []) as Attachment[]))
  }, [supabase, taskId, taskTable])

  async function upload(files: FileList | File[]) {
    const list = Array.from(files)
    if (!list.length || uploading) return
    setUploading(true)
    for (const file of list) {
      const ext = file.name.split('.').pop() ?? ''
      const path = `${taskTable}/${taskId}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file)
      if (upErr) continue
      const { data, error } = await supabase
        .from('task_attachment')
        .insert({ task_id: taskId, task_table: taskTable, name: file.name, size: file.size, mime_type: file.type, storage_path: path })
        .select()
        .single()
      if (!error && data) setAttachments((prev) => [data as Attachment, ...prev])
    }
    setUploading(false)
  }

  async function remove(att: Attachment) {
    await supabase.storage.from(BUCKET).remove([att.storage_path])
    await supabase.from('task_attachment').delete().eq('id', att.id)
    setAttachments((prev) => prev.filter((a) => a.id !== att.id))
  }

  function publicUrl(path: string) {
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files)
  }

  // Sem permissão de editar e sem anexos: nada a mostrar.
  if (!canEdit && attachments.length === 0) return null

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--fe-text-muted)' }}>
          <path d="M11.5 7L7 11.5C5.6 12.9 3.4 12.9 2 11.5C0.6 10.1 0.6 7.9 2 6.5L7 1.5C7.9 0.6 9.4 0.6 10.3 1.5C11.2 2.4 11.2 3.9 10.3 4.8L5.3 9.8C4.9 10.2 4.1 10.2 3.7 9.8C3.3 9.4 3.3 8.6 3.7 8.2L8.2 3.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Anexos {attachments.length > 0 ? `(${attachments.length})` : ''}
        </span>
      </div>

      {/* Drop zone — só com permissão de editar */}
      {canEdit && <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? 'var(--fe-accent)' : 'var(--fe-border)'}`,
          borderRadius: 'var(--fe-radius-md)',
          padding: '14px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: dragging ? 'var(--fe-accent-dim)' : 'transparent',
          transition: 'all 150ms',
          marginBottom: attachments.length > 0 ? 14 : 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: dragging ? 'var(--fe-accent)' : 'var(--fe-icon)', flexShrink: 0 }}>
          <path d="M8 3V11M5 6L8 3L11 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 13H13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 13, color: dragging ? 'var(--fe-accent)' : 'var(--fe-text-faint)' }}>
          {uploading ? 'Enviando…' : 'Clique ou arraste arquivos aqui'}
        </span>
        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => e.target.files && upload(e.target.files)} />
      </div>}

      {/* Lista de arquivos */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {attachments.map((att, i) => {
            const isImage = att.mime_type.startsWith('image/')
            const url = publicUrl(att.storage_path)
            return (
              <div
                key={att.id}
                onMouseEnter={() => setHoveredId(att.id)}
                onMouseLeave={() => setHoveredId(null)}
                onDoubleClick={() => setPreviewIndex(i)}
                title="Clique duplo para pré-visualizar"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--fe-radius-md)', background: hoveredId === att.id ? 'var(--fe-border-soft)' : 'transparent', transition: 'background 100ms', cursor: 'pointer', userSelect: 'none' }}
              >
                {/* Preview ou ícone */}
                {isImage ? (
                  <img src={url} alt={att.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid var(--fe-border-soft)' }} />
                ) : (
                  <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--fe-border-soft)', borderRadius: 6, flexShrink: 0 }}>
                    {fileIcon(att.mime_type)}
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--fe-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fe-text-faint)' }}>{formatSize(Number(att.size))}</div>
                </div>

                {/* Ações */}
                <div onDoubleClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 4, opacity: hoveredId === att.id ? 1 : 0, transition: 'opacity 100ms' }}>
                  <a href={url} download={att.name} target="_blank" rel="noopener noreferrer" title="Baixar" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fe-text-muted)', textDecoration: 'none' }}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2V10M4 7L7 10L10 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.5 12H11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  </a>
                  {canEdit && <button onClick={() => remove(att)} title="Excluir" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--fe-prio-urgent)' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3H10M4.5 3V2H7.5V3M3 3L3.5 10H8.5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {previewIndex !== null && attachments[previewIndex] && (
        <AttachmentPreview
          items={attachments}
          index={previewIndex}
          urlFor={(a) => publicUrl(a.storage_path)}
          onNavigate={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </div>
  )
}
