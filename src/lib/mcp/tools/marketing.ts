import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { admin, texto, erro, tool, normalizarData, resolveMembro, ANOT_WRITE } from '../helpers'
import { markdownToHtml } from '@/lib/richtext'

export function registrarMarketing(server: McpServer) {
  // ── criar_task_marketing ──────────────────────────────────────────────────
  server.registerTool(
    'criar_task_marketing',
    {
      title: 'Criar task de marketing',
      description:
        'Cria uma task na List de Marketing/Criação. Informe o `tipo` (copy, design, publicacao, landing, formulario).',
      inputSchema: {
        nome: z.string().min(1).describe('Nome da task (obrigatório).'),
        tipo: z.enum(['copy', 'design', 'publicacao', 'landing', 'formulario']).describe('Tipo da peça.'),
        responsavel: z.string().optional().describe('E-mail ou nome do responsável.'),
        prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
        tipo_conteudo: z.enum(['email', 'post', 'anuncio', 'landing_page', 'formulario', 'mensagem']).optional(),
        canais_publicacao: z.array(z.string()).optional().describe('Ex.: ["Instagram", "LinkedIn"].'),
        data_fim: z.string().optional().describe('Prazo.'),
        descricao: z.string().optional().describe('Aceita markdown: use # títulos, tabelas e listas.'),
      },
      annotations: ANOT_WRITE,
    },
    tool(async (args: {
      nome: string; tipo: string; responsavel?: string; prioridade?: string
      tipo_conteudo?: string; canais_publicacao?: string[]; data_fim?: string; descricao?: string
    }) => {
      const a = admin()
      const payload: Record<string, unknown> = { nome: args.nome, tipo: args.tipo }
      if (args.prioridade) payload.prioridade = args.prioridade
      if (args.tipo_conteudo) payload.tipo_conteudo = args.tipo_conteudo
      if (args.canais_publicacao?.length) payload.canais_publicacao = args.canais_publicacao
      const df = normalizarData(args.data_fim); if (df) payload.data_fim = df
      if (args.descricao?.trim()) payload.descricao = markdownToHtml(args.descricao.trim())
      if (args.responsavel) {
        const m = await resolveMembro(args.responsavel)
        if (!m) return erro(`Não encontrei o responsável "${args.responsavel}".`, 'Use o e-mail exato ou parte do nome.')
        payload.responsavel_id = m.id
      }
      const { data, error } = await a.from('task_marketing').insert(payload).select('id, nome').single()
      if (error) return erro(`Não consegui criar a task de marketing: ${error.message}`)
      return texto(`✅ Task **${data.nome}** criada em Marketing.\nid: ${data.id}`)
    })
  )
}
