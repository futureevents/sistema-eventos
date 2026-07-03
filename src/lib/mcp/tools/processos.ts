import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { admin, texto, erro, tool, ANOT_READ, ANOT_WRITE } from '../helpers'
import { markdownToHtml } from '@/lib/richtext'

// Espelha a config da List (src/components/list/configs/gestao-processos.ts).
const TIPOS = ['entrada_cliente', 'projetos', 'cientifico', 'marketing', 'comercial', 'juridico', 'ia'] as const
const STATUS = ['para_fazer', 'desenhando', 'ativo', 'descartado'] as const

const TIPO_LABEL: Record<string, string> = {
  entrada_cliente: 'Entrada de cliente',
  projetos: 'Projetos',
  cientifico: 'Científico/Conteúdo',
  marketing: 'Marketing',
  comercial: 'Comercial',
  juridico: 'Jurídico',
  ia: 'IA',
}

export function registrarProcessos(server: McpServer) {
  // ── listar_processos ────────────────────────────────────────────────────────
  server.registerTool(
    'listar_processos',
    {
      title: 'Listar processos',
      description:
        'Lista os processos (POPs) da Gestão. Filtre por `tipo` e/ou `status`, ou busque por parte do `nome`. Use para achar o id certo antes de editar ou apagar. (Processos não aparecem em `buscar_tasks`.)',
      inputSchema: {
        tipo: z.enum(TIPOS).optional().describe('Filtra por área do processo.'),
        status: z.enum(STATUS).optional(),
        nome: z.string().optional().describe('Busca por parte do nome.'),
      },
      annotations: ANOT_READ,
    },
    tool(async (args: { tipo?: string; status?: string; nome?: string }) => {
      const a = admin()
      let q = a.from('task_processo').select('id, nome, tipo, status').order('nome', { ascending: true }).limit(100)
      if (args.tipo) q = q.eq('tipo', args.tipo)
      if (args.status) q = q.eq('status', args.status)
      if (args.nome?.trim()) q = q.ilike('nome', `%${args.nome.trim()}%`)
      const { data, error } = await q
      if (error) return erro(`Não consegui listar os processos: ${error.message}`)
      if (!data?.length) return texto('Nenhum processo encontrado com esses filtros.')
      const linhas = data.map(
        (p) => `• **${p.nome || '(sem nome)'}** — ${TIPO_LABEL[p.tipo] ?? p.tipo} · ${p.status}\n  id: ${p.id}`
      )
      return texto(`${data.length} processo(s):\n\n${linhas.join('\n')}`)
    })
  )

  // ── criar_processo ──────────────────────────────────────────────────────────
  server.registerTool(
    'criar_processo',
    {
      title: 'Criar processo',
      description:
        'Cria um processo (POP) na Gestão. `tipo` define a área (obrigatório). A `descricao` é o corpo do POP e aceita markdown (títulos, tabelas, listas).',
      inputSchema: {
        nome: z.string().min(1).describe('Nome do processo (obrigatório).'),
        tipo: z.enum(TIPOS).describe('Área: entrada_cliente, projetos, cientifico, marketing, comercial, juridico, ia.'),
        status: z.enum(STATUS).optional().describe('Padrão: para_fazer.'),
        descricao: z.string().optional().describe('Corpo do POP. Aceita markdown.'),
      },
      annotations: ANOT_WRITE,
    },
    tool(async (args: { nome: string; tipo: string; status?: string; descricao?: string }) => {
      const payload: Record<string, unknown> = { nome: args.nome.trim(), tipo: args.tipo }
      if (args.status) payload.status = args.status
      if (args.descricao?.trim()) payload.descricao = markdownToHtml(args.descricao.trim())
      const a = admin()
      const { data, error } = await a.from('task_processo').insert(payload).select('id, nome').single()
      if (error) return erro(`Não consegui criar o processo: ${error.message}`)
      return texto(`✅ Processo **${data.nome}** criado em ${TIPO_LABEL[args.tipo] ?? args.tipo}.\nid: ${data.id}`)
    })
  )
}
