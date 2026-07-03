import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUrgencias, type UrgenciaItem } from '@/lib/mcp/urgencias'
import type { Membro } from '@/lib/mcp/auth'

/**
 * Catálogo de ferramentas do MCP do Sistema Eventos (Fase 1).
 *
 * Regra de ouro: as tools só fazem INSERT/UPDATE simples. TODA a lógica de
 * negócio (gerar as tasks do playbook, mover marketing, automações de CRM,
 * log de auditoria) vive em triggers do Postgres — não reimplementar aqui.
 *
 * `server` é o McpServer do mcp-handler; `getMembro` devolve quem está
 * perguntando (resolvido pelo token na rota).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type McpServer = any

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function texto(s: string) {
  return { content: [{ type: 'text' as const, text: s }] }
}

function fmtData(iso: string | null): string {
  if (!iso) return '—'
  const d = iso.slice(0, 10).split('-')
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : iso
}

function linhaUrgencia(u: UrgenciaItem): string {
  const flag = u.atrasada ? '🔴 ATRASADA' : '🟡'
  return `- ${flag} [${u.prioridade}] ${u.nome} — vence ${fmtData(u.data_fim)} · ${u.origem} · status: ${u.status}`
}

/** Resolve um evento por UUID ou por nome (busca parcial). */
async function resolverEvento(
  supabase: ReturnType<typeof createAdminClient>,
  ref: string
): Promise<{ id: string; nome: string; status: string; playbook_disparado_em: string | null } | { erro: string }> {
  let q = supabase.from('evento').select('id, nome, status, playbook_disparado_em')
  q = UUID_RE.test(ref) ? q.eq('id', ref) : q.ilike('nome', `%${ref}%`)
  const { data, error } = await q.limit(5)
  if (error) return { erro: error.message }
  if (!data || data.length === 0) return { erro: `Nenhum evento encontrado para "${ref}".` }
  if (data.length > 1)
    return { erro: `Vários eventos batem com "${ref}": ${data.map((e) => e.nome).join(', ')}. Seja mais específico.` }
  return data[0]
}

// Tabelas de task onde anexos/comentários/status fazem sentido (anatomia polimórfica).
const TABELAS_TASK = ['task_projeto', 'task_marketing', 'task_oportunidade', 'task_processo'] as const
type TabelaTask = (typeof TABELAS_TASK)[number]

// Status válidos por tabela (null = texto livre, ex.: pipeline de oportunidade).
const STATUS_VALIDOS: Record<TabelaTask, string[] | null> = {
  task_projeto: ['a_fazer', 'em_andamento', 'concluida', 'cancelada'],
  task_marketing: [
    'para_fazer', 'para_gravar', 'em_andamento', 'em_aprovacao', 'em_alteracao', 'descartado', 'finalizado',
  ],
  task_oportunidade: null,
  task_processo: ['para_fazer', 'desenhando', 'ativo', 'descartado'],
}

// Metadados por tabela para as tools GERAIS (criar_task_lista / atualizar_task).
// `tipos`  = valores válidos do discriminador de List (qual List a task pertence).
// `extras` = colunas opcionais aceitas além de nome/status/descricao (aplicadas só
//            se existirem na tabela — é o que torna as tools "table-aware").
// responsavel/designer = campos por e-mail resolvidos para *_id; evento idem.
const META_TABELA: Record<
  TabelaTask,
  { tipos: string[]; extras: string[]; responsavel?: boolean; designer?: boolean; evento?: boolean }
> = {
  task_projeto: {
    tipos: ['pre_evento', 'intra_evento', 'pos_evento', 'onboarding'],
    extras: ['prioridade', 'data_fim'],
    responsavel: true,
    evento: true,
  },
  task_marketing: {
    tipos: ['copy', 'design', 'publicacao', 'landing', 'formulario'],
    extras: ['prioridade', 'tipo_conteudo', 'formato_conteudo', 'canais_publicacao', 'data_publicacao', 'data_inicio', 'data_fim'],
    responsavel: true,
    designer: true,
  },
  task_oportunidade: {
    tipos: ['trafego_pago', 'prospeccao_ativa'],
    extras: ['prioridade', 'nome_contato', 'whatsapp', 'telefone', 'email', 'data_inicio', 'data_fim'],
    responsavel: true,
  },
  task_processo: {
    tipos: ['entrada_cliente', 'projetos', 'cientifico', 'marketing', 'comercial', 'juridico'],
    extras: [],
  },
}

