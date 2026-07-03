import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { admin, texto, erro, tool, resolveTasks, ANOT_WRITE, ANOT_DESTRUCTIVE } from '../helpers'
import { LISTS_VALIDAS, resolveList } from '../lists'
import { markdownToHtml } from '@/lib/richtext'

const LIST_ENUM = ['projeto', 'marketing', 'oportunidade', 'processo'] as const

const DICA_MD =
  'Aceita markdown e vira rich text: # / ## / ### para títulos, | tabelas |, listas com - e 1., > citações.'

/**
 * Tools GENÉRICAS de escrita que completam o CRUD de qualquer List
 * (as outras — status, prazo, responsável, comentário — já existem).
 * Seguem o princípio "tudo é Task": recebem só `list` + `task` (id ou nome).
 */
export function registrarGenerico(server: McpServer) {
  // ── atualizar_task ──────────────────────────────────────────────────────────
  server.registerTool(
    'atualizar_task',
    {
      title: 'Editar task (nome/descrição)',
      description:
        `Edita o nome e/ou a descrição (corpo) de uma task de qualquer List (${LISTS_VALIDAS.join(', ')}). ` +
        'Para status use `atualizar_status_task`; prazo, `definir_prazo_task`; responsável, `atribuir_responsavel`.',
      inputSchema: {
        list: z.enum(LIST_ENUM).describe('A List da task.'),
        task: z.string().min(1).describe('id (uuid) ou nome da task.'),
        nome: z.string().optional().describe('Novo nome/título.'),
        descricao: z.string().optional().describe(`Novo corpo/descrição. ${DICA_MD}`),
      },
      annotations: { ...ANOT_WRITE, idempotentHint: true },
    },
    tool(async (args: { list: string; task: string; nome?: string; descricao?: string }) => {
      const l = resolveList(args.list)
      if (!l) return erro(`List inválida: "${args.list}".`, `Use uma de: ${LISTS_VALIDAS.join(', ')}.`)

      const payload: Record<string, unknown> = {}
      if (args.nome?.trim()) payload.nome = args.nome.trim()
      if (args.descricao?.trim()) payload.descricao = markdownToHtml(args.descricao.trim())
      if (Object.keys(payload).length === 0) {
        return erro('Nada para atualizar.', 'Informe um novo `nome` e/ou `descricao`.')
      }

      const achados = await resolveTasks(l.table, args.task)
      if (achados.length === 0) {
        return erro(`Não encontrei nenhuma task "${args.task}" em ${l.label}.`, 'Confira o nome ou o id.')
      }
      if (achados.length > 1) {
        const linhas = achados.map((t) => `• ${t.nome} — id: ${t.id}`)
        return erro(
          `"${args.task}" casou com ${achados.length} tasks em ${l.label} — não alterei nada.`,
          `Repita informando o id exato:\n${linhas.join('\n')}`
        )
      }

      const a = admin()
      const { error } = await a.from(l.table).update(payload).eq('id', achados[0].id)
      if (error) return erro(`Não consegui editar a task: ${error.message}`)
      return texto(`✅ Task **${payload.nome ?? achados[0].nome}** atualizada (${Object.keys(payload).join(', ')}).`)
    })
  )

  // ── apagar_task ─────────────────────────────────────────────────────────────
  server.registerTool(
    'apagar_task',
    {
      title: 'Apagar task',
      description:
        `Apaga permanentemente uma task de qualquer List (${LISTS_VALIDAS.join(', ')}) — inclui processos (POPs), ` +
        'tasks de projeto, marketing e oportunidades. Informe o id (mais seguro) ou o nome; se o nome casar com mais ' +
        'de uma, nada é apagado e os candidatos são listados. Ação irreversível.',
      inputSchema: {
        list: z.enum(LIST_ENUM).describe('A List da task.'),
        task: z.string().min(1).describe('id (uuid) ou nome da task a apagar.'),
      },
      annotations: ANOT_DESTRUCTIVE,
    },
    tool(async (args: { list: string; task: string }) => {
      const l = resolveList(args.list)
      if (!l) return erro(`List inválida: "${args.list}".`, `Use uma de: ${LISTS_VALIDAS.join(', ')}.`)

      const achados = await resolveTasks(l.table, args.task)
      if (achados.length === 0) {
        return erro(`Não encontrei nenhuma task "${args.task}" em ${l.label}.`, 'Confira o nome ou o id.')
      }
      if (achados.length > 1) {
        const linhas = achados.map((t) => `• ${t.nome} — id: ${t.id}`)
        return erro(
          `"${args.task}" casou com ${achados.length} tasks em ${l.label} — não apaguei nada por segurança.`,
          `Repita informando o id exato de uma delas:\n${linhas.join('\n')}`
        )
      }

      const alvo = achados[0]
      const a = admin()
      const { error } = await a.from(l.table).delete().eq('id', alvo.id)
      if (error) return erro(`Não consegui apagar a task: ${error.message}`)
      return texto(`🗑️ Task **${alvo.nome}** (${l.label}) apagada permanentemente.`)
    })
  )
}
