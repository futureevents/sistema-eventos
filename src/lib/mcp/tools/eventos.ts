import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { admin, texto, erro, tool, normalizarData, resolveEvento, resolveCliente, ANOT_WRITE } from '../helpers'
import { markdownToHtml } from '@/lib/richtext'

const STATUS_EVENTO = ['backlog', 'em_aberto', 'em_execucao', 'realizado', 'encerrado', 'cancelado']

export function registrarEventos(server: McpServer) {
  // ── atualizar_evento ──────────────────────────────────────────────────────
  server.registerTool(
    'atualizar_evento',
    {
      title: 'Atualizar evento',
      description:
        'Altera campos de um evento existente (datas, local, status, cliente, briefing). Só os campos informados mudam. Para colocar em execução e disparar o playbook, prefira `iniciar_execucao_evento`.',
      inputSchema: {
        evento: z.string().describe('id ou nome do evento a atualizar.'),
        nome: z.string().optional(),
        status: z.enum(['backlog', 'em_aberto', 'em_execucao', 'realizado', 'encerrado', 'cancelado']).optional(),
        cliente: z.string().optional().describe('Nome ou id de um cliente para vincular.'),
        local: z.string().optional(),
        data_realizacao_inicio: z.string().optional(),
        data_realizacao_fim: z.string().optional(),
        data_montagem: z.string().optional(),
        data_inicio_organizacao: z.string().optional(),
        descricao: z.string().optional().describe('Briefing. Aceita markdown (títulos, tabelas).'),
      },
      annotations: { ...ANOT_WRITE, idempotentHint: true },
    },
    tool(async (args: Record<string, string | undefined>) => {
      const ref = await resolveEvento(args.evento!)
      if (!ref) return erro(`Não encontrei o evento "${args.evento}".`, 'Use `listar_eventos`.')
      if (args.status && !STATUS_EVENTO.includes(args.status)) {
        return erro(`Status "${args.status}" inválido.`, `Válidos: ${STATUS_EVENTO.join(', ')}.`)
      }
      const payload: Record<string, unknown> = {}
      if (args.nome) payload.nome = args.nome
      if (args.status) payload.status = args.status
      if (args.local) payload.local = args.local
      if (args.descricao?.trim()) payload.descricao = markdownToHtml(args.descricao.trim())
      for (const campo of ['data_realizacao_inicio', 'data_realizacao_fim', 'data_montagem', 'data_inicio_organizacao']) {
        const v = normalizarData(args[campo])
        if (v) payload[campo] = v
      }
      if (args.cliente) {
        const cli = await resolveCliente(args.cliente)
        if (!cli) return erro(`Não encontrei o cliente "${args.cliente}".`, 'Cadastre com `cadastrar_cliente`.')
        payload.cliente_id = cli.id
      }
      if (Object.keys(payload).length === 0) return erro('Nada para atualizar.', 'Informe ao menos um campo.')
      const a = admin()
      const { error } = await a.from('evento').update(payload).eq('id', ref.id)
      if (error) return erro(`Não consegui atualizar o evento: ${error.message}`)
      return texto(`✅ Evento **${ref.nome}** atualizado (${Object.keys(payload).join(', ')}).`)
    })
  )
}