const BUCKET_ANEXOS = 'task-attachments'

/** Resolve um membro da equipe por e-mail → id (= responsavel_id). */
async function resolverResponsavel(
  supabase: ReturnType<typeof createAdminClient>,
  email: string
): Promise<string | null> {
  const { data } = await supabase.from('membros').select('id').eq('email', email).maybeSingle()
  return data?.id ?? null
}

export function registrarTools(server: McpServer, getMembro: () => Membro) {
  // ---------------------------------------------------------------- LEITURA

  server.tool(
    'minhas_urgencias',
    'Minhas tasks com prazo nos próximos N dias (default 7), incluindo atrasadas, ordenadas por prioridade. Use para responder "quais são minhas pendências/urgências?".',
    { dias: z.number().int().min(1).max(90).optional() },
    async (args: { dias?: number }) => {
      const membro = getMembro()
      if (!membro.id)
        return texto(
          `Seu token (${membro.email}) ainda não está vinculado a um usuário com login no sistema, então não consigo filtrar "minhas". Use urgencias_da_semana para ver as de todos.`
        )
      const itens = await getUrgencias({ membroId: membro.id, dias: args.dias })
      if (itens.length === 0) return texto('✅ Você não tem urgências na janela. Tudo em dia!')
      return texto(
        `Suas urgências (${itens.length}):\n` + itens.map(linhaUrgencia).join('\n')
      )
    }
  )

  server.tool(
    'urgencias_da_semana',
    'As urgências de TODA a empresa (tasks com prazo nos próximos N dias, default 7, incluindo atrasadas), por prioridade. Use para "quais as principais urgências desta semana?".',
    { dias: z.number().int().min(1).max(90).optional() },
    async (args: { dias?: number }) => {
      const itens = await getUrgencias({ dias: args.dias })
      if (itens.length === 0) return texto('✅ Nenhuma urgência na janela.')
      return texto(
        `Urgências da empresa (${itens.length}):\n` + itens.map(linhaUrgencia).join('\n')
      )
    }
  )

  server.tool(
    'listar_eventos',
    'Lista eventos, opcionalmente filtrando por status. Útil para achar o evento antes de iniciar a execução.',
    {
      status: z
        .enum(['backlog', 'em_aberto', 'em_execucao', 'realizado', 'encerrado', 'cancelado'])
        .optional(),
      limite: z.number().int().min(1).max(100).optional(),
    },
    async (args: { status?: string; limite?: number }) => {
      const supabase = createAdminClient()
      let q = supabase
        .from('evento')
        .select('id, nome, status, data_realizacao_inicio')
        .order('criado_em', { ascending: false })
        .limit(args.limite ?? 50)
      if (args.status) q = q.eq('status', args.status)
      const { data, error } = await q
      if (error) return texto(`Erro: ${error.message}`)
      if (!data || data.length === 0) return texto('Nenhum evento encontrado.')
      return texto(
        `Eventos (${data.length}):\n` +
          data
            .map(
              (e) =>
                `- ${e.nome} · status: ${e.status} · realização: ${fmtData(e.data_realizacao_inicio)}`
            )
            .join('\n')
      )
    }
  )

  server.tool(
    'status_do_evento',
    'Mostra o estado de um evento e a contagem de tasks de projeto por status. Use o nome ou o id do evento.',
    { evento: z.string().min(1) },
    async (args: { evento: string }) => {
      const supabase = createAdminClient()
      const ev = await resolverEvento(supabase, args.evento)
      if ('erro' in ev) return texto(ev.erro)
      const { data: tasks } = await supabase
        .from('task_projeto')
        .select('status')
        .eq('evento_id', ev.id)
      const contagem: Record<string, number> = {}
      for (const t of tasks ?? []) contagem[t.status] = (contagem[t.status] ?? 0) + 1
      const resumo = Object.entries(contagem)
        .map(([s, n]) => `${s}: ${n}`)
        .join(', ')
      return texto(
        `Evento: ${ev.nome}\nStatus: ${ev.status}\nPlaybook disparado: ${
          ev.playbook_disparado_em ? 'sim (' + fmtData(ev.playbook_disparado_em) + ')' : 'não'
        }\nTasks de projeto: ${tasks?.length ?? 0}${resumo ? ' (' + resumo + ')' : ''}`
      )
    }
  )

  // ---------------------------------------------------------------- ESCRITA

  server.tool(
    'cadastrar_cliente',
    'Cadastra um novo cliente. Apenas o nome é obrigatório.',
    {
      nome: z.string().min(1),
      email: z.string().email().optional(),
      telefone: z.string().optional(),
      whatsapp: z.string().optional(),
      razao_social: z.string().optional(),
      cnpj_cpf: z.string().optional(),
    },
    async (args: {
      nome: string
      email?: string
      telefone?: string
      whatsapp?: string
      razao_social?: string
      cnpj_cpf?: string
    }) => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('cliente')
        .insert(args)
        .select('id, nome')
        .single()
      if (error) return texto(`Erro ao cadastrar cliente: ${error.message}`)
      return texto(`✅ Cliente "${data.nome}" cadastrado (id ${data.id}).`)
    }
  )

  server.tool(
    'iniciar_execucao_evento',
    'Coloca um evento em execução (status → em_execucao). Isso dispara o Playbook no banco, que gera automaticamente todas as tasks de pré/intra/pós-evento. Use o nome ou o id do evento.',
    { evento: z.string().min(1) },
    async (args: { evento: string }) => {
      const supabase = createAdminClient()
      const ev = await resolverEvento(supabase, args.evento)
      if ('erro' in ev) return texto(ev.erro)
      if (ev.status === 'em_execucao')
        return texto(`O evento "${ev.nome}" já está em execução. Nada a fazer.`)

      const { error } = await supabase
        .from('evento')
        .update({ status: 'em_execucao' })
        .eq('id', ev.id)
      if (error) return texto(`Erro ao iniciar execução: ${error.message}`)

      const { count } = await supabase
        .from('task_projeto')
        .select('id', { count: 'exact', head: true })
        .eq('evento_id', ev.id)
      return texto(
        `🚀 Evento "${ev.nome}" em execução. O Playbook gerou ${count ?? 0} tasks de projeto.`
      )
    }
  )

  server.tool(
    'criar_task',
    'Cria uma task de projeto (pré/intra/pós-evento ou onboarding), opcionalmente ligada a um evento e a um responsável (e-mail).',
    {
      nome: z.string().min(1),
      tipo: z.enum(['pre_evento', 'intra_evento', 'pos_evento', 'onboarding']),
      evento: z.string().optional(),
      responsavel: z.string().email().optional(),
      prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
      data_fim: z.string().optional(), // YYYY-MM-DD
      descricao: z.string().optional(),
    },
    async (args: {
      nome: string
      tipo: string
      evento?: string
      responsavel?: string
      prioridade?: string
      data_fim?: string
      descricao?: string
    }) => {
      const supabase = createAdminClient()
      const payload: Record<string, unknown> = { nome: args.nome, tipo: args.tipo }
      if (args.prioridade) payload.prioridade = args.prioridade
      if (args.data_fim) payload.data_fim = args.data_fim
      if (args.descricao) payload.descricao = args.descricao

      if (args.evento) {
        const ev = await resolverEvento(supabase, args.evento)
        if ('erro' in ev) return texto(ev.erro)
        payload.evento_id = ev.id
      }
      if (args.responsavel) {
        const id = await resolverResponsavel(supabase, args.responsavel)
        if (!id) return texto(`Não achei um membro com o e-mail ${args.responsavel}.`)
        payload.responsavel_id = id
      }

      const { data, error } = await supabase
        .from('task_projeto')
        .insert(payload)
        .select('id, nome')
        .single()
      if (error) return texto(`Erro ao criar task: ${error.message}`)
      return texto(`✅ Task "${data.nome}" criada (id ${data.id}).`)
    }
  )

  server.tool(
    'criar_task_lista',
    'Cria uma task em QUALQUER List do sistema. Informe `task_table` (task_projeto/task_marketing/task_oportunidade/task_processo) + `tipo` (o discriminador da List dentro da tabela) + `nome`. Os campos opcionais só se aplicam se existirem na tabela (nas outras são ignorados). Tipos por tabela — projeto: pre_evento/intra_evento/pos_evento/onboarding · marketing: copy(="Processo de copy")/design/publicacao/landing/formulario · oportunidade: trafego_pago/prospeccao_ativa · processo: entrada_cliente/projetos/cientifico/marketing/comercial/juridico. NÃO passe status=finalizado no INSERT (é a automação de mover etapa).',
    {
      task_table: z.enum(TABELAS_TASK),
      tipo: z.string().min(1),
      nome: z.string().min(1),
      status: z.string().optional(),
      descricao: z.string().optional(),
      prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
      responsavel: z.string().email().optional(),
      designer: z.string().email().optional(),
      evento: z.string().optional(),
      tipo_conteudo: z.string().optional(),
      formato_conteudo: z.array(z.string()).optional(),
      canais_publicacao: z.array(z.string()).optional(),
      data_publicacao: z.string().optional(), // YYYY-MM-DD
      data_inicio: z.string().optional(),
      data_fim: z.string().optional(),
      nome_contato: z.string().optional(),
      whatsapp: z.string().optional(),
      telefone: z.string().optional(),
      email: z.string().optional(),
    },
    async (args: {
      task_table: TabelaTask
      tipo: string
      nome: string
      status?: string
      descricao?: string
      prioridade?: string
      responsavel?: string
      designer?: string
      evento?: string
      tipo_conteudo?: string
      formato_conteudo?: string[]
      canais_publicacao?: string[]
      data_publicacao?: string
      data_inicio?: string
      data_fim?: string
      nome_contato?: string
      whatsapp?: string
      telefone?: string
      email?: string
    }) => {
      const meta = META_TABELA[args.task_table]
      if (!meta.tipos.includes(args.tipo))
        return texto(`tipo "${args.tipo}" inválido para ${args.task_table}. Use: ${meta.tipos.join(', ')}.`)
      const statusValidos = STATUS_VALIDOS[args.task_table]
      if (args.status && statusValidos && !statusValidos.includes(args.status))
        return texto(`status "${args.status}" inválido para ${args.task_table}. Use: ${statusValidos.join(', ')}.`)

      const supabase = createAdminClient()
      const payload: Record<string, unknown> = { nome: args.nome, tipo: args.tipo }
      if (args.status) payload.status = args.status
      if (args.descricao) payload.descricao = args.descricao
      // campos opcionais válidos para ESTA tabela (ignora os que não existem nela)
      for (const col of meta.extras) {
        const v = (args as Record<string, unknown>)[col]
        if (v !== undefined) payload[col] = v
      }
      // relacionais (por nome de evento / por e-mail)
      if (meta.evento && args.evento) {
        const ev = await resolverEvento(supabase, args.evento)
        if ('erro' in ev) return texto(ev.erro)
        payload.evento_id = ev.id
      }
      if (meta.responsavel && args.responsavel) {
        const id = await resolverResponsavel(supabase, args.responsavel)
        if (!id) return texto(`Não achei um membro com o e-mail ${args.responsavel}.`)
        payload.responsavel_id = id
      }
      if (meta.designer && args.designer) {
        const id = await resolverResponsavel(supabase, args.designer)
        if (!id) return texto(`Não achei um membro com o e-mail ${args.designer}.`)
        payload.designer_id = id
      }

      const { data, error } = await supabase
        .from(args.task_table)
        .insert(payload)
        .select('id, nome')
        .single()
      if (error) return texto(`Erro ao criar task: ${error.message}`)
      return texto(`✅ Task "${data.nome}" criada em ${args.task_table} / List ${args.tipo} (id ${data.id}).`)
    }
  )

  server.tool(
    'buscar_tasks',
    'Procura tasks pelo nome em projeto, marketing, oportunidades e processos. Use para achar o id de uma task antes de comentar, anexar ou mudar status.',
    { busca: z.string().min(1), limite: z.number().int().min(1).max(50).optional() },
    async (args: { busca: string; limite?: number }) => {
      const supabase = createAdminClient()
      const tabelas: TabelaTask[] = ['task_projeto', 'task_marketing', 'task_oportunidade', 'task_processo']
      const achados = await Promise.all(
        tabelas.map(async (tabela) => {
          const { data } = await supabase
            .from(tabela)
            .select('id, nome, status')
            .ilike('nome', `%${args.busca}%`)
            .limit(args.limite ?? 10)
          return (data ?? []).map((t) => `- [${tabela}] ${t.nome} · status: ${t.status} · id: ${t.id}`)
        })
      )
      const linhas = achados.flat()
      if (linhas.length === 0) return texto(`Nenhuma task encontrada para "${args.busca}".`)
      return texto(`Tasks encontradas (${linhas.length}):\n` + linhas.join('\n'))
    }
  )

  server.tool(
    'detalhe_task',
    'Mostra os dados de uma task e seus comentários. Informe a tabela (task_projeto, task_marketing, task_oportunidade, task_processo) e o id.',
    { task_table: z.enum(TABELAS_TASK), task_id: z.string().uuid() },
    async (args: { task_table: TabelaTask; task_id: string }) => {
      const supabase = createAdminClient()
      const { data: row, error } = await supabase
        .from(args.task_table)
        .select('*')
        .eq('id', args.task_id)
        .maybeSingle()
      if (error) return texto(`Erro: ${error.message}`)
      if (!row) return texto('Task não encontrada.')
      const { data: comentarios } = await supabase
        .from('task_comment')
        .select('author, body, criado_em')
        .eq('task_table', args.task_table)
        .eq('task_id', args.task_id)
        .order('criado_em', { ascending: true })
      const campos = Object.entries(row)
        .filter(([k]) => !['descricao'].includes(k))
        .map(([k, v]) => `${k}: ${v ?? '—'}`)
        .join('\n')
      const coms =
        (comentarios ?? []).length === 0
          ? '(sem comentários)'
          : comentarios!.map((c) => `• ${c.author} (${fmtData(c.criado_em)}): ${c.body}`).join('\n')
      return texto(`${campos}\n\nComentários:\n${coms}`)
    }
  )

  server.tool(
    'atualizar_status_task',
    'Muda o status de uma task. Em marketing isso pode disparar a automação que move a task para a próxima etapa.',
    { task_table: z.enum(TABELAS_TASK), task_id: z.string().uuid(), status: z.string().min(1) },
    async (args: { task_table: TabelaTask; task_id: string; status: string }) => {
      const validos = STATUS_VALIDOS[args.task_table]
      if (validos && !validos.includes(args.status))
        return texto(
          `Status "${args.status}" inválido para ${args.task_table}. Use um destes: ${validos.join(', ')}.`
        )
      const supabase = createAdminClient()
      const { error } = await supabase
        .from(args.task_table)
        .update({ status: args.status })
        .eq('id', args.task_id)
      if (error) return texto(`Erro ao atualizar status: ${error.message}`)
      return texto(`✅ Status atualizado para "${args.status}".`)
    }
  )

  server.tool(
    'atualizar_task',
    'Edita os campos de uma task em QUALQUER List. Informe task_table + task_id e só os campos que quer mudar (nome, status, descricao, prioridade, datas, responsavel/designer por e-mail, e campos específicos da tabela). Campos que não existem na tabela são ignorados. Para trocar de List (mover etapa) use mover_task/atualizar_status_task.',
    {
      task_table: z.enum(TABELAS_TASK),
      task_id: z.string().uuid(),
      nome: z.string().min(1).optional(),
      status: z.string().optional(),
      descricao: z.string().optional(),
      prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
      responsavel: z.string().email().optional(),
      designer: z.string().email().optional(),
      tipo_conteudo: z.string().optional(),
      formato_conteudo: z.array(z.string()).optional(),
      canais_publicacao: z.array(z.string()).optional(),
      data_publicacao: z.string().optional(),
      data_inicio: z.string().optional(),
      data_fim: z.string().optional(),
      nome_contato: z.string().optional(),
      whatsapp: z.string().optional(),
      telefone: z.string().optional(),
      email: z.string().optional(),
    },
    async (args: {
      task_table: TabelaTask
      task_id: string
      nome?: string
      status?: string
      descricao?: string
      prioridade?: string
      responsavel?: string
      designer?: string
      tipo_conteudo?: string
      formato_conteudo?: string[]
      canais_publicacao?: string[]
      data_publicacao?: string
      data_inicio?: string
      data_fim?: string
      nome_contato?: string
      whatsapp?: string
      telefone?: string
      email?: string
    }) => {
      const validos = STATUS_VALIDOS[args.task_table]
      if (args.status && validos && !validos.includes(args.status))
        return texto(`status "${args.status}" inválido para ${args.task_table}. Use: ${validos.join(', ')}.`)

      const meta = META_TABELA[args.task_table]
      const supabase = createAdminClient()
      const patch: Record<string, unknown> = {}
      if (args.nome !== undefined) patch.nome = args.nome
      if (args.status !== undefined) patch.status = args.status
      if (args.descricao !== undefined) patch.descricao = args.descricao
      for (const col of meta.extras) {
        const v = (args as Record<string, unknown>)[col]
        if (v !== undefined) patch[col] = v
      }
      if (meta.responsavel && args.responsavel) {
        const id = await resolverResponsavel(supabase, args.responsavel)
        if (!id) return texto(`Não achei um membro com o e-mail ${args.responsavel}.`)
        patch.responsavel_id = id
      }
      if (meta.designer && args.designer) {
        const id = await resolverResponsavel(supabase, args.designer)
        if (!id) return texto(`Não achei um membro com o e-mail ${args.designer}.`)
        patch.designer_id = id
      }

      if (Object.keys(patch).length === 0) return texto('Nada para atualizar — informe ao menos um campo.')
      const { error } = await supabase.from(args.task_table).update(patch).eq('id', args.task_id)
      if (error) return texto(`Erro ao atualizar task: ${error.message}`)
      return texto(`✅ Task atualizada (${Object.keys(patch).join(', ')}).`)
    }
  )

  server.tool(
    'mover_task',
    'Atalho de marketing: finaliza a etapa atual de uma task de marketing (status → finalizado), o que dispara a automação que a move para a próxima List (copy→design→publicação).',
    { task_id: z.string().uuid() },
    async (args: { task_id: string }) => {
      const supabase = createAdminClient()
      const { error } = await supabase
        .from('task_marketing')
        .update({ status: 'finalizado' })
        .eq('id', args.task_id)
      if (error) return texto(`Erro ao mover task: ${error.message}`)
      return texto('✅ Etapa finalizada — a task foi movida para a próxima List automaticamente.')
    }
  )

  server.tool(
    'comentar_em_task',
    'Adiciona um comentário a uma task. O autor é o dono do token.',
    { task_table: z.enum(TABELAS_TASK), task_id: z.string().uuid(), texto: z.string().min(1) },
    async (args: { task_table: TabelaTask; task_id: string; texto: string }) => {
      const supabase = createAdminClient()
      const { error } = await supabase.from('task_comment').insert({
        task_id: args.task_id,
        task_table: args.task_table,
        author: getMembro().email,
        body: args.texto,
      })
      if (error) return texto(`Erro ao comentar: ${error.message}`)
      return texto('✅ Comentário adicionado.')
    }
  )

  server.tool(
    'anexar_em_task',
    'Anexa um arquivo a uma task. Informe OU uma URL pública do arquivo, OU o conteúdo em base64 (com o mime_type). O arquivo vai para o Storage e aparece nos anexos da task no sistema.',
    {
      task_table: z.enum(TABELAS_TASK),
      task_id: z.string().uuid(),
      nome: z.string().min(1),
      url: z.string().url().optional(),
      conteudo_base64: z.string().optional(),
      mime_type: z.string().optional(),
    },
    async (args: {
      task_table: TabelaTask
      task_id: string
      nome: string
      url?: string
      conteudo_base64?: string
      mime_type?: string
    }) => {
      const supabase = createAdminClient()
      let bytes: Buffer
      let mime = args.mime_type ?? 'application/octet-stream'

      if (args.url) {
        const resp = await fetch(args.url)
        if (!resp.ok) return texto(`Não consegui baixar a URL (HTTP ${resp.status}).`)
        bytes = Buffer.from(await resp.arrayBuffer())
        mime = args.mime_type ?? resp.headers.get('content-type') ?? mime
      } else if (args.conteudo_base64) {
        bytes = Buffer.from(args.conteudo_base64, 'base64')
      } else {
        return texto('Informe `url` ou `conteudo_base64`.')
      }

      const ext = args.nome.includes('.') ? args.nome.split('.').pop() : 'bin'
      const path = `${args.task_table}/${args.task_id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from(BUCKET_ANEXOS)
        .upload(path, bytes, { contentType: mime })
      if (upErr) return texto(`Erro no upload: ${upErr.message}`)

      const { error } = await supabase.from('task_attachment').insert({
        task_id: args.task_id,
        task_table: args.task_table,
        name: args.nome,
        size: bytes.length,
        mime_type: mime,
        storage_path: path,
      })
      if (error) return texto(`Arquivo subiu, mas falhou registrar: ${error.message}`)
      return texto(`✅ Anexo "${args.nome}" adicionado (${(bytes.length / 1024).toFixed(0)} KB).`)
    }
  )
}
