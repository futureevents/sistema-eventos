import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { admin, texto, erro, tool, normalizarData, resolveMembro, ANOT_WRITE } from '../helpers'
import { LISTS_VALIDAS, resolveList } from '../lists'

const LIST_ENUM = z.enum(['projeto', 'marketing', 'oportunidade', 'processo'])
const BUCKET = 'task-attachments'

export function registrarAnatomia(server: McpServer) {
  // ── atribuir_responsavel ──────────────────────────────────────────────────
  server.registerTool(
    'atribuir_responsavel',
    {
      title: 'Atribuir responsável',
      description: `Define o responsável de uma task (Lists com responsável: projeto, marketing, oportunidade). Aceita e-mail ou nome.`,
      inputSchema: {
        list: LIST_ENUM.describe('A List da task.'),
        id: z.string().describe('id (uuid) da task.'),
        responsavel: z.string().describe('E-mail ou nome do membro.'),
      },
      annotations: { ...ANOT_WRITE, idempotentHint: true },
    },
    tool(async ({ list, id, responsavel }: { list: string; id: string; responsavel: string }) => {
      const l = resolveList(list)
      if (!l) return erro(`List inválida: "${list}".`, `Use uma de: ${LISTS_VALIDAS.join(', ')}.`)
      if (!l.temResponsavel) return erro(`${l.label} não tem responsável.`, 'Use projeto, marketing ou oportunidade.')
      const m = await resolveMembro(responsavel)
      if (!m) return erro(`Não encontrei o membro "${responsavel}".`, 'Use `listar_membros` para conferir.')
      const a = admin()
      const { data, error } = await a.from(l.table).update({ responsavel_id: m.id }).eq('id', id).select('id, nome').maybeSingle()
      if (error) return erro(`Não consegui atribuir: ${error.message}`)
      if (!data) return erro(`Task ${id} não encontrada em ${l.label}.`)
      return texto(`✅ **${data.nome}** agora é responsabilidade de ${m.nome || m.email}.`)
    })
  )

  // ── definir_prazo_task ────────────────────────────────────────────────────
  server.registerTool(
    'definir_prazo_task',
    {
      title: 'Definir prazo da task',
      description:
        'Define data de início e/ou de fim (prazo) de uma task. Datas em "AAAA-MM-DD" (só dia) ou "AAAA-MM-DDTHH:mm". Lists com prazo: projeto, marketing, oportunidade.',
      inputSchema: {
        list: LIST_ENUM.describe('A List da task.'),
        id: z.string().describe('id (uuid) da task.'),
        data_inicio: z.string().optional(),
        data_fim: z.string().optional().describe('Prazo.'),
      },
      annotations: { ...ANOT_WRITE, idempotentHint: true },
    },
    tool(async ({ list, id, data_inicio, data_fim }: { list: string; id: string; data_inicio?: string; data_fim?: string }) => {
      const l = resolveList(list)
      if (!l) return erro(`List inválida: "${list}".`, `Use uma de: ${LISTS_VALIDAS.join(', ')}.`)
      if (!l.temPrazo) return erro(`${l.label} não tem prazo.`)
      const payload: Record<string, unknown> = {}
      const di = normalizarData(data_inicio); if (di) payload.data_inicio = di
      const df = normalizarData(data_fim); if (df) payload.data_fim = df
      if (Object.keys(payload).length === 0) return erro('Informe data_inicio e/ou data_fim.')
      const a = admin()
      const { data, error } = await a.from(l.table).update(payload).eq('id', id).select('id, nome').maybeSingle()
      if (error) return erro(`Não consegui definir o prazo: ${error.message}`)
      if (!data) return erro(`Task ${id} não encontrada em ${l.label}.`)
      return texto(`✅ Prazo de **${data.nome}** atualizado (${Object.keys(payload).join(', ')}).`)
    })
  )

  // ── anexar_em_task ────────────────────────────────────────────────────────
  server.registerTool(
    'anexar_em_task',
    {
      title: 'Anexar arquivo em task',
      description:
        'Anexa um arquivo a uma task de qualquer List. Passe `url` (o arquivo é baixado) OU `conteudo_base64`. O anexo aparece na tela da task.',
      inputSchema: {
        list: LIST_ENUM.describe('A List da task.'),
        id: z.string().describe('id (uuid) da task.'),
        nome: z.string().describe('Nome do arquivo (com extensão, ex.: contrato.pdf).'),
        url: z.string().optional().describe('URL pública do arquivo a baixar e anexar.'),
        conteudo_base64: z.string().optional().describe('Conteúdo do arquivo em base64 (alternativa à url).'),
        mime: z.string().optional().describe('Tipo MIME (ex.: application/pdf). Inferido da url se ausente.'),
      },
      annotations: ANOT_WRITE,
    },
    tool(async ({ list, id, nome, url, conteudo_base64, mime }: {
      list: string; id: string; nome: string; url?: string; conteudo_base64?: string; mime?: string
    }) => {
      const l = resolveList(list)
      if (!l) return erro(`List inválida: "${list}".`, `Use uma de: ${LISTS_VALIDAS.join(', ')}.`)
      if (!url && !conteudo_base64) return erro('Informe `url` ou `conteudo_base64`.')

      let buffer: Buffer
      let mimeType = mime ?? 'application/octet-stream'
      if (conteudo_base64) {
        buffer = Buffer.from(conteudo_base64, 'base64')
      } else {
        const resp = await fetch(url!)
        if (!resp.ok) return erro(`Não consegui baixar o arquivo (HTTP ${resp.status}).`, 'Confira se a URL é pública.')
        buffer = Buffer.from(await resp.arrayBuffer())
        if (!mime) mimeType = resp.headers.get('content-type')?.split(';')[0] ?? mimeType
      }

      const ext = nome.includes('.') ? nome.split('.').pop() : ''
      const path = `${l.table}/${id}/${crypto.randomUUID()}${ext ? '.' + ext : ''}`
      const a = admin()
      const { error: upErr } = await a.storage.from(BUCKET).upload(path, buffer, { contentType: mimeType })
      if (upErr) return erro(`Falha no upload: ${upErr.message}`)
      const { error } = await a.from('task_attachment').insert({
        task_id: id, task_table: l.table, name: nome, size: buffer.length, mime_type: mimeType, storage_path: path,
      })
      if (error) return erro(`Arquivo subiu, mas não registrei o anexo: ${error.message}`)
      return texto(`📎 Anexo **${nome}** (${(buffer.length / 1024).toFixed(0)} KB) adicionado à task ${id}.`)
    })
  )

  // ── adicionar_checklist ───────────────────────────────────────────────────
  server.registerTool(
    'adicionar_checklist',
    {
      title: 'Adicionar checklist',
      description: 'Cria um checklist numa task, opcionalmente já com itens. Funciona em qualquer List.',
      inputSchema: {
        list: LIST_ENUM.describe('A List da task.'),
        id: z.string().describe('id (uuid) da task.'),
        titulo: z.string().optional().describe('Título do checklist (default "Checklist").'),
        itens: z.array(z.string()).optional().describe('Itens iniciais.'),
      },
      annotations: ANOT_WRITE,
    },
    tool(async ({ list, id, titulo, itens }: { list: string; id: string; titulo?: string; itens?: string[] }) => {
      const l = resolveList(list)
      if (!l) return erro(`List inválida: "${list}".`, `Use uma de: ${LISTS_VALIDAS.join(', ')}.`)
      const a = admin()
      const { data: chk, error } = await a
        .from('task_checklist')
        .insert({ task_id: id, task_table: l.table, title: titulo || 'Checklist' })
        .select('id, title')
        .single()
      if (error) return erro(`Não consegui criar o checklist: ${error.message}`)
      let nItens = 0
      if (itens?.length) {
        const rows = itens.map((label, i) => ({ checklist_id: chk.id, label, posicao: i }))
        const { error: itErr } = await a.from('task_checklist_item').insert(rows)
        if (itErr) return erro(`Checklist criado, mas falhei nos itens: ${itErr.message}`)
        nItens = rows.length
      }
      return texto(`☑ Checklist **${chk.title}** criado com ${nItens} item(ns) na task ${id}.`)
    })
  )

  // ── marcar_item_checklist ─────────────────────────────────────────────────
  server.registerTool(
    'marcar_item_checklist',
    {
      title: 'Marcar item de checklist',
      description: 'Marca ou desmarca um item de checklist de uma task, encontrando-o pelo texto do item.',
      inputSchema: {
        list: LIST_ENUM.describe('A List da task.'),
        id: z.string().describe('id (uuid) da task.'),
        item: z.string().describe('Texto (ou trecho) do item a marcar.'),
        done: z.boolean().optional().describe('true = feito (default), false = desmarca.'),
      },
      annotations: { ...ANOT_WRITE, idempotentHint: true },
    },
    tool(async ({ list, id, item, done }: { list: string; id: string; item: string; done?: boolean }) => {
      const l = resolveList(list)
      if (!l) return erro(`List inválida: "${list}".`, `Use uma de: ${LISTS_VALIDAS.join(', ')}.`)
      const a = admin()
      const { data: chks } = await a.from('task_checklist').select('id').eq('task_table', l.table).eq('task_id', id)
      const ids = (chks as { id: string }[] | null ?? []).map((c) => c.id)
      if (ids.length === 0) return erro('Essa task não tem checklist.', 'Crie um com `adicionar_checklist`.')
      const { data: itens } = await a
        .from('task_checklist_item')
        .select('id, label')
        .in('checklist_id', ids)
        .ilike('label', `%${item}%`)
      const achados = (itens as { id: string; label: string }[] | null) ?? []
      if (achados.length === 0) return erro(`Nenhum item com "${item}".`, 'Confira o texto com `detalhe_task`.')
      const novo = done !== false
      const { error } = await a.from('task_checklist_item').update({ done: novo }).in('id', achados.map((i) => i.id))
      if (error) return erro(`Não consegui marcar: ${error.message}`)
      return texto(`☑ ${achados.length} item(ns) ${novo ? 'marcado(s) como feito' : 'desmarcado(s)'}: ${achados.map((i) => i.label).join(', ')}.`)
    })
  )
}
