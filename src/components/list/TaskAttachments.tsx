'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

export function TaskAttachments({ taskId, taskTable }: { taskId: string; taskTable: string }) {
  const supabase = useRef(createClient()).current
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
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

      {/* Drop zone */}
      <div
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
      </div>

      {/* Lista de arquivos */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {attachments.map((att) => {
            const isImage = att.mime_type.startsWith('image/')
            const url = publicUrl(att.storage_path)
            return (
              <div
                key={att.id}
                onMouseEnter={() => setHoveredId(att.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--fe-radius-md)', background: hoveredId === att.id ? 'var(--fe-border-soft)' : 'transparent', transition: 'background 100ms' }}
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
                <div style={{ display: 'flex', gap: 4, opacity: hoveredId === att.id ? 1 : 0, transition: 'opacity 100ms' }}>
                  <a href={url} download={att.name} target="_blank" rel="noopener noreferrer" title="Baixar" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fe-text-muted)', textDecoration: 'none' }}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2V10M4 7L7 10L10 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.5 12H11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  </a>
                  <button onClick={() => remove(att)} title="Excluir" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--fe-border)', background: 'var(--fe-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--fe-prio-urgent)' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3H10M4.5 3V2H7.5V3M3 3L3.5 10H8.5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
