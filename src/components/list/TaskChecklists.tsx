'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Item {
  id: string
  checklist_id: string
  label: string
  done: boolean
  posicao: number
}

interface Checklist {
  id: string
  title: string
  posicao: number
  items: Item[]
}

export function TaskChecklists({ taskId, taskTable }: { taskId: string; taskTable: string }) {
  const supabase = useRef(createClient()).current
  const [lists, setLists] = useState<Checklist[]>([])
  const [adding, setAdding] = useState(false)
  const newItemRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    async function load() {
      const { data: cls } = await supabase
        .from('task_checklist')
        .select('*')
        .eq('task_table', taskTable)
        .eq('task_id', taskId)
        .order('posicao')
      if (!cls) return
      const ids = cls.map((c) => c.id)
      const { data: items } = ids.length
        ? await supabase.from('task_checklist_item').select('*').in('checklist_id', ids).order('posicao')
        : { data: [] }
      setLists(cls.map((c) => ({ ...c, items: (items ?? []).filter((i) => i.checklist_id === c.id) })))
    }
    load()
  }, [supabase, taskId, taskTable])

  async function addChecklist() {
    if (adding) return
    setAdding(true)
    const posicao = lists.length
    const { data, error } = await supabase
      .from('task_checklist')
      .insert({ task_id: taskId, task_table: taskTable, posicao })
      .select()
      .single()
    setAdding(false)
    if (!error && data) {
      setLists((prev) => [...prev, { ...data, items: [] }])
    }
  }

  async function renameChecklist(id: string, title: string) {
    await supabase.from('task_checklist').update({ title }).eq('id', id)
    setLists((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)))
  }

  async function deleteChecklist(id: string) {
    await supabase.from('task_checklist').delete().eq('id', id)
    setLists((prev) => prev.filter((c) => c.id !== id))
  }

  async function addItem(checklistId: string, label: string) {
    const cl = lists.find((c) => c.id === checklistId)
    if (!cl || !label.trim()) return
    const posicao = cl.items.length
    const { data, error } = await supabase
      .from('task_checklist_item')
      .insert({ checklist_id: checklistId, label: label.trim(), posicao })
      .select()
      .single()
    if (!error && data) {
      setLists((prev) =>
        prev.map((c) => (c.id === checklistId ? { ...c, items: [...c.items, data as Item] } : c))
      )
      setTimeout(() => newItemRefs.current[checklistId]?.focus(), 30)
    }
  }

  async function toggleItem(checklistId: string, itemId: string, done: boolean) {
    await supabase.from('task_checklist_item').update({ done }).eq('id', itemId)
    setLists((prev) =>
      prev.map((c) =>
        c.id === checklistId ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, done } : i)) } : c
      )
    )
  }

  async function renameItem(checklistId: string, itemId: string, label: string) {
    if (!label.trim()) return deleteItem(checklistId, itemId)
    await supabase.from('task_checklist_item').update({ label }).eq('id', itemId)
    setLists((prev) =>
      prev.map((c) =>
        c.id === checklistId ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, label } : i)) } : c
      )
    )
  }

  async function deleteItem(checklistId: string, itemId: string) {
    await supabase.from('task_checklist_item').delete().eq('id', itemId)
    setLists((prev) =>
      prev.map((c) => (c.id === checklistId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c))
    )
  }

  if (lists.length === 0 && !adding) {
    return (
      <div style={{ marginTop: 24 }}>
        <button onClick={addChecklist} style={addBtnStyle}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          Adicionar checklist
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 28 }}>
      {lists.map((cl) => {
        const total = cl.items.length
        const done = cl.items.filter((i) => i.done).length
        const pct = total > 0 ? Math.round((done / total) * 100) : 0
        return (
          <ChecklistBlock
            key={cl.id}
            cl={cl}
            pct={pct}
            done={done}
            total={total}
            newItemRef={(el) => { newItemRefs.current[cl.id] = el }}
            onRename={(title) => renameChecklist(cl.id, title)}
            onDelete={() => deleteChecklist(cl.id)}
            onAddItem={(label) => addItem(cl.id, label)}
            onToggle={(itemId, val) => toggleItem(cl.id, itemId, val)}
            onRenameItem={(itemId, label) => renameItem(cl.id, itemId, label)}
            onDeleteItem={(itemId) => deleteItem(cl.id, itemId)}
          />
        )
      })}
      <button onClick={addChecklist} disabled={adding} style={{ ...addBtnStyle, marginTop: 8 }}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        {adding ? 'Criando…' : 'Adicionar checklist'}
      </button>
    </div>
  )
}

