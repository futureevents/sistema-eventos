import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Membro } from '../auth'
import { admin, texto, erro, tool, normalizarData, resolveEvento, resolveMembro } from '../helpers'
import { LISTS_VALIDAS, resolveList } from '../lists'
import { markdownToHtml } from '@/lib/richtext'

/**
 * Campos rich text (descrição, comentário) são guardados como HTML e
 * renderizados no app. O agente escreve em markdown (títulos, tabelas, listas)
 * e aqui convertemos para o MESMO HTML que o editor gera ao colar markdown —
 * assim POPs e textos longos aparecem com hierarquia de títulos, não crus.
 */
function richText(md?: string | null): string | undefined {
  if (md == null) return undefined
  const t = md.trim()
  return t ? markdownToHtml(t) : undefined
}

/** Dica reutilizável para os campos de descrição em markdown. */
const DICA_MD =
  'Aceita markdown e vira rich text: use # / ## / ### para hierarquia de títulos, ' +
  '| tabelas |, listas com - e 1., > citações e ``` código. Estruture POPs e textos longos com títulos.'

const escreve = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }

export function registrarAcoes(server: McpServer, getMembro: () => Membro) {
  // ── cadastrar_cliente ─────────────────────────────────────────────────────
  server.registerTool(
    'cadastrar_cliente',
    {
      title: 'Cadastrar cliente',
      description: 'Cria um novo cliente na List Clientes. Só `nome` é obrigatório; o resto é opcional.',
      inputSchema: {
        nome: z.string().min(1).describe('Nome do cliente (obrigatório).'),
        razao_social: z.string().optional(),
        cnpj_cpf: z.string().optional(),
        email: z.string().optional(),
        whatsapp: z.string().optional(),
        telefone: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        descricao: z.string().optional().describe(`Notas sobre o cliente. ${DICA_MD}`),
      },
      annotations: escreve,
    },
    tool(async (args: Record<string, string | undefined>) => {
      const a = admin()
      const payload = Object.fromEntries(Object.entries(args).filter(([, v]) => v != null && v !== ''))
      if (typeof payload.descricao === 'string') payload.descricao = markdownToHtml(payload.descricao)
      const { data, error } = await a.from('cliente').insert(payload).select('id, nome').single()
      if (error) return erro(`Não consegui cadastrar o cliente: ${error.message}`)
      return texto(`✅ Cliente **${data.nome}** cadastrado.\nid: ${data.id}`)
    })
  )

  // ── criar_evento ──────────────────────────────────────────────────────────
  server.registerTool(
    'criar_evento',
    {
      title: 'Criar evento',
      description:
        'Cria um evento (status inicial: backlog). Vincule um cliente por nome ou id. Datas aceitam "AAAA-MM-DD" (só dia) ou "AAAA-MM-DDTHH:mm".',
      inputSchema: {
        nome: z.string().min(1).describe('Nome do evento (obrigatório).'),
        cliente: z.string().optional().describe('Nome ou id de um cliente já cadastrado.'),
        local: z.string().optional(),
        data_realizacao_inicio: z.string().optional().describe('Início da realização.'),
        data_realizacao_fim: z.string().optional().describe('Fim da realização.'),
        data_montagem: z.string().optional(),
        data_inicio_organizacao: z.string().optional(),
        descricao: z.string().optional().describe(`Briefing do evento. ${DICA_MD}`),
      },
      annotations: escreve,
    },
    tool(async (args: Record<string, string | undefined>) => {
      const a = admin()
      const payload: Record<string, unknown> = { nome: args.nome }
      if (args.local) payload.local = args.local
      const descEvento = richText(args.descricao)
      if (descEvento) payload.descricao = descEvento
      for (const campo of ['data_realizacao_inicio', 'data_realizacao_fim', 'data_montagem', 'data_inicio_organizacao']) {
        const v = normalizarData(args[campo])
        if (v) payload[campo] = v
      }
      if (args.cliente) {
        const a2 = admin()
        const alvo = args.cliente.trim()
        const { data: cli } = /^[0-9a-f-]{36}$/i.test(alvo)
          ? await a2.from('cliente').select('id, nome').eq('id', alvo).maybeSingle()
          : await a2.from('cliente').select('id, nome').ilike('nome', `%${alvo}%`).limit(1).maybeSingle()
        if (!cli) return erro(`Não encontrei o cliente "${args.cliente}".`, 'Cadastre-o antes com `cadastrar_cliente` ou confira o nome.')
        payload.cliente_id = cli.id
      }
      const { data, error } = await a.from('evento').insert(payload).select('id, nome, status').single()
      if (error) return erro(`Não consegui criar o evento: ${error.message}`)
      return texto(`✅ Evento **${data.nome}** criado (status: ${data.status}).\nid: ${data.id}`)
    })
  )

  // ── iniciar_execucao_evento ───────────────────────────────────────────────
  server.registerTool(
    'iniciar_execucao_evento',
    {
      title: 'Iniciar execução do evento',
      description:
        'Coloca o evento em execução (status = em_execucao). Isso DISPARA o playbook: o sistema gera automaticamente as tasks-modelo de pré/intra/pós-evento. Aceita id ou nome.',
      inputSchema: { evento: z.string().describe('id (uuid) ou nome do evento.') },
      annotations: { ...escreve, idempotentHint: true },
    },
    tool(async ({ evento }: { evento: string }) => {
      const ref = await resolveEvento(evento)
      if (!ref) return erro(`Não encontrei o evento "${evento}".`, 'Confira o nome ou use `listar_eventos`.')
      if (ref.status === 'em_execucao') {
        return texto(`ℹ️ O evento **${ref.nome}** já está em execução. Nada a fazer.`)
      }
      const a = admin()
      const { error } = await a.from('evento').update({ status: 'em_execucao' }).eq('id', ref.id)
      if (error) return erro(`Não consegui iniciar a execução: ${error.message}`)
      const { count } = await a
        .from('task_projeto')
        .select('*', { count: 'exact', head: true })
        .eq('evento_id', ref.id)
      return texto(
        `🚀 Evento **${ref.nome}** entrou em execução.\n` +
          `O playbook foi disparado: ${count ?? 0} task(s) de projeto agora existem para este evento.`
      )
    })
  )

  // ── criar_task (task_projeto) ─────────────────────────────────────────────
  server.registerTool(
    'criar_task',
    {
      title: 'Criar task de projeto',
      description:
        'Cria uma task na List de Projetos (pré/intra/pós-evento). Informe o `tipo` e, de preferência, o evento e o responsável.',
      inputSchema: {
        nome: z.string().min(1).describe('Nome da task (obrigatório).'),
        tipo: z.enum(['pre_evento', 'intra_evento', 'pos_evento', 'onboarding']).describe('Bloco da task.'),
        evento: z.string().optional().describe('Nome ou id do evento ao qual a task pertence.'),
        responsavel: z.string().optional().describe('E-mail ou nome do responsável.'),
        prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional().describe('Default: media.'),
        data_inicio: z.string().optional(),
        data_fim: z.string().optional().describe('Prazo.'),
        descricao: z.string().optional().describe(`Detalhes da task / POP. ${DICA_MD}`),
      },
      annotations: escreve,
    },
    tool(async (args: {
      nome: string; tipo: string; evento?: string; responsavel?: string
      prioridade?: string; data_inicio?: string; data_fim?: string; descricao?: string
    }) => {
      const a = admin()
      const payload: Record<string, unknown> = { nome: args.nome, tipo: args.tipo }
      if (args.prioridade) payload.prioridade = args.prioridade
      const descTask = richText(args.descricao)
      if (descTask) payload.descricao = descTask
      const di = normalizarData(args.data_inicio); if (di) payload.data_inicio = di
      const df = normalizarData(args.data_fim); if (df) payload.data_fim = df
      if (args.evento) {
        const ev = await resolveEvento(args.evento)
        if (!ev) return erro(`Não encontrei o evento "${args.evento}".`, 'Use `listar_eventos` para conferir.')
        payload.evento_id = ev.id
      }
      if (args.responsavel) {
        const m = await resolveMembro(args.responsavel)
        if (!m) return erro(`Não encontrei o responsável "${args.responsavel}".`, 'Use o e-mail exato ou parte do nome.')
        payload.responsavel_id = m.id
      }
      const { data, error } = await a.from('task_projeto').insert(payload).select('id, nome').single()
      if (error) return erro(`Não consegui criar a task: ${error.message}`)
      return texto(`✅ Task **${data.nome}** criada em Projetos.\nid: ${data.id}`)
    })
  )

  // ── atualizar_status_task (genérica) ──────────────────────────────────────
  server.registerTool(
    'atualizar_status_task',
    {
      title: 'Atualizar status da task',
      description:
        `Muda o status de uma task de qualquer List (${LISTS_VALIDAS.join(', ')}). Automações do sistema (ex.: fluxo do Marketing) disparam sozinhas na mudança.`,
      inputSchema: {
        list: z.enum(['projeto', 'marketing', 'oportunidade', 'processo']).describe('A List da task.'),
        id: z.string().describe('id (uuid) da task.'),
        status: z.string().describe('Novo status.'),
      },
      annotations: { ...escreve, idempotentHint: true },
    },
    tool(async ({ list, id, status }: { list: string; id: string; status: string }) => {
      const l = resolveList(list)
      if (!l) return erro(`List inválida: "${list}".`, `Use uma de: ${LISTS_VALIDAS.join(', ')}.`)
      if (!l.statusLivre && !l.statuses.includes(status)) {
        return erro(`Status "${status}" não existe em ${l.label}.`, `Status válidos: ${l.statuses.join(', ')}.`)
      }
      const a = admin()
      const { data, error } = await a.from(l.table).update({ status }).eq('id', id).select('id, nome, status').maybeSingle()
      if (error) return erro(`Não consegui atualizar o status: ${error.message}`)
      if (!data) return erro(`Task ${id} não encontrada em ${l.label}.`)
      return texto(`✅ **${data.nome}** agora está em "${data.status}".`)
    })
  )

  // ── comentar_em_task (genérica) ───────────────────────────────────────────
  server.registerTool(
    'comentar_em_task',
    {
      title: 'Comentar em task',
      description:
        `Adiciona um comentário a uma task de qualquer List (${LISTS_VALIDAS.join(', ')}). O autor é o membro autenticado.`,
      inputSchema: {
        list: z.enum(['projeto', 'marketing', 'oportunidade', 'processo']).describe('A List da task.'),
        id: z.string().describe('id (uuid) da task.'),
        texto: z.string().min(1).describe(`O comentário. ${DICA_MD}`),
      },
      annotations: escreve,
    },
    tool(async ({ list, id, texto: corpo }: { list: string; id: string; texto: string }) => {
      const l = resolveList(list)
      if (!l) return erro(`List inválida: "${list}".`, `Use uma de: ${LISTS_VALIDAS.join(', ')}.`)
      const membro = getMembro()
      const autor = membro.nome || membro.email
      const a = admin()
      const { error } = await a.from('task_comment').insert({
        task_id: id,
        task_table: l.table,
        author: autor,
        body: richText(corpo) ?? corpo,
      })
      if (error) return erro(`Não consegui comentar: ${error.message}`)
      return texto(`💬 Comentário adicionado por ${autor} na task ${id}.`)
    })
  )
}
