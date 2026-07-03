import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Membro } from '../auth'
import { admin, texto, erro, tool, fmtData, resolveEvento, resolveMembro } from '../helpers'
import { LISTS_VALIDAS, LISTS_TRABALHO, resolveList } from '../lists'
import { getUrgencias, type UrgenciaItem } from '../urgencias'

const PRIO_ICON: Record<string, string> = { urgente: '🔴', alta: '🟠', media: '🟡', baixa: '⚪' }

const SO_LEITURA = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }

function linhaUrgencia(u: UrgenciaItem): string {
  const flag = u.atrasada ? '⚠️ ATRASADA' : `vence ${fmtData(u.data_fim)}`
  const icon = PRIO_ICON[u.prioridade] ?? '🟡'
  return `- ${icon} **${u.nome}** — ${u.origem} · ${u.status} · ${flag}\n  \`${u.tabela}\` · id: ${u.id}`
}

function blocoUrgencias(itens: UrgenciaItem[], vazio: string): string {
  if (itens.length === 0) return vazio
  const atrasadas = itens.filter((i) => i.atrasada).length
  const cab = `${itens.length} pendência(s)${atrasadas ? ` · ${atrasadas} atrasada(s)` : ''}:\n`
  return cab + itens.map(linhaUrgencia).join('\n')
}

