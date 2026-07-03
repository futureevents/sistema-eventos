import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { admin, texto, erro, tool, fmtData, ANOT_READ } from '../helpers'

export function registrarCrmEquipe(server: McpServer) {
  // ── listar_oportunidades ──────────────────────────────────────────────────
  server.registerTool(
    'listar_oportunidades',
    {
      title: 'Listar oportunidades (CRM)',
      description:
        'Lista oportunidades do CRM. Filtre por tipo (trafego_pago, prospeccao_ativa) e/ou status. Mostra contato, valor e prazo.',
      inputSchema: {
        tipo: z.enum(['trafego_pago', 'prospeccao_ativa']).optional(),
        status: z.string().optional().describe('Filtra por status (texto livre).'),
        limite: z.number().int().min(1).max(200).optional().describe('Máx. (default 50).'),
      },
      annotations: ANOT_READ,
    },
    tool(async ({ tipo, status, limite }: { tipo?: string; status?: string; limite?: number }) => {
      const a = admin()
      let q = a
        .from('task_oportunidade')
        .select('id, nome, tipo, status, nome_contato, whatsapp, oportunidade, data_fim, prioridade')
        .order('status_changed_at', { ascending: false })
        .limit(limite ?? 50)
      if (tipo) q = q.eq('tipo', tipo)
      if (status) q = q.eq('status', status)
      const { data, error } = await q
      if (error) return erro(`Não consegui listar oportunidades: ${error.message}`)
      if (!data || data.length === 0) return texto('Nenhuma oportunidade encontrada com esse filtro.')
      const fmtValor = (v: unknown) =>
        v == null ? '' : ` · R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      const linhas = (data as Record<string, unknown>[]).map((o) => {
        const contato = o.nome_contato ? ` · 👤 ${o.nome_contato}` : ''
        const prazo = o.data_fim ? ` · vence ${fmtData(o.data_fim as string)}` : ''
        return `- **${o.nome || '(sem nome)'}** — ${o.tipo} · ${o.status}${contato}${fmtValor(o.oportunidade)}${prazo}\n  id: ${o.id}`
      })
      return texto(`💼 **Oportunidades** (${data.length})\n\n${linhas.join('\n')}`)
    })
  )

  // ── listar_membros ────────────────────────────────────────────────────────
  server.registerTool(
    'listar_membros',
    {
      title: 'Listar membros',
      description:
        'Lista os membros da equipe (nome, e-mail, papel e se está ativo). Útil para saber a quem atribuir uma task.',
      inputSchema: {},
      annotations: ANOT_READ,
    },
    tool(async () => {
      const a = admin()
      const [membros, perfis] = await Promise.all([
        a.from('membros').select('nome, email'),
        a.from('membro_perfil').select('email, papel, ativo'),
      ])
      const perfilPor = new Map<string, { papel: string; ativo: boolean }>()
      for (const p of (perfis.data as { email: string; papel: string; ativo: boolean }[] | null) ?? []) {
        perfilPor.set(p.email, { papel: p.papel, ativo: p.ativo })
      }
      const rows = (membros.data as { nome: string; email: string }[] | null) ?? []
      if (rows.length === 0) return texto('Nenhum membro encontrado.')
      const linhas = rows
        .map((m) => {
          const perfil = perfilPor.get(m.email)
          const papel = perfil?.papel ?? 'membro'
          const ativo = perfil?.ativo === false ? ' · ⛔ inativo' : ''
          return `- **${m.nome || m.email}** — ${m.email} · ${papel}${ativo}`
        })
        .sort()
      return texto(`👥 **Equipe** (${rows.length})\n\n${linhas.join('\n')}`)
    })
  )
}
