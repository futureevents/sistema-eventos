'use server'

import { createClient } from '@/lib/supabase/server'
import { InboxClient } from './InboxClient'
import { discriminatorColumns, taskHref, taskListLabel } from '@/components/list/taskRoute'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const userId = user.id

  const { data } = await supabase
    .from('task_comment')
    .select('*')
    .contains('mentions', [userId])
    .order('criado_em', { ascending: false })
    .limit(100)

  const mentions = data ?? []

  // Tabelas cujo destino depende de um discriminador (ex.: task_projeto.tipo
  // separa pré/intra/pós-evento). Buscamos esse campo em lote, por tabela.
  const discCols = discriminatorColumns()
  const idsByTable = new Map<string, Set<string>>()
  for (const c of mentions) {
    if (!discCols.has(c.task_table)) continue
    if (!idsByTable.has(c.task_table)) idsByTable.set(c.task_table, new Set())
    idsByTable.get(c.task_table)!.add(c.task_id)
  }

  const discByTask = new Map<string, string | null>() // `${table}:${id}` -> valor
  for (const [table, ids] of idsByTable) {
    const col = discCols.get(table)!
    const res = await supabase.from(table).select(`id, ${col}`).in('id', [...ids])
    const rows = (res.data ?? []) as unknown as Array<Record<string, unknown>>
    for (const r of rows) {
      discByTask.set(`${table}:${r.id as string}`, (r[col] as string) ?? null)
    }
  }

  const enriched = mentions.map((c) => {
    const disc = discByTask.get(`${c.task_table}:${c.task_id}`) ?? null
    return {
      ...c,
      href: taskHref(c.task_table, c.task_id, disc),
      listLabel: taskListLabel(c.task_table, disc),
    }
  })

  return <InboxClient mentions={enriched} currentUserId={userId} />
}