export function registrarLeitura(server: McpServer, getMembro: () => Membro) {
  // ── minhas_urgencias ──────────────────────────────────────────────────────
  server.registerTool(
    'minhas_urgencias',
    {
      title: 'Minhas urgências',
      description:
        'Lista as tasks pendentes DO MEMBRO logado com prazo nos próximos N dias (inclui atrasadas), ordenadas por urgência. Use para responder "o que preciso fazer".',
      inputSchema: { dias: z.number().int().min(1).max(90).optional().describe('Janela em dias (default 7).') },
      annotations: SO_LEITURA,
    },
    tool(async ({ dias }: { dias?: number }) => {
      const membro = getMembro()
      if (!membro.id) {
        return erro(
          'Seu e-mail ainda não tem login no sistema, então não dá para saber quais tasks são suas.',
          'Use `urgencias_da_semana` para ver as urgências de todo o time, ou crie seu login no sistema com este mesmo e-mail.'
        )
      }
      const itens = await getUrgencias({ membroId: membro.id, dias })
      return texto(
        `📋 **Urgências de ${membro.nome ?? membro.email}** (próximos ${dias ?? 7} dias)\n\n` +
          blocoUrgencias(itens, '✅ Nenhuma pendência sua no período. Tudo em dia!')
      )
    })
  )

  // ── urgencias_da_semana ───────────────────────────────────────────────────
  server.registerTool(
    'urgencias_da_semana',
    {
      title: 'Urgências do time',
      description:
        'Lista TODAS as tasks pendentes do time com prazo nos próximos N dias (inclui atrasadas), de todas as Lists de trabalho. Visão geral das urgências.',
      inputSchema: { dias: z.number().int().min(1).max(90).optional().describe('Janela em dias (default 7).') },
      annotations: SO_LEITURA,
    },
    tool(async ({ dias }: { dias?: number }) => {
      const itens = await getUrgencias({ dias })
      return texto(
        `📋 **Urgências do time** (próximos ${dias ?? 7} dias)\n\n` +
          blocoUrgencias(itens, '✅ Nenhuma pendência do time no período.')
      )
    })
  )

  // ── resumo_do_dia ─────────────────────────────────────────────────────────
  server.registerTool(
    'resumo_do_dia',
    {
      title: 'Resumo do dia',
      description:
        'Painel executivo: eventos por status, quantidade de urgências (e atrasadas), tasks de projeto em aberto e oportunidades no pipeline. Use para uma visão rápida da operação.',
      inputSchema: {},
      annotations: SO_LEITURA,
    },
    tool(async () => {
      const a = admin()
      const [eventos, urg, projAfazer, projAndamento, oport] = await Promise.all([
        a.from('evento').select('status'),
        getUrgencias({ dias: 7 }),
        a.from('task_projeto').select('*', { count: 'exact', head: true }).eq('status', 'a_fazer'),
        a.from('task_projeto').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento'),
        a.from('task_oportunidade').select('status'),
      ])

      const contarPor = (rows: { status: string }[] | null) => {
        const m = new Map<string, number>()
        for (const r of rows ?? []) m.set(r.status, (m.get(r.status) ?? 0) + 1)
        return [...m.entries()].sort((x, y) => y[1] - x[1])
      }

      const evLinhas = contarPor(eventos.data as { status: string }[] | null)
        .map(([s, n]) => `  - ${s}: ${n}`)
        .join('\n') || '  - (nenhum evento)'
      const opLinhas = contarPor(oport.data as { status: string }[] | null)
        .map(([s, n]) => `  - ${s}: ${n}`)
        .join('\n') || '  - (nenhuma oportunidade)'
      const atrasadas = urg.filter((u) => u.atrasada).length

      return texto(
        `📊 **Resumo do dia**\n\n` +
          `**Eventos por status:**\n${evLinhas}\n\n` +
          `**Urgências (7 dias):** ${urg.length} pendência(s)${atrasadas ? ` · ⚠️ ${atrasadas} atrasada(s)` : ''}\n\n` +
          `**Tasks de projeto em aberto:** ${projAfazer.count ?? 0} a fazer · ${projAndamento.count ?? 0} em andamento\n\n` +
          `**Oportunidades (CRM):**\n${opLinhas}`
      )
    })
  )

  // ── listar_eventos ────────────────────────────────────────────────────────
  server.registerTool(
    'listar_eventos',
    {
      title: 'Listar eventos',
      description:
        'Lista eventos com cliente, datas e local. Filtre por status (backlog, em_aberto, em_execucao, realizado, encerrado, cancelado).',
      inputSchema: {
        status: z.string().optional().describe('Filtra por status do evento.'),
        limite: z.number().int().min(1).max(200).optional().describe('Máx. de eventos (default 50).'),
      },
      annotations: SO_LEITURA,
    },
    tool(async ({ status, limite }: { status?: string; limite?: number }) => {
      const a = admin()
      let q = a
        .from('evento')
        .select('id, nome, status, local, data_realizacao_inicio, data_realizacao_fim, cliente:cliente_id(nome)')
        .order('data_realizacao_inicio', { ascending: true, nullsFirst: false })
        .limit(limite ?? 50)
      if (status) q = q.eq('status', status)
      const { data, error } = await q
      if (error) return erro(`Não consegui listar eventos: ${error.message}`)
      if (!data || data.length === 0) return texto('Nenhum evento encontrado com esse filtro.')

      const linhas = (data as Record<string, unknown>[]).map((e) => {
        const cli = (e.cliente as { nome?: string } | null)?.nome
        const quando = fmtData(e.data_realizacao_inicio as string | null)
        return `- **${e.nome}** — ${e.status}${cli ? ` · cliente: ${cli}` : ''} · ${quando}${e.local ? ` · ${e.local}` : ''}\n  id: ${e.id}`
      })
      return texto(`🎪 **Eventos** (${data.length})\n\n${linhas.join('\n')}`)
    })
  )

  // ── detalhe_evento ────────────────────────────────────────────────────────
  server.registerTool(
    'detalhe_evento',
    {
      title: 'Detalhe do evento',
      description:
        'Mostra um evento (datas, local, cliente, status) + o progresso das tasks de projeto (por status) e do playbook. Aceita id ou nome do evento.',
      inputSchema: { evento: z.string().describe('id (uuid) ou nome do evento.') },
      annotations: SO_LEITURA,
    },
    tool(async ({ evento }: { evento: string }) => {
      const ref = await resolveEvento(evento)
      if (!ref) return erro(`Não encontrei o evento "${evento}".`, 'Confira o nome ou use `listar_eventos`.')
      const a = admin()
      const [full, tasks] = await Promise.all([
        a.from('evento').select('*, cliente:cliente_id(nome)').eq('id', ref.id).maybeSingle(),
        a.from('task_projeto').select('status').eq('evento_id', ref.id),
      ])
      const e = full.data as Record<string, unknown> | null
      if (!e) return erro('Evento sumiu durante a leitura.')

      const rows = (tasks.data as { status: string }[] | null) ?? []
      const total = rows.length
      const concl = rows.filter((r) => r.status === 'concluida').length
      const porStatus = new Map<string, number>()
      for (const r of rows) porStatus.set(r.status, (porStatus.get(r.status) ?? 0) + 1)
      const statusLinhas = [...porStatus.entries()].map(([s, n]) => `  - ${s}: ${n}`).join('\n') || '  - (sem tasks)'
      const cli = (e.cliente as { nome?: string } | null)?.nome

      return texto(
        `🎪 **${e.nome}**\n` +
          `- Status: ${e.status}\n` +
          (cli ? `- Cliente: ${cli}\n` : '') +
          (e.local ? `- Local: ${e.local}\n` : '') +
          `- Início organização: ${fmtData(e.data_inicio_organizacao as string | null)}\n` +
          `- Montagem: ${fmtData(e.data_montagem as string | null)}\n` +
          `- Realização: ${fmtData(e.data_realizacao_inicio as string | null)} → ${fmtData(e.data_realizacao_fim as string | null)}\n` +
          (e.descricao ? `- Descrição: ${e.descricao}\n` : '') +
          `\n**Playbook / tasks de projeto:** ${concl}/${total} concluída(s)\n${statusLinhas}\n` +
          `\nid: ${e.id}`
      )
    })
  )

  // ── buscar_tasks ──────────────────────────────────────────────────────────
  server.registerTool(
    'buscar_tasks',
    {
      title: 'Buscar tasks',
      description:
        `Busca tasks por texto no nome, em uma List ou em todas as Lists de trabalho (${LISTS_TRABALHO.map((l) => l.slug).join(', ')}). Filtre por status e/ou responsável.`,
      inputSchema: {
        texto: z.string().optional().describe('Trecho do nome da task.'),
        list: z.enum(['projeto', 'marketing', 'oportunidade', 'processo']).optional().describe('Restringe a uma List.'),
        status: z.string().optional().describe('Filtra por status.'),
        responsavel: z.string().optional().describe('E-mail ou nome do responsável.'),
        limite: z.number().int().min(1).max(100).optional().describe('Máx. de resultados (default 30).'),
      },
      annotations: SO_LEITURA,
    },
    tool(async ({ texto: termo, list, status, responsavel, limite }: {
      texto?: string; list?: string; status?: string; responsavel?: string; limite?: number
    }) => {
      const a = admin()
      const alvo = list ? [resolveList(list)!] : LISTS_TRABALHO
      let membroId: string | null = null
      if (responsavel) {
        const m = await resolveMembro(responsavel)
        if (!m) return erro(`Não encontrei o responsável "${responsavel}".`, 'Use o e-mail exato ou parte do nome.')
        membroId = m.id
      }

      const porLista = await Promise.all(
        alvo.map(async (l) => {
          let q = a.from(l.table).select('id, nome, status').limit(limite ?? 30)
          if (termo) q = q.ilike('nome', `%${termo}%`)
          if (status) q = q.eq('status', status)
          if (membroId && l.temResponsavel) q = q.eq('responsavel_id', membroId)
          const { data } = await q
          return (data as { id: string; nome: string; status: string }[] | null ?? []).map((r) => ({ ...r, lista: l }))
        })
      )
      const itens = porLista.flat().slice(0, limite ?? 30)
      if (itens.length === 0) return texto('Nenhuma task encontrada com esses filtros.')
      const linhas = itens.map(
        (r) => `- **${r.nome}** — ${r.lista.label} · ${r.status}\n  \`${r.lista.slug}\` · id: ${r.id}`
      )
      return texto(`🔎 **Tasks encontradas** (${itens.length})\n\n${linhas.join('\n')}`)
    })
  )

  // ── detalhe_task ──────────────────────────────────────────────────────────
  server.registerTool(
    'detalhe_task',
    {
      title: 'Detalhe da task',
      description:
        `Mostra uma task completa (todos os campos) + comentários, checklist, histórico e anexos, num único retorno. \`list\` deve ser uma de: ${LISTS_VALIDAS.join(', ')}.`,
      inputSchema: {
        list: z.enum(['projeto', 'marketing', 'oportunidade', 'processo']).describe('A List da task.'),
        id: z.string().describe('id (uuid) da task.'),
      },
      annotations: SO_LEITURA,
    },
    tool(async ({ list, id }: { list: string; id: string }) => {
      const l = resolveList(list)
      if (!l) return erro(`List inválida: "${list}".`, `Use uma de: ${LISTS_VALIDAS.join(', ')}.`)
      const a = admin()
      const [row, coments, checklists, ativ, anexos] = await Promise.all([
        a.from(l.table).select('*').eq('id', id).maybeSingle(),
        a.from('task_comment').select('author, body, criado_em').eq('task_table', l.table).eq('task_id', id).order('criado_em'),
        a.from('task_checklist').select('id, title').eq('task_table', l.table).eq('task_id', id),
        a.from('task_activity').select('actor, type, criado_em').eq('task_table', l.table).eq('task_id', id).order('criado_em', { ascending: false }).limit(10),
        a.from('task_attachment').select('name, mime_type').eq('task_table', l.table).eq('task_id', id),
      ])
      const t = row.data as Record<string, unknown> | null
      if (!t) return erro(`Task ${id} não encontrada em ${l.label}.`)

      const campos = Object.entries(t)
        .filter(([, v]) => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
        .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
        .join('\n')

      const comLinhas = (coments.data as { author: string; body: string; criado_em: string }[] | null ?? [])
        .map((c) => `  - ${c.author} (${fmtData(c.criado_em)}): ${c.body.replace(/<[^>]+>/g, '').slice(0, 200)}`)
        .join('\n') || '  (sem comentários)'

      // itens de checklist
      const chIds = (checklists.data as { id: string; title: string }[] | null) ?? []
      let chBloco = '  (sem checklist)'
      if (chIds.length) {
        const { data: itens } = await a
          .from('task_checklist_item')
          .select('checklist_id, label, done')
          .in('checklist_id', chIds.map((c) => c.id))
        chBloco = chIds
          .map((c) => {
            const its = (itens as { checklist_id: string; label: string; done: boolean }[] | null ?? [])
              .filter((i) => i.checklist_id === c.id)
            const feitos = its.filter((i) => i.done).length
            const linhaItens = its.map((i) => `    ${i.done ? '☑' : '☐'} ${i.label}`).join('\n')
            return `  ${c.title} (${feitos}/${its.length})${linhaItens ? '\n' + linhaItens : ''}`
          })
          .join('\n')
      }

      const anexoLinhas = (anexos.data as { name: string; mime_type: string }[] | null ?? [])
        .map((x) => `  - ${x.name}`)
        .join('\n') || '  (sem anexos)'
      const ativLinhas = (ativ.data as { actor: string; type: string; criado_em: string }[] | null ?? [])
        .map((x) => `  - ${fmtData(x.criado_em)}: ${x.type} (${x.actor})`)
        .join('\n') || '  (sem histórico)'

      return texto(
        `📄 **Task em ${l.label}**\n\n**Campos:**\n${campos}\n\n` +
          `**Comentários:**\n${comLinhas}\n\n` +
          `**Checklist:**\n${chBloco}\n\n` +
          `**Anexos:**\n${anexoLinhas}\n\n` +
          `**Histórico recente:**\n${ativLinhas}`
      )
    })
  )
}
