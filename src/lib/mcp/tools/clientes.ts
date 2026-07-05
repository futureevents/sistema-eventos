import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { admin, texto, erro, tool, ANOT_READ, ANOT_WRITE, resolveCliente } from '../helpers'
import { markdownToHtml } from '@/lib/richtext'

export function registrarClientes(server: McpServer) {
  // ── listar_clientes ───────────────────────────────────────────────────────
  server.registerTool(
    'listar_clientes',
    {
      title: 'Listar clientes',
      description: 'Lista clientes cadastrados. Filtre por texto no nome ou razão social.',
      inputSchema: {
        texto: z.string().optional().describe('Trecho do nome/razão social.'),
        limite: z.number().int().min(1).max(200).optional().describe('Máx. (default 50).'),
      },
      annotations: ANOT_READ,
    },
    tool(async ({ texto: termo, limite }: { texto?: string; limite?: number }) => {
      const a = admin()
      let q = a.from('cliente').select('id, nome, razao_social, whatsapp, cidade, uf').order('nome').limit(limite ?? 50)
      if (termo) q = q.or(`nome.ilike.%${termo}%,razao_social.ilike.%${termo}%`)
      const { data, error } = await q
      if (error) return erro(`Não consegui listar clientes: ${error.message}`)
      if (!data || data.length === 0) return texto('Nenhum cliente encontrado.')
      const linhas = (data as Record<string, unknown>[]).map((c) => {
        const local = [c.cidade, c.uf].filter(Boolean).join('/')
        return `- **${c.nome}**${c.razao_social ? ` (${c.razao_social})` : ''}${c.whatsapp ? ` · 📱 ${c.whatsapp}` : ''}${local ? ` · ${local}` : ''}\n  id: ${c.id}`
      })
      return texto(`🧑‍💼 **Clientes** (${data.length})\n\n${linhas.join('\n')}`)
    })
  )

  // ── detalhe_cliente ───────────────────────────────────────────────────────
  server.registerTool(
    'detalhe_cliente',
    {
      title: 'Detalhe do cliente',
      description: 'Mostra os dados de um cliente + os eventos vinculados a ele. Aceita id ou nome.',
      inputSchema: { cliente: z.string().describe('id (uuid) ou nome do cliente.') },
      annotations: ANOT_READ,
    },
    tool(async ({ cliente }: { cliente: string }) => {
      const ref = await resolveCliente(cliente)
      if (!ref) return erro(`Não encontrei o cliente "${cliente}".`, 'Use `listar_clientes` para conferir.')
      const a = admin()
      const [full, eventos] = await Promise.all([
        a.from('cliente').select('*').eq('id', ref.id).maybeSingle(),
        a.from('evento').select('id, nome, status').eq('cliente_id', ref.id).order('criado_em', { ascending: false }),
      ])
      const c = full.data as Record<string, unknown> | null
      if (!c) return erro('Cliente sumiu durante a leitura.')
      const campos = Object.entries(c)
        .filter(([k, v]) => v !== null && v !== '' && k !== 'descricao')
        .map(([k, v]) => `- ${k}: ${String(v)}`)
        .join('\n')
      const evs = (eventos.data as { id: string; nome: string; status: string }[] | null ?? [])
        .map((e) => `  - ${e.nome} (${e.status}) · id: ${e.id}`)
        .join('\n') || '  (nenhum evento vinculado)'
      return texto(`🧑‍💼 **${c.nome}**\n\n**Dados:**\n${campos}\n\n**Eventos:**\n${evs}`)
    })
  )

  // ── atualizar_cliente ─────────────────────────────────────────────────────
  server.registerTool(
    'atualizar_cliente',
    {
      title: 'Atualizar cliente',
      description: 'Altera campos de um cliente existente. Só os campos informados são alterados.',
      inputSchema: {
        cliente: z.string().describe('id ou nome do cliente a atualizar.'),
        nome: z.string().optional(),
        razao_social: z.string().optional(),
        cnpj_cpf: z.string().optional(),
        email: z.string().optional(),
        whatsapp: z.string().optional(),
        telefone: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        descricao: z.string().optional().describe('Aceita markdown (vira rich text).'),
      },
      annotations: { ...ANOT_WRITE, idempotentHint: true },
    },
    tool(async ({ cliente, ...campos }: Record<string, string | undefined>) => {
      const ref = await resolveCliente(cliente!)
      if (!ref) return erro(`Não encontrei o cliente "${cliente}".`)
      const payload = Object.fromEntries(Object.entries(campos).filter(([, v]) => v != null && v !== ''))
      if (Object.keys(payload).length === 0) return erro('Nada para atualizar.', 'Informe ao menos um campo.')
      if (typeof payload.descricao === 'string') payload.descricao = markdownToHtml(payload.descricao)
      const a = admin()
      const { error } = await a.from('cliente').update(payload).eq('id', ref.id)
      if (error) return erro(`Não consegui atualizar: ${error.message}`)
      return texto(`✅ Cliente **${ref.nome}** atualizado (${Object.keys(payload).join(', ')}).`)
    })
  )
}
