import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { admin, texto, erro, tool, ANOT_READ, ANOT_WRITE, resolveEvento, resolveFornecedor } from '../helpers'
import { markdownToHtml } from '@/lib/richtext'

export function registrarFornecedores(server: McpServer) {
  // ── cadastrar_fornecedor ──────────────────────────────────────────────────
  server.registerTool(
    'cadastrar_fornecedor',
    {
      title: 'Cadastrar fornecedor',
      description: 'Cria um fornecedor na List Fornecedores. Só `nome` é obrigatório.',
      inputSchema: {
        nome: z.string().min(1).describe('Nome do fornecedor (obrigatório).'),
        responsavel: z.string().optional().describe('Nome do contato no fornecedor (texto livre).'),
        categorias: z.array(z.string()).optional().describe('Ex.: ["Buffet", "Som"].'),
        whatsapp: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().optional(),
        cnpj_cpf: z.string().optional(),
        cidade_sede: z.string().optional(),
        abrangencia: z.string().optional().describe('Ex.: nacional, regional.'),
        descricao: z.string().optional().describe('Aceita markdown (vira rich text).'),
      },
      annotations: ANOT_WRITE,
    },
    tool(async (args: Record<string, unknown>) => {
      const a = admin()
      const payload = Object.fromEntries(
        Object.entries(args).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0))
      )
      if (typeof payload.descricao === 'string') payload.descricao = markdownToHtml(payload.descricao)
      const { data, error } = await a.from('fornecedor').insert(payload).select('id, nome').single()
      if (error) return erro(`Não consegui cadastrar o fornecedor: ${error.message}`)
      return texto(`✅ Fornecedor **${data.nome}** cadastrado.\nid: ${data.id}`)
    })
  )

  // ── listar_fornecedores ───────────────────────────────────────────────────
  server.registerTool(
    'listar_fornecedores',
    {
      title: 'Listar fornecedores',
      description: 'Lista fornecedores. Filtre por texto no nome ou por categoria.',
      inputSchema: {
        texto: z.string().optional(),
        categoria: z.string().optional().describe('Filtra fornecedores que têm essa categoria.'),
        limite: z.number().int().min(1).max(200).optional().describe('Máx. (default 50).'),
      },
      annotations: ANOT_READ,
    },
    tool(async ({ texto: termo, categoria, limite }: { texto?: string; categoria?: string; limite?: number }) => {
      const a = admin()
      let q = a.from('fornecedor').select('id, nome, categorias, whatsapp, cidade_sede, abrangencia').order('nome').limit(limite ?? 50)
      if (termo) q = q.ilike('nome', `%${termo}%`)
      if (categoria) q = q.contains('categorias', [categoria])
      const { data, error } = await q
      if (error) return erro(`Não consegui listar fornecedores: ${error.message}`)
      if (!data || data.length === 0) return texto('Nenhum fornecedor encontrado.')
      const linhas = (data as Record<string, unknown>[]).map((f) => {
        const cats = (f.categorias as string[] | null)?.join(', ')
        return `- **${f.nome}**${cats ? ` · ${cats}` : ''}${f.cidade_sede ? ` · ${f.cidade_sede}` : ''}${f.whatsapp ? ` · 📱 ${f.whatsapp}` : ''}\n  id: ${f.id}`
      })
      return texto(`🏭 **Fornecedores** (${data.length})\n\n${linhas.join('\n')}`)
    })
  )

  // ── atualizar_fornecedor ──────────────────────────────────────────────────
  server.registerTool(
    'atualizar_fornecedor',
    {
      title: 'Atualizar fornecedor',
      description: 'Altera campos de um fornecedor existente. Só os campos informados são alterados. Aceita id ou nome.',
      inputSchema: {
        fornecedor: z.string().describe('id ou nome do fornecedor a atualizar.'),
        nome: z.string().optional(),
        responsavel: z.string().optional().describe('Nome do contato no fornecedor.'),
        categorias: z.array(z.string()).optional().describe('Substitui a lista de categorias.'),
        whatsapp: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().optional(),
        cnpj_cpf: z.string().optional(),
        cidade_sede: z.string().optional(),
        abrangencia: z.string().optional(),
        descricao: z.string().optional().describe('Aceita markdown (vira rich text).'),
      },
      annotations: { ...ANOT_WRITE, idempotentHint: true },
    },
    tool(async ({ fornecedor, ...campos }: Record<string, unknown>) => {
      const ref = await resolveFornecedor(fornecedor as string)
      if (!ref) return erro(`Não encontrei o fornecedor "${fornecedor}".`, 'Use `listar_fornecedores` para conferir.')
      const payload = Object.fromEntries(
        Object.entries(campos).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0))
      )
      if (Object.keys(payload).length === 0) return erro('Nada para atualizar.', 'Informe ao menos um campo.')
      if (typeof payload.descricao === 'string') payload.descricao = markdownToHtml(payload.descricao)
      const a = admin()
      const { error } = await a.from('fornecedor').update(payload).eq('id', ref.id)
      if (error) return erro(`Não consegui atualizar o fornecedor: ${error.message}`)
      return texto(`✅ Fornecedor **${ref.nome}** atualizado (${Object.keys(payload).join(', ')}).`)
    })
  )

  // ── vincular_fornecedor_evento ────────────────────────────────────────────
  server.registerTool(
    'vincular_fornecedor_evento',
    {
      title: 'Vincular fornecedor a evento',
      description: 'Associa um fornecedor a um evento (relação N–N). Aceita id ou nome de cada um.',
      inputSchema: {
        evento: z.string().describe('id ou nome do evento.'),
        fornecedor: z.string().describe('id ou nome do fornecedor.'),
      },
      annotations: { ...ANOT_WRITE, idempotentHint: true },
    },
    tool(async ({ evento, fornecedor }: { evento: string; fornecedor: string }) => {
      const ev = await resolveEvento(evento)
      if (!ev) return erro(`Não encontrei o evento "${evento}".`)
      const fo = await resolveFornecedor(fornecedor)
      if (!fo) return erro(`Não encontrei o fornecedor "${fornecedor}".`)
      const a = admin()
      const { error } = await a.from('evento_fornecedor').upsert(
        { evento_id: ev.id, fornecedor_id: fo.id },
        { onConflict: 'evento_id,fornecedor_id', ignoreDuplicates: true }
      )
      if (error) return erro(`Não consegui vincular: ${error.message}`)
      return texto(`🔗 Fornecedor **${fo.nome}** vinculado ao evento **${ev.nome}**.`)
    })
  )
}