function ChecklistBlock({ cl, pct, done, total, newItemRef, onRename, onDelete, onAddItem, onToggle, onRenameItem, onDeleteItem }: {
  cl: Checklist; pct: number; done: number; total: number
  newItemRef: (el: HTMLInputElement | null) => void
  onRename: (t: string) => void; onDelete: () => void
  onAddItem: (l: string) => void; onToggle: (id: string, v: boolean) => void
  onRenameItem: (id: string, l: string) => void; onDeleteItem: (id: string) => void
}) {
  const [newLabel, setNewLabel] = useState('')
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--fe-text-muted)', flexShrink: 0 }}>
          <path d="M2 4L5.5 7.5L12 2M2 10L5.5 13.5L12 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <input
          defaultValue={cl.title}
          onBlur={(e) => { if (e.target.value.trim() && e.target.value !== cl.title) onRename(e.target.value.trim()) }}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
          style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--fe-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', outline: 'none', background: 'transparent' }}
        />
        <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', whiteSpace: 'nowrap' }}>{done}/{total}</span>
        <button onClick={onDelete} title="Excluir checklist" style={{ width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--fe-text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, padding: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fe-prio-urgent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fe-text-faint)')}
        >
          <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 11.5, color: 'var(--fe-text-faint)', width: 28, textAlign: 'right' }}>{pct}%</span>
          <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'var(--fe-border-soft)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: pct === 100 ? 'var(--fe-accent)' : 'var(--fe-accent)', transition: 'width 300ms ease', opacity: pct === 100 ? 1 : 0.65 }} />
          </div>
        </div>
      )}

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {cl.items.map((item) => (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderRadius: 'var(--fe-radius-sm)' }}
          >
            <button
              onClick={() => onToggle(item.id, !item.done)}
              style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${item.done ? 'var(--fe-accent)' : 'var(--fe-border)'}`, background: item.done ? 'var(--fe-accent)' : 'transparent', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms', padding: 0 }}
            >
              {item.done && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5.2L4.2 7.5L8.5 2.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
            <input
              defaultValue={item.label}
              onBlur={(e) => onRenameItem(item.id, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
              style={{ flex: 1, fontSize: 13.5, color: item.done ? 'var(--fe-text-faint)' : 'var(--fe-text)', textDecoration: item.done ? 'line-through' : 'none', border: 'none', outline: 'none', background: 'transparent', lineHeight: 1.5 }}
            />
            <button
              onClick={() => onDeleteItem(item.id)}
              style={{ width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--fe-text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hoveredItem === item.id ? 0.5 : 0, transition: 'opacity 100ms', padding: 0, borderRadius: 4 }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          </div>
        ))}

        {/* New item input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid var(--fe-border-soft)', flexShrink: 0 }} />
          <input
            ref={newItemRef}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newLabel.trim()) { onAddItem(newLabel); setNewLabel('') }
            }}
            placeholder="Adicionar item…"
            style={{ flex: 1, fontSize: 13.5, color: 'var(--fe-text)', border: 'none', outline: 'none', background: 'transparent', lineHeight: 1.5 }}
          />
          {newLabel.trim() && (
            <button
              onClick={() => { onAddItem(newLabel); setNewLabel('') }}
              style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fe-accent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}
            >
              ↵ Salvar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const addBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500,
  color: 'var(--fe-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
}
